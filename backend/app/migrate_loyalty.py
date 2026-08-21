from backend.app.database import get_connection, get_cursor

def run_migration():
    conn = get_connection()
    cursor = get_cursor(conn)

    # 1. Create loyalty_rules table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loyalty_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        spend_threshold DECIMAL(10, 2) NOT NULL UNIQUE,
        reward_rides INT DEFAULT 1,
        title VARCHAR(100) DEFAULT 'Free Ride Milestone',
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at VARCHAR(50)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)
    print("loyalty_rules table verified.")

    # 2. Check and add columns to payments
    cursor.execute("SHOW COLUMNS FROM payments")
    p_cols = [r["Field"] for r in cursor.fetchall()]
    if "discount_reason" not in p_cols:
        cursor.execute("ALTER TABLE payments ADD COLUMN discount_reason VARCHAR(255)")
        print("Added discount_reason column to payments.")

    # 3. Check and add columns to user
    cursor.execute("SHOW COLUMNS FROM user")
    u_cols = [r["Field"] for r in cursor.fetchall()]
    if "last_milestone_claimed" not in u_cols:
        cursor.execute("ALTER TABLE user ADD COLUMN last_milestone_claimed DECIMAL(10, 2) DEFAULT 0.00")
        print("Added last_milestone_claimed column to user.")
    if "free_rides_redeemed" not in u_cols:
        cursor.execute("ALTER TABLE user ADD COLUMN free_rides_redeemed INT DEFAULT 0")
        print("Added free_rides_redeemed column to user.")

    # 4. Seed initial default loyalty rules if empty
    cursor.execute("SELECT COUNT(*) AS cnt FROM loyalty_rules")
    if cursor.fetchone()["cnt"] == 0:
        cursor.execute("""
        INSERT INTO loyalty_rules (spend_threshold, reward_rides, title, status, created_at)
        VALUES
            (1500.00, 1, 'Free Ride on Rs.1500 Spend', 'ACTIVE', '2026-08-21T00:00:00+05:30'),
            (3000.00, 1, 'Free Ride on Rs.3000 Spend', 'ACTIVE', '2026-08-21T00:00:00+05:30'),
            (4500.00, 1, 'Free Ride on Rs.4500 Spend', 'ACTIVE', '2026-08-21T00:00:00+05:30'),
            (5000.00, 1, 'Free Ride on Rs.5000 Spend', 'ACTIVE', '2026-08-21T00:00:00+05:30')
        """)
        print("Seeded default loyalty rules (1500, 3000, 4500, 5000).")

    conn.commit()
    cursor.close()
    conn.close()
    print("Loyalty Migration Completed Successfully.")

if __name__ == "__main__":
    run_migration()
