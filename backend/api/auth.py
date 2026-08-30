import os
import sys
import random
import datetime
import smtplib
import jwt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
from functools import wraps

sys_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if sys_path not in sys.path:
    sys.path.append(sys_path)
from database.db_connection import get_db_connection

auth_bp = Blueprint('auth', __name__)

# JWT Helper Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # JWT is passed in the Authorization header as 'Bearer <token>'
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"error": "Unauthorized", "message": "Invalid Authorization header format."}), 401
                
        if not token:
            return jsonify({"error": "Unauthorized", "message": "Authentication token is missing."}), 401
            
        try:
            # Decode using Flask app secret key
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            request.user_email = data['email']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized", "message": "Authentication token has expired."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Unauthorized", "message": "Authentication token is invalid."}), 401
            
        return f(*args, **kwargs)
    return decorated

def send_otp_email(to_email, otp):
    smtp_server = os.environ.get('SMTP_SERVER')
    smtp_port = os.environ.get('SMTP_PORT', '587')
    smtp_user = os.environ.get('SMTP_USERNAME')
    smtp_pass = os.environ.get('SMTP_PASSWORD')
    
    if not all([smtp_server, smtp_user, smtp_pass]):
        # Mock mode: Output to terminal logs
        print(f"\n==========================================")
        print(f"[MOCK AUTH] OTP for {to_email} is: {otp}")
        print(f"==========================================\n")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = "Your CustomerPulse Login OTP"
        
        body = f"""
        <html>
            <body>
                <h2>Welcome to CustomerPulse</h2>
                <p>Use the following One-Time Password (OTP) to log in to your account. This code is valid for 5 minutes.</p>
                <h1 style="color: #4F46E5; font-size: 32px; font-weight: bold; letter-spacing: 2px;">{otp}</h1>
                <p>If you did not request this code, please ignore this email.</p>
            </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send email to {to_email}: {e}")
        return False

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({"error": "Bad Request", "message": "Email is required."}), 400
        
    email = data['email'].strip().lower()
    if not email:
        return jsonify({"error": "Bad Request", "message": "Email is required."}), 400
        
    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"
    hashed_otp = generate_password_hash(otp)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    
    engine = get_db_connection()
    if not engine:
        return jsonify({"error": "Internal Server Error", "message": "Database connection failed."}), 500
        
    try:
        with engine.connect() as conn:
            # Upsert OTP
            conn.execute(text("""
                INSERT INTO user_otps (email, otp, expires_at) 
                VALUES (:email, :otp, :expires_at) 
                ON DUPLICATE KEY UPDATE otp = :otp, expires_at = :expires_at
            """), {"email": email, "otp": hashed_otp, "expires_at": expires_at})
            conn.commit()
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": f"Database error: {e}"}), 500
        
    # Send email (or log to terminal)
    email_sent = send_otp_email(email, otp)
    
    response_msg = "OTP sent to your email." if email_sent else "OTP generated. Check server console logs."
    return jsonify({"status": "success", "message": response_msg, "mock_mode": not email_sent})

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    if not data or 'email' not in data or 'otp' not in data:
        return jsonify({"error": "Bad Request", "message": "Email and OTP are required."}), 400
        
    email = data['email'].strip().lower()
    otp = data['otp'].strip()
    
    engine = get_db_connection()
    if not engine:
        return jsonify({"error": "Internal Server Error", "message": "Database connection failed."}), 500
        
    try:
        with engine.connect() as conn:
            # Retrieve OTP
            result = conn.execute(text("SELECT otp, expires_at FROM user_otps WHERE email = :email"), {"email": email}).first()
            
            if not result:
                return jsonify({"error": "Unauthorized", "message": "Invalid or expired OTP."}), 401
                
            db_otp, expires_at = result
            
            # Check expiration
            if datetime.datetime.utcnow() > expires_at:
                conn.execute(text("DELETE FROM user_otps WHERE email = :email"), {"email": email})
                conn.commit()
                return jsonify({"error": "Unauthorized", "message": "OTP has expired."}), 401
                
            # Verify OTP hash
            if not check_password_hash(db_otp, otp):
                return jsonify({"error": "Unauthorized", "message": "Invalid OTP code."}), 401
                
            # Clear verified OTP
            conn.execute(text("DELETE FROM user_otps WHERE email = :email"), {"email": email})
            
            # Register user if they do not exist
            user_exists = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email}).first()
            if not user_exists:
                conn.execute(text("INSERT INTO users (email) VALUES (:email)"), {"email": email})
                
            conn.commit()
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": f"Database error: {e}"}), 500
        
    # Generate JWT
    payload = {
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1) # 24 Hours validity
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        "status": "success",
        "message": "Authentication successful.",
        "token": token,
        "user": {"email": email}
    })
