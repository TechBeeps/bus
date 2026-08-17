# backend/app/main.py
from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import datetime
import razorpay
from app.database import get_connection
import requests

payment_logs = {}

app = FastAPI(
    title="Indian Bus Ticketing & Fintech API",
    version="1.0.0",
    description="Backend service for QR-based ticketing, payment verification, and fleet management."
)

RAZORPAY_KEY_ID = "rzp_test_LVIEo9xSbhNfUX"
RAZORPAY_KEY_SECRET = "TFbLcznEvwrRQZ89GVKr8F8E"

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
    # passenger_name: str

class PaymentSuccessRequest(BaseModel):
    payment_id: str
    razorpay_payment_id: str


class PaymentStatusRequest(BaseModel):
    payment_id: str
    status: str

class pushnotification(BaseModel):
    token: str

# --- Mock In-Memory Store for MVP ---
tickets_db = {}
conductor_live_alerts = {}

# --- Routes ---


@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Bus Ticketing API", "timestamp": datetime.datetime.now()}


@app.post("/api/v1/tickets/create")
def create_ticket(payload: CreateTicketRequest):
    """
    Creates an UNPAID ticket pending payment confirmation.
    """
    ticket_id = f"TICK-{int(datetime.datetime.now().timestamp())}"
    tickets_db[ticket_id] = {
        "ticket_id": ticket_id,
        "bus_id": payload.bus_id,
        "origin": payload.origin_stop,
        "destination": payload.destination_stop,
        "passenger_count": payload.passenger_count,
        "amount": payload.total_amount,
        "status": "PENDING",
        "verified": False,
        "created_at": str(datetime.datetime.now())
    }
    
    # In production: Generate UPI Payment Deep Link (PhonePe/Paytm/Razorpay QR)
    upi_intent_url = f"upi://pay?pa=busoperator@upi&pn=BusOperator&am={payload.total_amount}&tr={ticket_id}"
    
    return {
        "ticket_id": ticket_id,
        "status": "PENDING",
        "amount": payload.total_amount,
        "upi_intent_url": upi_intent_url
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

        # Notify assigned conductor in background (WebSockets / Push Notification)
        background_tasks.add_task(
            notify_conductor, 
            bus_id=payload.bus_id, 
            ticket=tickets_db[payload.ticket_id]
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
    # Logic to send Firebase Cloud Message (FCM) or WebSocket push to Conductor's phone
    print(f"[REALTIME ALERT] Bus {bus_id} -> Payment Verified for Ticket {ticket['ticket_id']}")



#13-8-26



# @app.post("/api/v1/payment/create")
# def create_payment(payload: CreatePaymentRequest):

#     payment_id = f"PAY-{int(datetime.datetime.now().timestamp())}"

#     cashback = 10 if payload.amount >= 100 else 0

#     payment_logs[payment_id] = {
#         "payment_id": payment_id,
#         "bus_id": payload.bus_id,
#         "amount": payload.amount,
#         # "mobile": payload.mobile,
#         # "passenger_name": payload.passenger_name,
#         "cashback": cashback,
#         "status": "INITIATED",
#         "created_at": str(datetime.datetime.now())
#     }

#     conn = get_connection()
#     cursor = conn.cursor()

#     cursor.execute("""
#         INSERT INTO payments (
#         payment_id,
#         bus_id,
#         amount,
#         cashback,
#         status,
#         razorpay_order_id,
#         created_at
#     )
#     VALUES (?, ?, ?, ?, ?, ?, ?)
#     """, (
#         payment_id,
#         payload.bus_id,
#         payload.amount,
#         cashback,
#         "INITIATED",
#         "",  # Placeholder for razorpay_order_id
#         str(datetime.datetime.now())
#     ))

#     conn.commit()
#     conn.close()

#     print("Payment Saved:", payment_logs[payment_id])

#     return {
#         "success": True,
#         "payment_id": payment_id,
#         "cashback": cashback
#     }

@app.get("/api/v1/payments")
def get_payments():
    return payment_logs

BUS_ROUTES = {
    "BUS001": {
        "bus_no": "RJ14PA1234",
        "origin": "Bari Sadri",
        "destination": "Udaipur"
    },
    "BUS002": {
        "bus_no": "RJ14PA5678",
        "origin": "Nimbahera",
        "destination": "Udaipur"
    },
    "BUS003": {
        "bus_no": "RJ14PA1212",
        "origin": "Neemuch",
        "destination": "Udaipur"
    }
}

@app.post("/api/v1/payment/order")
def create_order(payload: CreatePaymentRequest):

    payment_id = f"PAY-{int(datetime.datetime.now().timestamp())}"

    cashback = round(payload.amount * 0.10, 2)

    order = razorpay_client.order.create({
        "amount": int(payload.amount * 100),
        "currency": "INR",
        "receipt": payment_id
    })

    route = BUS_ROUTES.get(payload.bus_id, {})

    bus_no = route.get("bus_no", "")
    origin = route.get("origin", "")
    destination = route.get("destination", "")  

    payment_logs[payment_id] = {
        "payment_id": payment_id,
        "bus_id": payload.bus_id,
        "amount": payload.amount,
        "cashback": cashback,
        "status": "INITIATED",
        "razorpay_order_id": order["id"],
        "created_at": str(datetime.datetime.now()),
        "bus_no": bus_no,
        "origin": origin,
        "destination": destination
    }

    conn = get_connection()
    cursor = conn.cursor()

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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)
    """, (
        payment_id,
        payload.bus_id,
        payload.amount,
        cashback,
        "INITIATED",
        order["id"],
        str(datetime.datetime.now()),
        payload.mobile,
        origin,
        destination,
        1  # Default passenger_count to 1
    ))

    conn.commit()
    conn.close()

    print("INSERTED:", payment_id)

    return {
        "success": True,
        "payment_id": payment_id,
        "cashback": cashback,
        "razorpay_order_id": order["id"],
        "key": RAZORPAY_KEY_ID
    }


@app.post("/api/v1/payment/success")
def payment_success(payload: PaymentSuccessRequest):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT payment_id FROM payments WHERE payment_id=?",
        (payload.payment_id,)
    )

    row = cursor.fetchone()

    if not row:
        conn.close()
        return {"success": False}

    #payment_logs[payload.payment_id]["status"] = "PAID"
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE payments
    SET
    status=?,
    razorpay_payment_id=?,
    paid_at=?
    WHERE payment_id=?
    """, (
    "PAID",
    payload.razorpay_payment_id,
    str(datetime.datetime.now()),
    payload.payment_id
    ))

    conn.commit()

    cursor.execute("""
    SELECT origin, destination, amount, bus_id, id AS ticket_id
    FROM payments
    WHERE payment_id=?
    """, (payload.payment_id,))

    ticket = cursor.fetchone()

    origin = ticket[0]
    destination = ticket[1]
    amount = ticket[2]
    bus_id = ticket[3]
    ticket_id = ticket[4]

    cursor.execute("""
        SELECT token FROM push_token
    """)

    rows = cursor.fetchall()

    
    
    expo_tokens = [row[0] for row in rows]

    print("Push Tokens:", expo_tokens)

    # Push Notification
    #expo_token = "ExponentPushToken[fsvh3yPUuqi2Smlr5J__WO]"

    push_payload = {
        "to": expo_tokens,
        "title": "New Ticket Booked",
        "body": (
        f"Bus No: {bus_id}\n"
        f"Route: {origin} → {destination}\n"
        f"Fare: ₹{amount}\n"
        f"Ticket ID: {payload.payment_id}"
        ),
        "data": {
            "razorpay_payment_id": payload.payment_id,
            "bus_id": bus_id,
            "ticket_id": ticket_id,
            "amount": amount,
            "origin": origin,
            "destination": destination
        }
    }

    try:
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=push_payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        )
    except Exception as e:
        print("Push Error:", e)


    conn.close()

    

    #payment_logs[payload.payment_id]["razorpay_payment_id"] = payload.razorpay_payment_id
    #payment_logs[payload.payment_id]["paid_at"] = str(datetime.datetime.now())

    return {"success": True}


