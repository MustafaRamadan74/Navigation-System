# 🛰️ GeoRoute — Next-Generation GIS Navigation & Trip Routing Platform
### منصة الملاحة الذكية وحساب المسارات الجغرافية المتقدمة

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TomTom Maps SDK](https://img.shields.io/badge/TomTom-Maps_SDK_v6-DF1B12?logo=tomtom&logoColor=white)](https://developer.tomtom.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

GeoRoute is an enterprise-grade, client-side GIS Web Navigation application built with **React**, **TypeScript**, and the **TomTom Maps & Routing SDK**. Designed with a modern dark-and-gold visual aesthetic, full bilingual support (English & Arabic with native RTL), multi-modal routing, delivery waypoint optimization, live turn-by-turn navigation with audio guidance, and an intelligent 20 km spatial buffer engine for Electric Vehicle (EV) chargers.

---

## 📸 Screenshots & Highlights

| 🗺️ Main Dark/Gold Navigation | ⚡ 20km Route EV Buffer & Stations |
|:---:|:---:|
| Full-featured sidebar, multi-modal routing (Car/Motorcycle/Walking), real-time traffic | Strict 20km corridor filtering, POI popups, and one-click add-stop |

---

## ✨ Core Features & Capabilities

### 1. 🧭 Smart Routing & Multi-Modal Engine
- **Travel Modes**: Supports dedicated routing profiles for **Car**, **Motorcycle**, and **Walking (Pedestrian)**.
- **Alternative Routes**: Computes the optimal primary route along with up to 2 alternative routes (visualized with contrasting halos and interactive midpoint duration badges).
- **Traffic-Aware Calculation**: Incorporates live TomTom traffic flow and incidents with real-time delay minutes and delay-aware ETAs.
- **Flawless Endpoint Snapping**: Intelligently anchors and connects the route geometry directly to the user's pins (Points A & B), avoiding off-road endpoint disconnects.

### 2. ⚡ EV Charging Ecosystem & Spatial 20 km Buffer Engine
- **Nationwide Coverage**: Comprehensive coverage across Egypt (Greater Cairo, El Obour, Shorouk, New Administrative Capital, 6th of October, Sheikh Zayed, Alexandria, Delta, Suez, Sinai, and Red Sea) with parallel multi-hub queries.
- **Dynamic Viewport (Map Extent) Filtering**: While exploring the map without an active route, only stations situated inside the user's current visible map extent are rendered, keeping rendering fast and clean.
- **Trip Corridor Spatial Buffer (20 km)**:
  - When calculating a trip, the spatial engine evaluates the shortest distance from every charger to the route polyline.
  - Charging stations outside the **20 km buffer** are strictly filtered out, leaving only relevant charging stops along the travel corridor.
- **Rich Station Details & Route Integration**:
  - Displays connector types (Type 2, CCS, Fast Charge, kW rating), real-time status (Available / Occupied / Out of service).
  - One-click **"Add as Stop on Route"** to seamlessly inject a charger into the active itinerary.

### 3. 📦 Delivery Mode & Waypoint Optimization (TSP Engine)
- **Multi-Stop Logistics**: Add up to 5 custom stops/waypoints along any route.
- **Waypoint Optimization**: Employs heuristic 2-opt Travelling Salesperson algorithms to re-order stops for the lowest possible travel time and distance.
- **Drag-and-Drop & Reordering**: Intuitive stop manipulation, deletion, and editing.

### 4. 🚀 Live Driving Navigation & Simulation Mode
- **Turn-by-Turn Driving HUD**: Live step banner displaying high-visibility maneuver icons, remaining distance, ETA, current vehicle speed, and next instruction preview.
- **Voice Speech Guidance (TTS)**: Integrated Web Speech API audio announcer speaking maneuvers in fluent English or Arabic.
- **Simulated Navigation**: Test and demo routes without moving; features a heading-aligned animated puck, dynamic camera tracking, and simulated GPS progress.
- **Driving Camera Tracking**: Automatic camera follow mode with pitch (tilt), smooth heading rotation, and responsive zoom.

### 5. 🗺️ Basemaps & Custom Design System
- **Signature Dark & Gold Aesthetic**:
  - Sleek dark surface palette (`#1D2128`), gold primary accent (`#FF9E20`), rich teal (`#215E61`), and clean off-white text (`#F4F2F2`).
  - Strict zero-green policy for consistent, high-contrast visual hierarchy.
- **Multiple Basemap Styles**:
  - `Standard Dark`: Default high-contrast dark road map.
  - `Standard Light`: Crisp daytime cartography.
  - `Mono Light`: Minimalist blueprint styling.
  - `Satellite`: High-resolution satellite imagery with overlaid road networks.
- **Compact Map Options Drawer**: Intuitive control panel for basemaps, traffic flow, traffic incidents, and POI category toggles.

### 6. ⭐ Saved Places & History
- **Favorite Locations**: Pre-configured quick pins for **Home** and **Work**, plus unlimited custom saved locations categorized with icons and custom names.
- **Recent Trips History**: Automatic persistent caching of completed trips with one-click re-routing.
- **Dedicated Segmented Navigation**: Full-width tab controller (`[ 🧭 Directions ]` vs `[ ⭐ Saved & History ]`) with zero clipping or horizontal scroll.

### 7. 🌐 Bilingual & Localization (i18n)
- Seamless one-click switching between **English (LTR)** and **Arabic (RTL)**.
- Context-aware text direction, mirrored iconography, and culturally adapted typography.

### 8. 📤 GIS Export & Instant Sharing
- **GIS Formats**: Export any computed route to standard **GeoJSON**, **GPX**, or **KML**.
- **URL Route Sharing**: Encodes start, destination, travel mode, and waypoints into shareable link URLs.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 with TypeScript 5.5 |
| **Build Tool & Dev Server** | Vite 5.4 |
| **Maps & Routing Engine** | TomTom Web SDK Maps & Services (`@tomtom-international/web-sdk-maps`, `@tomtom-international/web-sdk-services`) |
| **Spatial Computations** | Turf.js & Custom Haversine/Euclidean Buffer Math |
| **Styling** | Modern Vanilla CSS3 with CSS Custom Properties & Glassmorphism |
| **State & Storage** | React Hooks, Context API, LocalStorage persistence |
| **Voice Guidance** | HTML5 Web Speech Synthesis API |

---

## 📁 Repository Structure

```
georoute/
├── src/
│   ├── assets/                 # Icons, symbols, and graphic assets
│   ├── components/
│   │   ├── Header/             # Mode selector, travel mode buttons, language switcher
│   │   ├── Map/                # TomTom map instance, layers, markers, puck, popups
│   │   ├── MapOptions/         # Map Options Drawer (basemaps, POIs, traffic controls)
│   │   ├── RouteInfo/          # Route summary card, live HUD, directions list, simulation
│   │   ├── RoutePanel/         # Primary sidebar with segmented tabs and search boxes
│   │   ├── SavedPlaces/        # Saved locations and recent routes tab
│   │   ├── SearchBox/          # TomTom fuzzy autocomplete search input
│   │   └── TrafficControls/    # Floating traffic and EV station toggles
│   ├── hooks/                  # Custom hooks (useLiveTracking, useAppMode, useDebounce)
│   ├── i18n/                   # Arabic & English dictionary and context
│   ├── services/
│   │   ├── geolocation/        # Browser HTML5 GPS tracking
│   │   ├── routing/            # TomTom route calculation and waypoint optimization
│   │   ├── storage/            # LocalStorage persistence for user preferences & places
│   │   ├── tomtom/             # TomTom SDK configuration, search, and EV queries
│   │   └── voice/              # Web Speech TTS service
│   ├── types/                  # TypeScript interfaces for routes, locations, EV stations
│   ├── utils/                  # Color palettes, GIS export, distance formatting
│   ├── App.tsx                 # Root application state orchestrator
│   └── main.tsx                # React application entry point
├── .env.example                # Template for environment variables
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A free [TomTom Developer Account](https://developer.tomtom.com/) to obtain an API Key.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MustafaRamadan74/Navigation-System.git
   cd Navigation-System/georoute
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `georoute/` folder based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your TomTom API key:
   ```env
   VITE_TOMTOM_API_KEY=YOUR_TOMTOM_API_KEY_HERE
   ```

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173/`.

5. **Build for Production:**
   ```bash
   npm run build
   ```
   The compiled bundle will be output to `georoute/dist/`.

---

## ⚙️ Architecture & Design Philosophy

1. **Zero-Backend Architecture**: All routing, geocoding, waypoint optimization, EV spatial queries, and audio guidance run entirely in the browser using TomTom REST/SDK APIs and client-side web APIs.
2. **Resilient Network Handling**:
   - Parallel multi-hub retrieval prevents single-query bottlenecks when loading EV charging infrastructure across Egypt.
   - LocalStorage caching avoids redundant network roundtrips.
3. **Spatial Math Accuracy**:
   - Route polyline endpoints are strictly connected to user search pins.
   - Buffer calculation uses segment-level Haversine distance to ensure stations right on curves and highway ramps are accurately captured within the 20 km corridor.

---

## 👤 Author
- **Mustafa Ramadan** — [GitHub Profile](https://github.com/MustafaRamadan74)
- **Repository**: [Navigation-System](https://github.com/MustafaRamadan74/Navigation-System.git)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
