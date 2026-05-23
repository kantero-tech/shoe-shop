This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Overview

Shoe Shop Manager is a lightweight PWA for tracking shoe inventory, sales, and debts.

## Setup

1. Clone the repo

```bash
git clone <repo-url>
cd shoe-shop-manager
npm install
```

2. Create a local env file

```bash
cp .env.example .env.local
# then edit .env.local and set NEXT_PUBLIC_INSTANTDB_APP_ID
```

3. Run development server

```bash
npm run dev
```

## InstantDB

This project expects an InstantDB App ID in `NEXT_PUBLIC_INSTANTDB_APP_ID`. Get an App ID at https://instantdb.com and add it to your `.env.local`.

## Deploy to Vercel

1. Push your repository to GitHub.
2. In Vercel, create a new project and import your repo.
3. Add an environment variable `NEXT_PUBLIC_INSTANTDB_APP_ID` in the Vercel project settings.
4. Deploy — Vercel will run `next build` automatically.

## Notes

- Placeholder app icons are in `/public` as `icon-192.png` and `icon-512.png`. Replace them with real PNGs later.
- The app includes a `manifest.json` to enable PWA install flow on supported platforms.
