import os
from dotenv import load_dotenv

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