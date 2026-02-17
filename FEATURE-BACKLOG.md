# VendRadar Feature Backlog
_Running list of features, revenue streams, and ideas to build_

**Status Legend:**
- 🎯 **MVP** — Building now (Week 1)
- 📋 **Planned** — Next 1-3 months
- 💡 **Future** — 3-6+ months out
- 🤔 **Research** — Needs validation

---

## Core Product Features

### 🎯 MVP (Week 1 - Feb 17-23)
- [x] Interactive map interface
- [x] Address search + click-to-analyze
- [x] 8 category filters (office/gym/hospital/school/etc)
- [x] Location scoring algorithm (0-100)
- [x] Census demographics overlay
- [x] PDF export
- [x] Mobile responsive design

### 📋 v1.1 — Contact Reveal (Week 3-4)
**Revenue Model:** Usage-based ($5-10 per reveal)

**Features:**
- "Reveal Decision Maker" button on location results
- Pay-per-reveal or credit packs (10/$60, 50/$250, 100/$400)
- Contact data:
  - Owner/manager name + title
  - Direct phone + email
  - LinkedIn bio snippet
  - Company details
- AI-generated outreach message:
  - Personalized to location score
  - Revenue estimate included
  - Category-specific pitch
  - Copy to clipboard
- Free reveals in Pro tier (5/month)
- Unlimited reveals in Enterprise tier

**Data Sources:**
- Apollo.io API (primary)
- ZoomInfo API (backup/enrichment)
- PhantomBuster (LinkedIn scraping)
- Clay.com (data enrichment)

**Pricing Impact:**
- Basic: $29/mo + $7/reveal
- Pro: $79/mo + $5/reveal (5 free/month)
- Enterprise: $299/mo + unlimited

**Why This Wins:**
- Completes prospecting workflow (insight → contact → pitch)
- Doubles LTV (subscription + usage)
- No competitor does this for vending
- Operators think "getting placements," not "finding locations"

---

### 📋 v1.2 — AI Recommendations (Month 2)
**Revenue Model:** Pro tier feature ($79/mo)

**Features:**
- "Find best locations in [area]" button
- Scans entire neighborhoods (grid scan every 100m)
- Returns top 10-20 ranked locations
- Shows reasoning for each:
  - "High foot traffic (7,500/day estimated)"
  - "Low competition (nearest machine 0.8mi)"
  - "Demographics fit: $65k median income, age 25-45"
  - "Anchor tenants: gym + office building"
- Batch analysis: Upload CSV of 50 addresses → instant ranking
- Saved searches ("Gyms in San Diego")
- Competition alerts (notify when new machines detected)

**Why This Wins:**
- Operators don't know WHERE to look (solves discovery problem)
- AI doing 20 hours of research in 30 seconds
- Justifies premium pricing
- Competitive moat (takes 6-12 months to replicate)

---

### 📋 v1.3 — Route Planner (Month 2-3)
**Revenue Model:** Pro tier feature ($79/mo) / standalone add-on ($29/mo)

**The Problem:**
Operators with 10-30 machines waste 3-5 hours/week driving inefficient routes. Gas, time, and spoilage costs add up fast. Most plan routes manually in Google Maps or just wing it.

**Features:**

**Core — Service Route Optimization:**
- Add all machine locations to "My Machines" portfolio
- One-click "Optimize Route" — returns the most efficient loop
- Set start/end point (home, warehouse, or any address)
- Drag-and-drop to reorder stops manually
- Turn-by-turn directions (open in Google Maps / Apple Maps / Waze)
- Estimated total drive time + distance
- Save routes as templates ("Monday Route", "South Side Route")

**Smart Scheduling:**
- Set service frequency per machine (daily, 2x/week, weekly)
- Auto-generate daily route based on which machines need service
- Priority flags: "Low stock" or "high-revenue" machines serviced first
- Time windows: "Office machines before 8am, gym machines after 5pm"

**Route Analytics:**
- Miles driven per week / month (track fuel costs)
- Time per stop (identify slow locations)
- Revenue per mile (which routes are most profitable?)
- Suggest machine removals: "Machine #12 earns $40/mo but adds 25 min to your route"

**Multi-Tech Support:**
- Works on desktop (plan tonight, drive tomorrow)
- Mobile-responsive (use on the road)
- Share route with employees / drivers (link or PDF)
- Export to Google Maps / Waze deep links

**Google Maps APIs Used:**
- **Routes API** — multi-stop optimization with waypoint reordering ($10/1000 requests)
- **Directions API** — turn-by-turn + travel time ($5/1000 requests)
- **Distance Matrix API** — all-pairs travel time calculations ($5/1000 elements)
- All covered under existing $200/mo free credit

