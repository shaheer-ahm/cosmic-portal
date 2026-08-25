# FitPortal Backend

FastAPI + MySQL backend for FitPortal based on the Cosmic Connector API Contract.

## Stack
- FastAPI (REST API)
- `pymysql`
- MySQL
- Pydantic

## Endpoints so far

**Orders**
- `GET  /api/v1/orders`
- `POST /api/v1/orders`
- `GET  /api/v1/orders/{order_id}`

**Items**
- `GET  /api/v1/orders/{order_id}/items`
- `GET  /api/v1/orders/{order_id}/items/{item_id}`
- `POST /api/v1/orders/{order_id}/items`
- `PUT  /api/v1/orders/{order_id}/items/{item_id}`
- `DELETE /api/v1/orders/{order_id}/items/{item_id}`

**Box types**
- `GET  /api/v1/box-types`

**Health**
- `GET  /api/v1/health`
