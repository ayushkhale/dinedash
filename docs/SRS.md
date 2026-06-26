# Software Requirements Specification (SRS)
## Project: DineDash

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **DineDash** platform, a next-generation SaaS ecosystem designed to streamline restaurant ordering and floor operations. It serves as the primary reference for developers, testers, managers, and stakeholders involved in the design and implementation of the DineDash product.

### 1.2 Scope of the System
DineDash is a web-based, mobile-responsive QR-ordering and kitchen management system. The platform bridges the gap between dine-in guests and restaurant personnel (owners, waitstaff, and chefs). 

The platform consists of:
*   **Customer Storefront (Guest Mobile Experience):** A zero-install mobile web interface accessed via scanning table-specific QR codes, allowing guests to browse menus, apply promotions, place orders directly to the kitchen, track order status in real time, and request assistance.
*   **Merchant Portal (Dashboard / Admin Panel):** A responsive management workspace accessible by Owners and Staff, facilitating menu building, table/QR code generation, promotions setup, live order management, and staff administration.
*   **Real-time Synchronization System:** A WebSocket-based event gateway ensuring instant synchronization between customer orders, waiter calls, kitchen monitors, and billing views.

### 1.3 Definitions, Acronyms, and Abbreviations
*   **SRS:** Software Requirements Specification
*   **KOT (Kitchen Order Ticket):** A ticket showing order items sent to the kitchen for preparation.
*   **KDS (Kitchen Display System):** A digital dashboard used by kitchen staff to view and track preparation times and progress of KOTs.
*   **OTP:** One-Time Password
*   **SaaS:** Software as a Service
*   **JWT:** JSON Web Token (used for authentication)
*   **UPI:** Unified Payments Interface (instant real-time payment system in India)
*   **Owner:** The user class possessing administrative rights over a restaurant workspace.
*   **Staff:** Restaurant employees (waiters, kitchen crews) with constrained access levels.
*   **Guest / Customer:** The end customer visiting the restaurant who orders food.
*   **Combo Menu Item:** A menu item composed of multiple sub-items at a combined price.
*   **QR Rotation:** Regenerating a table’s unique token to invalidate older printed QR codes.

### 1.4 References
1.  DineDash Front-End Codebase structure (`src/pages`, `src/components`, `src/api.js`).
2.  Vite & Tailwind CSS v4 Configuration Guidelines (`FONT_SETUP.md`, `src/index.css`).
3.  WebSocket Socket.io Gateway API interface contracts.

### 1.5 Document Overview
The remainder of this document details the overall product description, system features, external interfaces, and non-functional requirements. It highlights user roles, interaction constraints, authentication frameworks, real-time message architectures, and exact functional scopes.

---

## 2. Overall Description

### 2.1 Product Functions
DineDash satisfies the following core operational functions:
1.  **Direct-to-Kitchen QR Ordering:** Customers scan QR codes and place orders that print directly to the kitchen display screen, eliminating wait times.
2.  **Interactive Visual Menu Builder:** Management of categories, items, combo offerings, veg/non-veg tags, prices, descriptions, and dynamic stock availability.
3.  **Live Kitchen Display Monitor (KDS):** Digital ticket management for chefs, listing active prep times and item-ready triggers.
4.  **Waiter Summoning Alert System:** Active buzzer call system routing requests from a specific table directly to staff dashboards.
5.  **Multi-Floor & Table QR Management:** Generation, rotation, and printing of table-specific layout coordinates and QR tickets.
6.  **Flexible Promotions Engine:** Custom discount rules (Percentage, Flat, or Free Item) triggered based on cart value, items, and scheduled date/time validity.
7.  **Staff & Security Access Directory:** Control panel for creating and managing waitstaff credentials.
8.  **Profile & Outlet Configurator:** Controls for updating business names, phone numbers, location addresses, logo assets, and UPI gateway parameters.

### 2.2 User Classes and Characteristics
*   **System Owner (Restaurant Administrator):** Requires access to all functions including billing, menu setup, staff accounts, promotions, settings, and tables. Primarily utilizes desktop or tablet screens.
*   **Kitchen & Floor Staff:** Accesses order tracking and kitchen display screens. Has restricted permissions (cannot access menus, billing metrics, promotions, settings, or staff registers). Primarily utilizes wall-mounted tablets or handheld devices.
*   **Restaurant Guest (Customer):** Accesses menu browsing, cart checkout, and helper alerts. Requires a mobile-first, lightweight interface with zero download/onboarding friction.

