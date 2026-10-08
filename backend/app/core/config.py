"""Application settings, loaded from environment variables / `.env`.

Secrets (LiveKit API secret) only ever live here on the server; the frontend
receives short-lived, room-scoped tokens instead.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Zoom Clone API"
    database_url: str = "sqlite:///./zoom_clone.db"

    # Comma-separated list of origins allowed to call the API (the Next.js app).
    cors_origins: str = "http://localhost:3000"
    # Public URL of the frontend, used to build shareable invite links.
    public_app_url: str = "http://localhost:3000"

    # Authentication is out of scope: this user is treated as "logged in".
    default_user_name: str = "Vansh Sharma"
    default_user_email: str = "vansh.sharma@example.com"
    seed_sample_data: bool = True

    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_token_ttl_minutes: int = 180

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()
        ]

    @property
    def livekit_configured(self) -> bool:
        return all((self.livekit_url, self.livekit_api_key, self.livekit_api_secret))


@lru_cache
def get_settings() -> Settings:
    return Settings()
