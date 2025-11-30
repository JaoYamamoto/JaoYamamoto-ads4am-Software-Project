from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import Book, User
from sqlalchemy import func
from sqlalchemy.sql.expression import asc, desc
import requests
import urllib.parse

main = Blueprint('main', __name__)

# ==================== ROTAS DE AUTENTICAÇÃO ====================

@main.route('/register')
def register_page():
    """Página de registro"""
    return render_template('register.html')

@main.route('/login')
def login_page():
    """Página de login"""
    return render_template('login.html')

@main.route('/api/register', methods=['POST'])
def register():
    """API para registrar um novo usuário"""
    data = request.get_json()
    
    if not data or not data.get('nickname') or not data.get('password'):
        return jsonify({'error': 'Nickname e senha são obrigatórios'}), 400
    
    nickname = data['nickname'].strip()
    password = data['password']
    
    # Validações
    if len(nickname) < 3:
        return jsonify({'error': 'Nickname deve ter pelo menos 3 caracteres'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Senha deve ter pelo menos 6 caracteres'}), 400
    
    # Verificar se o nickname já existe
    if User.query.filter_by(nickname=nickname).first():
        return jsonify({'error': 'Este nickname já está em uso'}), 400
    
    # Criar novo usuário
    user = User(nickname=nickname)
    user.set_password(password)
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'Usuário criado com sucesso!', 'user_id': user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@main.route('/api/login', methods=['POST'])
def login():
    """API para fazer login"""
    data = request.get_json()
    
    if not data or not data.get('nickname') or not data.get('password'):
        return jsonify({'error': 'Nickname e senha são obrigatórios'}), 400
    
    nickname = data['nickname'].strip()
    password = data['password']
    
    # Buscar usuário
    user = User.query.filter_by(nickname=nickname).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Nickname ou senha incorretos'}), 401
    
    # Fazer login
    login_user(user)
    return jsonify({
        'message': 'Login realizado com sucesso!',
        'user': user.to_dict()
    }), 200

@main.route('/api/logout', methods=['POST'])
@login_required
def logout():
    """API para fazer logout"""
    logout_user()
    return jsonify({'message': 'Logout realizado com sucesso!'}), 200

@main.route('/api/current-user', methods=['GET'])
def current_user_info():
    """API para obter informações do usuário atual"""
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        }), 200
    else:
        return jsonify({'authenticated': False}), 200

# ==================== ROTAS PRINCIPAIS ====================

@main.route('/')
def index():
    """Página principal - lista todos os livros do usuário"""
    return render_template('index.html')

@main.route('/add-book')
@login_required
def add_book_page():
    """Página para adicionar livro"""
    return render_template('add_book.html')

@main.route('/edit-book/<int:book_id>')
@login_required
def edit_book_page(book_id):
    """Página para editar livro"""
    # Verificar se o livro pertence ao usuário atual
    book = Book.query.filter_by(id=book_id, user_id=current_user.id).first_or_404()
    return render_template('edit_book.html', book_id=book_id)

# ==================== API DE LIVROS ====================

@main.route('/api/books', methods=['GET'])
@login_required
def get_books():
    """API para obter todos os livros do usuário atual com filtros, ordenação e paginação"""
    search_query = request.args.get('search', '').strip()
    genre_filter = request.args.get('genre', '').strip()
    
    # NOVO: Parametros de Filtro por Status e Avaliacao
    status_filter = request.args.get('status', '').strip()
    try:
        rating_filter = int(request.args.get('min_rating', 0))
    except (ValueError, TypeError):
        rating_filter = 0
    
    # Parâmetros de Ordenação
    sort_by = request.args.get('sort_by', 'created_at') # Padrão: data de criação
    order = request.args.get('order', 'desc') # Padrão: descendente
    
    # Parâmetros de Paginação
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # 1. Filtrar apenas livros do usuário atual
    books_query = Book.query.filter_by(user_id=current_user.id)

    # 2. Aplicar Filtros de Busca e Gênero
    if search_query:
        books_query = books_query.filter(
            (Book.title.ilike(f'%{search_query}%')) |
            (Book.author.ilike(f'%{search_query}%')) |
            (Book.genre.ilike(f'%{search_query}%'))
        )
    
    if genre_filter and genre_filter.lower() != 'todos':
        books_query = books_query.filter(Book.genre.ilike(f'%{genre_filter}%'))
    
    # NOVO: Aplicar Filtros de Status de Leitura e Avaliacao
    if status_filter and status_filter in ['want_to_read', 'reading', 'read']:
        books_query = books_query.filter(Book.reading_status == status_filter)
    
    if rating_filter and rating_filter > 0:
        books_query = books_query.filter(Book.rating >= rating_filter)

    # 3. Aplicar Ordenação
    sort_column = None
    if sort_by == 'title':
        sort_column = Book.title
    elif sort_by == 'author':
        sort_column = Book.author
    elif sort_by == 'year':
        sort_column = Book.year
    else: # Default: created_at
        sort_column = Book.created_at
        
    if sort_column:
        if order == 'asc':
            books_query = books_query.order_by(asc(sort_column))
        else:
            books_query = books_query.order_by(desc(sort_column))

    # 4. Aplicar Paginação
    # Usamos o método paginate do SQLAlchemy para lidar com a paginação
    paginated_books = books_query.paginate(page=page, per_page=per_page, error_out=False)

    # 5. Preparar a resposta
    books_list = [book.to_dict() for book in paginated_books.items]
    
    return jsonify({
        'books': books_list,
        'pagination': {
            'total': paginated_books.total,
            'pages': paginated_books.pages,
            'current_page': paginated_books.page,
            'per_page': paginated_books.per_page,
            'has_next': paginated_books.has_next,
            'has_prev': paginated_books.has_prev,
            'next_num': paginated_books.next_num,
            'prev_num': paginated_books.prev_num
        }
    })

