# Uthabiti Platform

This repository is a unified platform for multiple Uthabiti services that share a single identity and authentication system.

Instead of each app maintaining its own separate user database and login flow, the platform uses one central backend service at the root of the project. All frontend apps authenticate through that backend, which validates users against PostgreSQL and issues a JWT token.

## What this project contains

The main structure is:

- `x.js` – legacy central API server
- `db.js` – PostgreSQL connection pool
- `start-unified.sh` – script that launches all apps together
- `public/dashboard.html` – shared dashboard page with links to the running services
- `mamaplus/` – MamaPlus Next.js app
- `collaborative-sacco/` – SACCO app
- `nfw-uthabiti/` – NFW Uthabiti app
- `utbmain/` – UTB Main app
- `cac-uthabiti/` – CAC Uthabiti app

## Core architecture

The identity layer is centralized in the legacy API:

- User registration and login happen in `x.js`
- Database access is handled in `db.js`
- The same PostgreSQL database and JWT secret are shared across apps
- Frontend apps either:
  - call the legacy API directly from the browser, or
  - use Next.js API route proxies like `app/api/login/route.js`

This means one account can work across multiple Uthabiti services without having to recreate users separately in each application.

## Service map and ports

The unified launcher starts everything on these ports:

| Service | Port | Location |
| --- | ---: | --- |
| Legacy API | 5000 | root project |
| MamaPlus | 5001 | `mamaplus/` |
| Collaborative SACCO | 5002 | `collaborative-sacco/` |
| NFW Uthabiti | 5003 | `nfw-uthabiti/` |
| UTB Main | 5004 | `utbmain/` |
| CAC Uthabiti | 5005 | `cac-uthabiti/` |

The launcher script is:

```bash
bash start-unified.sh
```

This starts all services in the background and keeps them running together.

## Authentication flow

The central login flow works like this:

1. A user submits email and password to an app endpoint or a legacy API route.
2. The app forwards the request to the central backend at `http://127.0.0.1:5000/api/login`.
3. The backend checks the PostgreSQL `users` table.
4. If valid, it compares the password using `bcryptjs`.
5. A JWT token is issued and returned to the client.
6. The frontend stores the token and uses it for subsequent protected requests.

This is the key design principle: the shared backend is the source of truth for identity.

## Running the platform

From the root folder:

```bash
cd /data/data/com.termux/files/home/platform
bash start-unified.sh
```

Then open the apps in a browser:

- API: http://localhost:5000
- MamaPlus: http://localhost:5001
- SACCO: http://localhost:5002
- NFW: http://localhost:5003
- UTB: http://localhost:5004
- CAC: http://localhost:5005
- Shared dashboard: http://localhost:5000/dashboard.html

## Login example

The same account can log into the shared platform via the central backend. Example request:

```bash
curl -sS -X POST http://127.0.0.1:5000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"fimaya@gmail.com","password":"opalites1"}'
```

A successful response includes a JWT token and the authenticated user record.

## Main files to understand

- `x.js` – auth server, registration/login endpoints, JWT creation
- `db.js` – database pool configuration
- `start-unified.sh` – service launcher
- `public/dashboard.html` – central dashboard with links to all services

## Notes

This setup is meant to provide a single identity layer across multiple Uthabiti product sites while keeping each service independent in its own Next.js app.

The central API is the authoritative account system. The apps are consumers of that system, not separate identity sources.
