import json
import os
from typing import List, Dict, Optional

class JSONDatabase:
    def __init__(self, db_file: str = 'books.json'):
        """
        Inicializa o banco de dados JSON.
        
        Args:
            db_file: Caminho para o arquivo JSON que armazenará os dados
        """
        self.db_file = db_file
        self._ensure_db_exists()
    
    def _ensure_db_exists(self):
        """Garante que o arquivo JSON existe e tem a estrutura correta."""
        if not os.path.exists(self.db_file):
            initial_data = {
                'books': [],
                'next_id': 1
            }
            with open(self.db_file, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, ensure_ascii=False, indent=2)
    
    def _read_data(self) -> Dict:
        """Lê os dados do arquivo JSON."""
        try:
            with open(self.db_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Se houver erro, recria o arquivo
            self._ensure_db_exists()
            with open(self.db_file, 'r', encoding='utf-8') as f:
                return json.load(f)
    
    def _write_data(self, data: Dict):
        """Escreve os dados no arquivo JSON."""
        with open(self.db_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def get_all_books(self) -> List[Dict]:
        """Retorna todos os livros."""
        data = self._read_data()
        return data['books']
    
    def get_book_by_id(self, book_id: int) -> Optional[Dict]:
        """
        Retorna um livro específico pelo ID.
        
        Args:
            book_id: ID do livro
            
        Returns:
            Dicionário com os dados do livro ou None se não encontrado
        """
        data = self._read_data()
        for book in data['books']:
            if book['id'] == book_id:
                return book
        return None
    
    def create_book(self, title: str, author: str, year: Optional[int] = None, 
                   genre: Optional[str] = None, description: Optional[str] = None) -> Dict:
        """
        Cria um novo livro.
        
        Args:
            title: Título do livro (obrigatório)
            author: Autor do livro (obrigatório)
            year: Ano de publicação (opcional)
            genre: Gênero do livro (opcional)
            description: Descrição do livro (opcional)
            
        Returns:
            Dicionário com os dados do livro criado
        """
        data = self._read_data()
        
        new_book = {
            'id': data['next_id'],
            'title': title,
            'author': author,
            'year': year,
            'genre': genre,
            'description': description
        }
        
        data['books'].append(new_book)
        data['next_id'] += 1
        
        self._write_data(data)
        return new_book
    
    def update_book(self, book_id: int, title: Optional[str] = None, 
                   author: Optional[str] = None, year: Optional[int] = None,
                   genre: Optional[str] = None, description: Optional[str] = None) -> Optional[Dict]:
        """
        Atualiza um livro existente.
        
        Args:
            book_id: ID do livro a ser atualizado
            title: Novo título (opcional)
            author: Novo autor (opcional)
            year: Novo ano (opcional)
            genre: Novo gênero (opcional)
            description: Nova descrição (opcional)
            
        Returns:
            Dicionário com os dados do livro atualizado ou None se não encontrado
        """
        data = self._read_data()
        
        for i, book in enumerate(data['books']):
            if book['id'] == book_id:
                # Atualiza apenas os campos fornecidos
                if title is not None:
                    book['title'] = title
                if author is not None:
                    book['author'] = author
                if year is not None:
                    book['year'] = year
                if genre is not None:
                    book['genre'] = genre
                if description is not None:
                    book['description'] = description
                
                data['books'][i] = book
                self._write_data(data)
                return book
        
        return None
    
    def delete_book(self, book_id: int) -> bool:
        """
        Deleta um livro.
        
        Args:
            book_id: ID do livro a ser deletado
            
        Returns:
            True se o livro foi deletado, False se não foi encontrado
        """
        data = self._read_data()
        
        for i, book in enumerate(data['books']):
            if book['id'] == book_id:
                del data['books'][i]
                self._write_data(data)
                return True
        
        return False
    
    def search_books(self, query: str) -> List[Dict]:
        """
        Busca livros por título, autor ou gênero.
        
        Args:
            query: Termo de busca
            
        Returns:
            Lista de livros que correspondem à busca
        """
        if not query:
            return self.get_all_books()
        
        query_lower = query.lower()
        data = self._read_data()
        results = []
        
        for book in data['books']:
            # Busca no título, autor e gênero
            if (query_lower in (book.get('title', '') or '').lower() or
                query_lower in (book.get('author', '') or '').lower() or
                query_lower in (book.get('genre', '') or '').lower()):
                results.append(book)
        
        return results
    
    def filter_by_genre(self, genre: str) -> List[Dict]:
        """
        Filtra livros por gênero.
        
        Args:
            genre: Gênero para filtrar
            
        Returns:
            Lista de livros do gênero especificado
        """
        if not genre or genre.lower() == 'todos':
            return self.get_all_books()
        
        data = self._read_data()
        results = []
        
        for book in data['books']:
            if book.get('genre', '').lower() == genre.lower():
                results.append(book)
        
        return results
    
    def get_genres(self) -> List[str]:
        """
        Retorna uma lista de todos os gêneros únicos.
        
        Returns:
            Lista de gêneros únicos
        """
        data = self._read_data()
        genres = set()
        
        for book in data['books']:
            genre = book.get('genre')
            if genre and genre.strip():
                genres.add(genre.strip())
        
        return sorted(list(genres))
    
    def get_authors(self) -> List[str]:
        """
        Retorna uma lista de todos os autores únicos.
        
        Returns:
            Lista de autores únicos
        """
        data = self._read_data()
        authors = set()
        
        for book in data['books']:
            author = book.get('author')
            if author and author.strip():
                authors.add(author.strip())
        
        return sorted(list(authors))
    
    def get_stats(self) -> Dict:
        """
        Retorna estatísticas da coleção.
        
        Returns:
            Dicionário com estatísticas (total de livros, gêneros, autores)
        """
        data = self._read_data()
        
        return {
            'total_books': len(data['books']),
            'total_genres': len(self.get_genres()),
            'total_authors': len(self.get_authors())
        }


# Instância global do banco de dados JSON
db = JSONDatabase()

