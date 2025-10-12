from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    
    # Configuração do banco de dados MySQL
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://book_user:book_password@localhost/book_collection'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'
    
    # Inicializar extensões
    db.init_app(app)
    CORS(app)
    migrate.init_app(app, db)
    
    # Configurar Flask-Login
    login_manager.init_app(app)
    login_manager.login_view = 'main.login'
    login_manager.login_message = 'Por favor, faça login para acessar esta página.'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        from app.models import User
        return User.query.get(int(user_id))
    
    # Registrar blueprints
    from app.routes import main
    app.register_blueprint(main)
    
    return app

