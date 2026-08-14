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

# Check if phone_number column exists
cursor.execute("PRAGMA table_info(payments)")
columns = [col[1] for col in cursor.fetchall()]

if "phone_number" not in columns:
    cursor.execute("""
    ALTER TABLE payments
    ADD COLUMN phone_number TEXT
    """)
    print("phone_number column added")

conn.commit()
conn.close()

print("Database Ready")
print("INIT DB PATH =", os.path.abspath("bus_payments.db"))