### 2.3 Operating Environment
*   **Client Devices:** Mobile browsers (Safari, Chrome, Firefox, Samsung Internet) and Desktop monitors.
*   **Software Stack:** Node.js runtime, React 19, Vite, Tailwind CSS, Socket.io-client.
*   **Network Protocols:** HTTP/HTTPS (REST API) and WebSockets (Socket.io).

### 2.4 Design and Implementation Constraints
*   **Single-Page Application (SPA):** The client must be implemented as a React SPA for fast navigation.
*   **Tailwind CSS Theme Configuration:** Custom styles and fonts (like the default "Bricolage Grotesque") must be declared within the Tailwind `@theme` configuration inside the global CSS file (`index.css`).
*   **Network Resilience:** The client must implement token-based session refresh and auto-reconnecting socket triggers to handle unstable restaurant Wi-Fi networks.
*   **Printer & Layout Compatibility:** Table QR sheets must be styled using standard CSS printing directives (`@media print`) to ensure standard rendering across physical thermal or A4 printers.

### 2.5 Assumptions and Dependencies
*   Guests have access to smartphones with functioning cameras and mobile data networks.
*   The backend server handles OTP messaging dispatches (via email gateways) and secures core database validations.

---

## 3. System Features

### 3.1 Customer Scan-to-Order Flow
#### 3.1.1 Description
Guests scan a table-attached QR code to open the public ordering page. Guests select categories, search items, configure cart quantities, apply eligible discount coupons, input their names, add chef notes, and submit orders directly.

#### 3.1.2 Functional Requirements
*   **Storefront Navigation:** 
    *   If the URL has `?table=TOKEN`, load the specific table menu (API `/api/public/tables/${tableToken}/menu`).
    *   If the URL has `?slug=SLUG`, load the storefront menu for browsing only (API `/api/public/restaurants/${slug}/menu`).
*   **Dish Search & Filtering:** Quick filtering of items by category selection tabs, text search inputs, and food type indicators (veg/non-veg).
*   **Combo Display:** Items marked as combos must display sub-item lists (ComboComponents) in the UI.
*   **Interactive Cart Modal:** Allows guests to view selected quantities, change item counts, and view price calculations.
*   **Coupon Validation:** Allows inputting discount codes and dynamically queries eligibility against active cart parameters (API `/api/public/promotions/validate`). Eligible discounts are displayed inline and deducted from the subtotal.
*   **Checkout Verification:** REST submission of orders (API `/api/public/orders`) requiring customer name, table reference, special instructions, and coupon codes. Guests must be restricted from placing orders without a scanned table session.
*   **Order Tracker Timeline:** A visual status monitor polling status changes (API `/api/public/orders/${orderId}`) with indicators for:
    *   `PENDING` (Order Received)
    *   `PREPARING` (In the Kitchen)
    *   `READY` (Dishes Ready)
    *   `SERVED` (Delivered to Table)
    *   `CANCELLED` (Order Cancelled)
*   **Persistent Status Banner:** A floating notification banner at the top of the menu screen allowing users to return to active trackers easily.

---

### 3.2 Kitchen Display System (KDS)
#### 3.2.1 Description
A live digital dashboard for chefs showing pending and active orders, elapsed timers, special preparation notes, and status transition controllers.

#### 3.2.2 Functional Requirements
*   **Live Stream Pipeline:** Immediate render of new table tickets utilizing Socket.io `new_order` event notifications.
*   **Preparation Timeline Display:** Shows elapsed minutes since ticket creation to help prioritize aging orders.
*   **Status Progression Actions:** Interactive triggers to step-transition order statuses:
    *   `PENDING` $\rightarrow$ `PREPARING` (Chef starts cooking)
    *   `PREPARING` $\rightarrow$ `READY` (Food is ready for delivery)
    *   `READY` $\rightarrow$ `SERVED` (Staff serves the dishes)
    *   `PENDING` / `PREPARING` $\rightarrow$ `CANCELLED` (Kitchen rejects the order)
*   **Real-time Synchronization:** Status modifications must broadcast to the guest's tracker and other portals via Socket.io.

---

### 3.3 Menu Management Workspace
#### 3.3.1 Description
An administrative workspace for owners to manage categorizations, menu dishes, prices, images, combo sets, and item stock availability.

