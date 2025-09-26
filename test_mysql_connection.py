import pymysql

try:
    conn = pymysql.connect(
        host='127.0.0.1',
        user='book_user',
        password='book_password',
        database='book_collection',
        port=3306 # Porta padrão do MySQL
    )
    print("Conexão com MySQL bem-sucedida!")
    conn.close()
except pymysql.Error as e:
    print(f"Erro ao conectar ao MySQL: {e}")

