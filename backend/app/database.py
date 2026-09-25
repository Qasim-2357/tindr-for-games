import os
from collections.abc import Generator

from sqlalchemy import URL, create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

connection_string = os.getenv("DATABASE_URL")
if connection_string:
    try:
        parsed_url = make_url(connection_string)
    except ArgumentError:
        raise RuntimeError("DATABASE_URL is not a valid SQLAlchemy URL") from None
    if parsed_url.drivername in {"postgres", "postgresql"}:
        parsed_url = parsed_url.set(drivername="postgresql+psycopg")
    elif parsed_url.drivername.startswith("postgresql+"):
        parsed_url = parsed_url.set(drivername="postgresql+psycopg")
    else:
        raise RuntimeError("DATABASE_URL must use PostgreSQL")
    database_url = parsed_url
else:
    database_url = URL.create(
        drivername="postgresql+psycopg",
        username=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "postgres"),
        host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        database=os.getenv("POSTGRES_DB", "tindr_for_games"),
    )

engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return False
    return True