#### 3.3.2 Functional Requirements
*   **Category Controls (CRUD):** 
    *   Create, edit, and delete category lists.
    *   Attributes: English name, Hindi name, sort order.
    *   Validation: Deleting a category is restricted if it contains active menu items.
*   **Dish Management (CRUD):**
    *   Create, edit, and delete individual menu items.
    *   Attributes: Name (English & Hindi), description (English & Hindi), price, image URL, veg/non-veg status, combo status, category association, and sort order.
*   **Combo Constructor:** When creating an item marked as `is_combo`, the owner can associate sub-dishes and assign quantities.
*   **Stock Availability Toggle:** An inline switch to toggle availability status (`is_available`). Items toggled "out-of-stock" are marked disabled in guest menus.

---

### 3.4 Table and QR Code Ecosystem
#### 3.4.1 Description
Provides restaurant owners the tools to construct table numbers, activate/deactivate tables, generate secure QR tokens, and format printing layouts.

#### 3.4.2 Functional Requirements
*   **Table Generation Options:**
    *   Single generation (creates one table number).
    *   Bulk generation (input a count $N$ to generate tables in sequential order).
*   **Secure QR Rotation:** Rotate table tokens to resolve unauthorized off-site scanning. Old QR printouts must immediately become invalid upon token rotation.
*   **Layout Printing Modes:**
    *   **Single Print Layout:** Opens a formatted printable window with the restaurant logo, table name/number, and a high-resolution QR code (generated via `qrcode.react`).
    *   **Bulk Sheet Print Layout:** Generates a structured multi-card grid sheet displaying QR codes for all active tables in a print-optimized window.
*   **Deactivation Override:** Tables cannot be deleted if they contain active or historical orders (to protect sales metrics). They can instead be toggled to an inactive state to restrict menu access.

---

### 3.5 Waiter Call & Summon Alerts
#### 3.5.1 Description
Enables dine-in guests to summon waitstaff directly to their tables. Summons trigger alerts on all dashboard views in real time.

#### 3.5.2 Functional Requirements
*   **Guest Summon Trigger:** Guests click a button to summon a waiter (API `/api/public/orders/${id}/call-waiter`). This endpoint is protected and requires a table session.
*   **Dashboard Alert System:** Staff portal receives immediate socket notices (`waiter_call`) and displays a blinking notification. The "Orders" tab shows a count badge with unresolved requests.
*   **Waitstaff Resolution:** Floor staff can dismiss and resolve active table requests. Dismissing a request updates all panels (Socket event `waiter_call_resolved`).

---

### 3.6 Promotions & Coupon Engine
#### 3.6.1 Description
A flexible rules engine allowing restaurant owners to configure promotional discount campaigns and track customer eligibility.

#### 3.6.2 Functional Requirements
*   **Campaign Configuration (CRUD):**
    *   **General details:** Title (Coupon Code, converted to uppercase), description, promo type (`COUPON` vs. `AUTO_APPLIED`), status (Active/Inactive).
    *   **Validity constraints:** Start/End dates, daily start/end active times.
    *   **Eligibility constraints:** Minimum subtotal amount, minimum total item count, required specific menu item.
    *   **Reward rule:** 
        *   `DISCOUNT_PERCENT` (percentage discount)
        *   `DISCOUNT_FLAT` (flat amount in INR)
        *   `FREE_ITEM` (gives a designated menu item for free)
*   **Public Eligibility Checking:** Guest menus automatically query coupons on checkout. If cart additions invalidate a previously applied coupon, the coupon is removed and a notification is displayed.
*   **Admin Promotion Tester:** An administrative form simulating public coupon validations by inputting test codes, table IDs, and mock items JSON arrays.

---

### 3.7 Staff & Directory Management
#### 3.7.1 Description
An owner-only portal to register, modify, and delete credentials for kitchen and floor waitstaff.

#### 3.7.2 Functional Requirements
*   **Staff Credentials Setup:** Owners assign a name, email address, and password.
*   **Staff Role Restrictions:** 
    *   Staff users can log in, view orders, manage kitchen screens, and resolve waiter calls.
    *   Staff users are blocked from viewing or editing menu structures, table management, promotions, settings, and staff lists.
*   **Staff Registry (CRUD):** Create, update name/email/password, and delete staff accounts. Deleting a staff account immediately revokes access.

