# GeoRoute V1 — Agent Execution Plan (Frontend-Only)

> This file is the single source of truth for an AI coding agent building GeoRoute.
> Read the whole file before writing any code. Follow the phases **in order**. Do not
> skip ahead, do not build features from a later phase early, and do not invent
> TomTom endpoints or capabilities that are not documented.

---

## 0. Non-Negotiable Rules

1. **No backend.** No ASP.NET Core, no SQL Server, no Express server, no Docker,
   no authentication, no cloud database. Everything runs in the browser.
2. **Persistence = `localStorage` only.** Saved places, favorites, recent
   searches/routes, and preferences all live in the browser.
3. **The TomTom API key never appears in source code.** It is read only from
   `import.meta.env.VITE_TOMTOM_API_KEY`. It lives in a local `.env` file that is
   git-ignored. A `.env.example` with a placeholder value is committed instead.
4. **Never commit `.env`.** Confirm `.gitignore` excludes `.env`, `.env.local`,
   `.env.*.local`, `node_modules/`, and `dist/` before the first commit.
5. **Stop and ask the user** if: a TomTom feature described below turns out not to
   exist or behave as expected in the current SDK/API version, a phase can't be
   completed without a decision the user hasn't made yet, or something in this
   plan conflicts with something else in it.
6. **One phase at a time.** After finishing a phase, summarize what was built,
   confirm the "Goal" for that phase is actually met, and only then move on.
7. **Replace every placeholder/error stub with real UI.** No empty
   `function() {}` handlers for loading or error states.

---

## 1. Tech Stack

- React + TypeScript + Vite
- TomTom Maps SDK for Web (map, search/geocoding, routing, traffic flow, traffic
  incidents)
- Plain CSS (no CSS framework required)
- `localStorage` for all persistence
- Deployment target: a static host (GitHub Pages, Netlify, or Vercel — agent may
  ask the user which one before Phase 10)

## 2. Project Structure

