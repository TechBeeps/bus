# backend/app/main.py
import os
import random
import time
import math
import requests
import uvicorn
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Optional, Union, Any

from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import razorpay

import json

from app.database import get_connection, get_cursor

IST = ZoneInfo("Asia/Kolkata")


def now_ist():
    return datetime.now(IST).isoformat()


payment_logs = {}

app = FastAPI(
    title="Indian Bus Ticketing & Fintech API",
    version="1.0.0",
    description="Backend service for QR-based ticketing, payment verification, and fleet management.",
)

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_LVIEo9xSbhNfUX")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "TFbLcznEvwrRQZ89GVKr8F8E")
# test
razorpay_client = razorpay.Client(
    auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
)


# CORS configuration for Web-App access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    try:
        from app.init_db import init_database
        init_database()
    except Exception as e:
        print(f"[DATABASE ERROR] Could not initialize database tables: {e}")


# --- Pydantic Schemas ---
class CreateTicketRequest(BaseModel):
    bus_id: str
    route_id: str
    origin_stop: str
    destination_stop: str
    passenger_count: int
    total_amount: float
    passenger_phone: Optional[str] = None


class WebhookPaymentPayload(BaseModel):
    transaction_id: str
    ticket_id: str
    bus_id: str
    status: str  # "SUCCESS" or "FAILED"
    amount: float
    upi_txn_id: str


class CreatePaymentRequest(BaseModel):
    bus_id: str
    amount: float
    mobile: str


class PaymentSuccessRequest(BaseModel):
    payment_id: str
    razorpay_payment_id: str


class PaymentStatusRequest(BaseModel):
    payment_id: str
    status: str


class pushnotification(BaseModel):
    token: str


class MonthlyPassPurchaseRequest(BaseModel):
    bus_id: str
    name: str
    mobile: str


class MonthlyPassUseRequest(BaseModel):
    bus_id: str
    mobile: str
    pin: str


# --- Admin & Fleet Management Schemas ---
class AdminLoginRequest(BaseModel):
    username: str
    password: str


class SettingsUpdateRequest(BaseModel):
    default_cashback_pct: float
    min_spend_amount: float


class CityCreateRequest(BaseModel):
    name: str
    state: Optional[str] = "Rajasthan"


class CityUpdateRequest(BaseModel):
    name: str
    state: Optional[str] = "Rajasthan"
    status: Optional[str] = "ACTIVE"


class ConductorLoginRequest(BaseModel):
    identifier: Optional[str] = None
    username: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    password: str


