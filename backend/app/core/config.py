from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "API Gateway Pro"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/admin"
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./api_gateway.db"
    
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    ENABLE_AUTH: bool = False
    
    CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    LOG_LEVEL: str = "INFO"
    LOG_RETENTION_DAYS: int = 30
    
    DEFAULT_REQUEST_TIMEOUT: int = 30
    DEFAULT_RETRY_COUNT: int = 1
    DEFAULT_CONNECTION_POOL_SIZE: int = 10
    
    MAX_SCRIPT_TIMEOUT_MS: int = 1000
    ENABLE_PYTHON_SCRIPTS: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
