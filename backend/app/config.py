from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./opsvault.db"
    secret_key: str = "development-secret-change-me"
    access_token_minutes: int = 30
    refresh_token_days: int = 14
    frontend_origins: str = "http://localhost:5173"
    upload_dir: str = "uploads"
    bootstrap_admin_email: str | None = None
    bootstrap_admin_password: str | None = None
    bootstrap_admin_name: str = "OpsVault Administrator"
    dev_seed_users: bool = False

    @property
    def origins(self): return [v.strip() for v in self.frontend_origins.split(",") if v.strip()]

settings = Settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
