from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://hackathon:hackathon@localhost:5432/hackathon"
    secret_key: str = "dev-secret-change-me"
    access_token_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:3000"
    admin_email: str = "admin@cywork.dz"
    admin_password: str = "admin2049"
    default_capacity: int = 120
    max_team_size: int = 5


settings = Settings()
