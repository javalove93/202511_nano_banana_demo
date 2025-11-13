import os
from flask import Blueprint, render_template, request, redirect, url_for, jsonify, g, current_app
from google.cloud import firestore
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import datetime
import jwt
from functools import wraps

load_dotenv()

admin_bp = Blueprint('admin', __name__)

# Firestore client setup
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
FIRESTORE_DATABASE_ID = os.getenv("FIRESTORE_DATABASE_ID")

if FIRESTORE_DATABASE_ID:
    db = firestore.Client(project=PROJECT_ID, database=FIRESTORE_DATABASE_ID)
else:
    db = firestore.Client(project=PROJECT_ID)
    
ACCOUNTS_COLLECTION = os.getenv("ACCOUNTS_ID", "user_accounts")
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')


def token_required(admin_only=False):
    """
    토큰 검증 데코레이터
    admin_only=True일 경우 관리자 권한도 확인
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = None
            
            # Authorization 헤더에서 토큰 추출
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                try:
                    token = auth_header.split(' ')[1]  # "Bearer <token>"에서 토큰 추출
                except IndexError:
                    return jsonify({'message': 'Invalid token format'}), 401
            
            if not token:
                return jsonify({'message': 'Token is missing'}), 401
            
            try:
                # 토큰 디코딩
                data = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
                user_id = data['user_id']
                
                # Firestore에서 사용자 정보 조회
                user_ref = db.collection(ACCOUNTS_COLLECTION).document(user_id)
                user_doc = user_ref.get()
                
                if not user_doc.exists:
                    return jsonify({'message': 'User not found'}), 401
                
                user_data = user_doc.to_dict()
                
                # 만료일 확인
                if 'expires_at' in user_data:
                    expires_at = user_data['expires_at']
                    # Firestore timestamp를 datetime으로 변환
                    if hasattr(expires_at, 'timestamp'):
                        expires_at = datetime.datetime.fromtimestamp(expires_at.timestamp())
                    elif isinstance(expires_at, datetime.datetime):
                        pass
                    else:
                        return jsonify({'message': 'Invalid expiry date format'}), 401
                    
                    # 만료일이 현재 시간보다 이전인지 확인
                    if expires_at < datetime.datetime.now():
                        return jsonify({'message': 'Account has expired'}), 401
                
                # 관리자 권한 확인
                if admin_only and user_id != ADMIN_USERNAME:
                    return jsonify({'message': 'Admin access required'}), 403
                
                # 사용자 정보를 g 객체에 저장
                g.user = {'user_id': user_id, 'data': user_data}
                
            except jwt.ExpiredSignatureError:
                return jsonify({'message': 'Token has expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'message': 'Invalid token'}), 401
            except Exception as e:
                current_app.logger.error(f"Token validation error: {e}")
                return jsonify({'message': 'Token validation failed'}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@admin_bp.route('/admin')
def index():
    # Render the page without authentication - authentication will be handled by JavaScript
    return render_template('admin.html')

@admin_bp.route('/admin/users', methods=['GET'])
@token_required(admin_only=True)
def get_users():
    """API endpoint to get all users - requires admin authentication"""
    users_ref = db.collection(ACCOUNTS_COLLECTION).stream()
    users = []
    for user in users_ref:
        user_data = user.to_dict()
        user_data['id'] = user.id
        # Ensure created_at and expires_at are handled gracefully if missing
        if 'created_at' in user_data and isinstance(user_data['created_at'], datetime.datetime):
            user_data['created_at'] = user_data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        if 'expires_at' in user_data and isinstance(user_data['expires_at'], datetime.datetime):
            user_data['expires_at'] = user_data['expires_at'].strftime('%Y-%m-%d')
        users.append(user_data)
    return jsonify(users), 200

@admin_bp.route('/admin/add_user', methods=['POST'])
@token_required(admin_only=True)
def add_user():
    user_id = request.form.get('user_id')
    password = request.form.get('password')
    expiry_date_str = request.form.get('expiry_date')

    if not user_id or not password:
        return "User ID and password are required.", 400

    hashed_password = generate_password_hash(password)
    
    user_data = {
        'password': hashed_password,
        'created_at': datetime.datetime.now(datetime.timezone.utc),
    }

    if expiry_date_str:
        try:
            expiry_date = datetime.datetime.strptime(expiry_date_str, '%Y-%m-%d')
            user_data['expires_at'] = expiry_date
        except ValueError:
            return "Invalid date format for expiry date. Use YYYY-MM-DD.", 400

    db.collection(ACCOUNTS_COLLECTION).document(user_id).set(user_data)
    return redirect(url_for('admin.index'))

@admin_bp.route('/admin/update_password', methods=['POST'])
@token_required(admin_only=True)
def update_password():
    user_id = request.form.get('user_id')
    new_password = request.form.get('new_password')

    if not user_id or not new_password:
        return "User ID and new password are required.", 400

    hashed_password = generate_password_hash(new_password)
    db.collection(ACCOUNTS_COLLECTION).document(user_id).update({
        'password': hashed_password
    })
    return redirect(url_for('admin.index'))

@admin_bp.route('/admin/update_expiry', methods=['POST'])
@token_required(admin_only=True)
def update_expiry():
    user_id = request.form.get('user_id')
    expiry_date_str = request.form.get('expiry_date')

    if not user_id or not expiry_date_str:
        return "User ID and expiry date are required.", 400
        
    try:
        expiry_date = datetime.datetime.strptime(expiry_date_str, '%Y-%m-%d')
        db.collection(ACCOUNTS_COLLECTION).document(user_id).update({
            'expires_at': expiry_date
        })
    except ValueError:
        return "Invalid date format. Use YYYY-MM-DD.", 400
        
    return redirect(url_for('admin.index'))

@admin_bp.route('/admin/delete_user', methods=['POST'])
@token_required(admin_only=True)
def delete_user():
    user_id = request.form.get('user_id')
    if not user_id:
        return "User ID is required.", 400
        
    db.collection(ACCOUNTS_COLLECTION).document(user_id).delete()
    return redirect(url_for('admin.index'))