@app.post("/api/v1/payment/update-status")
def update_payment_status(payload: PaymentStatusRequest):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT payment_id FROM payments WHERE payment_id=?",
        (payload.payment_id,)
    )

    row = cursor.fetchone()

    if not row:
        conn.close()
        return {"success": False}

    payment_logs[payload.payment_id]["status"] = payload.status

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE payments
    SET
        status=?,
        updated_at=?
    WHERE payment_id=?
    """, (
        payload.status,
        str(datetime.datetime.now()),
        payload.payment_id
    ))

    conn.commit()
    conn.close()

    payment_logs[payload.payment_id]["updated_at"] = str(datetime.datetime.now())

    return {"success": True}

@app.get("/api/v1/payment/{payment_id}")
def get_payment(payment_id: str):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM payments
        WHERE payment_id = ?
    """, (payment_id,))

    row = cursor.fetchone()

    conn.close()

    if not row:
        return {"success": False, "message": "Payment not found"}

    return dict(row)



@app.get("/api/v1/tickets")
def tickets():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM payments")

    rows = cursor.fetchall()

    conn.close()

    return [dict(row) for row in rows]


@app.get("/api/v1/tickets/{bus_id}")
def ticketsByid(bus_id: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id AS ticket_id,
                amount,
                origin,
                destination,
                passenger_count,
                razorpay_payment_id,
                created_at
            FROM payments
            WHERE bus_id = ?
            AND status = ?
            AND date(created_at) = date('now', 'localtime')
        """, (bus_id, "PAID"))

        rows = cursor.fetchall()

        conn.close()

        #these data fetch form row 
        # { ticket_id: 'TKT009', amount: 150, origin: 'Delhi', destination: 'Jaipur', passenger_count: 2, created_at: '2026-08-17T12:10:00', upi_txn_id: 'UPI123' },

        data = [dict(row) for row in rows]

        return {
            "success": True, 
            "data": data
        }

    except ValueError:
        return {"success": False, "message": "Invalid bus_id"}

    

#add push notification token
@app.post("/api/v1/push-token")
def add_push_token(payload: pushnotification):
    conn = get_connection()
    cursor = conn.cursor()

    now = str(datetime.datetime.now())

    # Check token already exists
    cursor.execute(
        "SELECT id FROM push_token WHERE token = ?",
        (payload.token,)
    )
    existing_token = cursor.fetchone()

    if existing_token:
        # Existing token -> update time
        cursor.execute("""
            UPDATE push_token
            SET updated_at = ?
            WHERE token = ?
        """, (now, payload.token))
    else:
        # New token -> insert
        cursor.execute("""
            INSERT INTO push_token (token, created_at, updated_at)
            VALUES (?, ?, ?)
        """, (payload.token, now, now))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Push token added successfully"
    }


#viewall token

@app.get("/api/v1/push-token")
def view_push_tokens():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM push_token")
    rows = cursor.fetchall()

    conn.close()

    return [dict(row) for row in rows]




if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
