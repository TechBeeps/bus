# backend/app/models/schema.py
from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import declarative_base
import datetime

Base = declarative_base()

class Bus(Base):
    __tablename__ = "buses"
    id = Column(String, primary_key=True)
    registration_number = Column(String, unique=True, nullable=False)
    route_name = Column(String, nullable=False)
    active_conductor_id = Column(String, nullable=True)

class ConductorShiftLog(Base):
    __tablename__ = "conductor_shift_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    conductor_id = Column(String, nullable=False)
    bus_id = Column(String, ForeignKey("buses.id"), nullable=False)
    shift_start = Column(DateTime, default=datetime.datetime.utcnow)
    shift_end = Column(DateTime, nullable=True)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(String, primary_key=True)
    bus_id = Column(String, ForeignKey("buses.id"), nullable=False)
    passenger_phone = Column(String, nullable=True)
    passenger_count = Column(Integer, default=1)
    amount = Column(Float, nullable=False)
    status = Column(String, default="PENDING") # PENDING, PAID, FAILED
    is_verified = Column(Boolean, default=False)
    upi_txn_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PassengerWallet(Base):
    __tablename__ = "passenger_wallets"
    phone_number = Column(String, primary_key=True)
    balance = Column(Float, default=0.0)
    overdraft_allowed = Column(Boolean, default=True)
    emergency_trips_used = Column(Integer, default=0) # Overdraft tracking
    cashback_earned = Column(Float, default=0.0)