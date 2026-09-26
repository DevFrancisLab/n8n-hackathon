# YakWetu

African movie storefront built with React and Vite, and the frontend for an AI conversion engine. Customer actions are recorded as events that a Django API can later forward to n8n.

## Run

The React app stays at the repository root.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `VITE_USE_API=false` (the default) the app uses the in-browser demo and does not need Django.

```bash
npm run build
```

## Django API

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

The API listens on [http://localhost:8000](http://localhost:8000). PostgreSQL is required. Set `DATABASE_URL` or `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and `POSTGRES_PORT` in `backend/.env`. There is no SQLite fallback.

Set `VITE_USE_API=true` in the frontend env to send auth, movies, checkout, payments, watch completion, concierge, and events to Django. Leave `N8N_WEBHOOK_URL` empty until n8n is ready. Events are still stored.

```bash
python manage.py test
```

## Demo path

Home → Movies → a movie → Checkout → Payment → Watch → recommendations.

`/demo` plays the abandonment journey and lists local events. Payment success and failure are simulated on the payment page. Nothing here charges M-Pesa or a card, and nothing emails a customer.

Movie titles in this prototype are fictional.

## Backend later

Copy `.env.example` and set `VITE_USE_API=true` when Django is running. `NEXT_PUBLIC_USE_API` is still honored if the Vite variable is unset.

- `POST /api/events` is the only event door. The browser does not call n8n.
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Movies: `GET /api/movies`, `GET /api/movies/:id`
- Checkout: `POST /api/checkouts`, `PATCH /api/checkouts/:id`, `POST /api/checkouts/:id/abandon`, `POST /api/checkouts/:id/pay`
- Concierge: `POST /api/concierge`
