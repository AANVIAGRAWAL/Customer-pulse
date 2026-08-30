import os
import sys
import datetime
import urllib.request
import json
import jwt
from flask import Blueprint, request, jsonify, current_app, g
from sqlalchemy import text
from functools import wraps

sys_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if sys_path not in sys.path:
    sys.path.append(sys_path)
from database.db_connection import get_db_connection

auth_bp = Blueprint('auth', __name__)

# Firebase Public Certs Caching
GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken-system@system.gserviceaccount.com"
_certs_cache = {}
_certs_expiry = None

def get_google_public_key(kid):
    global _certs_cache, _certs_expiry
    now = datetime.datetime.now(datetime.UTC)
    if not _certs_cache or not _certs_expiry or now > _certs_expiry:
        try:
            req = urllib.request.Request(GOOGLE_CERTS_URL)
            with urllib.request.urlopen(req) as response:
                _certs_cache = json.loads(response.read().decode('utf-8'))
                # Cache for 1 hour
                _certs_expiry = now + datetime.timedelta(hours=1)
        except Exception as e:
            print(f"[AUTH ERROR] Failed to fetch Google securetoken certs: {e}")
            return None
    return _certs_cache.get(kid)

# JWT Authentication Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"error": "Unauthorized", "message": "Invalid Authorization header format."}), 401
                
        if not token:
            return jsonify({"error": "Unauthorized", "message": "Authentication token is missing."}), 401
            
        # 1. Attempt to verify as local Mock Token (HS256 signed with Flask SECRET_KEY)
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            request.user_email = data['email']
            g.user_email = data['email']
            return f(*args, **kwargs)
        except (jwt.ExpiredSignatureError, jwt.InvalidSignatureError, jwt.InvalidTokenError):
            # Not a local mock token, continue to Firebase validation
            pass

        # 2. Attempt to verify as Firebase ID Token (RS256 signed by Google)
        firebase_project_id = os.environ.get('FIREBASE_PROJECT_ID')
        if not firebase_project_id:
            return jsonify({
                "error": "Unauthorized", 
                "message": "Invalid token. Firebase Project ID is not configured on the backend, and local mock signature failed."
            }), 401

        try:
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            if not kid:
                return jsonify({"error": "Unauthorized", "message": "Invalid token header. Missing 'kid'."}), 401
                
            public_key = get_google_public_key(kid)
            if not public_key:
                return jsonify({"error": "Unauthorized", "message": "Google authentication key not found or expired."}), 401
                
            decoded_token = jwt.decode(
                token, 
                public_key, 
                algorithms=["RS256"], 
                audience=firebase_project_id, 
                issuer=f"https://securetoken.google.com/{firebase_project_id}"
            )
            request.user_email = decoded_token.get('email')
            g.user_email = decoded_token.get('email')
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized", "message": "Authentication token has expired."}), 401
        except Exception as e:
            return jsonify({"error": "Unauthorized", "message": f"Token validation failed: {e}"}), 401
            
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/mock-login', methods=['POST'])
def mock_login():
    """
    Mock login endpoint to bypass Firebase during local development.
    Generates a local JWT token signed with Flask app's SECRET_KEY.
    """
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({"error": "Bad Request", "message": "Email is required."}), 400
        
    email = data['email'].strip().lower()
    if not email:
        return jsonify({"error": "Bad Request", "message": "Email is required."}), 400
        
    engine = get_db_connection()
    if not engine:
        return jsonify({"error": "Internal Server Error", "message": "Database connection failed."}), 500
        
    try:
        with engine.connect() as conn:
            # Register user if they do not exist
            user_exists = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email}).first()
            if not user_exists:
                conn.execute(text("INSERT INTO users (email) VALUES (:email)"), {"email": email})
                conn.commit()
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": f"Database error during user check: {e}"}), 500
        
    # Generate local JWT
    payload = {
        "email": email,
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=1)
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        "status": "success",
        "message": "Local developer login successful.",
        "token": token,
        "user": {"email": email}
    })

@auth_bp.route('/session-status', methods=['GET'])
@token_required
def session_status():
    """
    Returns whether the current user has uploaded data in their SQLite session.
    """
    from backend.services.db_service import user_has_data
    has_data = user_has_data(g.user_email)
    return jsonify({
        "status": "success",
        "has_data": has_data
    })
