# DineDash System Module Documentation

This document outlines the architecture, data structures, and implementation details of the DineDash frontend system, highlighting the relationships between core modules, real-time communications, and the backend API.

---

## 1. System Overview

DineDash is a real-time QR ordering and management platform. It splits into two primary client environments running on a unified codebase:
* Customer-Facing Web App: Accessed via scanning table QR codes, allowing guests to view menus, place orders (KOTs), and track preparation status.
* Staff Dashboard: Accessed by restaurant owners and kitchen staff to manage orders, tables, menus, and process payments.

---

## 2. Core Modules

### A. Customer Menu Page (PublicMenuPage.jsx)
The customer-facing application handles QR parsing, menu presentation, shopping cart operations, and session order tracking.

#### Key Functions
* QR Parse and Initialisation: Extracts the table QR token from the URL parameters (`?table=TOKEN`), initializes the session, and sets the table token in localStorage.
* Session Tray Assembly: Combines and flattens all individual KOTs placed under the active session into a single unified item list. Duplicated items are combined by quantity and total price.
* Prep-Status Pulsing: Scans the session orders. If any order is not yet served or cancelled, it marks the session as having active preparation and renders a "KOT Active" pulse badge.
* Order Status Polling: Polls individual order endpoints every 5 seconds and table sessions every 15 seconds to fetch latest updates.

#### Local Storage Keys
* `dine_dash_table_id`: Stores the active table UUID.
* `dine_dash_session_token`: Stores the backend-generated unique session token for verification.
* `dine_dash_customer_name`: Remembers the guest's name for repeat orders.

---

### B. Staff Orders Panel (OrdersWorkspace.jsx)
The main order management dashboard rendered for restaurant staff to track, prepare, and settle orders.

#### Key Functions
* Session-Based Grouping: Merges flat orders by cross-referencing order IDs against the backend sessions fetched from `/api/orders/sessions`.
* Stacked Layout Representation: Displays active unpaid dine-in orders stacked on top of each other within a single spanned row. Columns like Table Number and Actions span the height of the entire active session using rowSpan.
* Individual Detail Inspection: Renders KOT detail modals for individual orders when a user clicks the respective eye icon.
* Session-Wide Payment settlement: Provides a unified button to mark all orders in the session as paid, clearing the table instantly.
* Thermal Bill Preview: Displays a pop-up rendering the tax invoice. Users can toggle between the individual order bill or the combined table session bill prior to print spooling.

---

### C. Seating Management (TablesWorkspace.jsx)
Manages the restaurant tables, QR card generation, and table session lifecycle.

#### Key Functions
* Seat Guests (Open Session): Triggers session initialization on the backend for a vacant table, generating a new active session token.
* Done - Free Up Table (Clear Session): Reset the table status to vacant and invalidate the active session token.
* QR Card Printing: Spools single or batch table QR sticker card layouts for print.

---

### D. Socket Event Handler (useRestaurantSocket.js)
A React hook establishing a WebSockets connection with the backend Socket.io server to synchronize UI states.

#### Socket Room
* Joins the room `restaurant_${restaurant_id}` upon successful dashboard login.

#### Subscribed Events
* `new_order`: Receives incoming orders and pushes them to the top of the orders list.
* `order_status_update`: Listens to changes in order state (Pending -> Preparing -> Ready -> Served) and updates the matching order object.
* `payment_status_update`: Listens to updates on payment status (Unpaid -> Paid).
* `table_session_cleared`: Triggers when an entire table session has been settled, instantly updating all orders on that table to Paid and Served to clear them from the dashboard.

---

### E. API Client (api.js)
A custom HTTP client wrapping native fetch to streamline communication with the backend.

#### Configured Base URL
* `http://192.168.0.105:3005` (fallback for local local development network).

#### Features
* JWT Authorization Injection: Automatically appends `Bearer token` from memory to secure requests.
* Interceptor for Token Expiration: Intercepts 403 Forbidden statuses, pauses execution, calls the backend refresh endpoint, saves new tokens, and retries original queue items.

---

## 3. Data Integration and Workflows

### Order Checkout Flow
1. Guest scans QR code. Table session is loaded from `GET /api/public/tables/:qr_token/menu`.
2. Guest adds items to cart and enters their name.
3. Guest clicks checkout. Payload is dispatched to `POST /api/public/orders` containing:
   * `customer_name`
   * `table_id`
   * `session_token`
   * `items` (array of item objects, quantity, and notes)
4. Dashboard receives the order real-time via `new_order` websocket event.

### Table Settle Flow
1. Owner opens Orders workspace and views the grouped table session row.
2. Owner clicks "Payment Received" on the unified controls cell.
3. Client dispatches `PUT /api/tables/:table_id/pay-session`.
4. Backend updates all session orders to Paid and Served, vacates the table session, and broadcasts a `table_session_cleared` socket event.
5. All open dashboard instances process the socket event, marking the matching orders as paid and served, removing the session group from the active orders table.
