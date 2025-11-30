from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from app import db
from app.models import Book

main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Página principal - lista todos os livros"""
    return render_template('index.html')

@main.route('/api/books', methods=['GET'])
def get_books():
    """API para obter todos os livros"""
    books = Book.query.all()
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

@main.route('/add')
def add_book_page():
    """Página para adicionar livro"""
    return render_template('add_book.html')

@main.route('/edit/<int:book_id>')
def edit_book_page(book_id):
    """Página para editar livro"""
    return render_template('edit_book.html', book_id=book_id)