@main.route('/api/books/<int:book_id>', methods=['GET'])
@login_required
def get_book(book_id):
    """API para obter um livro específico do usuário atual"""
    book = Book.query.filter_by(id=book_id, user_id=current_user.id).first_or_404()
    return jsonify(book.to_dict())

@main.route('/api/books', methods=['POST'])
@login_required
def create_book():
    """API para criar um novo livro para o usuário atual"""
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('author'):
        return jsonify({'error': 'Título e autor são obrigatórios'}), 400
    
    book = Book(
        title=data['title'],
        author=data['author'],
        year=data.get('year'),
        genre=data.get('genre'),
        description=data.get('description'),
        cover_image_url=data.get('cover_image_url'),
        rating=data.get('rating', 0),  # NOVO: Rating (padrão 0)
        reading_status=data.get('reading_status', 'want_to_read'),  # NOVO: Status de leitura
        user_id=current_user.id  # Associar ao usuário atual
    )
    
    try:
        db.session.add(book)
        db.session.commit()
        return jsonify(book.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@main.route('/api/books/<int:book_id>', methods=['PUT'])
@login_required
def update_book(book_id):
    """API para atualizar um livro do usuário atual"""
    book = Book.query.filter_by(id=book_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Dados não fornecidos'}), 400
    
    # Atualizar campos
    if 'title' in data:
        book.title = data['title']
    if 'author' in data:
        book.author = data['author']
    if 'year' in data:
        book.year = data['year']
    if 'genre' in data:
        book.genre = data['genre']
    if 'description' in data:
        book.description = data['description']
    if 'cover_image_url' in data:
        book.cover_image_url = data['cover_image_url']
    if 'rating' in data:  # NOVO: Atualizar rating
        book.rating = data['rating']
    if 'reading_status' in data:  # NOVO: Atualizar status de leitura
        book.reading_status = data['reading_status']
    
    try:
        db.session.commit()
        return jsonify(book.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@main.route('/api/books/<int:book_id>', methods=['DELETE'])
@login_required
def delete_book(book_id):
    """API para deletar um livro do usuário atual"""
    book = Book.query.filter_by(id=book_id, user_id=current_user.id).first_or_404()
    
    try:
        db.session.delete(book)
        db.session.commit()
        return jsonify({'message': 'Livro deletado com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ==================== API DE ESTATÍSTICAS ====================

@main.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    """API para obter estatísticas dos livros do usuário atual"""
    # Total de livros do usuário
    total_books = Book.query.filter_by(user_id=current_user.id).count()
    
    # Gêneros únicos do usuário
    genres = db.session.query(Book.genre).filter(
        Book.user_id == current_user.id,
        Book.genre.isnot(None),
        Book.genre != ''
    ).distinct().all()
    unique_genres = len([g[0] for g in genres if g[0]])
    
    # Autores únicos do usuário
    authors = db.session.query(Book.author).filter(
        Book.user_id == current_user.id,
        Book.author.isnot(None),
        Book.author != ''
    ).distinct().all()
    unique_authors = len([a[0] for a in authors if a[0]])
    
    return jsonify({
        'total_books': total_books,
        'unique_genres': unique_genres,
        'unique_authors': unique_authors
    })

# ==================== API GOOGLE BOOKS ====================

@main.route('/api/search-google-books', methods=['GET'])
@login_required
def search_google_books():
    """API para buscar livros na Google Books API"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({'error': 'Parâmetro de busca é obrigatório'}), 400
    
    try:
        # Codifica a query para URL
        encoded_query = urllib.parse.quote(query)
        
        # URL da Google Books API
        api_url = f'https://www.googleapis.com/books/v1/volumes?q={encoded_query}&maxResults=5'
        
        # Faz a requisição para a Google Books API
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        books = []
        
        # Processa os resultados
        if 'items' in data:
            for item in data['items']:
                volume_info = item.get('volumeInfo', {})
                
                # Extrai as informações do livro
                book_data = {
                    'title': volume_info.get('title', ''),
                    'authors': volume_info.get('authors', []),
                    'author': ', '.join(volume_info.get('authors', [])),
                    'publishedDate': volume_info.get('publishedDate', ''),
                    'year': None,
                    'description': volume_info.get('description', ''),
                    'categories': volume_info.get('categories', []),
                    'genre': ', '.join(volume_info.get('categories', [])),
                    'pageCount': volume_info.get('pageCount'),
                    'language': volume_info.get('language', ''),
                    'thumbnail': volume_info.get('imageLinks', {}).get('thumbnail', ''),
                    'cover_image_url': volume_info.get('imageLinks', {}).get('thumbnail', ''), # Adicionado cover_image_url
                    'publisher': volume_info.get('publisher', ''),
                    'isbn': None
                }
                
                # Extrai o ano da data de publicação
                if book_data['publishedDate']:
                    try:
                        # Tenta extrair o ano (formato pode ser YYYY, YYYY-MM, YYYY-MM-DD)
                        year_str = book_data['publishedDate'].split('-')[0]
                        if year_str.isdigit() and len(year_str) == 4:
                            book_data['year'] = int(year_str)
                    except (ValueError, IndexError):
                        pass
                
                # Extrai ISBN se disponível
                industry_identifiers = volume_info.get('industryIdentifiers', [])
                for identifier in industry_identifiers:
                    if identifier.get('type') in ['ISBN_13', 'ISBN_10']:
                        book_data['isbn'] = identifier.get('identifier')
                        break
                
                books.append(book_data)
        
        return jsonify({
            'success': True,
            'totalItems': data.get('totalItems', 0),
            'books': books
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Erro ao conectar com a Google Books API: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500


# ==================== ROTAS DE EXPORTACAO ====================

@main.route('/api/books/export/csv', methods=['GET'])
@login_required
def export_books_csv():
    """API para exportar todos os livros do usuario em formato CSV"""
    try:
        # Buscar todos os livros do usuario atual
        books = Book.query.filter_by(user_id=current_user.id).all()
        
        # Criar um arquivo CSV em memoria
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Escrever cabecalho
        writer.writerow([
            'ID', 'Titulo', 'Autor', 'Ano', 'Genero', 'Descricao', 
            'Avaliacao', 'Status de Leitura', 'Data de Criacao'
        ])
        
        # Escrever dados dos livros
        for book in books:
            status_labels = {
                'want_to_read': 'Quero Ler',
                'reading': 'Lendo',
                'read': 'Lido'
            }
            status_label = status_labels.get(book.reading_status, 'Quero Ler')
            
            writer.writerow([
                book.id,
                book.title,
                book.author,
                book.year or '',
                book.genre or '',
                book.description or '',
                book.rating or 0,
                status_label,
                book.created_at.strftime('%Y-%m-%d %H:%M:%S') if book.created_at else ''
            ])
        
        # Preparar o arquivo para download
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'colecao_livros_{current_user.nickname}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    
    except Exception as e:
        return jsonify({'error': f'Erro ao exportar para CSV: {str(e)}'}), 500


@main.route('/api/books/export/json', methods=['GET'])
@login_required
def export_books_json():
    """API para exportar todos os livros do usuario em formato JSON"""
    try:
        # Buscar todos os livros do usuario atual
        books = Book.query.filter_by(user_id=current_user.id).all()
        
        # Preparar dados para JSON
        books_data = []
        for book in books:
            status_labels = {
                'want_to_read': 'Quero Ler',
                'reading': 'Lendo',
                'read': 'Lido'
            }
            status_label = status_labels.get(book.reading_status, 'Quero Ler')
            
            books_data.append({
                'id': book.id,
                'titulo': book.title,
                'autor': book.author,
                'ano': book.year,
                'genero': book.genre,
                'descricao': book.description,
                'avaliacao': book.rating or 0,
                'status_leitura': status_label,
                'url_capa': book.cover_image_url,
                'data_criacao': book.created_at.isoformat() if book.created_at else None
            })
        
        # Preparar o JSON com metadados
        export_data = {
            'usuario': current_user.nickname,
            'data_exportacao': datetime.now().isoformat(),
            'total_livros': len(books_data),
            'livros': books_data
        }
        
        # Retornar como download
        return send_file(
            io.BytesIO(json.dumps(export_data, ensure_ascii=False, indent=2).encode('utf-8')),
            mimetype='application/json',
            as_attachment=True,
            download_name=f'colecao_livros_{current_user.nickname}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        )
    
    except Exception as e:
        return jsonify({'error': f'Erro ao exportar para JSON: {str(e)}'}), 500
