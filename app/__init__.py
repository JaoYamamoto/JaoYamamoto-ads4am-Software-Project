from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate

db = SQLAlchemy()
Migrate = Migrate()

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    
    # Configuração do banco de dados MySQL
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://book_user:book_password@127.0.0.1/book_collection'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'your-secret-key-here'
    
    # Inicializar extensões
    db.init_app(app)
    CORS(app)
    Migrate.init_app(app, db)
    
    # Registrar blueprints
    from app.routes import main
    app.register_blueprint(main)
    
    return app



