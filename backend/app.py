from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User
import os
from sqlalchemy import delete

# --- GARANTIR CAMINHOS ABSOLUTOS ---
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

if not os.path.exists(instance_path):
    os.makedirs(instance_path)

app = Flask(__name__)

# --- AJUSTE CORS COMPLETO ---
CORS(app, resources={r"/api/*": {"origins": "*"}}, 
     allow_headers=["Content-Type", "X-Admin-Token", "ngrok-skip-browser-warning"], 
     expose_headers=["X-Admin-Token"])

# --- CHAVES SECRETAS ---
ADMIN_SECRET_KEY = os.getenv("MINHA_API_KEY")

# --- CONFIGURAÇÃO DO BANCO DE DADOS ---
database_url = 'sqlite:///' + os.path.join(instance_path, 'database.db')
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# --- ROTAS DA PÁGINA PRIMÁRIA ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    db.session.remove()
    user = User.query.filter_by(username=data.get('username'), password=data.get('password')).first()
    if user:
        return jsonify({"id": user.id, "username": user.username, "role": user.role, "balance": user.balance}), 200
    return jsonify({"error": "O que você tá fazendo aqui?"}), 401

@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    db.session.remove()
    user = User.query.get(user_id)
    if user:
        return jsonify({"id": user.id, "username": user.username, "role": user.role, "balance": user.balance}), 200
    return jsonify({"error": "Acho que você não existe aqui, hein?!"}), 404

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    db.session.remove()
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Usuário já existe no sistema primário"}), 400
    new_user = User(username=username, password=data.get('password'), role='user', balance=0.0)
    db.session.add(new_user)
    try:
        db.session.commit()
        return jsonify({"message": "Sucesso no sistema primário"}), 201
    except:
        db.session.rollback()
        return jsonify({"error": "Erro ao registrar no primário"}), 500

@app.route('/api/user/pay', methods=['POST'])
def user_pay():
    data = request.json
    db.session.remove()
    user = User.query.get(data.get('user_id'))
    value = float(data.get('value', 0))
    if not user or user.balance < value:
        return jsonify({"error": "Saldo insuficiente no sistema primário"}), 400
    try:
        user.balance -= value
        db.session.commit()
        return jsonify({"message": "Pagamento primário ok", "new_balance": user.balance}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "Erro no pagamento primário"}), 500

@app.route('/api/make-me-admin/<username>', methods=['GET'])
def make_me_admin(username):
    if request.headers.get('X-Admin-Token') != ADMIN_SECRET_KEY:
            return jsonify({"error": "Acesso negado"}), 403
    db.session.remove()
    user = User.query.filter_by(username=username).first()
    if user:
        try:
            user.role = 'admin'
            db.session.commit()
            return f"Usuário {username} agora é ADMIN primário!", 200
        except:
            db.session.rollback()
            return "Erro interno no primário", 500
    return "Não encontrado", 404

# --- EXECUÇÃO ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        for bind_name in app.config['SQLALCHEMY_BINDS'].keys():
            engine = db.get_engine(app, bind=bind_name)
            User.__table__.create(bind=engine, checkfirst=True)
            print(f"✅ Banco sincronizado: {bind_name}.db")
        print("🚀 Todos os bancos de dados estão prontos!")
            
    app.run(host='0.0.0.0', port=5000, debug=True)