**Pricing Impact:**
- Free: Location scouting only (no route planning)
- Basic ($29/mo): Route planning for up to 10 stops
- Pro ($79/mo): Unlimited stops + optimization + analytics
- Enterprise ($299/mo): Multi-driver routes + team sharing

**Why This Wins:**
- Transforms VendRadar from a one-time research tool into a daily-use platform
- Solves the #2 operator pain point (after "finding locations" it's "servicing efficiently")
- Recurring usage = dramatically lower churn (opens app every service day)
- Natural upsell path: operators discover route planner AFTER placing machines via VendRadar
- Competitive moat: no vending-specific route planner exists (operators use generic Google Maps)
- Data flywheel: route data reveals which locations get serviced most = better recommendations

**Implementation Notes:**
- Phase 1 (Week 1): "My Machines" portfolio + basic route optimization (Routes API)
- Phase 2 (Week 2): Save routes, scheduling, Google Maps/Waze deep links
- Phase 3 (Week 3-4): Analytics dashboard, multi-driver support
- Database: Supabase table for machine locations, routes, service logs
- State: Portfolio persists per user account (requires auth, pairs with Supabase rollout)

**Estimated API Costs at Scale:**
- 100 operators × 5 routes/week × 4 API calls = 2,000 requests/week
- ~$40-80/month in API costs (well within free credit for early growth)
- Break-even: 2 Pro subscribers cover API costs for 100 users

---

## Revenue Stream Features

### 📋 Marketplace — Used Machines & Routes (Month 2-3)

**The Opportunity:**
- Operators constantly buy/sell equipment and routes
- No central marketplace exists (just Craigslist/Facebook)
- Every listing = SEO gold (indexed pages, user-generated content)

**Revenue Models:**
1. **Listing fees:** $49-99 per listing (machine or route)
2. **Transaction fee:** 5% of sale price
3. **Featured listings:** $29/mo to stay at top of search
4. **Escrow service:** 2% fee for safe transactions (Phase 2)

**Listing Types:**

**Routes for Sale:**
- Example: "25 machines, San Diego offices, $4,500/mo revenue, asking $85k"
- Details: Machine count, locations, monthly revenue, asking price, reason for sale
- Photos: Route map, machines, revenue reports

**Individual Machines:**
- Example: "Used Seaga Infinity combo, $1,200, Sacramento pickup"
- Details: Make/model, condition, year, features, location
- Photos: Front, inside, coin mech, condition

**Features:**
- Simple Craigslist-style listings (MVP)
- User uploads: photos, description, price, location
- Contact seller via platform (no public emails)
- Search/filter: by location, price, machine type, route size
- Saved searches + email alerts
- Seller ratings/reviews (Phase 2)
- Integrated transactions + escrow (Phase 2)

**SEO Impact:**
- "Used vending machines [city]" = high-intent searches
- "Vending routes for sale [state]"
- Every listing = unique indexed page
- Network effects: more listings → more traffic → more listings

**Revenue Estimate:**
- 1,000 listings/year × $75 avg = $75k
- 100 route sales/year × 5% × $60k avg = $300k
- Featured listings: 50 × $29/mo = $17.4k/yr
- **Total: ~$400k/year**

**Tech Stack:**
- Supabase (listings database)
- Stripe Connect (payments, later)
- Cloudinary (image hosting)
- Algolia (search, optional)

**Why This Wins:**
- Operators already doing this on Facebook/Craigslist
- Industry-specific = better quality, less scams
- Network effects amplify (flywheel)
- Sticky (once listing machines, they stay)

---

### 📋 Affiliate Partnerships (Month 3+)

**The Opportunity:**
- VendRadar users = qualified leads (active operators, growth mode)
- Hardware/software vendors need distribution
- Win-win: operators get vetted recommendations, we earn commission

**Partner Categories:**

**1. Hardware Vendors** (3-5% commission)
- Seaga, Wittern, Crane, Automated Merchandising Systems (AMS)
- Commission: 3-5% on $2-8k machines = $60-400 per sale
- Integration: "Recommended machines for [category]" feature
  - "Best machines for gyms: Seaga Infinity (healthy vending)"
  - "Office vending: Wittern 3580 (coffee + snacks)"

**2. Software Vendors** (referral fees)
- VendSoft, Cantaloupe, Parlevel (operations partners, NOT competitors)
- Referral fee: $50-200 per signup
- Pitch: "After you place your machine, use VendSoft to manage routes"
- We handle prospecting, they handle operations

**3. Service Providers**
- Payment processors: Nayax, USA Technologies, Cantaloupe
- Inventory suppliers: Vistar, Imperial Trading
- Insurance: Vending-specific coverage
- Financing: Equipment leasing companies
- Telemetry: Remote monitoring systems

