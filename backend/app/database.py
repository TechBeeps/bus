import os
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Locate and load environment configuration
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

# MySQL Connection Details
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "bus_ticketing")

print(f"[DATABASE] MySQL Target -> {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# URL encode user and password for safe SQLAlchemy URI
encoded_user = urllib.parse.quote_plus(DB_USER)
encoded_password = urllib.parse.quote_plus(DB_PASSWORD)

# SQLAlchemy Database URL (supports pymysql or mysqlconnector)
try:
    import pymysql
    SQLALCHEMY_DATABASE_URL = (
        f"mysql+pymysql://{encoded_user}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )
except ImportError:
    SQLALCHEMY_DATABASE_URL = (
        f"mysql+mysqlconnector://{encoded_user}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency for SQLAlchemy database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_connection(database: str = DB_NAME):
    """
    Returns a MySQL database connection.
    Prioritizes mysql-connector-python, with fallback to pymysql.
    """
    try:
        import mysql.connector

        config = {
            "host": DB_HOST,
            "port": DB_PORT,
            "user": DB_USER,
            "password": DB_PASSWORD,
            "charset": "utf8mb4",
            "autocommit": False,
        }
        if database:
            config["database"] = database
        return mysql.connector.connect(**config)
    except ImportError:
        import pymysql

        config = {
            "host": DB_HOST,
            "port": DB_PORT,
            "user": DB_USER,
            "password": DB_PASSWORD,
            "charset": "utf8mb4",
            "autocommit": False,
        }
        if database:
            config["database"] = database
        return pymysql.connect(**config)


def get_cursor(conn):
    """
    Returns a dictionary cursor (allowing row['column_name'] access).
    Compatible with both mysql-connector-python and pymysql.
    """
    try:
        return conn.cursor(dictionary=True)
    except (TypeError, AttributeError):
        try:
            import pymysql.cursors

            return conn.cursor(pymysql.cursors.DictCursor)
        except Exception:
            return conn.cursor()


def create_all_tables():
    """
    Creates all tables defined in SQLAlchemy models if they do not already exist.
    """
    try:
        from app.models.schema import Base
    except ImportError:
        from models.schema import Base
    Base.metadata.create_all(bind=engine)