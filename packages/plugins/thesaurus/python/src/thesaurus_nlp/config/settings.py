from enum import StrEnum
from pathlib import Path
from typing import ClassVar

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict, PydanticBaseSettingsSource, TomlConfigSettingsSource

class ModelType(StrEnum):
    """Tested encoding models for the similarity ranker."""
    MINILM_L6_V2 = "sentence-transformers/all-MiniLM-L6-v2"
    MPNET_V2 = "sentence-transformers/all-mpnet-base-v2"
    BGE = "BAAI/bge-base-en-v1.5"


class Config(BaseSettings):
    model_name: ModelType
    min_score: float = Field(ge=0.0, le=1.0)
    log_level: str
    log_file: Path

    project_root: ClassVar[Path] = Path(__file__).parents[3]
    model_config = SettingsConfigDict(
        toml_file=project_root / "config.toml",
    )
    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        return (
            init_settings,
            env_settings,
            TomlConfigSettingsSource(settings_cls),
        )