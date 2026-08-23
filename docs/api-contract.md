# Cosmic Connector API Contract

**Version:** 0.1
**Status:** Draft

## 1. Overview
The Cosmic Portal API provides communication between the React frontend, FastAPI backend, Cosmic Solver, and Cosmic Visualizer.

Base API path:

`/api/v1`

---

## 2. Technology
- Frontend:     React
- Backend:      Python + FastAPI
- Database:     MySQL
- API Style:    REST
- Data Format:  JSON

---

## 3. Authentication and Authorization

Authentication will use JWT Bearer tokens.

The system currently defines two user roles:
- `USER` - may access and view optimisation results.
- `SUPERVISOR` - may access results and initiate the optimisation algorithm.

Only users with the `SUPERVISOR` role may initiate optimisation

### CORS
The FastAPI backend will use CORS configuration to grant requests from approved frontend applications, including the Cosmic Portal frontend and Cosmic Visualizer where required.

---

## 4. Data Conventions

### Measurement Units

- Dimensions:   millimetres (mm)
- Weight:       kilograms (kg)

### Solver Coordinate System

The Cosmic Solver currently returns placement coordinats using:
- X = Width
- Y = Length
- Z = Depth (vertical)
- Origin = internal front-bottom-left corner
- Position represents the minimum corner of an item, not its centre

<u>**The final coordinate convention exposed to Cosmic Visualizer is yet to be finalized.**</u>

---

## 5. API Endpoints

### Authentication

`POST /api/v1/auth/login`
Authenticate a user and return a JWT access token

`GET /api/v1/auth/login`
Return information about the currently authenticated user.

---

### Dashboard

`Get /api/v1/dashboard/summary`
Return dashboard statistics and recent order information.

---

### Orders
`POST /api/v1/orders`
Create a new order

`GET /api/v1/orders`
Retrieve orders

`GET /api/v1/orders/{order_id}`
Retrieve specific order

`POST /api/v1/orders/{order_id}/items`
Add an item to an order

`PUT /api/v1/orders/{order_id}/items/{item_id}`
Update an item belonging to an order

`DELETE /api/v1/orders/{order_id}/items/{item_id}`
Remove an item from an order

`POST /api/v1/orders/{order_id}/box-types`
Select the box types available for an order.

`POST /api/v1/orders/{order_id}/validate`
Validate an order before optimisation

`GET /api/v1/orders/{order_id}/status`
Retrieve the current order/optimisation status

`GET /api/v1/orders/{order_id}/results`
Retrieve the optimisation results for an order

---

### Optimisation
`POST /api/v1/orders/{order_id}/optimise`
Submit an order for optimisation

**Required role:** `SUPERVISOR`

---

### Box Types
`GET /api/v1/box-types`
Retrieve available box types

---

### Integration
`GET /api/v1/integration/status`
Retrieve the current status of system integration

`GET /api/v1/health`
Check whether the Cosmic Portal backend is online

---

## 6. Extrenal Integration

### Cosmic Solver
The Portal will communicate with Cosmic Solver using a REST API.

The Portal will also preserve the **client-defined** `ITEM` and `BoxType` field names and data structures when communicating with Solver.

<u>**The exact Solver endpoint is yet to be confirmed.**</u>

### Cosmic Visualizer
Cosmic Visualizer will retrieve optimisation results from the Postal using a REST API.

<u>**The final coordinate-system mapping between Solver and Visualizer is still to be confirmed.**</u>

---

## 7. Questions to be answered
### Solver
- What exact REST endpoint will Cosmic Solver expose?
- What complete request object does Solver expect around the Item and BoxType collections?

### Visualizer
- Will Consmic Visualizer use Solver's coordinate convention directly, or will Portal transform the coodinates?
- Will Visualizer access Portal directly from its frontend or through its own backend?
- Will Visualizer authenticate using the user's JWT or require separate service authentication?

---

## 8. Contract Status
This API contract is the initial design and may change as integration requirements are finalised with the Cosmic Solver and Cosmic Visualizer teams