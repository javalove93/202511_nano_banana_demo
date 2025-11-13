import os
from flask import Blueprint, render_template, request, redirect, url_for
from google.cloud import firestore
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv
import datetime

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

@admin_bp.route('/admin')
def index():
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
    return render_template('admin.html', users=users)

@admin_bp.route('/admin/add_user', methods=['POST'])
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
def delete_user():
    user_id = request.form.get('user_id')
    if not user_id:
        return "User ID is required.", 400
        
    db.collection(ACCOUNTS_COLLECTION).document(user_id).delete()
    return redirect(url_for('admin.index'))
