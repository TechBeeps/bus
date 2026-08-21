import os
import sys

# Support direct execution from any working directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from app.database import get_connection, DB_NAME, DB_HOST, DB_PORT, DB_USER
except ImportError:
    from database import get_connection, DB_NAME, DB_HOST, DB_PORT, DB_USER


def init_database():
    print(f"Connecting to MySQL server at {DB_HOST}:{DB_PORT} as {DB_USER}...")

    # Step 1: Bootstrap connection to ensure database exists
    try:
        bootstrap_conn = get_connection(database=None)
        bootstrap_cursor = bootstrap_conn.cursor()
        bootstrap_cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        bootstrap_conn.commit()
        bootstrap_cursor.close()
        bootstrap_conn.close()
        print(f"Database `{DB_NAME}` verified/created.")
    except Exception as e:
        print(f"Warning during database bootstrap: {e}")

    # Step 2: Connect to target database and create tables
    conn = get_connection(database=DB_NAME)
    cursor = conn.cursor()

    # Table: payments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payment_id VARCHAR(100) UNIQUE,
        bus_id VARCHAR(50),
        amount DECIMAL(10, 2),
        cashback DECIMAL(10, 2) DEFAULT 0.00,
        status VARCHAR(50),
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        phone_number VARCHAR(20),
        origin VARCHAR(100),
        destination VARCHAR(100),
        passenger_count INT DEFAULT 1,
        created_at VARCHAR(50),
        updated_at VARCHAR(50),
        paid_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: push_token
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS push_token (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(255) UNIQUE,
        created_at VARCHAR(50),
        updated_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: user
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mobile_number VARCHAR(20) UNIQUE,
        user_pin VARCHAR(10),
        cashback DECIMAL(10, 2) DEFAULT 0.00,
        created_at VARCHAR(50),
        updated_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: monthly_passes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS monthly_passes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pass_id VARCHAR(100) UNIQUE,
        bus_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NOT NULL UNIQUE,
        pin VARCHAR(10) NOT NULL,
        amount DECIMAL(10, 2) DEFAULT 1000.00,
        total_rides INT DEFAULT 62,
        used_rides INT DEFAULT 0,
        remaining_rides INT DEFAULT 62,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: pass_usage
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pass_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pass_id VARCHAR(100) NOT NULL,
        bus_id VARCHAR(50) NOT NULL,
        used_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    conn.commit()
    cursor.close()
    conn.close()

    print(f"All MySQL tables successfully initialized in database `{DB_NAME}`!")


if __name__ == "__main__":
    init_database()