```text
georoute/
├── public/
├── src/
│   ├── components/
│   │   ├── Map/
│   │   ├── RoutePanel/
│   │   ├── SearchBox/
│   │   ├── RouteInfo/
│   │   ├── TrafficControls/
│   │   ├── SavedPlaces/
│   │   └── Header/
│   ├── services/
│   │   ├── tomtom/
│   │   ├── routing/
│   │   └── geolocation/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── i18n/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 3. API Key Handling

```env
# .env.example (this file IS committed)
VITE_TOMTOM_API_KEY=YOUR_TOMTOM_API_KEY
```

```env
# .env (this file is NOT committed — real key goes here)
VITE_TOMTOM_API_KEY=<the user will paste their real key here locally>
```

```typescript
const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
```

Before deployment (Phase 10), remind the user to set the same domain/origin
restriction on their TomTom key that TomTom's dashboard supports, so the
production key only works from the deployed domain.

---

## 4. Execution Checklist — Work Through in Order

### Phase 1 — Setup
- [x] `npm create vite@latest georoute -- --template react-ts`
- [x] Initialize a git repository (or connect to the existing one — confirm
      with the user which repo to use before the first commit).
- [x] Create `.gitignore` (see section 3 rules above).
- [x] Create `.env` (local, real key) and `.env.example` (committed, placeholder).
- [x] Create the folder structure from section 2.
- [x] **Goal:** `npm run dev` shows a blank React app with the title "GeoRoute" —
      nothing else yet.

### Phase 2 — Map
- [x] Install and initialize the TomTom Maps SDK for Web.
- [x] Render an interactive vector map with a sensible default center (e.g.
      Cairo) and zoom level.
- [x] Add zoom, pan, navigation, and fullscreen controls.
- [x] Confirm the map resizes correctly when the browser window resizes.
- [x] **Goal:** a working interactive map, nothing else.

### Phase 3 — Search & Location
- [x] Add a "Start" search box and a "Destination" search box using TomTom
      Search/Geocoding.
- [x] Selecting a search result drops a marker on the map at that location.
- [x] Add a "Use my location" button that requests browser geolocation,
      reverse-geocodes the result, and sets it as the start point.
- [x] Implement real loading and error states for search and geolocation
      (e.g. "No results found", "Location permission denied") — no empty stubs.
- [x] **Goal:** the user can pick a start point and a destination on the map.

### Phase 4 — Routing
- [x] Calculate a route between Start and Destination using TomTom Routing.
- [x] Draw the route geometry on the map and fit the map bounds to it.
- [x] Display distance and ETA in a Route Info panel.
- [x] Handle the "no route found" and "request failed" cases with visible
      error messages.
- [x] **Goal:** complete A → B routing with distance and ETA shown.

### Phase 5 — Traffic
- [x] Add a Traffic ON/OFF toggle.
- [x] Show TomTom traffic flow on the map when enabled.
- [x] Show TomTom traffic incidents on the map, inspectable by the user.
- [x] Make route calculation traffic-aware when the toggle is on, and show any
      traffic delay TomTom returns.
- [x] **Goal:** routing plus live traffic visualization.

### Phase 6 — Navigation
- [x] Parse and display turn-by-turn instructions from the routing response.
- [x] Support alternative routes (`maxAlternatives`) with a way to select one;
      the selected route is visually distinct from the others.
- [x] Support multiple waypoints (add/remove stops between Start and
      Destination), with validation for missing/duplicate points and any
      TomTom-imposed limits.
- [x] **Goal:** a full navigation-style workflow, not just a single line on a map.

### Phase 7 — Local Features (`localStorage`)
- [x] Saved places: save, rename, delete, and quick-select (Home/Work/Favorites).
- [x] Recent searches and recent routes, stored locally.
- [x] User preferences (e.g. last-used language, units) persisted locally.
- [x] **Goal:** the app remembers useful things between visits, with no backend.

### Phase 8 — GIS Features
- [x] Export the current route as GeoJSON.
- [x] Export the current route as GPX where the route geometry supports it.
- [x] Route sharing via a URL that encodes start/destination/waypoints
      (e.g. `?start=...&destination=...`), restorable on load.
- [x] **Goal:** the app produces and consumes standard GIS route data, not
      just visuals.

### Phase 9 — UI / UX Polish
- [x] Responsive layout: desktop, tablet, and mobile (mobile-first for the
      search/route panel — bottom sheet on small screens with drag handle; map
      touch & panning fully preserved).
- [x] English and Arabic UI via an `i18n` strings setup (no hardcoded text in
      components), with RTL layout when Arabic is active.
- [x] Dark/light theme toggle with persistent storage and light frosted glass styling.
- [x] Accessibility pass: labeled controls, keyboard navigation `:focus-visible` rings,
      sufficient contrast.
- [x] **Goal:** the app looks and behaves like a finished product, in both
      languages and on both desktop and mobile.

### Phase 10 — Testing & Deployment
- [x] Manual test pass: search, routing, traffic, current location, waypoints,
      saved places, mobile layout, Arabic RTL, Light/Dark themes, and every error state.
- [x] Write the final `README.md`: features, stack, install/run/build commands,
      API key setup, project architecture, deployment steps.
- [x] Confirm deployment platform: GitHub Pages selected by user.
- [x] Configured Vite with `base: './'` for seamless relative asset hosting on GitHub Pages.
- [x] Created automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).
- [ ] Push repository to GitHub and enable GitHub Pages in repository settings.
- [ ] Set the TomTom key's domain restriction to your GitHub Pages domain (`<username>.github.io`).
- [ ] **Goal:** a live, working, documented GeoRoute the user can link to from
      their portfolio.

---

## 5. Definition of Done

- [ ] React + TypeScript + Vite app running
- [ ] TomTom map displayed, key loaded from `.env`, `.env` git-ignored
- [ ] TomTom key domain restriction configured for production
- [ ] Search, current location, and Start/Destination selection all work
- [ ] Routing works: route line, distance, ETA
- [ ] Traffic flow and traffic incidents both work
- [ ] Alternative routes and waypoints both work
- [ ] Turn-by-turn instructions work
- [ ] Saved places and recent searches/routes work (localStorage)
- [ ] GeoJSON/GPX export and route-sharing URL work
- [ ] Arabic/English + RTL work
- [ ] Responsive on desktop and mobile
- [ ] Every loading/error state has real UI, not a stub
- [ ] README complete with screenshots
- [ ] Repository is clean and deployed live