---

### 3.8 Restaurant Settings and Profile Workspace
#### 3.8.1 Description
Allows owners and staff to configure operational configurations, profile credentials, and address settings.

#### 3.8.2 Functional Requirements
*   **Owner Profile Management:** Edit full name, registered email, and change login password.
*   **Restaurant Operations Settings:**
    *   Edit restaurant name and customer support contact phone.
    *   Edit GST number (printed on thermal bills).
    *   Configure restaurant logo URL (renders a preview thumbnail).
*   **Restaurant Address Details:** Street address, landmark, area locality, city, state, and pincode (verified as a 6-digit numeric string).
*   **Public Slug Configuration:** Automatic slug generation from the restaurant's name to provide clean public URL links (`dinedash.com/menu/slug`).

---

## 4. External Interface Requirements

### 4.1 User Interfaces
*   **Aesthetic Guidelines:** Clean, modern user interface utilizing a curated color palette (light gray background `#f5f3f4`, charcoal black text `#161a1d`, primary crimson red `#ba181b`, dark red hover `#a4161a`, and secondary accents).
*   **Typography:** The application uses "Bricolage Grotesque" as its default typeface, loaded via Google Fonts.
*   **Responsive Layouts:**
    *   Guest pages must be designed mobile-first, optimized for quick interaction on mobile browsers.
    *   Admin dashboard uses a responsive sidebar layout that transitions smoothly to fit smaller screen resolutions.
*   **Visual Enhancements:** Micro-animations for loading loops, slide-up cart drawers, status timelines, and printing receipt animations.

### 4.2 Software Interfaces
*   **REST API Gateway:** Interfaces with the backend REST server using JSON payloads. All outgoing requests attach the authentication token within HTTP header properties (`Authorization: Bearer <Token>`).
*   **Real-time WebSockets:** Connects to the Socket.io WebSocket server (`transports: ['websocket']`). Connect queries attach the user's ID to authenticate the connection.

### 4.3 Database / Session Storage
*   **Access Token Management:** The `accessToken` is stored in an in-memory window variable (`window.__accessToken`) to protect against Cross-Site Scripting (XSS) attacks.
*   **Refresh Token Storage:** The `refreshToken` and basic user profile information are saved in the browser’s `localStorage`.
*   **Auth State Restoration:** On boot, if a `refreshToken` exists in `localStorage`, the application calls the endpoint `POST /api/auth/refresh` to fetch a new `accessToken` and restore the user session.
*   **Expiration Redirects:** If a request returns an HTTP `403 Forbidden` status (indicating token expiration), the API client queues pending requests, attempts token refresh, and retries the original request. If the refresh token is invalid or expired, the user is logged out and redirected to `/login`.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
*   **Live Updates Latency:** Order status updates and waiter summon alerts must render on dashboards within $1.0$ second of event occurrence.
*   **Asset Load Time:** Storefront menus must load and display interactive elements in under $2.0$ seconds on stable mobile connections.
*   **Memory Efficiency:** The socket listener wrapper must clean up connections when components unmount to avoid memory leaks.

### 5.2 Security Requirements
*   **Authentication & Access Control:** Role-Based Access Control (RBAC) enforced on the client side. Routes are protected via `<ProtectedRoute>` and `<PublicRoute>` guards.
*   **Token Refresh Queue:** Parallel API requests triggered during a token refresh must be queued and retried sequentially after a new token is obtained, preventing session desynchronization.
*   **Table Verification:** Guests are prohibited from completing checkouts without a valid scanned table token.
*   **Password Complexity:** Password updates (for owners and staff) must enforce a minimum length of 6 characters.

### 5.3 Reliability & Availability
*   **Socket Reconnection Policy:** The Socket.io client must attempt up to 5 reconnection cycles before notifying the user of connection issues.
*   **Graceful Degradation:** If WebSocket connectivity is lost, the admin panel must allow manual refreshes to fetch active tickets via HTTP REST requests.

### 5.4 Usability & Accessibility
*   **Zero-Onboarding Friction:** Guests must not be forced to sign up, create accounts, or download an application to order food.
*   **Dynamic Visual Cues:** Use distinct color badges for different order states, promotional campaigns, and table alerts.
*   **Bilingual Accessibility:** Renders menu items in English and Hindi to accommodate a wider customer base.
