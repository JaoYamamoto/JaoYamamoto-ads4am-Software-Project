from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import Book, User
from sqlalchemy import func
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
    """API para obter todos os livros do usuário atual"""
    search_query = request.args.get('search', '').strip()
    genre_filter = request.args.get('genre', '').strip()

    # Filtrar apenas livros do usuário atual
    books_query = Book.query.filter_by(user_id=current_user.id)

    if search_query:
        books_query = books_query.filter(
            (Book.title.ilike(f'%{search_query}%')) |
            (Book.author.ilike(f'%{search_query}%')) |
            (Book.genre.ilike(f'%{search_query}%'))
        )
    
    if genre_filter and genre_filter.lower() != 'todos':
        books_query = books_query.filter(Book.genre.ilike(f'%{genre_filter}%'))

    books = books_query.all()
    return jsonify([book.to_dict() for book in books])

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

