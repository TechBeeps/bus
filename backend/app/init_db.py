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



# Check if phone_number column exists
cursor.execute("PRAGMA table_info(payments)")
columns = [col[1] for col in cursor.fetchall()]

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