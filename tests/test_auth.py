from datetime import timedelta
import pytest
from backend.api.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    get_user,
    DEFAULT_USERNAME,
    DEFAULT_PASSWORD,
    hashed_default_password,
    fake_users_db
)

# Test password hashing and verification
def test_password_hashing_and_verification():
    password = "test_password"
    hashed_password = get_password_hash(password)
    assert verify_password(password, hashed_password) is True
    assert verify_password("wrong_password", hashed_password) is False

# Test access token creation and decoding
def test_create_and_decode_access_token():
    data = {"sub": "testuser"}
    token = create_access_token(data)
    decoded_payload = decode_access_token(token)
    assert decoded_payload is not None
    assert decoded_payload["sub"] == "testuser"
    assert "exp" in decoded_payload

# Test expired access token
def test_expired_access_token():
    data = {"sub": "testuser"}
    expired_token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    decoded_payload = decode_access_token(expired_token)
    assert decoded_payload is None

# Test get_user function
def test_get_user():
    user = get_user(DEFAULT_USERNAME)
    assert user is not None
    assert user.username == DEFAULT_USERNAME
    assert user.hashed_password == hashed_default_password
    assert user.disabled is False

    non_existent_user = get_user("non_existent_user")
    assert non_existent_user is None

# Test that default user password is hashed
def test_default_user_password_is_hashed():
    assert hashed_default_password != DEFAULT_PASSWORD
    assert verify_password(DEFAULT_PASSWORD, hashed_default_password) is True



