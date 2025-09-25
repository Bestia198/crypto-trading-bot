import os
import yaml
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration manager"""
    
    def __init__(self, config_file: str = "config/config.yaml"):
        self.config_file = config_file
        self._config = {}
        self.load_config()
    
    def load_config(self):
        """Load configuration from YAML file"""
        try:
            config_path = os.path.join(os.path.dirname(__file__), '..', self.config_file)
            
            with open(config_path, 'r') as file:
                self._config = yaml.safe_load(file)
            
            self._override_with_env()
            
        except FileNotFoundError:
            print(f"Config file {self.config_file} not found, using defaults")
            self._config = self._get_default_config()
        except Exception as e:
            print(f"Error loading config: {e}")
            self._config = self._get_default_config()
    
    def _override_with_env(self):
        """Override config with environment variables"""
        if os.getenv('SERVER_HOST'):
            self._config.setdefault('server', {})['host'] = os.getenv('SERVER_HOST')
        if os.getenv('SERVER_PORT'):
            self._config.setdefault('server', {})['port'] = int(os.getenv('SERVER_PORT'))
        
        if os.getenv('REDIS_HOST'):
            self._config.setdefault('database', {}).setdefault('redis', {})['host'] = os.getenv('REDIS_HOST')
        if os.getenv('REDIS_PORT'):
            self._config.setdefault('database', {}).setdefault('redis', {})['port'] = int(os.getenv('REDIS_PORT'))
        if os.getenv('REDIS_PASSWORD'):
            self._config.setdefault('database', {}).setdefault('redis', {})['password'] = os.getenv('REDIS_PASSWORD')
        
        exchanges = self._config.setdefault('exchanges', {})
        
        if os.getenv('BINANCE_API_KEY'):
            exchanges.setdefault('binance', {})['api_key'] = os.getenv('BINANCE_API_KEY')
        if os.getenv('BINANCE_API_SECRET'):
            exchanges.setdefault('binance', {})['api_secret'] = os.getenv('BINANCE_API_SECRET')

        # JWT Security settings
        if os.getenv('JWT_SECRET_KEY'):
            self._config.setdefault('security', {})['secret_key'] = os.getenv('JWT_SECRET_KEY')
        if os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES'):
            self._config.setdefault('security', {})['access_token_expire_minutes'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES'))
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            'server': {'host': '0.0.0.0', 'port': 8000, 'debug': True},
            'database': {'redis': {'host': 'localhost', 'port': 6379, 'db': 0, 'password': None}},
            'exchanges': {'binance': {'enabled': True, 'testnet': True}},
            'trading': {'initial_balance': 5.0, 'max_positions': 2, 'strategy_interval': 60},
            'security': {'secret_key': 'super-secret-key', 'algorithm': 'HS256', 'access_token_expire_minutes': 30}
        }
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        keys = key.split('.')
        value = self._config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any):
        """Set configuration value"""
        keys = key.split('.')
        config = self._config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        config[keys[-1]] = value

config = Config()



