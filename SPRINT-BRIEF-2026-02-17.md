# VendRadar MVP Sprint — Feb 17, 2026 (9:30 AM)
_Sprint Goal: Ship working map interface with category search and basic scoring_

## Objective
Build the core VendRadar product: interactive map where operators can search addresses, filter by category, and see instant location intelligence.

## Success Criteria
By end of sprint (2-hour window):
- [ ] Working Next.js app deployed to Vercel
- [ ] Google Maps integration with search
- [ ] 8 category filters functional
- [ ] Location scoring algorithm implemented
- [ ] Basic demographics overlay (Census API)
- [ ] PDF export working
- [ ] Mobile-responsive design

## Technical Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Shadcn/ui components (optional, for speed)

**APIs:**
- Google Maps JavaScript API (free tier: 28k loads/mo)
- US Census Bureau API (free, no key required)
- Google Places API (for POI data)

**Deployment:**
- Vercel (free tier)
- Supabase for database (PostgreSQL, free tier)

**Auth (Phase 2):**
- Clerk or Supabase Auth (skip for MVP, focus on product)

## Core Features to Build

### 1. Map Interface
**Component: `MapView`**
- Full-screen Google Maps embed
- Search bar (address autocomplete)
- Click on map to analyze location
- Zoom controls
- Current location button

**Data displayed on click:**
- Address
- Location score (0-100, big number)
- Demographics preview (income, population, age)
- Nearby POIs (gyms, offices, schools)
- Competition markers (placeholder data for MVP)

### 2. Category Filter Panel
**Component: `CategoryPanel`**
- Sidebar or top bar with 8 category buttons
- Categories:
  1. Office Buildings
  2. Gyms & Fitness Centers
  3. Hospitals & Medical
  4. Schools & Universities
  5. Manufacturing & Warehouses
  6. Apartment Complexes
  7. Hotels
  8. Transit Hubs

**Behavior:**
- Click category → filters map markers to show only that type
- Adjusts scoring algorithm weights per category
- Shows category-specific insights

### 3. Location Scoring Algorithm
**File: `lib/scoring.ts`**

**Input data:**
- Census tract demographics (income, population, age)
- Google Places nearby POIs
- Distance to nearest competition (mock data for MVP)
- Building type match

**Scoring formula (0-100 total):**

```javascript
function calculateScore(location, category, data) {
  let score = 0;
  
  // 1. Foot Traffic (30 points)
  const poiDensity = countNearbyPOIs(location, 0.5); // within 0.5mi
  const transitScore = getTransitProximity(location);
  score += Math.min(30, poiDensity * 2 + transitScore * 3);
  
  // 2. Demographics (25 points)
  const incomeScore = normalizeIncome(data.medianIncome, category);
  const populationScore = normalizePopulation(data.populationDensity);
  score += Math.min(25, incomeScore + populationScore);
  
  // 3. Competition (25 points) - mock for MVP
  const competitionDistance = 0.8; // miles (placeholder)
  const competitionScore = Math.min(25, competitionDistance * 30);
  score += competitionScore;
  
  // 4. Building Type Fit (20 points)
  const buildingFit = calculateBuildingFit(location, category);
  score += Math.min(20, buildingFit);
  
  return Math.round(score);
}
```

**Category-specific weights:**
- Gyms: Demographics +10, Foot Traffic +5
- Offices: Building Type +10, Demographics +5
- Hospitals: Foot Traffic +10, Building Type +5

### 4. Data Integration

