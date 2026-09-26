# YakWetu

African movie storefront built with React and Vite, and the frontend for an AI conversion engine. Customer actions are recorded as events that a Django API can later forward to n8n.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
```

## Demo path

Home → Movies → a movie → Checkout → Payment → Watch → recommendations.

`/demo` plays the abandonment journey and lists local events. Payment success and failure are simulated on the payment page. Nothing here charges M-Pesa or a card, and nothing emails a customer.

Movie titles in this prototype are fictional.

## Backend later

Set `NEXT_PUBLIC_API_URL` (see `.env.example`) and `NEXT_PUBLIC_USE_API=true` when Django is ready.

- `POST /api/events` is the only event door. The browser does not call n8n.
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Movies: `GET /api/movies`, `GET /api/movies/:id`
- Concierge: `POST /api/concierge`
