from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

# Inicializa o banco de dados
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'  # Forçamos o nome para 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default='user')
    balance = db.Column(db.Float, default=0.0)
    avatar = db.Column(db.Text, nullable=True)
    
    # O segredo está aqui: referenciando a classe Transaction
    transactions = db.relationship('Transaction', backref='users', lazy=True)

class Transaction(db.Model):
    __tablename__ = 'transaction'
    id = db.Column(db.Integer, primary_key=True)
    
    # IMPORTANTE: O nome dentro do ForeignKey deve ser exatamente 
    # o nome da __tablename__ do User + .id
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    value = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(10), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)