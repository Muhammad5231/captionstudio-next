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
    """Create all database tables, apply non-destructive column migrations, and seed initial accounts."""
    from apps.api.app.database import models  # noqa: F401
    from apps.api.app.core.security import get_password_hash
    Base.metadata.create_all(bind=engine)

    # Safe SQLite column migrations
    with engine.connect() as conn:
        try:
            # Check caption_tracks columns
            res = conn.execute(text("PRAGMA table_info(caption_tracks)")).fetchall()
            col_names = [r[1] for r in res]
            if "style_spec" not in col_names:
                conn.execute(text("ALTER TABLE caption_tracks ADD COLUMN style_spec TEXT"))
                conn.commit()

            # Check exports columns
            res = conn.execute(text("PRAGMA table_info(exports)")).fetchall()
            col_names = [r[1] for r in res]
            if "job_id" not in col_names:
                conn.execute(text("ALTER TABLE exports ADD COLUMN job_id VARCHAR(36)"))
                conn.commit()
            if "status" not in col_names:
                conn.execute(text("ALTER TABLE exports ADD COLUMN status VARCHAR(50) DEFAULT 'QUEUED'"))
                conn.commit()
            if "file_size" not in col_names:
                conn.execute(text("ALTER TABLE exports ADD COLUMN file_size INTEGER"))
                conn.commit()
            if "filename" not in col_names:
                conn.execute(text("ALTER TABLE exports ADD COLUMN filename VARCHAR(255)"))
                conn.commit()
            if "completed_at" not in col_names:
                conn.execute(text("ALTER TABLE exports ADD COLUMN completed_at DATETIME"))
                conn.commit()
        except Exception as e:
            # Ignore or log if already migrated
            if "user_id" not in col_names:
                conn.execute(text("ALTER TABLE exports ADD COLUMN user_id VARCHAR(36)"))
                conn.commit()

            # Check projects columns
            res = conn.execute(text("PRAGMA table_info(projects)")).fetchall()
            col_names = [r[1] for r in res]
            if "user_id" not in col_names:
                conn.execute(text("ALTER TABLE projects ADD COLUMN user_id VARCHAR(36)"))
                conn.commit()
            if "deleted_at" not in col_names:
                conn.execute(text("ALTER TABLE projects ADD COLUMN deleted_at DATETIME"))
                conn.commit()

            # Check jobs columns
            res = conn.execute(text("PRAGMA table_info(jobs)")).fetchall()
            col_names = [r[1] for r in res]
            if "user_id" not in col_names:
                conn.execute(text("ALTER TABLE jobs ADD COLUMN user_id VARCHAR(36)"))
                conn.commit()

            # Check users columns
            res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            col_names = [r[1] for r in res]
            if "name" not in col_names:
                conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR(100) DEFAULT 'Local User'"))
                conn.commit()
            if "email" not in col_names:
                conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
                conn.commit()
            if "hashed_password" not in col_names:
                conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"))
                conn.commit()
            if "role" not in col_names:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER'"))
                conn.commit()
            if "is_active" not in col_names:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                conn.commit()
            if "last_active_at" not in col_names:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_active_at DATETIME"))
                conn.commit()
            if "updated_at" not in col_names:
                conn.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
                conn.commit()

            # Check sessions columns
            res = conn.execute(text("PRAGMA table_info(sessions)")).fetchall()
            col_names = [r[1] for r in res]
            if "expires_at" not in col_names:
                conn.execute(text("ALTER TABLE sessions ADD COLUMN expires_at DATETIME"))
                conn.commit()

            # Check audit_logs columns
            res = conn.execute(text("PRAGMA table_info(audit_logs)")).fetchall()
            col_names = [r[1] for r in res]
            if "actor_id" not in col_names:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN actor_id VARCHAR(36)"))
                conn.commit()
            if "actor_email" not in col_names:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN actor_email VARCHAR(255)"))
                conn.commit()
            if "target_type" not in col_names:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN target_type VARCHAR(100)"))
                conn.commit()
            if "target_id" not in col_names:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN target_id VARCHAR(255)"))
                conn.commit()

        except Exception:
            pass

    # Seed default Admin and User if not already present
    db = SessionLocal()
    try:
        from apps.api.app.database.models import User, Project
        import uuid

        admin_user = db.query(User).filter(User.email == "admin@captionstudio.local").first()
        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                username="admin",
                name="Administrator",
                email="admin@captionstudio.local",
                hashed_password=get_password_hash("admin123"),
                role="SUPER_ADMIN",
                is_active=True,
            )
            db.add(admin_user)
            db.flush()
        else:
            if not admin_user.hashed_password.startswith("pbkdf2_sha256$"):
                admin_user.hashed_password = get_password_hash("admin123")
                admin_user.role = "SUPER_ADMIN"
                db.flush()

        creator_user = db.query(User).filter(User.email == "user@captionstudio.local").first()
        if not creator_user:
            creator_user = User(
                id=str(uuid.uuid4()),
                username="user",
                name="Content Creator",
                email="user@captionstudio.local",
                hashed_password=get_password_hash("user123"),
                role="USER",
                is_active=True,
            )
            db.add(creator_user)
            db.flush()

        # Associate any unassigned projects with the admin account
        db.query(Project).filter(Project.user_id.is_(None)).update({"user_id": admin_user.id})
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


