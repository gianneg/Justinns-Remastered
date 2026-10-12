# Justinns (Remastered)

A booking platform for inns, hotels and pensions, rebuilt with Next.js and TypeScript from an earlier PHP version.

## Features

- Sign up, log in, forgot and reset password
- Browse lodgings and view lodging details
- Booking flow: pick a room, confirm, and see a confirmation
- Favorites, reviews (read and write), and discounts
- User profile and a user dashboard
- Admin dashboard to manage lodgings, rooms and bookings

## Tech

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres and Auth)

## Project structure

```
justinns/
  app/          # Pages and API routes (signup, reviews)
  components/   # Navbar, Header, Footer, Calendar, FavoritesButton
  lib/          # Supabase client and data helpers (booking, lodging, queries)
```

## Run it locally

```bash
cd justinns
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key. Turn on row-level security. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Used by an API route. Never expose it to the browser. |

## Deploy

Deployed on Vercel with the root directory set to `justinns`.

**Live:** https://justinns-remastered.vercel.app
