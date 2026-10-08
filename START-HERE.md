# AKŌI Form Studio — source download

This archive contains the website source, original lockfile, model generators,
STL exporters, saved-design API, database migration, and verification scripts.
It is a source snapshot, not a backup of saved user designs or hosting secrets.

## Run on your computer

1. Install Node.js 22.13 or newer and pnpm 11.25.0.
2. Open a terminal inside this folder.
3. Install dependencies: `pnpm install --frozen-lockfile`.
4. Start development: `pnpm dev`.
5. Open the local URL printed in the terminal (normally http://localhost:5173).

The shape editor and local STL downloads run in the browser. Cloud saved designs
require a D1 database and authenticated identity. Your existing hosted saved
designs are not included in this archive. Download editable .akoi.json projects
from the website separately to keep copies of your designs.

## Optional local saved-design database

Build once with `pnpm build`, then initialize an empty local database:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_wakeful_marauders.sql
```

Run this migration only once per empty local database. For the development
preview, open /signin-with-chatgpt?return_to=/ on the local server to activate its
local test identity. Production sign-in is provided by the hosting platform.

## Main folders

- app/: shade, base, lid and assembly screens and API routes
- lib/: parametric geometry, export, validation and saved-design logic
- components/: interface and interactive preview
- scripts/verify-*.mjs: geometry and feature checks
- drizzle/: saved-design database migration
- docs/: design research notes

For a different hosting provider, adapt the Cloudflare D1 binding and production
identity handling. This archive does not automatically move the private site or
its saved-design database, and does not publish anything.

Source commit: 6c6c038d5e495c8fe802b8dfc118b55091c8fb9b
