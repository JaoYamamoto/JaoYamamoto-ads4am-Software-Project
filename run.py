from app import create_app, db
from flask_migrate import Migrate, MigrateCommand 
from flask_script import Manager 

app = create_app()
manager = Manager(app) 
manager.add_command('db', MigrateCommand) 
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