**Census API:**
```javascript
// Endpoint: https://api.census.gov/data/2021/acs/acs5
// No API key required
async function getCensusData(lat, lng) {
  // Convert lat/lng to census tract
  const tract = await getTractFromCoords(lat, lng);
  
  // Fetch demographics
  const response = await fetch(
    `https://api.census.gov/data/2021/acs/acs5?get=NAME,B19013_001E,B01003_001E&for=tract:${tract.tract}&in=state:${tract.state}+county:${tract.county}`
  );
  
  return {
    medianIncome: data.B19013_001E,
    population: data.B01003_001E,
    tract: data.NAME
  };
}
```

**Google Places API:**
```javascript
// Find nearby POIs of specific type
async function getNearbyPOIs(lat, lng, category) {
  const categoryMap = {
    'gyms': 'gym',
    'offices': 'office',
    'hospitals': 'hospital',
    'schools': 'school',
    // etc.
  };
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=800&type=${categoryMap[category]}&key=${GOOGLE_API_KEY}`
  );
  
  return response.results;
}
```

### 5. Results Panel
**Component: `ResultsPanel`**
- Displays when location is selected
- Shows:
  - **Score:** Big number (0-100) with color coding
    - 80-100: Green (Excellent)
    - 60-79: Yellow (Good)
    - 40-59: Orange (Fair)
    - 0-39: Red (Poor)
  - **Demographics:**
    - Median income
    - Population density
    - Age distribution
  - **Foot Traffic Estimate:**
    - Nearby POIs count
    - Transit proximity
  - **Competition:**
    - Nearest machine: X.X miles (placeholder)
    - Machines within 1mi: X (placeholder)
  - **Reasoning:**
    - "High foot traffic from nearby gym and office complex"
    - "Affluent demographics ($78k median income)"
    - "Low competition (nearest machine 1.2mi away)"

### 6. PDF Export
**Component: `ExportButton`**
- Uses `jsPDF` or browser print → PDF
- Generates simple report:
  - VendRadar logo
  - Location address + map snapshot
  - Score + color indicator
  - All demographics data
  - Reasoning bullets
  - Footer: "Generated by VendRadar.com"

**Libraries:**
- `react-to-print` for simple approach
- Or `jsPDF` + `html2canvas` for custom PDF

### 7. UI/UX Design
**Color scheme:**
- Primary: Blue (#0066cc)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)
- Background: White (#ffffff)
- Text: Dark gray (#1a1a2e)

**Layout:**
- Map takes 70% of screen width
- Sidebar/panel on right with filters + results (30%)
- Mobile: Full-screen map, bottom drawer for results

**Components to build:**
- Map container
- Search bar with autocomplete
- Category filter pills/buttons
- Results card
- Score indicator (circular progress or big number)
- Export button
- Loading states
- Empty states ("Search an address to get started")

## Data Mocking Strategy (MVP)
Since we're moving fast, mock some data:

**Competition data:**
- Generate random distances (0.3-2.0 miles)
- Show "mock data" badge
- Will be replaced with user-contributed data in v1.1

**Foot traffic:**
- Estimate based on POI count (rough proxy)
- Will be replaced with Foursquare API in v2.0

**Building details:**
- Use Google Places "types" field
- Basic heuristics (has parking, hours, rating)

## File Structure
```
vendsite/
├── src/
│   ├── app/
│   │   ├── page.tsx              (main map page)
│   │   ├── layout.tsx            (root layout)
│   │   └── api/
│   │       ├── score/route.ts    (scoring endpoint)
│   │       └── census/route.ts   (census data proxy)
│   ├── components/
│   │   ├── MapView.tsx           (Google Maps wrapper)
│   │   ├── SearchBar.tsx         (address autocomplete)
│   │   ├── CategoryPanel.tsx     (category filters)
│   │   ├── ResultsPanel.tsx      (location details)
│   │   ├── ScoreIndicator.tsx    (big score number)
│   │   └── ExportButton.tsx      (PDF export)
│   ├── lib/
│   │   ├── scoring.ts            (location scoring algorithm)
│   │   ├── census.ts             (Census API client)
│   │   └── places.ts             (Google Places client)
│   └── types/
│       └── index.ts              (TypeScript types)
├── public/
│   └── logo.svg
├── .env.local                     (API keys)
├── package.json
├── next.config.js
└── README.md
```

## Environment Variables
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_PLACES_API_KEY=your_key_here  # Same key, server-side only
```

## Deployment Steps
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
5. Share preview link with Chris

## Out of Scope (Phase 2)
- User authentication (show it working publicly for now)
- Saving searches
- AI recommendations (Pro tier feature)
- Batch analysis
- Competition alerts
- Paid API integrations (Foursquare, SafeGraph)

## Testing Checklist
Before end of sprint:
- [ ] Search "123 Main St, San Francisco, CA" → shows result
- [ ] Click on map → analyzes that location
- [ ] Switch categories → score recalculates
- [ ] Export PDF → downloads readable report
- [ ] Mobile view → map + results drawer functional
- [ ] Load time <3 seconds

## Resources

**Google Maps API Setup:**
1. Go to: https://console.cloud.google.com/
2. Enable: Maps JavaScript API, Places API, Geocoding API
3. Create API key
4. Restrict key to your domain (for production)

**Census API Docs:**
- https://www.census.gov/data/developers/data-sets/acs-5year.html
- No key required
- Example: https://api.census.gov/data/2021/acs/acs5/examples.html

**Deployment:**
- Vercel account: vercel.com
- Connect GitHub repo
- Auto-deploys on push

## Sprint Output
At end of sprint, deliver:
1. **Live demo URL** (Vercel deployment)
2. **GitHub repo link**
3. **Quick demo video** (Loom, 2-3 min showing features)
4. **Known issues list** (anything broken or incomplete)
5. **Next steps** (what needs fixing before beta launch)

## Success = Shippable Prototype
Chris should be able to:
- Search any US address
- See a reasonable score (even if algorithm is basic)
- Filter by category
- Export a PDF
- Show it to a vending operator and get feedback

**Don't aim for perfect. Aim for functional.**

---

_Sprint starts: Feb 17, 2026 9:30 AM_  
_Sprint owner: Kimi K2.5 (deep work sprint agent)_  
_Reviewed by: Pax (orchestrator)_  
_Approved by: Chris (product owner)_
