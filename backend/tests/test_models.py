import os
import sys
import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.models.schema import (
    Base,
    Payment,
    PushToken,
    User,
    LoyaltyRule,
    MonthlyPass,
    PassUsage,
    AdminUser,
    SystemSetting,
    City,
    Conductor,
    Bus,
    ConductorShiftLog,
    Ticket,
    PassengerWallet,
)
from app.database import engine, SessionLocal, create_all_tables


def test_models_metadata_registration():
    expected_tables = {
        "payments",
        "push_token",
        "user",
        "loyalty_rules",
        "monthly_passes",
        "pass_usage",
        "admin_users",
        "system_settings",
        "cities",
        "conductors",
        "buses",
        "conductor_shift_logs",
    }
    actual_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(actual_tables), f"Missing tables in metadata: {expected_tables - actual_tables}"


def test_legacy_aliases():
    assert Ticket is Payment
    assert PassengerWallet is User


def test_sqlalchemy_session_query():
    db = SessionLocal()
    try:
        # Query cities table
        cities = db.query(City).limit(5).all()
        assert isinstance(cities, list)
        
        # Query system settings table
        settings = db.query(SystemSetting).all()
        assert isinstance(settings, list)
        
        # Query buses table
        buses = db.query(Bus).limit(5).all()
        assert isinstance(buses, list)
        
        # Query admin users table
        admins = db.query(AdminUser).all()
        assert isinstance(admins, list)
    finally:
        db.close()
