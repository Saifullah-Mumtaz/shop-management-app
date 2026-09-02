# Shop Management App (MERN)

A mobile-first ledger replacement for a family shop: customer loans/advances,
cold-drink point-of-sale, and nightly reporting.

## Folder structure

```
shop-management-app/
├── server/                        # Express + Mongoose API
│   ├── config/
│   │   └── db.js                  # Mongo connection
│   ├── models/
│   │   ├── Customer.js            # Customer accounts (loan/advance holders)
│   │   ├── Transaction.js         # Every loan/advance/sale movement
│   │   └── Product.js             # Cold-drink catalog + running daily count
│   ├── middleware/
│   │   ├── asyncHandler.js        # Wraps async routes, forwards errors
│   │   └── errorHandler.js        # Centralized error responses
│   ├── controllers/
│   │   ├── customerController.js
│   │   ├── transactionController.js
│   │   ├── productController.js
│   │   └── reportController.js    # Dashboard + end-of-day report
│   ├── routes/
│   │   ├── customerRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── productRoutes.js
│   │   └── reportRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # App entry point
│
└── client/                        # React + Tailwind (Vite) frontend
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── api/
        │   └── axios.js           # Preconfigured axios instance
        ├── context/
        │   └── AppContext.jsx     # Global state: customers, products, dashboard
        ├── components/
        │   └── SummaryCard.jsx    # Reusable dashboard stat card
        └── pages/
            ├── Dashboard.jsx      # 4 summary cards
            └── ColdDrinks.jsx     # Grid + quick-add sales counter
```

## Why this shape

- **`Transaction` is the single source of truth.** Loans, advances (ADD), and
  cold-drink sales are all "money movements" tied to a `type` field. This lets
  the nightly report run one aggregation instead of stitching together three
  different collections.
- **`Product.dailyCount` is denormalized on purpose.** The Cold Drinks grid
  needs to increment a counter on every tap with near-zero latency. Reading
  it straight off the `Product` doc avoids an aggregation query on every
  page load. The nightly report re-derives the "official" total from
  `Transaction` records and can flag any drift — see `reportController.js`.
- **Context API, not Redux.** The app only has 3 real "nouns" (customers,
  products, dashboard totals) and no complex cross-cutting state, so Context
  + `useReducer` keeps re-renders predictable without extra dependencies.

## Quick start

```bash
# Server
cd server
cp .env.example .env   # fill in MONGO_URI
npm install
npm run dev

# Client (new terminal)
cd client
npm install
npm run dev
```
