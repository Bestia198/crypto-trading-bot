from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from ..utils.config import config
from ..utils.logger import setup_logger

logger = setup_logger("auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings (should be in config/env vars)
SECRET_KEY = config.get("security.secret_key", "super-secret-key")
ALGORITHM = config.get("security.algorithm", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = config.get("security.access_token_expire_minutes", 30)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"Error decoding token: {e}")
        return None

# In-memory "database" for users (for demonstration purposes)
# In a real application, this would be a proper database
class User:
    def __init__(self, username: str, hashed_password: str, disabled: bool = False):
        self.username = username
        self.hashed_password = hashed_password
        self.disabled = disabled

# Default user for demonstration
DEFAULT_USERNAME = "user"
DEFAULT_PASSWORD = "password"

# Hash the default password once
hashed_default_password = get_password_hash(DEFAULT_PASSWORD)

fake_users_db = {
    DEFAULT_USERNAME: User(DEFAULT_USERNAME, hashed_default_password),
}

def get_user(username: str) -> Optional[User]:
    return fake_users_db.get(username)


# Example usage (for testing purposes, not part of the main app flow)
if __name__ == "__main__":
    # Test password hashing and verification
    password = "mysecretpassword"
    hashed = get_password_hash(password)
    print(f"Hashed password: {hashed}")
    print(f"Verify 'mysecretpassword': {verify_password('mysecretpassword', hashed)}")
    print(f"Verify 'wrongpassword': {verify_password('wrongpassword', hashed)}")

    # Test token creation and decoding
    token_data = {"sub": "testuser"}
    token = create_access_token(token_data)
    print(f"Generated token: {token}")
    decoded_payload = decode_access_token(token)
    print(f"Decoded payload: {decoded_payload}")

    # Test with expired token
    expired_token = create_access_token(token_data, expires_delta=timedelta(seconds=1))
    print(f"Expired token: {expired_token}")
    import time
    time.sleep(2)
    decoded_expired_payload = decode_access_token(expired_token)
    print(f"Decoded expired payload: {decoded_expired_payload}")


