from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import orders, items, box_types

# Creates orders/order_items/box_types/profiles if they don't already exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FitPortal API", version="0.1.0")

# TODO: confirm before deploying
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router)
app.include_router(items.router)
app.include_router(box_types.router)


@app.get("/api/v1/health", tags=["health"])
def health_check():
    return {"status": "ok"}