from flask_sqlalchemy import SQLAlchemy

# Inicializa o banco de dados
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    
    # Define o saldo inicial (CNA$) padrão para novos usuários
    balance = db.Column(db.Float, default=0.0)
    
    # Define o papel do usuário (admin ou user)
    role = db.Column(db.String(20), default='user')

    def __repr__(self):
        return f'<User {self.username}>'