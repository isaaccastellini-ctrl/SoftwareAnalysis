from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from models import db, User, Transaction
import os
from dotenv import load_dotenv
from fpdf import FPDF
from datetime import datetime

# Carrega variáveis do arquivo .env
load_dotenv()

# --- CAMINHOS ABSOLUTOS ---
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

if not os.path.exists(instance_path):
    os.makedirs(instance_path)

app = Flask(__name__)

# --- CONFIGURAÇÃO CORS ---
CORS(app, resources={r"/api/*": {"origins": "*"}}, 
     allow_headers=["Content-Type", "X-Admin-Token", "ngrok-skip-browser-warning"], 
     expose_headers=["X-Admin-Token"])

# --- CHAVES SECRETAS ---
ADMIN_SECRET_KEY = os.getenv("MINHA_API_KEY")

# --- CONFIGURAÇÃO DO BANCO DE DADOS (PRIMÁRIO) ---
database_url = os.getenv('BANCO_URL')
if not database_url:
    database_url = 'sqlite:///' + os.path.join(instance_path, 'database.db')
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# --- FUNÇÃO AUXILIAR PARA PDF ---
def generate_receipt_pdf(username, value):
    timestamp = datetime.now().strftime('%d%m%Y%H%M%S')
    val_code = f"REC-{username[:3].upper()}-{timestamp}"

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="Comprovante de Pagamento", ln=True, align='C')
    pdf.ln(5)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(200, 10, txt=f"Cod. Autenticacao: {val_code}", ln=True, align='C')
    pdf.ln(5)
    
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"Usuario: {username}", ln=True)
    pdf.cell(200, 10, txt=f"Valor Pago: R$ {value:.2f}", ln=True)
    pdf.cell(200, 10, txt=f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", ln=True)
    return pdf.output(dest='S').encode('latin-1')

# --- ROTAS DO SISTEMA ---

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "alive", "database": "primary"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    db.session.remove()
    user = User.query.filter_by(username=data.get('username'), password=data.get('password')).first()
    if user:
        return jsonify({
            "id": user.id, 
            "username": user.username, 
            "role": user.role, 
            "balance": user.balance, 
            "avatar": user.avatar
        }), 200
    return jsonify({"error": "Credenciais inválidas no sistema primário"}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    db.session.remove()
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Usuário já existe"}), 400
    
    new_user = User(username=username, password=data.get('password'), role='user', balance=0.0)
    db.session.add(new_user)
    try:
        db.session.commit()
        return jsonify({"message": "Usuário registrado com sucesso"}), 201
    except:
        db.session.rollback()
        return jsonify({"error": "Erro ao registrar usuário"}), 500

@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    db.session.remove()
    user = User.query.get(user_id)
    if user:
        return jsonify({
            "id": user.id, 
            "username": user.username, 
            "role": user.role, 
            "balance": user.balance, 
            "avatar": user.avatar
        }), 200
    return jsonify({"error": "Usuário não encontrado"}), 404

@app.route('/api/user/update-avatar', methods=['POST'])
def update_avatar():
    data = request.json
    db.session.remove()
    user = User.query.get(data.get('user_id'))
    if not user: return jsonify({"error": "Usuário não encontrado"}), 404
    try:
        user.avatar = data.get('avatar_url')
        db.session.commit()
        return jsonify({"message": "Avatar atualizado"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "Erro ao atualizar avatar"}), 500

@app.route('/api/user/pay', methods=['POST'])
def user_pay():
    data = request.json
    db.session.remove()
    user = User.query.get(data.get('user_id'))
    value = float(data.get('value', 0))
    
    if not user or user.balance < value:
        return jsonify({"error": "Saldo insuficiente"}), 400
    
    try:
        user.balance -= value
        new_trans = Transaction(user_id=user.id, value=value, type='Saída', timestamp=datetime.now())
        db.session.add(new_trans)
        db.session.commit()
        return jsonify({
            "message": "Pagamento realizado", 
            "new_balance": user.balance,
            "receipt_url": f"/api/receipt/{user.id}/{value}"
        }), 200
    except:
        db.session.rollback()
        return jsonify({"error": "Erro ao processar pagamento"}), 500

@app.route('/api/user/transactions/<int:user_id>', methods=['GET'])
def get_transactions(user_id):
    db.session.remove()
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.timestamp.desc()).all()
    return jsonify([{
        "id": t.id,
        "value": t.value,
        "timestamp": t.timestamp.strftime('%d/%m/%Y %H:%M'),
        "type": t.type
    } for t in transactions]), 200

@app.route('/api/receipt/<int:user_id>/<float:value>', methods=['GET'])
def get_receipt(user_id, value):
    user = User.query.get(user_id)
    if not user: return "Usuário não encontrado", 404
    pdf_bytes = generate_receipt_pdf(user.username, value)
    response = make_response(pdf_bytes)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'inline; filename=comprovante_{user.username}.pdf'
    return response

# --- ROTAS ADMIN ---

@app.route('/api/admin/users', methods=['GET'])
def list_users():
    if request.headers.get('X-Admin-Token') != ADMIN_SECRET_KEY:
        return jsonify({"error": "Acesso negado"}), 403
    db.session.remove()
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "balance": u.balance, "role": u.role} for u in users]), 200

@app.route('/api/admin/update-balance', methods=['POST'])
def update_balance():
    if request.headers.get('X-Admin-Token') != ADMIN_SECRET_KEY:
        return jsonify({"error": "Acesso negado"}), 403
    data = request.json
    db.session.remove()
    user = User.query.get(data.get('user_id'))
    amount = float(data.get('amount', 0))
    if user:
        try:
            user.balance += amount
            if user.balance < 0: user.balance = 0
            if amount > 0:
                new_trans = Transaction(user_id=user.id, value=amount, type='Entrada', timestamp=datetime.now())
                db.session.add(new_trans)
            db.session.commit()
            return jsonify({"message": "Saldo atualizado", "new_balance": user.balance}), 200
        except:
            db.session.rollback()
            return jsonify({"error": "Erro ao atualizar saldo"}), 500
    return jsonify({"error": "Usuário não encontrado"}), 404

@app.route('/api/admin/export-db', methods=['GET'])
def export_db():
    if request.headers.get('X-Admin-Token') != ADMIN_SECRET_KEY:
        return jsonify({"error": "Acesso negado"}), 403
    db.session.remove()
    users = User.query.all()
    data = [{"id": u.id, "username": u.username, "password": u.password, "balance": u.balance, "role": u.role, "avatar": u.avatar} for u in users]
    return jsonify({"info": "Backup Primário", "data": data}), 200

@app.route('/api/admin/import-db', methods=['POST'])
def import_db():
    if request.headers.get('X-Admin-Token') != ADMIN_SECRET_KEY:
        return jsonify({"error": "Acesso negado"}), 403
    backup = request.json
    try:
        db.session.remove()
        User.query.delete()
        for u_data in backup['data']:
            new_u = User(
                id=u_data.get('id'), 
                username=u_data.get('username'), 
                password=u_data.get('password'), 
                balance=u_data.get('balance'), 
                role=u_data.get('role'), 
                avatar=u_data.get('avatar')
            )
            db.session.add(new_u)
        db.session.commit()
        return jsonify({"message": "Restauração concluída"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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
            return f"Usuário {username} agora é ADMIN!", 200
        except:
            db.session.rollback()
            return "Erro interno", 500
    return "Não encontrado", 404

# --- EXECUÇÃO ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Banco de dados primário sincronizado!")
        print("🚀 Servidor CNA Finance rodando...")
            
    app.run(host='0.0.0.0', port=5000, debug=True)