**Content/SEO Strategy:**
- Comparison pages: "Seaga vs Wittern: Best for gyms"
- Category pages: "Healthy vending machines"
- Reviews: "VendSoft review: Is it worth it?"
- Guides: "Complete vending machine buying guide"
- Rankings for bottom-funnel keywords

**Implementation:**
1. Join existing affiliate programs (most have them)
2. Add "Resources" section to site
3. Embed affiliate links with disclosure
4. Track conversions via UTM codes
5. Negotiate direct deals once volume proves out

**Revenue Estimate:**
- Hardware: 500 sales/yr × $150 avg = $75k
- Software: 300 referrals × $100 = $30k
- Services: $50k/yr
- **Total: ~$155k/year**

**Why This Wins:**
- Zero marginal cost (pure content)
- SEO benefit (product pages, reviews, comparisons)
- Operators want recommendations anyway
- Legitimizes platform (trusted resource)

---

## Product Enhancements

### 💡 Competition Mapping — User-Contributed Data
**Target:** Month 3-4

**Features:**
- Operators flag competitor machines on map
- Share anonymous performance data (opt-in):
  - Revenue per day
  - Product mix that works
  - Location notes ("restocked 2x/week, high volume")
- Network effects: more users = better competition intel
- Gamification: badges for contributing data

**Why This Wins:**
- Makes recommendations more accurate
- Creates moat (data network effect)
- Sticky (operators invested in platform)

---

### 💡 CRM Integration
**Target:** Month 4-5

**Features:**
- Export prospects to CSV
- Zapier integration (send to HubSpot, Salesforce, etc)
- Email sequencing: auto-follow-up after contact reveal
- Track outreach: called, emailed, meeting scheduled, deal closed
- Success rate tracking per location type

**Why This Wins:**
- Operators using VendRadar as their prospecting hub
- Workflow automation = stickier
- Upsell opportunity (CRM add-on $29/mo)

---

### 💡 Mobile App
**Target:** Month 6+

**Features:**
- GPS-based scouting: walk around, tap "analyze this location"
- Photo upload: snap building, AI suggests category
- Offline mode: save locations, sync later
- Push notifications: competition alerts, saved search matches
- Route planning: native mobile integration with v1.3 Route Planner (real-time rerouting, traffic alerts)

**Why This Wins:**
- Operators scout on-the-go (mobile-first use case)
- Camera + GPS = perfect for field work
- Reduces friction (analyze location in 10 seconds)

---

## Category Expansion

### 🤔 Adjacent Verticals
**Target:** Month 6-12

Same location intelligence tech, different customer segments:

**Micro-Markets:**
- Similar to vending but larger footprint
- Higher revenue per placement ($2-5k/mo vs $500-1k)
- Same location criteria (offices, factories)
- Price point: $99-149/mo (larger deal size)

**ATM Operators:**
- Identical location intelligence needs
- Different scoring factors (foot traffic > demographics)
- Category filters: bars, convenience stores, events
- TAM: ~2,500 operators

**Laundromat Operators:**
- Location-dependent business
- Similar scoring: demographics, competition, foot traffic
- Different data: rent costs, parking, residential density

**Car Wash Operators:**
- Site selection critical
- Traffic patterns, income, competition
- Expand to commercial real estate intelligence

**Smart Stores / Autonomous Retail:**
- Growing market (Zippin, AiFi, Amazon Just Walk Out)
- High-tech operators, higher willingness to pay
- Premium tier: $199-299/mo

---

## Enterprise Features

### 💡 White-Label Reports
**Target:** Month 6+

**Use Case:** Location consultants, large operators pitching to clients

**Features:**
- Upload client logo
- Custom branding colors
- Professional formatting
- Add custom notes/recommendations
- Batch generate 50+ reports

**Pricing:** Enterprise tier ($299/mo) or add-on ($49/mo)

---

### 💡 API Access
**Target:** Month 9-12

**Use Case:** Integrate VendRadar intelligence into other platforms

**Features:**
- RESTful API for location scoring
- Webhook for competition alerts
- Bulk analysis endpoints
- Developer docs + sandbox

**Pricing:** Enterprise tier or separate API tier ($499+/mo)

---

## Marketing/Community Features

### 💡 Operator Community
**Target:** Month 4-5

**Features:**
- Forums (like r/vending but on-platform)
- Success stories: "How I placed 15 machines in 3 months"
- Ask the community: "Anyone service this area?"
- Private messaging between operators
- Resource library: contracts, pitch templates, checklists

**Why This Wins:**
- Network effects (more users = more value)
- SEO goldmine (forum posts indexed)
- Retention (community keeps people engaged)
- Intel sharing (crowdsourced best practices)

