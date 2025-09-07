from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from app.json_db import db

main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Página principal - lista todos os livros"""
    return render_template('index.html')

@main.route('/api/books', methods=['GET'])
def get_books():
    """API para obter todos os livros"""
    # Verifica se há parâmetros de busca ou filtro
    search_query = request.args.get('search', '').strip()
    genre_filter = request.args.get('genre', '').strip()
    
    if search_query:
        books = db.search_books(search_query)
    elif genre_filter and genre_filter.lower() != 'todos':
        books = db.filter_by_genre(genre_filter)
    else:
        books = db.get_all_books()
    
    return jsonify(books)

@main.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """API para obter um livro específico"""
    book = db.get_book_by_id(book_id)
    if not book:
        return jsonify({'error': 'Livro não encontrado'}), 404
    return jsonify(book)

@main.route('/api/books', methods=['POST'])
def create_book():
    """API para criar um novo livro"""
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('author'):
        return jsonify({'error': 'Título e autor são obrigatórios'}), 400
    
    try:
        book = db.create_book(
            title=data['title'],
            author=data['author'],
            year=data.get('year'),
            genre=data.get('genre'),
            description=data.get('description')
        )
        return jsonify(book), 201
    except Exception as e:
        return jsonify({'error': f'Erro ao criar livro: {str(e)}'}), 500

@main.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    """API para atualizar um livro"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Dados não fornecidos'}), 400
    
    try:
        book = db.update_book(
            book_id=book_id,
            title=data.get('title'),
            author=data.get('author'),
            year=data.get('year'),
            genre=data.get('genre'),
            description=data.get('description')
        )
        
        if not book:
            return jsonify({'error': 'Livro não encontrado'}), 404
        
        return jsonify(book)
    except Exception as e:
        return jsonify({'error': f'Erro ao atualizar livro: {str(e)}'}), 500

@main.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    """API para deletar um livro"""
    try:
        success = db.delete_book(book_id)
        if not success:
            return jsonify({'error': 'Livro não encontrado'}), 404
        
        return jsonify({'message': 'Livro deletado com sucesso'}), 200
    except Exception as e:
        return jsonify({'error': f'Erro ao deletar livro: {str(e)}'}), 500

@main.route('/api/genres', methods=['GET'])
def get_genres():
    """API para obter todos os gêneros únicos"""
    try:
        genres = db.get_genres()
        return jsonify(genres)
    except Exception as e:
        return jsonify({'error': f'Erro ao obter gêneros: {str(e)}'}), 500

@main.route('/api/authors', methods=['GET'])
def get_authors():
    """API para obter todos os autores únicos"""
    try:
        authors = db.get_authors()
        return jsonify(authors)
    except Exception as e:
        return jsonify({'error': f'Erro ao obter autores: {str(e)}'}), 500

@main.route('/api/stats', methods=['GET'])
def get_stats():
    """API para obter estatísticas da coleção"""
    try:
        stats = db.get_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': f'Erro ao obter estatísticas: {str(e)}'}), 500

@main.route('/add')
def add_book_page():
    """Página para adicionar livro"""
    return render_template('add_book.html')

@main.route('/edit/<int:book_id>')
def edit_book_page(book_id):
    """Página para editar livro"""
    return render_template('edit_book.html', book_id=book_id)

