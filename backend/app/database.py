"""
Database setup using SQLAlchemy.

We use the synchronous ORM here (not async) because:
  1. Whisper inference is already CPU-bound and blocking — async wouldn't help.
  2. Async SQLAlchemy with SQLite has known rough edges and extra complexity.
  3. FastAPI's BackgroundTasks + thread-pool handles our concurrency needs.

The engine URL comes from settings so swapping to Postgres requires
only an env-var change — no code changes.  The check_same_thread=False
flag is SQLite-specific and automatically ignored by other dialects.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

# SQLite-specific: allow the same connection to be used across threads
# (necessary because FastAPI runs route handlers in a thread pool).
# For other databases this connect_args dict is simply ignored.
connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    # Pool size / overflow only relevant for non-SQLite databases; SQLite
    # uses NullPool internally when check_same_thread=False.
    echo=False,
)

# Enable WAL mode for SQLite: allows concurrent readers during writes,
# which matters when the background pipeline writes while the frontend polls.
if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db():
    """
    FastAPI dependency that yields a DB session and ensures it is closed
    even if an exception occurs during request handling.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables():
    """Create all tables defined in models. Called once at startup."""
    # Import models here so SQLAlchemy's metadata registry is populated
    # before create_all() is called.
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