---

### 💡 Educational Content
**Target:** Ongoing

**Content Types:**
- Blog: "How to negotiate commission splits"
- Video: "Location scouting walkthrough"
- Guides: "Complete vending startup guide"
- Webinars: "Using data to 3x your placements"
- Case studies: Real operator results

**Distribution:**
- SEO (organic traffic)
- YouTube (vending how-to searches)
- Reddit (r/vending, r/EntrepreneurRideAlong)
- Email newsletter (weekly tips)

**Why This Wins:**
- Top-of-funnel lead gen
- Establishes authority
- SEO compounds over time
- Evergreen content = passive traffic

---

## Technical Debt & Infrastructure

### 📋 Phase 2 Paid APIs (After Revenue)
**Target:** 30+ paying customers

**Add when revenue justifies cost:**
- **Foursquare Places API** (~$100-200/mo)
  - Real foot traffic data (not proxies)
  - Hourly visit patterns
  - Visitor demographics
  
- **SafeGraph Core Places** (~$100/mo)
  - Detailed POI data
  - Business polygons
  - Category classifications
  
- **Esri Demographics** (optional)
  - Enhanced demographic data
  - Spending patterns
  - Psychographic segmentation

**Impact:** Recommendations go from "pretty good" to "scary accurate"

---

### 💡 Advanced Scoring Models
**Target:** Month 3-4

**Machine Learning Enhancements:**
- Train on actual operator success data
- Predict revenue per location (not just score)
- Seasonality factors (summer vs winter performance)
- Category-specific models (gym scoring ≠ office scoring)
- A/B test algorithm improvements

---

## Metrics & Analytics

### 💡 Operator Dashboard
**Target:** Month 3-4

**Features:**
- Portfolio view: all your machines/routes on map
- Performance tracking: revenue per location
- ROI calculator: compare actual vs predicted performance
- Expansion recommendations: "Your office machines perform well, find more offices"
- Month-over-month growth

**Why This Wins:**
- Retention (operators see their business growing)
- Upsell (high performers upgrade to Pro)
- Testimonials (track before/after VendRadar usage)

---

## Partnerships & Integrations

### 🤔 OEM Partnerships
**Target:** Month 6-12

**Opportunity:** Partner with machine manufacturers

**Pitch to OEMs:**
- We send qualified leads (operators actively expanding)
- White-label VendRadar for their customers
- Co-marketing (manufacturer funds location tools for their buyers)

**Revenue Model:**
- Referral fees on machine sales
- White-label licensing fee
- Co-branded Pro tier

**Example:** "Seaga Location Finder (powered by VendRadar)"

---

### 🤔 Location Owner Platform
**Target:** Year 2+

**Flip the marketplace:**
- Building owners list available spaces
- "Seeking vending operator for our gym (2,500 members)"
- Operators bid or apply
- VendRadar takes commission from both sides

**Why This Could Be Huge:**
- Solves cold outreach problem (warm leads)
- Building owners want passive income (easier sell)
- Network effects squared (operators + locations)

---

## Summary of Revenue Streams

| Stream | Launch | Est. Year 1 Revenue | Effort |
|--------|--------|---------------------|--------|
| **Subscriptions** | Week 1 | $568k (600 users @ $79/mo) | High (core product) |
| **Contact Reveal** | Month 1 | $180k (usage-based) | Medium (API integration) |
| **Route Planner** | Month 2 | $104k (300 users @ $29/mo add-on) | Medium (API integration) |
| **Marketplace** | Month 2 | $400k (listings + transactions) | Medium (platform build) |
| **Affiliates** | Month 3 | $155k (hardware/software) | Low (content + links) |
| **Enterprise** | Month 6 | $100k (white-label, API) | Medium (custom features) |
| **Total** | - | **~$1.5M ARR** | - |

**Key Insight:** Diversified revenue = resilient business. If subscriptions slow, marketplace/affiliates can carry it.

---

## Prioritization Framework

**Build Next If:**
1. **High ROI:** Revenue potential > development cost
2. **Low effort:** Can ship in 1-2 weeks
3. **Operator demand:** Requested by 5+ beta users
4. **Competitive moat:** Hard for others to copy
5. **Network effects:** Value increases with more users

**Examples:**
- ✅ Contact reveal: High ROI, medium effort, high demand, moat
- ✅ Marketplace: High ROI, medium effort, SEO benefit, network effects
- ✅ Affiliates: High ROI, low effort, passive income
- ⚠️ Mobile app: High value, high effort (defer to Month 6+)
- ⚠️ CRM integration: Medium ROI, medium effort (after PMF)

---

_Document maintained by: Pax_  
_Last updated: Feb 16, 2026_  
_Review cadence: After each major release_
