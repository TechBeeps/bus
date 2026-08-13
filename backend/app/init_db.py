from database import get_connection
import os

conn = get_connection()
cursor = conn.cursor()

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

conn.commit()
conn.close()

print("Database Ready")

print("INIT DB PATH =", os.path.abspath("bus_payments.db"))