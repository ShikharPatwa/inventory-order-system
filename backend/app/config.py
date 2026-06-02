from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://inventory:inventory@localhost:5432/inventory_db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = ConfigDict(env_file=".env")


settings = Settings()
