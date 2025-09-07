from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    
    # Configuração da aplicação
    app.config['SECRET_KEY'] = 'your-secret-key-here'
    
    # Inicializar extensões
    CORS(app)
    
    # Registrar blueprints
    from app.routes import main
    app.register_blueprint(main)
    
    return app

