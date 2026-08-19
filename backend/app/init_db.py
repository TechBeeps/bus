from database import get_connection
import os

conn = get_connection()
cursor = conn.cursor()

# Table create
cursor.execute("""
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT UNIQUE,
    bus_id TEXT,
    amount REAL,
    cashback REAL,
    status TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TEXT,
    updated_at TEXT,
    paid_at TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS push_token (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT,
    created_at TEXT,
    updated_at TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile_number TEXT UNIQUE,
    user_pin TEXT,
    cashback REAL,
    created_at TEXT,
    updated_at TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS monthly_passes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pass_id TEXT UNIQUE,
    bus_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    pin TEXT NOT NULL,
    amount REAL DEFAULT 1000,
    total_rides INTEGER DEFAULT 62,
    used_rides INTEGER DEFAULT 0,
    remaining_rides INTEGER DEFAULT 62,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS pass_usage (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
    pass_id INTEGER NOT NULL,
    bus_id TEXT NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")
cursor.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_pass_mobile
ON monthly_passes(mobile)
""")



# Check if phone_number column exists
cursor.execute("PRAGMA table_info(payments)")
columns = [col[1] for col in cursor.fetchall()]



if "phone_number" not in columns:
    cursor.execute("""
    ALTER TABLE payments
    ADD COLUMN phone_number TEXT
    """)

if "origin" not in columns:
    cursor.execute("""
    ALTER TABLE payments
    ADD COLUMN origin TEXT
    """)
if "destination" not in columns:
    cursor.execute("""
    ALTER TABLE payments
    ADD COLUMN destination TEXT
    """)
if "passenger_count" not in columns:
    cursor.execute("""
    ALTER TABLE payments
    ADD COLUMN passenger_count INTEGER
    """)

cursor.execute("PRAGMA table_info(push_token)")
columns = [col[1] for col in cursor.fetchall()]

if "updated_at" not in columns:
    cursor.execute("""
    ALTER TABLE push_token
    ADD COLUMN updated_at TEXT
    """)
    print("updated_at column added")



conn.commit()
conn.close()

print("Database Ready")
print("INIT DB PATH =", os.path.abspath("bus_payments.db"))