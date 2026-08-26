# backend/app/models/schema.py
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Integer,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base
import datetime

Base = declarative_base()


class Payment(Base):
    """
    Payments and tickets table
    """
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_id = Column(String(100), unique=True, nullable=True)
    bus_id = Column(String(50), nullable=True)
    amount = Column(Numeric(10, 2), nullable=True)
    cashback = Column(Numeric(10, 2), default=0.00)
    status = Column(String(50), nullable=True)  # PENDING, SUCCESS, FAILED
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    phone_number = Column(String(20), nullable=True)
    origin = Column(String(100), nullable=True)
    destination = Column(String(100), nullable=True)
    passenger_count = Column(Integer, default=1)
    conductor_id = Column(String(50), nullable=True)
    bus_number = Column(String(50), nullable=True)
    payment_mode = Column(String(20), default="UPI")  # 'UPI' or 'PASS'


    discount_reason = Column(String(255), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)
    paid_at = Column(String(50), nullable=True)



class PushToken(Base):
    """
    FCM / Expo Push notification tokens
    """
    __tablename__ = "push_token"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(255), unique=True, nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)


class User(Base):
    """
    Passenger / Customer user accounts and wallet balance
    """
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), default="Customer")
    mobile_number = Column(String(20), unique=True, nullable=True)
    user_pin = Column(String(10), default="1234")
    cashback = Column(Numeric(10, 2), default=0.00)
    total_tickets = Column(Integer, default=0)
    total_spent = Column(Numeric(10, 2), default=0.00)
    last_milestone_claimed = Column(Numeric(10, 2), default=0.00)
    free_rides_redeemed = Column(Integer, default=0)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)


class LoyaltyRule(Base):
    """
    Loyalty spend milestones and rewards
    """
    __tablename__ = "loyalty_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    spend_threshold = Column(Numeric(10, 2), unique=True, nullable=False)
    reward_rides = Column(Integer, default=1)
    title = Column(String(100), default="Free Ride Milestone")
    status = Column(String(20), default="ACTIVE")
    created_at = Column(String(50), nullable=True)


class MonthlyPass(Base):
    """
    Passenger monthly bus passes
    """
    __tablename__ = "monthly_passes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pass_id = Column(String(100), unique=True, nullable=True)
    bus_id = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    mobile = Column(String(20), unique=True, nullable=False)
    pin = Column(String(10), nullable=False)
    amount = Column(Numeric(10, 2), default=1000.00)
    location = Column(Text, nullable=True)
    origin_city = Column(String(255), default="")
    destination_city = Column(String(255), default="")
    route = Column(String(255), default="")
    total_rides = Column(Integer, default=62)
    used_rides = Column(Integer, default=0)
    remaining_rides = Column(Integer, default=62)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(String(50), nullable=True)


class PassUsage(Base):
    """
    Log of each monthly pass punch / ride usage
    """
    __tablename__ = "pass_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pass_id = Column(String(100), nullable=False)
    bus_id = Column(String(50), nullable=False)
    used_at = Column(String(50), nullable=True)


class AdminUser(Base):
    """
    Admin portal users and credentials
    """
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(100), nullable=True)
    password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(50), default="SUPER_ADMIN")
    created_at = Column(String(50), nullable=True)


class SystemSetting(Base):
    """
    Global system configurations (cashback %, spend threshold, etc.)
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(String(50), nullable=True)


class City(Base):
    """
    Operational cities and stations
    """
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    state = Column(String(100), default="Rajasthan")
    status = Column(String(20), default="ACTIVE")
    created_at = Column(String(50), nullable=True)


class Conductor(Base):
    """
    Bus conductors and mobile credentials
    """
    __tablename__ = "conductors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conductor_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    mobile = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), nullable=True)
    password = Column(String(100), nullable=False)
    gender = Column(String(20), default="Male")
    status = Column(String(20), default="ACTIVE")
    assigned_bus_id = Column(String(50), nullable=True)
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)


class Bus(Base):
    """
    Fleet bus records
    """
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bus_id = Column(String(50), unique=True, nullable=False)
    bus_number = Column(String(50), nullable=False)
    origin_city = Column(String(100), nullable=False)
    destination_city = Column(String(100), nullable=False)
    current_conductor_id = Column(String(50), nullable=True)
    current_conductor_name = Column(String(100), default="Unassigned")
    fare_amount = Column(Numeric(10, 2), default=50.00)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(String(50), nullable=True)
    updated_at = Column(String(50), nullable=True)


class ConductorShiftLog(Base):
    """
    Daily conductor shifts and ticket collection summaries
    """
    __tablename__ = "conductor_shift_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shift_id = Column(String(100), unique=True, nullable=True)
    bus_id = Column(String(50), nullable=False)
    bus_number = Column(String(50), nullable=True)
    conductor_id = Column(String(50), nullable=False)
    conductor_name = Column(String(100), nullable=False)
    shift_date = Column(String(50), nullable=True)
    start_time = Column(String(50), nullable=True)
    end_time = Column(String(50), nullable=True)
    collection_amount = Column(Numeric(10, 2), default=0.00)
    tickets_count = Column(Integer, default=0)
    status = Column(String(20), default="COMPLETED")
    created_at = Column(String(50), nullable=True)


# --- Legacy / Prototype Aliases for Backward Compatibility ---
Ticket = Payment
PassengerWallet = User