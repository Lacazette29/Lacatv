# LACA TV — Football Highlights Platform

## Quick Start

```bash
npm install
npm start
```

## Project Structure

```
src/
├── styles/globals.css       ← Design system (CSS vars, components)
├── context/AppContext.jsx   ← Global state (videos, auth, settings)
├── utils/
│   ├── data.js             ← Mock data, constants, ADMIN_PASSWORD
│   └── helpers.js          ← fmtViews, timeAgo, etc.
├── components/             ← Reusable UI (Header, Sidebar, VideoCard…)
├── pages/                  ← Public pages (Home, VideoPlayer)
└── admin/                  ← Admin panel (Login, Panel with 4 tabs)
```

## Admin Access

- **URL**: `admin.yourdomain.com` OR `yourdomain.com/admin`
- **Password**: `lacatv2026` (change in `src/utils/data.js` → `ADMIN_PASSWORD`)
- The public site has **no admin button** — access is subdomain-only

## Admin Features

| Tab       | Features                                      |
|-----------|-----------------------------------------------|
| Upload    | Title, league, URL, description, tags, colour |
| Videos    | List, search, delete, toggle featured/new     |
| Analytics | Views by league, recent uploads, top video   |
| Settings  | Site name, ticker toggle, maintenance mode    |

## Deploying to Vercel (Admin Subdomain)

1. Deploy normally to Vercel
2. Add domain: `admin.yourdomain.com`
3. The app auto-detects `admin.` hostname and shows admin panel

## Switching to Supabase

Replace mock data in `src/utils/data.js` with Supabase queries.
See `.env.example` for required environment variables.
