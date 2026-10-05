from logging.config import fileConfig
import sys
from pathlib import Path
from alembic import context
from sqlalchemy import engine_from_config, pool

# `alembic` is an installed console script; its script directory rather than
# the project root can otherwise become sys.path[0] in containers.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
from app.database import Base
from app import models
from app.config import settings

config = context.config
# This project uses a deliberately minimal alembic.ini. Configure logging only
# when a full logging section is supplied by a deployment-specific config.
if config.config_file_name and config.file_config.has_section("formatters"):
    fileConfig(config.config_file_name)
target_metadata = Base.metadata
# The environment is authoritative. `alembic.ini` only supplies a local
# fallback, while containers and production use DATABASE_URL.
config.set_main_option("sqlalchemy.url", settings.database_url)

def run_migrations_offline():
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