class ConductorCreateRequest(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = ""
    password: str
    gender: Optional[str] = "Male"
    assigned_bus_id: Optional[str] = None



class ConductorUpdateRequest(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = ""
    password: Optional[str] = None
    gender: Optional[str] = "Male"
    assigned_bus_id: Optional[str] = None
    status: Optional[str] = "ACTIVE"


class BusCreateRequest(BaseModel):
    bus_id: str
    bus_number: str
    origin_city: str
    destination_city: str
    current_conductor_id: Optional[str] = None
    fare_amount: Optional[float] = 50.0
    status: Optional[str] = "ACTIVE"


class BusUpdateRequest(BaseModel):
    bus_number: str
    origin_city: str
    destination_city: str
    current_conductor_id: Optional[str] = None
    fare_amount: Optional[float] = 50.0
    status: Optional[str] = "ACTIVE"


class BusReassignRequest(BaseModel):
    conductor_id: str


class ShiftLogCreateRequest(BaseModel):
    bus_id: str
    conductor_id: str
    shift_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    collection_amount: Optional[float] = 0.0
    tickets_count: Optional[int] = 0
    status: Optional[str] = "COMPLETED"


class AdminPassCreateRequest(BaseModel):
    name: str
    mobile: str
    origin_city: Optional[str] = "Bari Sadri"
    destination_city: Optional[str] = "Udaipur"
    route: Optional[str] = None
    bus_id: Optional[str] = None
    amount: Optional[float] = 1000.0
    total_rides: Optional[int] = 62
    pin: Optional[str] = None
    location: Optional[Any] = None


class AdminPassUpdateRequest(BaseModel):
    name: str
    mobile: str
    origin_city: Optional[str] = "Bari Sadri"
    destination_city: Optional[str] = "Udaipur"
    route: Optional[str] = None
    amount: Optional[float] = 1000.0
    total_rides: Optional[int] = 62
    remaining_rides: Optional[int] = None
    used_rides: Optional[int] = None
    pin: Optional[str] = None
    status: Optional[str] = "ACTIVE"



class LoyaltyRuleCreateRequest(BaseModel):
    spend_threshold: float
    reward_rides: Optional[int] = 1
    title: Optional[str] = None


# --- Mock In-Memory Store for MVP ---
tickets_db = {}
conductor_live_alerts = {}


# --- Routes ---


@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Bus Ticketing API", "timestamp": now_ist()}


@app.post("/api/v1/tickets/create")
def create_ticket(payload: CreateTicketRequest):
    """
    Creates an UNPAID ticket pending payment confirmation.
    """
    ticket_id = f"TICK-{int(datetime.now(IST).timestamp())}"
    tickets_db[ticket_id] = {
        "ticket_id": ticket_id,
        "bus_id": payload.bus_id,
        "origin": payload.origin_stop,
        "destination": payload.destination_stop,
        "passenger_count": payload.passenger_count,
        "amount": payload.total_amount,
        "status": "PENDING",
        "verified": False,
        "created_at": now_ist(),
    }

    # Generate UPI Payment Deep Link (PhonePe/Paytm/Razorpay QR)
    upi_intent_url = f"upi://pay?pa=busoperator@upi&pn=BusOperator&am={payload.total_amount}&tr={ticket_id}"

    return {
        "ticket_id": ticket_id,
        "status": "PENDING",
        "amount": payload.total_amount,
        "upi_intent_url": upi_intent_url,
    }


@app.post("/api/v1/payments/webhook")
def payment_gateway_webhook(payload: WebhookPaymentPayload, background_tasks: BackgroundTasks):
    """
    Server-to-Server Payment Webhook.
    Strict Verification: Updates state ONLY when bank responds with SUCCESS.
    """
    if payload.ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if payload.status == "SUCCESS":
        # Mark ticket as fully verified
        tickets_db[payload.ticket_id]["status"] = "PAID"
        tickets_db[payload.ticket_id]["verified"] = True
        tickets_db[payload.ticket_id]["upi_txn_id"] = payload.upi_txn_id

        # Notify assigned conductor in background
        background_tasks.add_task(
            notify_conductor,
            bus_id=payload.bus_id,
            ticket=tickets_db[payload.ticket_id],
        )

        return {"status": "SUCCESS", "message": "Payment verified and ticket activated"}

    tickets_db[payload.ticket_id]["status"] = "FAILED"
    return {"status": "FAILED", "message": "Payment verification failed"}


@app.get("/api/v1/conductor/bus/{bus_id}/updates")
def get_conductor_updates(bus_id: str):
    """
    Conductor polling endpoint (or fallback for WebSockets).
    Returns verified payments for active duty bus.
    """
    bus_tickets = [
        t for t in tickets_db.values()
        if t["bus_id"] == bus_id and t["verified"] is True
    ]
    return {"bus_id": bus_id, "verified_tickets": bus_tickets}


def notify_conductor(bus_id: str, ticket: dict):
    print(f"[REALTIME ALERT] Bus {bus_id} -> Payment Verified for Ticket {ticket['ticket_id']}")


def register_or_update_customer(cursor, mobile: str, name: str = "Customer", cashback: float = 0.0, amount: float = 0.0):
    """
    Registers a new unique customer in 'user' table if mobile does not exist.
    If already exists, updates total_tickets, total_spent, and cashback without duplicating.
    Ensures 1-time unique customer entry per mobile number.
    """
    if not mobile or not str(mobile).strip():
        return

    clean_mobile = str(mobile).strip()
    if clean_mobile in ("Cash / QR", "monthly_pass", "N/A", "Unassigned"):
        return

    try:
        cursor.execute(
            "SELECT id, name, cashback, total_tickets, total_spent FROM user WHERE mobile_number = %s",
            (clean_mobile,)
        )
        existing = cursor.fetchone()
        now = now_ist()
        cust_name = name.strip() if (name and str(name).strip() and str(name).strip() != "Customer") else "Customer"

        if not existing:
            cursor.execute("""
                INSERT INTO user (
                    name, mobile_number, user_pin, cashback, total_tickets, total_spent, status, created_at, updated_at
                )
                VALUES (%s, %s, '1234', %s, 1, %s, 'ACTIVE', %s, %s)
            """, (
                cust_name,
                clean_mobile,
                float(cashback or 0.0),
                float(amount or 0.0),
                now,
                now,
            ))
            print(f"[NEW CUSTOMER REGISTERED]: {clean_mobile} ({cust_name})")
        else:
            cursor.execute("""
                UPDATE user
                SET cashback = cashback + %s,
                    total_tickets = total_tickets + 1,
                    total_spent = total_spent + %s,
                    updated_at = %s
                WHERE id = %s
            """, (
                float(cashback or 0.0),
                float(amount or 0.0),
                now,
                existing["id"],
            ))
            print(f"[CUSTOMER UPDATED]: {clean_mobile}")
    except Exception as err:
        print("[CUSTOMER REGISTER/UPDATE ERROR]:", err)


@app.get("/api/v1/payments")
def get_payments():
    return payment_logs


BUS_ROUTES = {
    "BUS001": {
        "bus_no": "RJ14PA1234",
        "origin": "Bari Sadri",
        "destination": "Udaipur",
        "bus_id": "BUS001",
    },
    "BUS002": {
        "bus_no": "RJ14PA5678",
        "origin": "Nimbahera",
        "destination": "Udaipur",
        "bus_id": "BUS002",
    },
    "BUS003": {
        "bus_no": "RJ14PA1212",
        "origin": "Neemuch",
        "destination": "Udaipur",
        "bus_id": "BUS003",
    },
}


def get_dynamic_cashback_rules():
    default_cashback_pct = 10.0
    min_spend_amount = 50.0
    try:
        conn = get_connection()
        cursor = get_cursor(conn)
        cursor.execute("SELECT setting_key, setting_value FROM system_settings")
        rows = cursor.fetchall()
        for r in rows:
            if r["setting_key"] == "default_cashback_pct":
                default_cashback_pct = float(r["setting_value"])
            elif r["setting_key"] == "min_spend_amount":
                min_spend_amount = float(r["setting_value"])
        cursor.close()
        conn.close()
    except Exception as e:
        print("[CASHBACK RULES ERROR]:", e)
    return default_cashback_pct, min_spend_amount


@app.post("/api/v1/payment/order")
def create_payment(payload: CreatePaymentRequest):
    base_fare = float(payload.amount or 0.0)
    clean_mobile = str(payload.mobile).strip() if payload.mobile else ""

    # =========================================================================
    # 1. Check if customer is eligible for a Spend Milestone FREE RIDE!
    # =========================================================================
    if clean_mobile and clean_mobile not in ("Cash / QR", "monthly_pass", "N/A", "undefined", "null"):
        try:
            conn_loyalty = get_connection()
            c_loyalty = get_cursor(conn_loyalty)

            c_loyalty.execute(
                "SELECT id, name, total_spent, last_milestone_claimed, free_rides_redeemed, total_tickets, cashback FROM user WHERE mobile_number = %s",
                (clean_mobile,)
            )
            user_row = c_loyalty.fetchone()

            if user_row:
                total_spent = float(user_row.get("total_spent") or 0.0)
                last_claimed = float(user_row.get("last_milestone_claimed") or 0.0)

                # Fetch all active milestone rules ordered by threshold ascending
                c_loyalty.execute("SELECT id, spend_threshold, title, reward_rides FROM loyalty_rules WHERE status = 'ACTIVE' ORDER BY spend_threshold ASC")
                milestone_rules = c_loyalty.fetchall()

                eligible_rule = None
                for rule in milestone_rules:
                    thresh = float(rule["spend_threshold"])
                    if total_spent >= thresh and thresh > last_claimed:
                        eligible_rule = rule
                        break

                if eligible_rule:
                    thresh = float(eligible_rule["spend_threshold"])
                    reward_reason = f"Milestone Reward: Free Ride on Rs.{int(thresh)} Spend"
                    free_payment_id = f"FREE-{int(time.time())}"

                    # Lookup bus info
                    bus_no = ""
                    origin = ""
                    destination = ""
                    c_loyalty.execute("SELECT bus_number, origin_city, destination_city FROM buses WHERE bus_id = %s", (payload.bus_id,))
                    b_row = c_loyalty.fetchone()
                    if b_row:
                        bus_no = b_row["bus_number"]
                        origin = b_row["origin_city"]
                        destination = b_row["destination_city"]
                    if not bus_no:
                        route = BUS_ROUTES.get(payload.bus_id, {})
                        bus_no = route.get("bus_no", "")
                        origin = route.get("origin", "")
                        destination = route.get("destination", "")

                    now = now_ist()
                    # Directly insert confirmed PAID ticket with amount 0.0
                    c_loyalty.execute("""
                        INSERT INTO payments (
                            payment_id, bus_id, amount, cashback, status,
                            razorpay_order_id, razorpay_payment_id, phone_number,
                            origin, destination, passenger_count, discount_reason,
                            created_at, updated_at, paid_at
                        )
                        VALUES (%s, %s, 0.00, %s, 'PAID', 'free_milestone_ride', 'free_milestone_ride', %s, %s, %s, 1, %s, %s, %s, %s)
                    """, (
                        free_payment_id,
                        payload.bus_id,
                        base_fare, # Entire fare counted as discount
                        clean_mobile,
                        origin,
                        destination,
                        reward_reason,
                        now,
                        now,
                        now,
                    ))

                    # Update customer record with claimed milestone
                    c_loyalty.execute("""
                        UPDATE user
                        SET last_milestone_claimed = %s,
                            free_rides_redeemed = COALESCE(free_rides_redeemed, 0) + 1,
                            total_tickets = COALESCE(total_tickets, 0) + 1,
                            cashback = COALESCE(cashback, 0) + %s,
                            updated_at = %s
                        WHERE id = %s
                    """, (thresh, base_fare, now, user_row["id"]))

                    conn_loyalty.commit()
                    c_loyalty.close()
                    conn_loyalty.close()

                    print(f"[FREE MILESTONE RIDE ISSUED]: {clean_mobile} -> {free_payment_id} ({reward_reason})")

                    return {
                        "success": True,
                        "free_ride": True,
                        "payment_id": free_payment_id,
                        "discount_reason": reward_reason,
                        "amount": 0.0,
                        "message": f"Congratulations! You earned a 100% FREE RIDE for reaching Rs.{int(thresh)} in bookings!",
                    }

            c_loyalty.close()
            conn_loyalty.close()
        except Exception as e:
            print("[MILESTONE CHECK ERROR]:", e)

    # =========================================================================
    # 2. Standard Booking Flow with Dynamic Instant Percentage Discount
    # =========================================================================
    cashback_pct, min_spend = get_dynamic_cashback_rules()
    cashback = 0.0

    if base_fare >= min_spend:
        cashback = round((base_fare * cashback_pct) / 100, 2)

    discountAmount = max(0.0, base_fare - cashback)

    payment_id = f"PAY-{int(time.time())}"

    order = razorpay_client.order.create({
        "amount": int(discountAmount * 100),
        "currency": "INR",
        "receipt": payment_id,
    })

    # Fetch dynamic bus info & assigned conductor from DB
    bus_no = ""
    origin = ""
    destination = ""
    assigned_conductor_id = None
    try:
        conn_bus = get_connection()
        c_bus = get_cursor(conn_bus)
        c_bus.execute("SELECT bus_number, current_conductor_id, origin_city, destination_city FROM buses WHERE bus_id = %s", (payload.bus_id,))
        bus_row = c_bus.fetchone()
        c_bus.close()
        conn_bus.close()
        if bus_row:
            bus_no = bus_row["bus_number"]
            origin = bus_row["origin_city"]
            destination = bus_row["destination_city"]
            assigned_conductor_id = bus_row.get("current_conductor_id")
    except Exception as e:
        print("[BUS LOOKUP ERROR]:", e)

    if not bus_no:
        route = BUS_ROUTES.get(payload.bus_id, {})
        bus_no = route.get("bus_no", "")
        origin = route.get("origin", "")
        destination = route.get("destination", "")

    payment_logs[payment_id] = {
        "payment_id": payment_id,
        "bus_id": payload.bus_id,
        "amount": discountAmount,
        "cashback": cashback,
        "status": "INITIATED",
        "razorpay_order_id": order["id"],
        "created_at": now_ist(),
        "bus_no": bus_no,
        "origin": origin,
        "destination": destination,
    }

    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("""
    INSERT INTO payments (
        payment_id,
        bus_id,
        amount,
        cashback,
        status,
        razorpay_order_id,
        created_at,
        phone_number,
        origin,
        destination,
        passenger_count,
        conductor_id,
        bus_number,
        payment_mode
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'UPI')
    """, (
        payment_id,
        payload.bus_id,
        discountAmount,
        cashback,
        "INITIATED",
        order["id"],
        now_ist(),
        payload.mobile,
        origin,
        destination,
        1,  # Default passenger_count to 1
        assigned_conductor_id,
        bus_no,
    ))

    conn.commit()
    cursor.close()
    conn.close()

    print("INSERTED:", payment_id)


    return {
        "success": True,
        "free_ride": False,
        "payment_id": payment_id,
        "cashback": cashback,
        "razorpay_order_id": order["id"],
        "key": RAZORPAY_KEY_ID,
    }


@app.post("/api/v1/payment/success")
def payment_success(payload: PaymentSuccessRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute(
        "SELECT payment_id FROM payments WHERE payment_id = %s",
        (payload.payment_id,),
    )

    row = cursor.fetchone()

    if not row:
        cursor.close()
        conn.close()
        return {"success": False}

    cursor.execute("""
    UPDATE payments
    SET
        status = %s,
        razorpay_payment_id = %s,
        paid_at = %s
    WHERE payment_id = %s
    """, (
        "PAID",
        payload.razorpay_payment_id,
        now_ist(),
        payload.payment_id,
    ))

    conn.commit()

    cursor.execute("""
    SELECT origin, destination, amount, bus_id, id AS ticket_id, cashback, phone_number
    FROM payments
    WHERE payment_id = %s
    """, (payload.payment_id,))

    ticket = cursor.fetchone()

    origin = ticket["origin"] if ticket else ""
    destination = ticket["destination"] if ticket else ""
    amount = float(ticket["amount"] or 0) if ticket else 0.0
    bus_id = ticket["bus_id"] if ticket else ""
    ticket_id = ticket["ticket_id"] if ticket else payload.payment_id
    cashback = float(ticket["cashback"] or 0) if ticket else 0.0
    phone_number = ticket.get("phone_number") if ticket else ""

    # Auto-register / update unique customer record ONLY upon confirmed successful payment
    if phone_number:
        register_or_update_customer(
            cursor=cursor,
            mobile=phone_number,
            name="Customer",
            cashback=cashback,
            amount=amount,
        )
        conn.commit()

    cursor.execute("SELECT token FROM push_token")
    rows = cursor.fetchall()
    expo_tokens = [r["token"] for r in rows if r.get("token")]

    print("Push Tokens:", expo_tokens)

    push_payload = {
        "to": expo_tokens,
        "title": "New Ticket Booked",
        "body": (
            f"Fare: ₹{amount + cashback}\n"
            f"Route: {origin} → {destination}\n"
            f"Bus No: {bus_id}\n"
            f"Ticket ID: {payload.payment_id}"
        ),
        "data": {
            "razorpay_payment_id": payload.payment_id,
            "bus_id": bus_id,
            "ticket_id": ticket_id,
            "amount": amount + cashback,
            "cashback": cashback,
            "origin": origin,
            "destination": destination,
        },
    }

    try:
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=push_payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
    except Exception as e:
        print("Push Error:", e)

    cursor.close()
    conn.close()

    return {"success": True}


@app.post("/api/v1/payment/update-status")
def update_payment_status(payload: PaymentStatusRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute(
        "SELECT payment_id FROM payments WHERE payment_id = %s",
        (payload.payment_id,),
    )

    row = cursor.fetchone()

    if not row:
        cursor.close()
        conn.close()
        return {"success": False}

    if payload.payment_id in payment_logs:
        payment_logs[payload.payment_id]["status"] = payload.status
        payment_logs[payload.payment_id]["updated_at"] = now_ist()

    cursor.execute("""
    UPDATE payments
    SET
        status = %s,
        updated_at = %s
    WHERE payment_id = %s
    """, (
        payload.status,
        now_ist(),
        payload.payment_id,
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True}


@app.get("/api/v1/payment/{payment_id}")
def get_payment(payment_id: str):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("""
        SELECT *
        FROM payments
        WHERE payment_id = %s
    """, (payment_id,))

    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return {"success": False, "message": "Payment not found"}

    return dict(row)


@app.get("/api/v1/tickets")
def tickets():
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("SELECT * FROM payments")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [dict(r) for r in rows]


@app.get("/api/v1/tickets/{bus_id}")
def ticketsByid(bus_id: str):
    try:
        conn = get_connection()
        cursor = get_cursor(conn)

        cursor.execute("""
            SELECT
                id AS ticket_id,
                amount,
                cashback,
                origin,
                destination,
                passenger_count,
                razorpay_payment_id,
                created_at
            FROM payments
            WHERE bus_id = %s
            AND status = %s
            AND (DATE(created_at) = CURDATE() OR created_at LIKE CONCAT(CURDATE(), '%%'))
        """, (bus_id, "PAID"))

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        data = [
            {
                **dict(row),
                "amount": float(row["amount"] or 0) + float(row["cashback"] or 0),
                "paidamount": float(row["amount"] or 0),
            }
            for row in rows
        ]

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        return {"success": False, "message": str(e)}


# add push notification token
@app.post("/api/v1/push-token")
def add_push_token(payload: pushnotification):
    conn = get_connection()
    cursor = get_cursor(conn)

    now = now_ist()

    # Check token already exists
    cursor.execute(
        "SELECT id FROM push_token WHERE token = %s",
        (payload.token,),
    )
    existing_token = cursor.fetchone()

    if existing_token:
        # Existing token -> update time
        cursor.execute("""
            UPDATE push_token
            SET updated_at = %s
            WHERE token = %s
        """, (now, payload.token))
    else:
        # New token -> insert
        cursor.execute("""
            INSERT INTO push_token (token, created_at, updated_at)
            VALUES (%s, %s, %s)
        """, (payload.token, now_ist(), now_ist()))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "Push token added successfully",
    }


# view all tokens
@app.get("/api/v1/push-token")
def view_push_tokens():
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("SELECT * FROM push_token")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [dict(row) for row in rows]


@app.post("/api/v1/monthly-pass/order")
def create_monthly_pass(payload: MonthlyPassPurchaseRequest):
    payment_id = f"PAY-{int(datetime.now().timestamp())}"

    order = razorpay_client.order.create({
        "amount": 1000 * 100,
        "currency": "INR",
        "receipt": payment_id,
    })

    return {
        "success": True,
        "payment_id": payment_id,
        "razorpay_order_id": order["id"],
        "key": RAZORPAY_KEY_ID,
    }


# @app.post("/api/v1/monthly-pass/success")
# def monthly_pass_success(payload: dict):
#     conn = get_connection()
#     cursor = get_cursor(conn)
    
#     print(payload["location"])


#     # Check existing active pass
#     cursor.execute("""
#         SELECT *
#         FROM monthly_passes
#         WHERE mobile = %s
#         AND status = 'ACTIVE'
#     """, (payload["mobile"],))

#     existing_pass = cursor.fetchone()

#     # Existing Pass Found
#     if existing_pass:
#         cursor.execute("""
#             UPDATE monthly_passes
#             SET
#                 total_rides = total_rides + 62,
#                 remaining_rides = remaining_rides + 62,
#                 amount = amount + 1000
#             WHERE mobile = %s
#         """, (payload["mobile"],))

#         conn.commit()

#         cursor.execute("""
#             SELECT remaining_rides, pin
#             FROM monthly_passes
#             WHERE mobile = %s
#         """, (payload["mobile"],))

#         updated_pass = cursor.fetchone()
#         cursor.close()
#         conn.close()

#         return {
#             "success": True,
#             "message": "Existing pass updated",
#             "pin": updated_pass["pin"],
#             "rides": updated_pass["remaining_rides"],
#         }

#     # New Pass
#     pin = str(random.randint(1000, 9999))

#     cursor.execute("""
#         INSERT INTO monthly_passes (
#             pass_id,
#             bus_id,
#             name,
#             mobile,
#             pin,
#             amount,
#             location,
#             total_rides,
#             remaining_rides,
#             created_at
#         )
#         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
#     """, (
#         payload["payment_id"],
#         payload["bus_id"],
#         payload["name"],
#         payload["mobile"],
#         pin,
#         1000,
#         payload["location"],
#         62,
#         62,
#         now_ist(),
#     ))

#     # Auto-register / update unique customer record
#     register_or_update_customer(
#         cursor=cursor,
#         mobile=payload["mobile"],
#         name=payload.get("name") or "Customer",
#         cashback=0.0,
#         amount=1000.0,
#     )

#     conn.commit()
#     cursor.close()
#     conn.close()

#     return {
#         "success": True,
#         "message": "New pass created",
#         "pin": pin,
#         "rides": 62,
#     }



@app.post("/api/v1/monthly-pass/success")
def monthly_pass_success(payload: dict):
    conn = get_connection()
    cursor = get_cursor(conn)
    
    print(payload["location"])

    # Convert location dict to JSON string
    location_json = json.dumps(payload["location"])

    # Check existing active pass
    cursor.execute("""
        SELECT *
        FROM monthly_passes
        WHERE mobile = %s
        AND status = 'ACTIVE'
    """, (payload["mobile"],))

    existing_pass = cursor.fetchone()

    # Existing Pass Found
    if existing_pass:
        cursor.execute("""
            UPDATE monthly_passes
            SET
                total_rides = total_rides + 62,
                remaining_rides = remaining_rides + 62,
                amount = amount + 1000,
                location = %s
            WHERE mobile = %s
        """, (location_json, payload["mobile"]))

        conn.commit()

        cursor.execute("""
            SELECT remaining_rides, pin
            FROM monthly_passes
            WHERE mobile = %s
        """, (payload["mobile"],))

        updated_pass = cursor.fetchone()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "Existing pass updated",
            "pin": updated_pass["pin"],
            "rides": updated_pass["remaining_rides"],
        }

    # New Pass
    pin = str(random.randint(1000, 9999))

    cursor.execute("""
        INSERT INTO monthly_passes (
            pass_id,
            bus_id,
            name,
            mobile,
            pin,
            amount,
            location,
            total_rides,
            remaining_rides,
            created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        payload["payment_id"],
        payload["bus_id"],
        payload["name"],
        payload["mobile"],
        pin,
        1000,
        location_json,  # Use the JSON string here
        62,
        62,
        now_ist(),
    ))

    # Auto-register / update unique customer record
    register_or_update_customer(
        cursor=cursor,
        mobile=payload["mobile"],
        name=payload.get("name") or "Customer",
        cashback=0.0,
        amount=1000.0,
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "New pass created",
        "pin": pin,
        "rides": 62,
    }

@app.post("/api/v1/monthly-pass/use")
def use_monthly_pass(payload: dict):
    conn = get_connection()
    cursor = get_cursor(conn)

    # Verify Pass
    cursor.execute("""
        SELECT *
        FROM monthly_passes
        WHERE mobile = %s
        AND pin = %s
        AND status = 'ACTIVE'
    """, (
        payload["mobile"],
        payload["pin"],
    ))

    pass_row = cursor.fetchone()

    if not pass_row:
        cursor.close()
        conn.close()
        return {
            "success": False,
            "message": "Invalid Mobile or PIN",
        }

    # No rides left
    if pass_row["remaining_rides"] <= 0:
        cursor.close()
        conn.close()
        return {
            "success": False,

            "message": "No rides remaining",
        }

    # Last usage check
    cursor.execute("""
        SELECT *
        FROM pass_usage
        WHERE pass_id = %s
        ORDER BY id DESC
        LIMIT 1

    """, (pass_row["pass_id"],))

    last_usage = cursor.fetchone()

    if last_usage:
        try:
            last_used = datetime.fromisoformat(str(last_usage["used_at"]))
            current_time = datetime.now(last_used.tzinfo) if last_used.tzinfo else datetime.now()
            if current_time - last_used < timedelta(hours=3):  # 3 hours cooldown
                cursor.close()
                conn.close()
                return {
                    "success": False,
                    "deducted": False,
                    "remaining_rides": pass_row["remaining_rides"],
                    "message": "Monthly git Pass already used within 3 hours",
                }
        except Exception as e:
            print("Time parse error:", e)

    # Deduct Ride
    cursor.execute("""
        UPDATE monthly_passes
        SET
            used_rides = used_rides + 1,
            remaining_rides = remaining_rides - 1
        WHERE pass_id = %s
    """, (pass_row["pass_id"],))

    # Usage Log
    cursor.execute("""
        INSERT INTO pass_usage (
            pass_id,
            bus_id,
            used_at
        )
        VALUES (%s, %s, %s)
    """, (
        pass_row["pass_id"],
        payload["bus_id"],
        now_ist(),
    ))

    route = BUS_ROUTES.get(payload["bus_id"], {})
    origin = route.get("origin", "")
    destination = route.get("destination", "")

    payment_id = f"PASS-{int(time.time())}"

    cursor.execute("""
    INSERT INTO payments (
        payment_id,
        bus_id,
        amount,
        cashback,
        origin,
        destination,
        status,
        passenger_count,
        created_at,
        paid_at,
        razorpay_payment_id,
        phone_number
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        payment_id,
        payload["bus_id"],
        0,
        0,
        origin,
        destination,
        "PAID",
        1,
        now_ist(),
        now_ist(),
        "monthly_pass",
        payload["mobile"],
    ))
    last_insert_id = cursor.lastrowid

    # Auto-register / update unique customer record
    register_or_update_customer(
        cursor=cursor,
        mobile=payload["mobile"],
        name=pass_row.get("name") or "Customer",
        cashback=0.0,
        amount=0.0,
    )

    conn.commit()

    # Get updated rides
    cursor.execute("""
        SELECT remaining_rides
        FROM monthly_passes
        WHERE pass_id = %s
    """, (pass_row["pass_id"],))

    updated = cursor.fetchone()
    remaining_rides = updated["remaining_rides"]

    # Push Tokens
    cursor.execute("SELECT token FROM push_token")
    rows = cursor.fetchall()
    expo_tokens = [r["token"] for r in rows if r.get("token")]

    # Push Notification
    push_payload = {
        "to": expo_tokens,
        "title": "Monthly Pass Ride Booked",
        "body": (
            f"Bus No: {payload['bus_id']}\n"
            f"Ticket ID: {payment_id}\n"
            f"Remaining Rides: {remaining_rides}"
        ),
        "data": {
            "razorpay_payment_id": "monthly_pass",
            "bus_id": payload["bus_id"],
            "ticket_id": last_insert_id,
            "amount": 0,
            "origin": origin,
            "destination": destination,
        },
    }

    try:
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=push_payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
    except Exception as e:
        print("Push Error:", e)

    cursor.close()
    conn.close()

    return {
        "success": True,
        "deducted": True,
        "payment_id": payment_id,
        "ticket_id": payment_id,
        "remaining_rides": remaining_rides,
        "message": "Ride booked successfully",
    }


@app.get("/api/v1/bus")
def public_buses():
    """
    Public buses endpoint for Passenger WebApp & Conductor Mobile.
    Fetches live active buses from MySQL database with fallback.
    """
    try:
        conn = get_connection()
        cursor = get_cursor(conn)
        cursor.execute("SELECT * FROM buses WHERE status = 'ACTIVE'")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        if rows:
            buses_data = [
                {
                    "bus_no": r["bus_number"],
                    "origin": r["origin_city"],
                    "destination": r["destination_city"],
                    "bus_id": r["bus_id"],
                    "fare": float(r.get("fare_amount") or 50.0),
                    "conductor": r.get("current_conductor_name", "Unassigned"),
                }
                for r in rows
            ]
            return {"buses": buses_data, "base_url": "https://bus.shreemateshwaribus.com/"}
    except Exception as e:
        print("[PUBLIC BUSES FETCH ERROR]:", e)

    return {"buses": list(BUS_ROUTES.values()), "base_url": "https://bus.shreemateshwaribus.com/"}



# --- ADMIN AUTHENTICATION ---


@app.post("/api/v1/admin/login")
def admin_login(payload: AdminLoginRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("""
        SELECT * FROM admin_users
        WHERE (username = %s OR email = %s)
    """, (payload.username, payload.username))

    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # In production JWT token can be returned; for MVP return auth payload
    return {
        "success": True,
        "token": f"admin-token-{user['id']}-{int(time.time())}",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user.get("full_name", "Bus Operator Admin"),
            "role": user.get("role", "SUPER_ADMIN"),
            "email": user.get("email", ""),
        },
    }


@app.get("/api/v1/admin/me")
def admin_me():
    return {
        "success": True,
        "user": {
            "username": "admin",
            "full_name": "Bus Operator Admin",
            "role": "SUPER_ADMIN",
        }
    }



# --- DYNAMIC SYSTEM SETTINGS (CASHBACK & MIN SPEND) ---


@app.get("/api/v1/admin/settings")
def get_admin_settings():
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("SELECT setting_key, setting_value FROM system_settings")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    settings_dict = {
        "default_cashback_pct": 10.0,
        "min_spend_amount": 50.0,
    }
    for r in rows:
        key = r["setting_key"]
        val = r["setting_value"]
        if key == "default_cashback_pct":
            settings_dict["default_cashback_pct"] = float(val)
        elif key == "min_spend_amount":
            settings_dict["min_spend_amount"] = float(val)

    return {"success": True, "settings": settings_dict}


@app.post("/api/v1/admin/settings")
def update_admin_settings(payload: SettingsUpdateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)
    now = now_ist()

    # Update default_cashback_pct
    cursor.execute("""
        INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
        VALUES ('default_cashback_pct', %s, 'Default Cashback Percentage (%)', %s)
        ON DUPLICATE KEY UPDATE setting_value = %s, updated_at = %s
    """, (str(payload.default_cashback_pct), now, str(payload.default_cashback_pct), now))

    # Update min_spend_amount
    cursor.execute("""
        INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
        VALUES ('min_spend_amount', %s, 'Minimum Spend Threshold (₹)', %s)
        ON DUPLICATE KEY UPDATE setting_value = %s, updated_at = %s
    """, (str(payload.min_spend_amount), now, str(payload.min_spend_amount), now))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "System cashback settings updated successfully",
        "settings": {
            "default_cashback_pct": payload.default_cashback_pct,
            "min_spend_amount": payload.min_spend_amount,
        },
    }


# =========================================================================
# --- DYNAMIC CITIES MANAGEMENT (Replacing Static Routes) ---
# =========================================================================

@app.get("/api/v1/cities")
def get_cities():
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT * FROM cities ORDER BY name ASC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/v1/cities")
def create_city(payload: CityCreateRequest):
    city_name = payload.name.strip()
    if not city_name:
        raise HTTPException(status_code=400, detail="City name is required")

    conn = get_connection()
    cursor = get_cursor(conn)

    # Check existence
    cursor.execute("SELECT id FROM cities WHERE name = %s", (city_name,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail=f"City '{city_name}' already exists")

    cursor.execute("""
        INSERT INTO cities (name, state, status, created_at)
        VALUES (%s, %s, 'ACTIVE', %s)
    """, (city_name, payload.state, now_ist()))

    new_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": f"City '{city_name}' added successfully",
        "city": {
            "id": new_id,
            "name": city_name,
            "state": payload.state,
            "status": "ACTIVE",
        },
    }


@app.put("/api/v1/cities/{city_id}")
def update_city(city_id: int, payload: CityUpdateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("""
        UPDATE cities
        SET name = %s, state = %s, status = %s
        WHERE id = %s
    """, (payload.name.strip(), payload.state, payload.status, city_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "City updated successfully"}


@app.delete("/api/v1/cities/{city_id}")
def delete_city(city_id: int):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("DELETE FROM cities WHERE id = %s", (city_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "City deleted successfully"}


# =========================================================================
# --- DYNAMIC CONDUCTORS MANAGEMENT & AUTHENTICATION ---
# =========================================================================

@app.post("/api/v1/conductor/login")
@app.post("/api/v1/conductors/login")
def conductor_login(payload: ConductorLoginRequest):
    identifier = (payload.identifier or payload.username or payload.mobile or payload.email or "").strip()
    password = payload.password.strip() if payload.password else ""

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Mobile/Email and password are required")

    conn = get_connection()
    cursor = get_cursor(conn)

    # Search by mobile or email
    cursor.execute("""
        SELECT * FROM conductors
        WHERE (mobile = %s OR email = %s)
    """, (identifier, identifier))

    conductor = cursor.fetchone()

    if not conductor or conductor["password"] != password:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid mobile number/email or password")

    if conductor.get("status") != "ACTIVE":
        cursor.close()
        conn.close()
        raise HTTPException(status_code=403, detail="Conductor account is inactive or blocked. Please contact admin.")

    # Fetch assigned bus details if any
    assigned_bus = None
    assigned_bus_id = conductor.get("assigned_bus_id")
    if assigned_bus_id:
        cursor.execute("""
            SELECT * FROM buses
            WHERE bus_id = %s OR bus_number = %s
        """, (assigned_bus_id, assigned_bus_id))
        bus_row = cursor.fetchone()
        if bus_row:
            assigned_bus = {
                "bus_id": bus_row.get("bus_id"),
                "bus_no": bus_row.get("bus_number") or bus_row.get("bus_no"),
                "bus_number": bus_row.get("bus_number") or bus_row.get("bus_no"),
                "origin": bus_row.get("origin_city") or bus_row.get("origin"),
                "destination": bus_row.get("destination_city") or bus_row.get("destination"),
                "origin_city": bus_row.get("origin_city") or bus_row.get("origin"),
                "destination_city": bus_row.get("destination_city") or bus_row.get("destination"),
                "fare_amount": float(bus_row.get("fare_amount", 50.0)),
                "status": bus_row.get("status", "ACTIVE"),
            }

    cursor.close()
    conn.close()

    conductor_data = {
        "id": conductor["id"],
        "conductor_id": conductor["conductor_id"],
        "name": conductor["name"],
        "mobile": conductor["mobile"],
        "email": conductor.get("email", ""),
        "gender": conductor.get("gender", "Male"),
        "status": conductor.get("status", "ACTIVE"),
        "assigned_bus_id": assigned_bus_id,
    }

    return {
        "success": True,
        "message": "Login successful",
        "token": f"conductor-token-{conductor['conductor_id']}-{int(time.time())}",
        "conductor": conductor_data,
        "assigned_bus": assigned_bus,
    }


@app.get("/api/v1/conductor/my-bus/{conductor_id}")
def get_conductor_assigned_bus(conductor_id: str):
    conn = get_connection()
    cursor = get_cursor(conn)

    is_num = str(conductor_id).isdigit()
    where_sql = "WHERE conductor_id = %s OR id = %s" if is_num else "WHERE conductor_id = %s"
    target_args = (str(conductor_id), int(conductor_id)) if is_num else (str(conductor_id),)

    cursor.execute(f"SELECT * FROM conductors {where_sql}", target_args)
    conductor = cursor.fetchone()

    if not conductor:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Conductor not found")

    assigned_bus = None
    assigned_bus_id = conductor.get("assigned_bus_id")
    if assigned_bus_id:
        cursor.execute("""
            SELECT * FROM buses
            WHERE bus_id = %s OR bus_number = %s
        """, (assigned_bus_id, assigned_bus_id))
        bus_row = cursor.fetchone()
        if bus_row:
            assigned_bus = {
                "bus_id": bus_row.get("bus_id"),
                "bus_no": bus_row.get("bus_number") or bus_row.get("bus_no"),
                "bus_number": bus_row.get("bus_number") or bus_row.get("bus_no"),
                "origin": bus_row.get("origin_city") or bus_row.get("origin"),
                "destination": bus_row.get("destination_city") or bus_row.get("destination"),
                "origin_city": bus_row.get("origin_city") or bus_row.get("origin"),
                "destination_city": bus_row.get("destination_city") or bus_row.get("destination"),
                "fare_amount": float(bus_row.get("fare_amount", 50.0)),
                "status": bus_row.get("status", "ACTIVE"),
            }

    cursor.close()
    conn.close()

    return {
        "success": True,
        "conductor": {
            "id": conductor["id"],
            "conductor_id": conductor["conductor_id"],
            "name": conductor["name"],
            "mobile": conductor["mobile"],
            "email": conductor.get("email", ""),
            "status": conductor.get("status", "ACTIVE"),
            "assigned_bus_id": assigned_bus_id,
        },
        "assigned_bus": assigned_bus,
    }


# =========================================================================
# --- CONDUCTOR PAYMENT & TICKET HISTORY (BY DATE & CONDUCTOR) ---
# =========================================================================

@app.get("/api/v1/conductor/payment-history")
def get_conductor_payment_history(conductor_id: str, date: Optional[str] = None):
    """
    Returns verified payments and tickets for a conductor on a specific date (or today).
    Supports shifting bus assignments across multiple days.
    """
    target_date = date.strip() if date and date.strip() else datetime.now(IST).strftime("%Y-%m-%d")

    conn = get_connection()
    cursor = get_cursor(conn)

    # 1. Fetch Conductor Details
    cursor.execute("SELECT * FROM conductors WHERE conductor_id = %s", (conductor_id,))
    conductor = cursor.fetchone()
    if not conductor:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Conductor not found")

    assigned_bus_id = conductor.get("assigned_bus_id")

    # 2. Query Payments
    # Matches:
    # a) payments explicitly recorded with conductor_id = %s
    # b) OR fallback: payments where conductor_id IS NULL and bus_id was assigned in conductor_shift_logs on target_date
    # c) OR fallback: payments where conductor_id IS NULL and bus_id matches currently assigned_bus_id
    query = """
        SELECT
            p.id AS payment_row_id,
            p.payment_id,
            COALESCE(p.id, p.payment_id) AS ticket_id,
            p.bus_id,
            p.bus_number,
            p.conductor_id,
            p.amount,
            p.cashback,
            p.status,
            p.razorpay_order_id,
            p.razorpay_payment_id,
            p.phone_number,
            p.origin,
            p.destination,
            p.passenger_count,
            p.payment_mode,
            p.discount_reason,
            p.created_at,
            p.paid_at,
            b.bus_number AS bus_table_number,
            b.origin_city AS bus_origin,
            b.destination_city AS bus_destination
        FROM payments p
        LEFT JOIN buses b ON p.bus_id = b.bus_id
        WHERE p.status = 'PAID'
          AND (DATE(p.created_at) = %s OR p.created_at LIKE CONCAT(%s, '%%'))
          AND (
              p.conductor_id = %s
              OR (
                  p.conductor_id IS NULL
                  AND (
                      p.bus_id = %s
                      OR p.bus_id IN (
                          SELECT bus_id FROM conductor_shift_logs
                          WHERE conductor_id = %s AND (shift_date = %s OR start_time LIKE CONCAT(%s, '%%'))
                      )
                  )
              )
          )
        ORDER BY p.id DESC
    """
    cursor.execute(query, (
        target_date, target_date,
        conductor_id,
        assigned_bus_id,
        conductor_id, target_date, target_date
    ))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    total_collection = 0.0
    total_tickets = 0
    total_cashback = 0.0
    buses_set = set()
    tickets_data = []

    for r in rows:
        amount_raw = float(r.get("amount") or 0.0)
        cashback_raw = float(r.get("cashback") or 0.0)
        is_pass = r.get("razorpay_payment_id") == "monthly_pass" or r.get("payment_mode") == "PASS"

        if not is_pass:
            total_collection += amount_raw
        total_tickets += int(r.get("passenger_count") or 1)
        total_cashback += cashback_raw

        bus_num = r.get("bus_number") or r.get("bus_table_number") or r.get("bus_id") or "N/A"
        buses_set.add(f"{bus_num} ({r.get('bus_id', '')})")

        created_str = str(r.get("created_at") or "")
        time_formatted = "Just Now"
        if "T" in created_str:
            time_formatted = created_str.split("T")[1][:5]
        elif " " in created_str:
            time_formatted = created_str.split(" ")[1][:5]

        tickets_data.append({
            "id": r["payment_row_id"],
            "ticket_id": r["ticket_id"],
            "payment_id": r["payment_id"],
            "bus_id": r["bus_id"],
            "bus_number": bus_num,
            "origin": r.get("origin") or r.get("bus_origin") or "Start",
            "destination": r.get("destination") or r.get("bus_destination") or "End",
            "passenger_count": int(r.get("passenger_count") or 1),
            "amount": amount_raw + cashback_raw,
            "paidamount": amount_raw,
            "cashback": cashback_raw,
            "payment_mode": "PASS" if is_pass else "UPI",
            "razorpay_payment_id": r.get("razorpay_payment_id"),
            "phone_number": r.get("phone_number"),
            "created_at": created_str,
            "time_formatted": time_formatted,
            "status": r.get("status", "PAID"),
        })

    return {
        "success": True,
        "conductor_id": conductor["conductor_id"],
        "conductor_name": conductor["name"],
        "date": target_date,
        "total_amount": round(total_collection, 2),
        "total_tickets": len(tickets_data),
        "total_passengers": total_tickets,
        "total_cashback": round(total_cashback, 2),
        "buses_covered": list(buses_set),
        "tickets": tickets_data,
    }


@app.get("/api/v1/conductors")
def get_conductors():


    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT * FROM conductors ORDER BY id DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/v1/conductors")
def create_conductor(payload: ConductorCreateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("SELECT id FROM conductors WHERE mobile = %s", (payload.mobile,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Mobile number already registered for another conductor")

    cursor.execute("SELECT COUNT(*) AS total FROM conductors")
    total_count = cursor.fetchone()["total"]
    conductor_id = f"COND-{str(total_count + 1).zfill(2)}"

    cursor.execute("""
        INSERT INTO conductors (
            conductor_id, name, mobile, email, password, gender, status, assigned_bus_id, created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE', %s, %s, %s)
    """, (
        conductor_id,
        payload.name,
        payload.mobile,
        payload.email or "",
        payload.password,
        payload.gender or "Male",
        payload.assigned_bus_id,
        now_ist(),
        now_ist(),
    ))

    new_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "Conductor added successfully",
        "conductor": {
            "id": new_id,
            "conductor_id": conductor_id,
            "name": payload.name,
            "mobile": payload.mobile,
            "email": payload.email,
            "gender": payload.gender,
            "status": "ACTIVE",
            "assigned_bus_id": payload.assigned_bus_id,
        }
    }


@app.put("/api/v1/conductors/{conductor_id}")
def update_conductor(conductor_id: str, payload: ConductorUpdateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    is_num = str(conductor_id).isdigit()
    where_sql = "WHERE conductor_id = %s OR id = %s" if is_num else "WHERE conductor_id = %s"
    target_args = (str(conductor_id), int(conductor_id)) if is_num else (str(conductor_id),)

    if payload.password:
        update_query = f"""
            UPDATE conductors
            SET name = %s, mobile = %s, email = %s, password = %s, gender = %s, assigned_bus_id = %s, status = %s, updated_at = %s
            {where_sql}
        """
        params = (
            payload.name, payload.mobile, payload.email or "", payload.password,
            payload.gender or "Male", payload.assigned_bus_id or None, payload.status or "ACTIVE",
            now_ist(), *target_args
        )
    else:
        update_query = f"""
            UPDATE conductors
            SET name = %s, mobile = %s, email = %s, gender = %s, assigned_bus_id = %s, status = %s, updated_at = %s
            {where_sql}
        """
        params = (
            payload.name, payload.mobile, payload.email or "",
            payload.gender or "Male", payload.assigned_bus_id or None, payload.status or "ACTIVE",
            now_ist(), *target_args
        )

    cursor.execute(update_query, params)

    # Sync bus assignments if assigned_bus_id provided
    if payload.assigned_bus_id:
        cursor.execute("UPDATE buses SET current_conductor_id = NULL, current_conductor_name = 'Unassigned' WHERE current_conductor_id = %s AND bus_id != %s", (conductor_id, payload.assigned_bus_id))
        cursor.execute("UPDATE conductors SET assigned_bus_id = NULL WHERE assigned_bus_id = %s AND conductor_id != %s", (payload.assigned_bus_id, conductor_id))
        cursor.execute("UPDATE buses SET current_conductor_id = %s, current_conductor_name = %s WHERE bus_id = %s", (conductor_id, payload.name, payload.assigned_bus_id))
    else:
        cursor.execute("UPDATE buses SET current_conductor_id = NULL, current_conductor_name = 'Unassigned' WHERE current_conductor_id = %s", (conductor_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Conductor updated successfully"}


@app.delete("/api/v1/conductors/{conductor_id}")
def delete_conductor(conductor_id: str):
    conn = get_connection()
    cursor = get_cursor(conn)

    is_num = str(conductor_id).isdigit()
    where_sql = "WHERE conductor_id = %s OR id = %s" if is_num else "WHERE conductor_id = %s"
    target_args = (str(conductor_id), int(conductor_id)) if is_num else (str(conductor_id),)

    cursor.execute(f"DELETE FROM conductors {where_sql}", target_args)
    cursor.execute("UPDATE buses SET current_conductor_id = NULL, current_conductor_name = 'Unassigned' WHERE current_conductor_id = %s", (conductor_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Conductor deleted successfully"}


# =========================================================================
# --- DYNAMIC BUSES MANAGEMENT ---
# =========================================================================

@app.get("/api/v1/buses")
def get_all_buses():
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("""
        SELECT b.*, c.name AS conductor_name, c.mobile AS conductor_mobile
        FROM buses b
        LEFT JOIN conductors c ON b.current_conductor_id = c.conductor_id
        ORDER BY b.id DESC
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    formatted = []
    for r in rows:
        c_name = r.get("conductor_name") or r.get("current_conductor_name") or "Unassigned"
        formatted.append({
            "id": r["bus_id"],
            "bus_id": r["bus_id"],
            "bus_number": r["bus_number"],
            "origin_city": r["origin_city"],
            "destination_city": r["destination_city"],
            "route": f"{r['origin_city']} ➔ {r['destination_city']}",
            "current_conductor_id": r.get("current_conductor_id"),
            "currentConductor": c_name,
            "conductor_name": c_name,
            "conductor_mobile": r.get("conductor_mobile", ""),
            "fare_amount": float(r.get("fare_amount") or 50.0),
            "status": r.get("status", "ACTIVE"),
            "created_at": r.get("created_at", ""),
        })

    return formatted


@app.post("/api/v1/buses")
def create_bus(payload: BusCreateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    bus_id = payload.bus_id.strip().upper()

    cursor.execute("SELECT id FROM buses WHERE bus_id = %s", (bus_id,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Bus ID '{bus_id}' already exists")

    conductor_name = "Unassigned"
    if payload.current_conductor_id:
        cursor.execute("SELECT name FROM conductors WHERE conductor_id = %s", (payload.current_conductor_id,))
        cond_row = cursor.fetchone()
        if cond_row:
            conductor_name = cond_row["name"]

    cursor.execute("""
        INSERT INTO buses (
            bus_id, bus_number, origin_city, destination_city, current_conductor_id, current_conductor_name, fare_amount, status, created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        bus_id,
        payload.bus_number.strip().upper(),
        payload.origin_city.strip(),
        payload.destination_city.strip(),
        payload.current_conductor_id,
        conductor_name,
        payload.fare_amount or 50.0,
        payload.status or "ACTIVE",
        now_ist(),
        now_ist(),
    ))

    # If conductor assigned, clear previous assignments and update
    if payload.current_conductor_id:
        cursor.execute("UPDATE buses SET current_conductor_id = NULL, current_conductor_name = 'Unassigned' WHERE current_conductor_id = %s AND bus_id != %s", (payload.current_conductor_id, bus_id))
        cursor.execute("UPDATE conductors SET assigned_bus_id = NULL WHERE assigned_bus_id = %s AND conductor_id != %s", (bus_id, payload.current_conductor_id))
        cursor.execute("UPDATE conductors SET assigned_bus_id = %s WHERE conductor_id = %s", (bus_id, payload.current_conductor_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": f"Bus {bus_id} created successfully",
        "bus": {
            "id": bus_id,
            "bus_id": bus_id,
            "bus_number": payload.bus_number,
            "origin_city": payload.origin_city,
            "destination_city": payload.destination_city,
            "route": f"{payload.origin_city} ➔ {payload.destination_city}",
            "current_conductor_id": payload.current_conductor_id,
            "currentConductor": conductor_name,
            "fare_amount": payload.fare_amount or 50.0,
            "status": payload.status or "ACTIVE",
        }
    }


@app.put("/api/v1/buses/{bus_id}")
def update_bus(bus_id: str, payload: BusUpdateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    conductor_name = "Unassigned"
    if payload.current_conductor_id:
        cursor.execute("SELECT name FROM conductors WHERE conductor_id = %s", (payload.current_conductor_id,))
        cond_row = cursor.fetchone()
        if cond_row:
            conductor_name = cond_row["name"]

    cursor.execute("""
        UPDATE buses
        SET bus_number = %s, origin_city = %s, destination_city = %s, current_conductor_id = %s, current_conductor_name = %s, fare_amount = %s, status = %s, updated_at = %s
        WHERE bus_id = %s
    """, (
        payload.bus_number.strip().upper(),
        payload.origin_city.strip(),
        payload.destination_city.strip(),
        payload.current_conductor_id,
        conductor_name,
        payload.fare_amount or 50.0,
        payload.status or "ACTIVE",
        now_ist(),
        bus_id,
    ))

    if payload.current_conductor_id:
        cursor.execute("UPDATE buses SET current_conductor_id = NULL, current_conductor_name = 'Unassigned' WHERE current_conductor_id = %s AND bus_id != %s", (payload.current_conductor_id, bus_id))
        cursor.execute("UPDATE conductors SET assigned_bus_id = NULL WHERE assigned_bus_id = %s AND conductor_id != %s", (bus_id, payload.current_conductor_id))
        cursor.execute("UPDATE conductors SET assigned_bus_id = %s WHERE conductor_id = %s", (bus_id, payload.current_conductor_id))
    else:
        cursor.execute("UPDATE conductors SET assigned_bus_id = NULL WHERE assigned_bus_id = %s", (bus_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": f"Bus {bus_id} updated successfully"}


@app.delete("/api/v1/buses/{bus_id}")
def delete_bus(bus_id: str):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("DELETE FROM buses WHERE bus_id = %s", (bus_id,))
    cursor.execute("UPDATE conductors SET assigned_bus_id = NULL WHERE assigned_bus_id = %s", (bus_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": f"Bus {bus_id} deleted successfully"}


@app.post("/api/v1/buses/{bus_id}/reassign")
def reassign_bus_conductor(bus_id: str, payload: BusReassignRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    cursor.execute("SELECT * FROM buses WHERE bus_id = %s", (bus_id,))
    bus = cursor.fetchone()
    if not bus:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Bus not found")

    conductor_name = "Unassigned"
    if payload.conductor_id:
        cursor.execute("SELECT name FROM conductors WHERE conductor_id = %s", (payload.conductor_id,))
        cond_row = cursor.fetchone()
        if cond_row:
            conductor_name = cond_row["name"]

    # Clear previous assignments for this conductor and this bus to enforce 1-to-1
    if payload.conductor_id:
        cursor.execute("UPDATE buses SET current_conductor_id = NULL, current_conductor_name = 'Unassigned' WHERE current_conductor_id = %s AND bus_id != %s", (payload.conductor_id, bus_id))
        cursor.execute("UPDATE conductors SET assigned_bus_id = NULL WHERE assigned_bus_id = %s AND conductor_id != %s", (bus_id, payload.conductor_id))
        cursor.execute("UPDATE conductors SET assigned_bus_id = %s WHERE conductor_id = %s", (bus_id, payload.conductor_id))
    else:
        cursor.execute("UPDATE conductors SET assigned_bus_id = NULL WHERE assigned_bus_id = %s", (bus_id,))

    # Update bus
    cursor.execute("""
        UPDATE buses
        SET current_conductor_id = %s, current_conductor_name = %s, status = 'ACTIVE', updated_at = %s
        WHERE bus_id = %s
    """, (payload.conductor_id, conductor_name, now_ist(), bus_id))

    # Create shift log entry
    shift_id = f"SHIFT-{int(time.time())}"
    today_date = datetime.now(IST).strftime("%Y-%m-%d")
    cursor.execute("""
        INSERT INTO conductor_shift_logs (
            shift_id, bus_id, bus_number, conductor_id, conductor_name, shift_date, start_time, status, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE', %s)
    """, (
        shift_id,
        bus_id,
        bus["bus_number"],
        payload.conductor_id,
        conductor_name,
        today_date,
        now_ist(),
        now_ist(),
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": f"Conductor {conductor_name} assigned to {bus_id}",
        "shift_id": shift_id,
    }


# =========================================================================
# --- CONDUCTOR SHIFT AUDIT LOGS ---
# =========================================================================

@app.get("/api/v1/conductor/shift-logs")
def get_shift_logs(bus_id: Optional[str] = None, conductor_id: Optional[str] = None, date: Optional[str] = None):
    conn = get_connection()
    cursor = get_cursor(conn)

    query = "SELECT * FROM conductor_shift_logs WHERE 1=1"
    params = []

    if bus_id:
        query += " AND bus_id = %s"
        params.append(bus_id)
    if conductor_id:
        query += " AND conductor_id = %s"
        params.append(conductor_id)
    if date:
        query += " AND (shift_date = %s OR start_time LIKE CONCAT(%s, '%%'))"
        params.extend([date, date])

    query += " ORDER BY id DESC LIMIT 100"

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()

    # Dynamic calculation of total revenue & tickets for active/recent shifts
    logs_data = []
    for r in rows:
        item = dict(r)
        item["collection_amount"] = float(item.get("collection_amount") or 0.0)
        item["tickets_count"] = int(item.get("tickets_count") or 0)
        logs_data.append(item)

    cursor.close()
    conn.close()

    return logs_data


@app.post("/api/v1/conductor/shift-logs")
def create_shift_log(payload: ShiftLogCreateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    # Lookup bus & conductor names
    cursor.execute("SELECT bus_number FROM buses WHERE bus_id = %s", (payload.bus_id,))
    b_row = cursor.fetchone()
    bus_number = b_row["bus_number"] if b_row else payload.bus_id

    cursor.execute("SELECT name FROM conductors WHERE conductor_id = %s", (payload.conductor_id,))
    c_row = cursor.fetchone()
    conductor_name = c_row["name"] if c_row else payload.conductor_id

    shift_id = f"SHIFT-{int(time.time())}"
    shift_date = payload.shift_date or datetime.now(IST).strftime("%Y-%m-%d")

    cursor.execute("""
        INSERT INTO conductor_shift_logs (
            shift_id, bus_id, bus_number, conductor_id, conductor_name, shift_date, start_time, end_time, collection_amount, tickets_count, status, created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        shift_id,
        payload.bus_id,
        bus_number,
        payload.conductor_id,
        conductor_name,
        shift_date,
        payload.start_time or now_ist(),
        payload.end_time,
        payload.collection_amount or 0.0,
        payload.tickets_count or 0,
        payload.status or "COMPLETED",
        now_ist(),
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Shift audit log recorded successfully", "shift_id": shift_id}


# =========================================================================
# --- ALL TICKETS (ADMIN VIEW WITH FILTERS) ---
# =========================================================================

@app.get("/api/v1/admin/tickets")
def get_admin_tickets(
    bus_id: Optional[str] = None,
    date: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 150,
    offset: int = 0
):
    conn = get_connection()
    cursor = get_cursor(conn)

    query = "SELECT * FROM payments WHERE 1=1"
    count_query = "SELECT COUNT(*) AS total_count, COALESCE(SUM(amount), 0) AS total_revenue, COALESCE(SUM(cashback), 0) AS total_cashback FROM payments WHERE 1=1"
    params = []

    if bus_id and bus_id != "ALL":
        query += " AND bus_id = %s"
        count_query += " AND bus_id = %s"
        params.append(bus_id)

    if status and status != "ALL":
        query += " AND status = %s"
        count_query += " AND status = %s"
        params.append(status)

    if date:
        query += " AND (created_at LIKE CONCAT(%s, '%%') OR paid_at LIKE CONCAT(%s, '%%'))"
        count_query += " AND (created_at LIKE CONCAT(%s, '%%') OR paid_at LIKE CONCAT(%s, '%%'))"
        params.extend([date, date])

    if search:
        search_pattern = f"%{search}%"
        query += " AND (payment_id LIKE %s OR phone_number LIKE %s OR razorpay_payment_id LIKE %s OR origin LIKE %s OR destination LIKE %s)"
        count_query += " AND (payment_id LIKE %s OR phone_number LIKE %s OR razorpay_payment_id LIKE %s OR origin LIKE %s OR destination LIKE %s)"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern, search_pattern])

    # Run summary stats
    cursor.execute(count_query, tuple(params))
    summary = cursor.fetchone()

    # Query paginated rows
    query += " ORDER BY id DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    tickets_list = []
    for r in rows:
        item = dict(r)
        item["amount"] = float(item.get("amount") or 0.0)
        item["cashback"] = float(item.get("cashback") or 0.0)
        item["passenger_count"] = int(item.get("passenger_count") or 1)
        tickets_list.append(item)

    return {
        "success": True,
        "total": summary["total_count"] if summary else len(tickets_list),
        "total_revenue": float(summary["total_revenue"] if summary else 0.0),
        "total_cashback": float(summary["total_cashback"] if summary else 0.0),
        "tickets": tickets_list,
    }


# =========================================================================
# --- ADMIN MONTHLY PASSES ---
# =========================================================================

@app.get("/api/v1/admin/monthly-passes")
def get_admin_monthly_passes(status: Optional[str] = None, search: Optional[str] = None):
    conn = get_connection()
    cursor = get_cursor(conn)

    query = "SELECT * FROM monthly_passes WHERE 1=1"
    params = []

    if status and status != "ALL":
        query += " AND status = %s"
        params.append(status)

    if search:
        search_pat = f"%{search}%"
        query += " AND (name LIKE %s OR mobile LIKE %s OR pass_id LIKE %s OR bus_id LIKE %s OR origin_city LIKE %s OR destination_city LIKE %s OR route LIKE %s OR location LIKE %s)"
        params.extend([search_pat, search_pat, search_pat, search_pat, search_pat, search_pat, search_pat, search_pat])

    query += " ORDER BY id DESC"

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    passes = []
    for r in rows:
        item = dict(r)
        item["amount"] = float(item.get("amount") or 1000.0)
        item["total_rides"] = int(item.get("total_rides") or 62)
        item["used_rides"] = int(item.get("used_rides") or 0)
        item["remaining_rides"] = int(item.get("remaining_rides") or 62)

        # Parse location field if JSON string or dict
        loc = item.get("location")
        item["address"] = ""
        item["lat"] = None
        item["lng"] = None
        item["location_data"] = None
        if loc:
            if isinstance(loc, str) and loc.strip():
                try:
                    loc_obj = json.loads(loc)
                    if isinstance(loc_obj, dict):
                        item["location_data"] = loc_obj
                        item["address"] = loc_obj.get("address") or ""
                        item["lat"] = loc_obj.get("lat")
                        item["lng"] = loc_obj.get("lng")
                    else:
                        item["address"] = str(loc_obj)
                except Exception:
                    item["address"] = str(loc)
            elif isinstance(loc, dict):
                item["location_data"] = loc
                item["address"] = loc.get("address") or ""
                item["lat"] = loc.get("lat")
                item["lng"] = loc.get("lng")

        passes.append(item)

    return passes



@app.post("/api/v1/admin/monthly-passes")
def create_admin_monthly_pass(payload: AdminPassCreateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    pass_id = f"PASS-{int(time.time())}"
    pin = payload.pin or str(random.randint(1000, 9999))
    amount = payload.amount or 1000.0
    rides = payload.total_rides or 62
    origin = payload.origin_city or "Bari Sadri"
    dest = payload.destination_city or "Udaipur"
    route_str = payload.route or f"{origin} ➔ {dest}"

    # Default Udaipur Office Location
    default_admin_location = {
        "lat": 24.571271,
        "lng": 73.691544,
        "address": "Bus Operator Head Office, City Bus Station, Udaipur, Rajasthan 313001, India",
        "timestamp": int(time.time() * 1000),
    }

    if payload.location:
        if isinstance(payload.location, dict):
            location_json = json.dumps(payload.location)
        else:
            location_json = str(payload.location)
    else:
        location_json = json.dumps(default_admin_location)

    # Check if active pass exists for mobile
    cursor.execute("SELECT id FROM monthly_passes WHERE mobile = %s AND status = 'ACTIVE'", (payload.mobile,))
    existing = cursor.fetchone()
    if existing:
        # Update existing
        cursor.execute("""
            UPDATE monthly_passes
            SET total_rides = total_rides + %s, remaining_rides = remaining_rides + %s, amount = amount + %s, pin = %s,
                origin_city = %s, destination_city = %s, route = %s,
                location = COALESCE(NULLIF(location, ''), %s)
            WHERE id = %s
        """, (rides, rides, amount, pin, origin, dest, route_str, location_json, existing["id"]))
    else:
        # Create new
        cursor.execute("""
            INSERT INTO monthly_passes (
                pass_id, bus_id, origin_city, destination_city, route, name, mobile, pin, amount, location, total_rides, used_rides, remaining_rides, status, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, %s, 'ACTIVE', %s)
        """, (
            pass_id,
            payload.bus_id or "ROUTE-PASS",
            origin,
            dest,
            route_str,
            payload.name,
            payload.mobile,
            pin,
            amount,
            location_json,
            rides,
            rides,
            now_ist(),
        ))


    # Auto-register / update customer in user table
    register_or_update_customer(
        cursor=cursor,
        mobile=payload.mobile,
        name=payload.name or "Customer",
        cashback=0.0,
        amount=amount,
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": f"Monthly Pass {pass_id} created successfully for {payload.name} ({route_str})",
        "pass": {
            "pass_id": pass_id,
            "name": payload.name,
            "mobile": payload.mobile,
            "origin_city": origin,
            "destination_city": dest,
            "route": route_str,
        }
    }


@app.put("/api/v1/admin/monthly-passes/{pass_id}")
def update_admin_monthly_pass(pass_id: str, payload: AdminPassUpdateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)

    origin = payload.origin_city or "Bari Sadri"
    dest = payload.destination_city or "Udaipur"
    route_str = payload.route or f"{origin} ➔ {dest}"

    is_num = str(pass_id).isdigit()
    where_sql = "WHERE pass_id = %s OR id = %s" if is_num else "WHERE pass_id = %s"
    target_args = (str(pass_id), int(pass_id)) if is_num else (str(pass_id),)

    cursor.execute(f"SELECT * FROM monthly_passes {where_sql}", target_args)
    existing = cursor.fetchone()
    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Monthly pass not found")

    total_rides = payload.total_rides if payload.total_rides is not None else existing.get("total_rides", 62)
    used_rides = payload.used_rides if payload.used_rides is not None else existing.get("used_rides", 0)
    remaining_rides = payload.remaining_rides if payload.remaining_rides is not None else (total_rides - used_rides)
    pin = payload.pin if payload.pin else existing.get("pin", "1234")
    amount = payload.amount if payload.amount is not None else existing.get("amount", 1000.0)
    status = payload.status or existing.get("status", "ACTIVE")

    update_query = f"""
        UPDATE monthly_passes
        SET name = %s, mobile = %s, origin_city = %s, destination_city = %s, route = %s,
            amount = %s, total_rides = %s, used_rides = %s, remaining_rides = %s, pin = %s, status = %s
        {where_sql}
    """
    params = (
        payload.name, payload.mobile, origin, dest, route_str,
        amount, total_rides, used_rides, remaining_rides, pin, status,
        *target_args
    )
    cursor.execute(update_query, params)
    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Monthly Pass updated successfully"}


@app.delete("/api/v1/admin/monthly-passes/{pass_id}")
def delete_admin_monthly_pass(pass_id: str):
    conn = get_connection()
    cursor = get_cursor(conn)

    is_num = str(pass_id).isdigit()
    where_sql = "WHERE pass_id = %s OR id = %s" if is_num else "WHERE pass_id = %s"
    target_args = (str(pass_id), int(pass_id)) if is_num else (str(pass_id),)

    cursor.execute(f"DELETE FROM monthly_passes {where_sql}", target_args)
    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Monthly Pass deleted successfully"}


# =========================================================================
# --- ADMIN LOYALTY MILESTONE RULES ---
# =========================================================================

@app.get("/api/v1/admin/loyalty-rules")
def get_loyalty_rules():
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("SELECT * FROM loyalty_rules ORDER BY spend_threshold ASC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        {
            "id": r["id"],
            "spend_threshold": float(r["spend_threshold"]),
            "reward_rides": int(r.get("reward_rides") or 1),
            "title": r.get("title") or f"Free Ride on Rs.{int(r['spend_threshold'])} Spend",
            "status": r.get("status") or "ACTIVE",
            "created_at": r.get("created_at"),
        }
        for r in rows
    ]


@app.post("/api/v1/admin/loyalty-rules")
def create_loyalty_rule(payload: LoyaltyRuleCreateRequest):
    conn = get_connection()
    cursor = get_cursor(conn)
    threshold = float(payload.spend_threshold)
    title = payload.title or f"Free Ride on Rs.{int(threshold)} Spend"
    now = now_ist()
    try:
        cursor.execute("""
            INSERT INTO loyalty_rules (spend_threshold, reward_rides, title, status, created_at)
            VALUES (%s, %s, %s, 'ACTIVE', %s)
            ON DUPLICATE KEY UPDATE title = %s, reward_rides = %s, status = 'ACTIVE'
        """, (threshold, payload.reward_rides or 1, title, now, title, payload.reward_rides or 1))
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    return {"success": True, "message": f"Milestone rule for Rs.{int(threshold)} saved successfully"}


@app.delete("/api/v1/admin/loyalty-rules/{rule_id}")
def delete_loyalty_rule(rule_id: int):
    conn = get_connection()
    cursor = get_cursor(conn)
    cursor.execute("DELETE FROM loyalty_rules WHERE id = %s", (rule_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "message": "Loyalty rule deleted"}


# =========================================================================
# --- ADMIN CUSTOMERS DIRECTORY WITH LOYALTY TRACKING ---
# =========================================================================

@app.get("/api/v1/admin/customers")
def get_admin_customers(search: Optional[str] = None):
    conn = get_connection()
    cursor = get_cursor(conn)

    # Fetch active milestone rules ordered
    cursor.execute("SELECT id, spend_threshold, title FROM loyalty_rules WHERE status = 'ACTIVE' ORDER BY spend_threshold ASC")
    rules = cursor.fetchall()

    # Fetch all monthly passes to link with customers by mobile
    cursor.execute("SELECT * FROM monthly_passes")
    pass_rows = cursor.fetchall()
    passes_by_mobile = {}
    for p in pass_rows:
        mob = str(p.get("mobile") or "").strip()
        if mob:
            passes_by_mobile[mob] = {
                "id": p["id"],
                "pass_id": p.get("pass_id"),
                "name": p.get("name"),
                "mobile": p.get("mobile"),
                "bus_id": p.get("bus_id"),
                "origin_city": p.get("origin_city") or "Bari Sadri",
                "destination_city": p.get("destination_city") or "Udaipur",
                "route": p.get("route") or f"{p.get('origin_city', 'Bari Sadri')} ➔ {p.get('destination_city', 'Udaipur')}",
                "amount": float(p.get("amount") or 1000.0),
                "total_rides": int(p.get("total_rides") or 62),
                "used_rides": int(p.get("used_rides") or 0),
                "remaining_rides": int(p.get("remaining_rides") or 0),
                "pin": p.get("pin") or "1234",
                "status": p.get("status") or "ACTIVE",
                "created_at": p.get("created_at"),
            }

    query = "SELECT * FROM user WHERE 1=1"
    params = []
    if search:
        pat = f"%{search}%"
        query += " AND (name LIKE %s OR mobile_number LIKE %s)"
        params.extend([pat, pat])
    query += " ORDER BY id DESC"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    result = []
    for r in rows:
        total_spent = float(r.get("total_spent") or 0.0)
        last_claimed = float(r.get("last_milestone_claimed") or 0.0)
        mob = str(r.get("mobile_number") or "").strip()
        m_pass = passes_by_mobile.get(mob, None)

        # Find next upcoming milestone
        next_rule = None
        for rule in rules:
            if float(rule["spend_threshold"]) > total_spent:
                next_rule = rule
                break

        next_threshold = float(next_rule["spend_threshold"]) if next_rule else None
        amount_needed = max(0.0, next_threshold - total_spent) if next_threshold else 0.0

        # Calculate progress percent towards next milestone
        prev_threshold = 0.0
        if next_threshold:
            for rule in rules:
                if float(rule["spend_threshold"]) < next_threshold:
                    prev_threshold = float(rule["spend_threshold"])
            span = max(1.0, next_threshold - prev_threshold)
            progress_pct = min(100, max(0, int(((total_spent - prev_threshold) / span) * 100)))
        else:
            progress_pct = 100

        result.append({
            "id": r["id"],
            "name": r.get("name") or "Customer",
            "mobile_number": r["mobile_number"],
            "user_pin": r.get("user_pin") or "1234",
            "cashback": float(r.get("cashback") or 0.0),
            "total_tickets": int(r.get("total_tickets") or 0),
            "total_spent": total_spent,
            "last_milestone_claimed": last_claimed,
            "free_rides_redeemed": int(r.get("free_rides_redeemed") or 0),
            "next_threshold": next_threshold,
            "amount_needed": amount_needed,
            "progress_pct": progress_pct,
            "monthly_pass": m_pass,
            "status": r.get("status") or "ACTIVE",
            "created_at": r.get("created_at"),
            "updated_at": r.get("updated_at"),
        })

    return result


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
