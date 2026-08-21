# backend/app/main.py
import os
import random
import time
import math
import requests
import uvicorn
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import razorpay

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

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_TRERJ9RO8gmVih")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "9w31CkmZ3dqkE1ClZDT9z1Mm")

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


@app.post("/api/v1/payment/order")
def create_order(payload: CreatePaymentRequest):
    payment_id = f"PAY-{int(datetime.now().timestamp())}"
    cashback = round(payload.amount * 0.10, 2)
    discountAmount = payload.amount - cashback

    order = razorpay_client.order.create({
        "amount": int(discountAmount * 100),
        "currency": "INR",
        "receipt": payment_id,
    })

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
        passenger_count
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
    ))

    conn.commit()
    cursor.close()
    conn.close()

    print("INSERTED:", payment_id)

    return {
        "success": True,
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
    SELECT origin, destination, amount, bus_id, id AS ticket_id, cashback
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


@app.post("/api/v1/monthly-pass/success")
def monthly_pass_success(payload: dict):
    conn = get_connection()
    cursor = get_cursor(conn)

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
                amount = amount + 1000
            WHERE mobile = %s
        """, (payload["mobile"],))

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
            total_rides,
            remaining_rides,
            created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        payload["payment_id"],
        payload["bus_id"],
        payload["name"],
        payload["mobile"],
        pin,
        1000,
        62,
        62,
        now_ist(),
    ))

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
            if current_time - last_used < timedelta(minutes=2):
                cursor.close()
                conn.close()
                return {
                    "success": False,
                    "deducted": False,
                    "remaining_rides": pass_row["remaining_rides"],
                    "message": "Pass already used within 2 minutes",
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
        razorpay_payment_id
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
    ))
    last_insert_id = cursor.lastrowid
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
def buses():
    return {"buses": list(BUS_ROUTES.values()), "base_url": "https://bus.shreemateshwaribus.com/"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
