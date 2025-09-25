import os
import pytest
from backend.utils.config import Config

# Mock environment variables for testing
@pytest.fixture(autouse=True)
def mock_env_vars():
    os.environ["SERVER_HOST"] = "127.0.0.1"
    os.environ["SERVER_PORT"] = "8080"
    os.environ["REDIS_HOST"] = "test_redis"
    os.environ["REDIS_PORT"] = "6380"
    os.environ["REDIS_PASSWORD"] = "test_pass"
    os.environ["BINANCE_API_KEY"] = "test_key"
    os.environ["BINANCE_API_SECRET"] = "test_secret"
    os.environ["JWT_SECRET_KEY"] = "test_jwt_secret"
    os.environ["JWT_ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
    yield
    # Clean up environment variables after test
    del os.environ["SERVER_HOST"]
    del os.environ["SERVER_PORT"]
    del os.environ["REDIS_HOST"]
    del os.environ["REDIS_PORT"]
    del os.environ["REDIS_PASSWORD"]
    del os.environ["BINANCE_API_KEY"]
    del os.environ["BINANCE_API_SECRET"]
    del os.environ["JWT_SECRET_KEY"]
    del os.environ["JWT_ACCESS_TOKEN_EXPIRE_MINUTES"]

# Mock config.yaml content for testing
@pytest.fixture
def mock_config_yaml(tmp_path):
    config_content = """
server:
  host: "0.0.0.0"
  port: 8000
  debug: true

database:
  redis:
    host: "localhost"
    port: 6379
    db: 0
    password: null

exchanges:
  binance:
    enabled: true
    testnet: true
    api_key: "default_key"
    api_secret: "default_secret"
    sandbox: true

trading:
  initial_balance: 10.0
  max_positions: 3

security:
  secret_key: "default-secret"
  algorithm: "HS256"
  access_token_expire_minutes: 30
"""
    config_file = tmp_path / "config.yaml"
    config_file.write_text(config_content)
    return str(config_file)

def test_config_loading_and_env_override(mock_env_vars, mock_config_yaml):
    # Temporarily change the current working directory to the mock config file's directory
    # This is a bit hacky but necessary for the Config class to find the mock config.yaml
    original_cwd = os.getcwd()
    os.chdir(os.path.dirname(mock_config_yaml))
    
    try:
        # Re-initialize Config to load from the mock file and apply env vars
        cfg = Config(config_file=os.path.basename(mock_config_yaml))

        # Test server settings
        assert cfg.get("server.host") == "127.0.0.1"
        assert cfg.get("server.port") == 8080
        assert cfg.get("server.debug") == True

        # Test database settings
        assert cfg.get("database.redis.host") == "test_redis"
        assert cfg.get("database.redis.port") == 6380
        assert cfg.get("database.redis.db") == 0
        assert cfg.get("database.redis.password") == "test_pass"

        # Test exchange settings
        assert cfg.get("exchanges.binance.api_key") == "test_key"
        assert cfg.get("exchanges.binance.api_secret") == "test_secret"
        assert cfg.get("exchanges.binance.enabled") == True
        assert cfg.get("exchanges.binance.testnet") == True
        assert cfg.get("exchanges.binance.sandbox") == True

        # Test trading settings (from mock config.yaml, not overridden by env)
        assert cfg.get("trading.initial_balance") == 10.0
        assert cfg.get("trading.max_positions") == 3

        # Test security settings
        assert cfg.get("security.secret_key") == "test_jwt_secret"
        assert cfg.get("security.algorithm") == "HS256"
        assert cfg.get("security.access_token_expire_minutes") == 60

        # Test non-existent key
        assert cfg.get("non.existent.key") is None
        assert cfg.get("non.existent.key", "default_value") == "default_value"

    finally:
        os.chdir(original_cwd)

def test_config_set_method():
    cfg = Config(config_file="non_existent_config.yaml") # Use default config

    cfg.set("new.setting.value", 123)
    assert cfg.get("new.setting.value") == 123

    cfg.set("server.port", 9000)
    assert cfg.get("server.port") == 9000

    cfg.set("exchanges.binance.enabled", False)
    assert cfg.get("exchanges.binance.enabled") == False




