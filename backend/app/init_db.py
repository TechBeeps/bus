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

    # Table: user (Customers)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) DEFAULT 'Customer',
        mobile_number VARCHAR(20) UNIQUE NOT NULL,
        user_pin VARCHAR(10) DEFAULT '1234',
        cashback DECIMAL(10, 2) DEFAULT 0.00,
        total_tickets INT DEFAULT 0,
        total_spent DECIMAL(10, 2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'ACTIVE',
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

    # Table: admin_users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'SUPER_ADMIN',
        created_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: system_settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        updated_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: cities
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        state VARCHAR(100) DEFAULT 'Rajasthan',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: conductors
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conductors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conductor_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100),
        password VARCHAR(100) NOT NULL,
        gender VARCHAR(20) DEFAULT 'Male',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        assigned_bus_id VARCHAR(50) DEFAULT NULL,
        created_at VARCHAR(50),
        updated_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: buses
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS buses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bus_id VARCHAR(50) UNIQUE NOT NULL,
        bus_number VARCHAR(50) NOT NULL,
        origin_city VARCHAR(100) NOT NULL,
        destination_city VARCHAR(100) NOT NULL,
        current_conductor_id VARCHAR(50) DEFAULT NULL,
        current_conductor_name VARCHAR(100) DEFAULT 'Unassigned',
        fare_amount DECIMAL(10, 2) DEFAULT 50.00,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at VARCHAR(50),
        updated_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # Table: conductor_shift_logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conductor_shift_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shift_id VARCHAR(100) UNIQUE,
        bus_id VARCHAR(50) NOT NULL,
        bus_number VARCHAR(50),
        conductor_id VARCHAR(50) NOT NULL,
        conductor_name VARCHAR(100) NOT NULL,
        shift_date VARCHAR(50),
        start_time VARCHAR(50),
        end_time VARCHAR(50) DEFAULT NULL,
        collection_amount DECIMAL(10, 2) DEFAULT 0.00,
        tickets_count INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'COMPLETED',
        created_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    # --- Seeding Default Data (Idempotent) ---
    # 1. Admin user
    cursor.execute("""
        INSERT IGNORE INTO admin_users (username, email, password, full_name, role, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, ("admin", "admin@shreemateshwaribus.com", "admin123", "Bus Operator Admin", "SUPER_ADMIN", "2026-08-21 00:00:00"))

    # 2. System settings
    default_settings = [
        ("default_cashback_pct", "10", "Default Cashback Percentage (%)"),
        ("min_spend_amount", "50", "Minimum Spend Threshold (₹) for Cashback Eligibility"),
    ]
    for key, val, desc in default_settings:
        cursor.execute("""
            INSERT IGNORE INTO system_settings (setting_key, setting_value, description, updated_at)
            VALUES (%s, %s, %s, %s)
        """, (key, val, desc, "2026-08-21 00:00:00"))

    # 3. Cities
    initial_cities = [
        ("Bari Sadri", "Rajasthan"),
        ("Udaipur", "Rajasthan"),
        ("Nimbahera", "Rajasthan"),
        ("Neemuch", "Madhya Pradesh"),
        ("Chittorgarh", "Rajasthan"),
        ("Jaipur", "Rajasthan"),
        ("Kota", "Rajasthan"),
        ("Bhilwara", "Rajasthan"),
        ("Pratapgarh", "Rajasthan"),
    ]
    for c_name, c_state in initial_cities:
        cursor.execute("""
            INSERT IGNORE INTO cities (name, state, status, created_at)
            VALUES (%s, %s, %s, %s)
        """, (c_name, c_state, "ACTIVE", "2026-08-21 00:00:00"))

    # 4. Conductors
    initial_conductors = [
        ("COND-01", "Rajesh Kumar", "9876543210", "rajesh@bus.com", "123456", "Male", "ACTIVE", "BUS001"),
        ("COND-02", "Suresh Verma", "9876543211", "suresh@bus.com", "123456", "Male", "ACTIVE", "BUS002"),
        ("COND-03", "Amit Singh", "9876543212", "amit@bus.com", "123456", "Male", "ACTIVE", "BUS003"),
        ("COND-04", "Vikram Patel", "9876543213", "vikram@bus.com", "123456", "Male", "ACTIVE", None),
    ]
    for cid, name, mob, email, pwd, gen, st, bus in initial_conductors:
        cursor.execute("""
            INSERT IGNORE INTO conductors (conductor_id, name, mobile, email, password, gender, status, assigned_bus_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (cid, name, mob, email, pwd, gen, st, bus, "2026-08-21 00:00:00"))

    # 5. Buses
    initial_buses = [
        ("BUS001", "RJ14PA1234", "Bari Sadri", "Udaipur", "COND-01", "Rajesh Kumar", 50.00, "ACTIVE"),
        ("BUS002", "RJ14PA5678", "Nimbahera", "Udaipur", "COND-02", "Suresh Verma", 60.00, "ACTIVE"),
        ("BUS003", "RJ14PA1212", "Neemuch", "Udaipur", "COND-03", "Amit Singh", 80.00, "ACTIVE"),
    ]
    for bid, bno, orig, dest, cond_id, cond_name, fare, st in initial_buses:
        cursor.execute("""
            INSERT IGNORE INTO buses (bus_id, bus_number, origin_city, destination_city, current_conductor_id, current_conductor_name, fare_amount, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (bid, bno, orig, dest, cond_id, cond_name, fare, st, "2026-08-21 00:00:00"))

    # 6. Sample shift logs
    sample_logs = [
        ("SHIFT-101", "BUS001", "RJ14PA1234", "COND-01", "Rajesh Kumar", "2026-08-21", "2026-08-21 06:30:00", "2026-08-21 14:30:00", 3450.00, 69, "COMPLETED"),
        ("SHIFT-102", "BUS002", "RJ14PA5678", "COND-02", "Suresh Verma", "2026-08-21", "2026-08-21 07:00:00", None, 1820.00, 36, "ACTIVE"),
    ]
    for sid, bid, bno, cid, cname, sdate, stime, etime, col, tcount, st in sample_logs:
        cursor.execute("""
            INSERT IGNORE INTO conductor_shift_logs (shift_id, bus_id, bus_number, conductor_id, conductor_name, shift_date, start_time, end_time, collection_amount, tickets_count, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (sid, bid, bno, cid, cname, sdate, stime, etime, col, tcount, st, "2026-08-21 00:00:00"))

    conn.commit()
    cursor.close()
    conn.close()

    print(f"All MySQL tables successfully initialized and seeded in database `{DB_NAME}`!")


if __name__ == "__main__":
    init_database()