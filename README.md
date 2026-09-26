# YakWetu

African movie storefront for a conversion demo. The React app records customer actions as events. Django stores them and can forward each saved event to n8n. The browser never calls n8n.

Movie titles in this prototype are fictional. Payment success and failure are simulated. Nothing charges M-Pesa or a card.

## Frontend

The React app is in `frontend/`. Vite serves it on [http://localhost:3000](http://localhost:3000).

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

Copy `frontend/.env.example` to `frontend/.env.local`. `VITE_USE_API=false` is the default. In that mode the app uses the in-browser catalog, auth, and checkout, so a demo still runs if Django is down.

`npm run lint` is the TypeScript check. `npm run build` runs that check and then builds the app.

## Django API

PostgreSQL is required. There is no SQLite fallback. Create a database and user, then point `backend/.env` at them with `DATABASE_URL` or `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and `POSTGRES_PORT`.

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

The API listens on [http://localhost:8000](http://localhost:8000). `python manage.py test` runs the Django suite.

Leave `N8N_WEBHOOK_URL` empty until n8n is ready. Django still saves the event. If the webhook is set and n8n is down, the event remains saved and the failure is logged.

## API mode

Set this in `frontend/.env.local` and restart Vite:

```text
VITE_API_URL=http://localhost:8000/api
VITE_USE_API=true
```

`VITE_*` is what Vite reads. `NEXT_PUBLIC_*` is used only when the matching `VITE_*` value is unset.

With API mode on, auth, movies, events, checkout, payment, purchases, watch completion, and concierge go to Django. Signup and login store Django’s token. A reload calls `GET /api/auth/me`. Logout clears that token even if the logout request fails.

`/account` requires a signed-in user. In API mode, checkout, payment, and watch do too. A logged-out visitor is sent to login and returned to the page they asked for. Movie browsing stays public. In mock mode, checkout still works without an account.

Checkout prices come from the Django movie record. The client cannot set the amount.

## Demo path

Home → Movies → a movie → Checkout → Payment → Watch → recommendations.

`/demo` plays the abandonment journey and lists local events. The payment page has **Simulate Successful Payment**, **Simulate Payment Failure**, and the checkout page has **Simulate Checkout Abandonment**.

Routes: `/`, `/movies`, `/movies/:id`, `/checkout/:id`, `/payment/:id`, `/watch/:id`, `/login`, `/signup`, `/account`, `/concierge`, `/demo`.

## API

- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Movies: `GET /api/movies`, `GET /api/movies/:id`, `POST /api/watch`
- Events: `POST /api/events`
- Checkout: `POST /api/checkouts`, `PATCH /api/checkouts/:id`, `POST /api/checkouts/:id/abandon`, `POST /api/checkouts/:id/pay`
- Purchases: `GET /api/purchases`
- Activity: `GET /api/customers/me/activity`, `GET /api/customers/:id/activity`
- Concierge: `POST /api/concierge`

`POST /api/events` is the only event door. A customer can read their own activity. Another customer’s activity returns 403.
