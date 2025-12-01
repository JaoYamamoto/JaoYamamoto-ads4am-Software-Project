import sqlite3
import os

try:
    db_path = os.path.join(os.path.dirname(__file__), 'app', 'book_collection.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT sqlite_version()")
    version = cursor.fetchone()
    print(f"Conexão com SQLite bem-sucedida! Versão: {version[0]}")
    conn.close()
except sqlite3.Error as e:
    print(f"Erro ao conectar ao SQLite: {e}")
