from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from app import db
from app.models import Book
from sqlalchemy import func

main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Página principal - lista todos os livros"""
    return render_template('index.html')

@main.route('/api/books', methods=['GET'])
def get_books():
    """API para obter todos os livros"""
    search_query = request.args.get('search', '').strip()
    genre_filter = request.args.get('genre', '').strip()

    books_query = Book.query

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
def get_book(book_id):
    """API para obter um livro específico"""
    book = Book.query.get_or_404(book_id)
    return jsonify(book.to_dict())

@main.route('/api/books', methods=['POST'])
def create_book():
    """API para criar um novo livro"""
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('author'):
        return jsonify({'error': 'Título e autor são obrigatórios'}), 400
    
    book = Book(
        title=data['title'],
        author=data['author'],
        year=data.get('year'),
        genre=data.get('genre'),
        description=data.get('description')
    )
    
    db.session.add(book)
    db.session.commit()
    
    return jsonify(book.to_dict()), 201

@main.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    """API para atualizar um livro"""
    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Dados não fornecidos'}), 400
    
    book.title = data.get('title', book.title)
    book.author = data.get('author', book.author)
    book.year = data.get('year', book.year)
    book.genre = data.get('genre', book.genre)
    book.description = data.get('description', book.description)
    
    db.session.commit()
    
    return jsonify(book.to_dict())

@main.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    """API para deletar um livro"""
    book = Book.query.get_or_404(book_id)
    db.session.delete(book)
    db.session.commit()
    
    return jsonify({'message': 'Livro deletado com sucesso'}), 200

@main.route('/api/genres', methods=['GET'])
def get_genres():
    """API para obter todos os gêneros únicos"""
    genres = db.session.query(Book.genre).filter(Book.genre.isnot(None)).distinct().all()
    return jsonify(sorted([g[0] for g in genres if g[0].strip()]))

@main.route('/api/authors', methods=['GET'])
def get_authors():
    """API para obter todos os autores únicos"""
    authors = db.session.query(Book.author).filter(Book.author.isnot(None)).distinct().all()
    return jsonify(sorted([a[0] for a in authors if a[0].strip()]))

@main.route('/api/stats', methods=['GET'])
def get_stats():
    """API para obter estatísticas da coleção"""
    total_books = Book.query.count()
    total_genres = db.session.query(func.count(Book.genre.distinct())).filter(Book.genre.isnot(None)).scalar()
    total_authors = db.session.query(func.count(Book.author.distinct())).filter(Book.author.isnot(None)).scalar()
    
    return jsonify({
        'total_books': total_books,
        'total_genres': total_genres,
        'total_authors': total_authors
    })

@main.route('/add')
def add_book_page():
    """Página para adicionar livro"""
    return render_template('add_book.html')

@main.route('/edit/<int:book_id>')
def edit_book_page(book_id):
    """Página para editar livro"""
    return render_template('edit_book.html', book_id=book_id)


