# CATALYST
Scroll-scrubbed dragon landing site. Vite + React + TypeScript + Tailwind v4.
`npm install` · `npm run dev` · `npm run build` (output in `dist/`)

## Edit events
All content is in `src/data/events.json` (id, realm, name, tagline, category, date, time, venue, description, rules[], prizes, registerUrl, themeColor, image). `realm` is `ember`, `frost` or `grove` (two events each). Dates are `YYYY-MM-DD`; the countdown targets the next future one.

## Replace the video
Drop the new file at `public/media/dragon-original.mp4`, run `npm run media`, then update the `data-t` / `data-e` seconds on each `<section>` in `src/App.tsx` (the scroll map) and the realm thresholds in `useScrub`'s callback.

## Colors
`src/index.css` (`@theme` tokens) and `REALMS` in `src/App.tsx` for the per-realm grades.

## Deploy
Vercel/Netlify: build command `npm run build`, output `dist`.

## Assumptions / you need to supply
Logo, real event info, about copy, tagline, sponsor and speaker details, registration links, map link, socials. All placeholders are in [BRACKETS].
