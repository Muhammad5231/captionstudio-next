from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from apps.api.app.core.config import settings

db_path = settings.database_path
db_url = f"sqlite:///{db_path.as_posix()}"

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False},
    echo=False,
)


# Enable SQLite Foreign Keys and WAL (Write-Ahead Logging) mode for concurrent reads/writes
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all database tables."""
    from apps.api.app.database import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
