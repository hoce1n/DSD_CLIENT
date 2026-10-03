# DSD_CLIENT

A Persian-first **React and Vite operations dashboard** for the [`DSD_SERVER`](https://github.com/hoce1n/DSD_SERVER) order-management API. The client gives administrators, supervisors, sales representatives, and customers role-aware workflows for products, orders, customers, delivery, finance, notifications, and reporting.

## What this project demonstrates

- Building a responsive business dashboard with React 19 and Vite
- Managing feature state with Redux Toolkit and React Redux
- Connecting multiple business domains to a typed service-style API layer with Axios
- Implementing role-aware navigation and protected routes
- Supporting Persian RTL UX, Jalali date formatting, printable invoices, and localized status text
- Delivering offline-aware/PWA behavior with service-worker support
- Building operational tools such as global search, notifications, delivery updates, signatures, and online-status indicators

## Main modules

- **Dashboard:** order summaries, recent activity, and operational charts
- **Products:** catalog browsing, search, categories, stock, pricing, and management
- **Orders:** paginated order lists, quick orders, status transitions, cancellation, and history
- **Customers:** customer profiles, assigned accounts, and financial balances
- **Delivery:** sales-representative delivery workflows, quantity updates, invoices, printing, and customer confirmation
- **Finance:** customer ledger, payments, balances, and invoice-related flows
- **Sales reps:** assigned orders/customers, delivery actions, and performance views
- **Users:** role-aware user administration
- **Search:** debounced global search with history across customers, orders, and products
- **Notifications:** order, product, customer, and system notification views
- **PWA:** install prompt, service worker, cached assets, and offline indicator

## Technology stack

- React 19
- Vite 6
- Redux Toolkit and React Redux
- React Router
- Axios
- Tailwind CSS 4
- React Hook Form
- `moment-jalaali` for Persian calendar formatting
- `react-to-print` for delivery invoices
- `vite-plugin-pwa`
- Lucide React and React Icons

## Project structure

```text
src/
├── components/   Dashboard UI, forms, invoices, search, delivery, and notifications
├── hooks/        PWA and reusable client hooks
├── services/     API service modules by business domain
├── store/        Redux store and feature slices
├── styles/       Application and print styles
└── App.jsx       Route and application composition
```

## Getting started

### Prerequisites

- Node.js 20+
- A running [`DSD_SERVER`](https://github.com/hoce1n/DSD_SERVER) API

### Install and run

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

The Vite development proxy currently forwards `/api` requests to the configured backend origin in `vite.config.js`. Update that origin for your local or deployed API before using the client.

## Authentication and API

The application stores the authenticated session through the Redux auth slice and sends bearer tokens through the shared Axios client. API services are separated by domain, including auth, orders, products, delivery, sales reps, customers, notifications, search, and financial operations.

## Related backend

- API: [`hoce1n/DSD_SERVER`](https://github.com/hoce1n/DSD_SERVER)

## License

No license has been specified yet. Add a license before distributing the application publicly.
