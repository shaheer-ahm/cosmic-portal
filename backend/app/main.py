import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import orders, items, box_types, auth, dashboard, integration

load_dotenv()

# Creates orders/order_items/box_types/order_box_types/order_results/profiles
# if they don't already exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FitPortal API", version="0.1.0")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=False,
)

app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(items.router)
app.include_router(box_types.router)
app.include_router(dashboard.router)
app.include_router(integration.router)


@app.get("/api/v1/health", tags=["health"])
def health_check():
    return {"status": "ok"}
