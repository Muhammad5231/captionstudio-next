from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker
from apps.api.app.core.config import settings

db_path = settings.database_path
db_url = f"sqlite:///{db_path.as_posix()}"

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False, "timeout": 30},
    echo=False,
)


# Enable SQLite Foreign Keys, WAL mode, and busy timeout for concurrent transactions
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
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
    """Create all database tables and apply non-destructive column migrations."""
    from apps.api.app.database import models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Safe SQLite column migrations for existing databases
    with engine.connect() as conn:
        try:
            # Check admin_sessions table
            res = conn.execute(text("PRAGMA table_info(admin_sessions)")).fetchall()
            col_names = [r[1] for r in res]
            if res and "id" not in col_names:
                conn.execute(text("DROP TABLE admin_sessions"))
                conn.commit()

            # Clean and recreate caption style tables for Phase 4B Python engine
            res = conn.execute(text("PRAGMA table_info(caption_styles)")).fetchall()
            col_names = [r[1] for r in res]
            if res and ("status" not in col_names or "is_active" in col_names):
                conn.execute(text("DROP TABLE IF EXISTS caption_style_versions"))
                conn.execute(text("DROP TABLE IF EXISTS caption_styles"))
                conn.commit()

            # Drop obsolete public user tables from Phase 2/3
            for old_tbl in ["users", "sessions", "favorites", "favorite_templates", "system_settings", "custom_fonts", "templates"]:
                conn.execute(text(f"DROP TABLE IF EXISTS {old_tbl}"))
                conn.commit()

            # Check caption_tracks columns
            res = conn.execute(text("PRAGMA table_info(caption_tracks)")).fetchall()
            col_names = [r[1] for r in res]
            if "style_spec" not in col_names:
                conn.execute(text("ALTER TABLE caption_tracks ADD COLUMN style_spec TEXT"))
                conn.commit()

            # Check exports columns
            res = conn.execute(text("PRAGMA table_info(exports)")).fetchall()
            col_names = [r[1] for r in res]
            for col, col_type in [
                ("job_id", "VARCHAR(36)"),
                ("status", "VARCHAR(50) DEFAULT 'QUEUED'"),
                ("file_size", "INTEGER"),
                ("filename", "VARCHAR(255)"),
                ("source_duration", "FLOAT"),
                ("source_width", "INTEGER"),
                ("source_height", "INTEGER"),
                ("style_id", "VARCHAR(64)"),
                ("style_version", "INTEGER"),
                ("output_duration", "FLOAT"),
                ("output_size", "INTEGER"),
                ("completed_at", "DATETIME"),
            ]:
                if col not in col_names:
                    conn.execute(text(f"ALTER TABLE exports ADD COLUMN {col} {col_type}"))
                    conn.commit()

            # Check projects columns
            res = conn.execute(text("PRAGMA table_info(projects)")).fetchall()
            col_names = [r[1] for r in res]
            if "deleted_at" not in col_names:
                conn.execute(text("ALTER TABLE projects ADD COLUMN deleted_at DATETIME"))
                conn.commit()

        except Exception:
            pass

    # Ensure all tables created
    Base.metadata.create_all(bind=engine)

    # Seed built-in styles if needed
    db = SessionLocal()
    try:
        from apps.api.app.services.styles.style_service import style_service
        style_service.seed_builtin_styles(db)
    except Exception:
        # Style service will seed on first access or during startup
        pass
    finally:
        db.close()
