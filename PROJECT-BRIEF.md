# VendRadar — Location Intelligence for Vending Operators
_Project Brief — Feb 16, 2026_

## Executive Summary

**What:** AI-powered location intelligence platform that tells vending operators exactly where to put their next machine.

**Why:** 15,867 US operators waste days driving around guessing good locations. No existing tools solve location prospecting — they only manage existing operations.

**Market:** $7.7B vending industry, $11.4M ARR TAM (small-medium operators), zero direct competitors.

**Moat:** Category-specific AI recommendations + vending-native intelligence. One good location find = $500-2k/mo for operator, VendRadar costs $79/mo.

**Status:** Market validated (A- grade), competitive research complete, ready to build.

---

## The Problem

**Current operator workflow:**
1. Drive around neighborhoods looking for buildings
2. Guess foot traffic based on "feel"
3. Cold call building managers
4. Hope the location works out
5. 30-40% of placements underperform or fail

**Cost of bad placement:**
- Machine rental/purchase: $2-5k
- Inventory investment: $500-1k
- Wasted commission payments to location
- Opportunity cost of better location
- Time wasted on restocking underperformers

**No one is solving WHERE to look.** All existing software manages AFTER you've placed machines.

---

## The Solution

### Core Product: Interactive Map + AI Recommendations

**How it works:**
1. Operator logs in → sees map interface
2. Either:
   - **Manual lookup:** Search any address → instant score + data
   - **AI recommendations:** "Find 10 best gym locations in San Diego" → ranked list with reasoning
3. Select category (office, gym, hospital, school, etc.)
4. See instant overlay:
   - Foot traffic heatmap
   - Demographics (income, age, population)
   - Competition markers (other machines within radius)
   - Location score (0-100)
   - AI reasoning: "Why this spot is good"
5. Export PDF report with all data

**Key Innovation: Category Search**

Not all vending is the same. Category search understands vertical-specific criteria:

| Category | Key Factors | Product Fit | Peak Hours |
|----------|-------------|-------------|------------|
| **Office Buildings** | Weekday traffic, employee count, break rooms | Coffee, snacks, lunch items | 9am-12pm, 2-4pm |
| **Gyms/Fitness** | Membership size, affluent demographics | Protein bars, healthy snacks, recovery drinks | 6-9am, 5-8pm |
| **Hospitals/Medical** | 24/7 access, visitor traffic, staff count | Grab-and-go meals, coffee, healthy options | All hours |
| **Schools/Universities** | Student count, compliance requirements | Healthy snacks, bulk volume | 8am-3pm |
| **Manufacturing/Warehouses** | Shift workers, break schedules | Energy drinks, meal replacement, bulk snacks | Shift changes |
| **Apartments** | Unit count, demographics, access | Micro-markets, convenience items | Evening/night |
| **Hotels** | Guest count, business vs leisure | Premium snacks, branded items | Check-in/out times |
| **Transit Hubs** | Daily passenger volume | Grab-and-go, high turnover | Rush hours |

**Why this matters:** A gym operator doesn't care about office building data. Category search = instant relevance = faster purchasing decision.

---

## Business Model

### Pricing Tiers

**Free Tier (Lead Gen + Validation)**
- 5 manual address lookups per month
- Basic demographics
- Location score only
- No exports
- **Purpose:** Prove value, convert to paid

**Basic — $29/mo "Scout Mode"**
- Unlimited manual lookups
- All category filters
- Full data overlays (demographics, competition, foot traffic)
- PDF export
- **Target:** Operators with 10-50 machines, active scouting

**Pro — $79/mo "AI Prospector"** ⭐ Main revenue driver
- Everything in Basic +
- **AI Recommendations:** "Find best locations in [area]"
- Scans entire neighborhoods, ranks by potential
- AI reasoning for each recommendation
- Batch analysis: Upload 50 addresses → instant ranking
- Competition alerts: Notified when new machines open near yours
- Priority support
- **Target:** Operators with 50-500 machines, growth mode

**Enterprise — $299/mo (Future)**
- Multi-user accounts
- API access
- White-label reports for client pitches
- Custom scoring algorithms
- **Target:** Large operators (500+ machines), location consultants

### Unit Economics (Pro Tier)

**Revenue per customer:** $79/mo = $948/year

**Cost per customer:**
- Google Maps API: ~$3/mo per active user
- Foursquare API: ~$5/mo per active user (Phase 2)
- Hosting: ~$0.50/mo per user
- Support: ~$2/mo per user (10% need help)
- **Total:** ~$10.50/mo

**Gross margin:** 87% ($68.50 per customer)

**Break-even:** ~3 paying customers covers base infrastructure ($200-300/mo)

**Payback period:** <1 month (operators see value immediately)

---

## Market Analysis

### Total Addressable Market (TAM)

**Primary Market: US Vending Operators**
- Total US operators: 15,867
- Target segment (10-500 machines): ~12,000 operators
- **TAM:** 12,000 × $79/mo = $947k MRR = **$11.4M ARR**

**Realistic Year 1 Capture (5%):**
- 600 paying customers
- $47k MRR = **$568k ARR**

**Adjacent Markets (Future Expansion):**
- Micro-market operators: +5,000
- Smart store/kiosk operators: +3,000
- ATM operators: +2,500
- Laundromat/car wash: +2,500
- **Expanded TAM:** ~25,000 businesses = **$23.7M ARR**

### Industry Context

- **Market size:** $7.7B (2026)
- **Machine count:** 5-7M nationwide
- **Trend:** Declining 0.3% CAGR (traditional vending) but smart vending growing
- **Competitive intensity:** High (Compass/Aramark dominate)
- **Operator challenge:** Small/medium operators need data to compete with giants

---

## Competitive Landscape

### Direct Competitors: NONE

**Existing vending software solves different problems:**

| Company | What They Do | Price | Market Position | Gap |
|---------|--------------|-------|-----------------|-----|
| **VendSoft** | Operations (inventory, routes, telemetry) | $99-299/mo | 500+ operators | No location intelligence |
| **Cantaloupe** | Payment processing + operations | Per-machine | 31,000+ customers | No prospecting tools |
| **Parlevel** | Enterprise operations platform | Enterprise | Large operators | Existing machines only |
| **Seed Pro** | Route optimization + inventory | $100-200/mo | Mid-market | No scouting features |

**Generic location intelligence tools:**

| Tool | Price | Problem |
|------|-------|---------|
| **Placer.ai** | $500-2k/mo | Enterprise-only, not vending-specific, overwhelming data |
| **SafeGraph** | API pricing | Developer tool, no UI, complex integration |
| **Spatial.ai** | Enterprise | Not accessible to small operators, generic insights |

**Operator "solutions" today:**
- Drive around and guess (time-intensive, high failure rate)
- Google Maps (no analytics, manual research)
- Word of mouth (unreliable, lagging indicator)
- Commercial real estate platforms (not vending-specific)

### Our Competitive Advantages

**1. Blue Ocean Market**
- Zero direct competition in vending location intelligence
- Creating new category: "Location prospecting for operators"

**2. Vending-Native Intelligence**
- Scoring algorithm understands vending-specific factors:
  - Competition density (0.5mi radius matters)
  - Building type fit (gym ≠ office ≠ hospital)
  - Product-location matching (healthy → gyms, coffee → offices)
  - Peak hour alignment (shift workers vs office workers)
- Generic tools can't replicate domain expertise

**3. AI Recommendations (Moat)**
- No competitor offers: "Show me the 10 best locations"
- Requires:
  - Vending-specific scoring algorithm
  - Category intelligence
  - Network effects (more users = better competition data)
- Takes 6-12 months to build well

**4. Price Point**
- $79/mo vs $500-2k/mo for generic alternatives
- ROI is instant: One good location = $500-2k/mo revenue
- Impulse purchase territory for operators

**5. Network Effects**
- More users → more competition data
- Better data → better recommendations
- Operators using VendRadar get better locations → competitors forced to adopt
- Creates flywheel

---

## Go-to-Market Strategy

### Phase 1: Beta Launch (Week 1-2)

**Target:** r/vending (24k members, highly engaged)

**Offer:**
- "Free beta access for first 100 operators"
- "Submit your worst-performing location → we'll show you 5 better alternatives (free)"
- Build credibility + testimonials

**Success metrics:**
- 50+ beta signups
- 10+ active daily users
- 3+ testimonials ("This found a spot I never would've considered")

### Phase 2: Paid Conversion (Week 3-4)

**Convert beta users:**
- "Beta ending, lock in $49/mo founder pricing (normally $79)"
- Email sequence showing usage stats: "You looked up 47 locations — that would've taken 20 hours of driving"

**Expand channels:**
- Vending operator Facebook groups (20+ groups, 50k+ members)
- Vending industry forums (VendingConnection, VendingWorld)
- YouTube (search "how to find vending machine locations")

**Goal:** 20 paying customers by end of Month 1

### Phase 3: Scale (Month 2-3)

**Add paid APIs once revenue justifies:**
- Foursquare foot traffic ($100-200/mo) at 30 customers
- SafeGraph POI data ($100/mo) at 50 customers

**Content marketing:**
- Case studies: "How [Operator] added 15 machines in 3 months using VendRadar"
- Guide: "The Complete Location Scouting Playbook"
- YouTube demos: "Finding profitable vending locations in 5 minutes"

**Partnerships:**
- Vending machine suppliers (Wittern, Seaga, Crane)
- Industry consultants (refer clients for 20% commission)
- Vending associations (NAMA members)

**Goal:** 100 paying customers by end of Month 3

### Phase 4: Vertical Expansion (Month 4+)

**Adjacent markets:**
- Micro-market operators (similar needs, higher revenue per location)
- ATM operators (identical location intelligence needs)
- Laundromat/car wash (same location factors)

**Enterprise tier:**
- Multi-location chains (Canteen, Aramark small regions)
- Location consultants (white-label reports)

---

## Product Roadmap

### MVP (Week 1) — Build Tomorrow

**Core features:**
- Map interface (Google Maps API, free tier)
- Address search → instant score
- Category filters (8 verticals)
- Basic data overlay:
  - Census demographics (free API)
  - Scraped Google Maps POIs (foot traffic proxy)
  - Competition mapping (user-contributed data)
- Location score algorithm (0-100)
- PDF export

**Tech stack:**
- Frontend: Next.js + React + Tailwind
- Maps: Google Maps JavaScript API
- Data: Census API + scraped Google Places
- Backend: Vercel serverless functions
- Database: Supabase (PostgreSQL)
- Auth: Clerk or Supabase Auth

**Launch target:** End of Week 1 (Feb 23)

### Version 1.1 (Week 2-3)

**AI Recommendations:**
- "Find best locations in [area]" button
- Scans grid (every 100m), scores each point
- Returns top 10-20 ranked locations
- Shows reasoning for each

**Enhanced data:**
- Transit proximity (nearby bus/metro stops)
- Anchor tenant detection (gyms, offices, schools)
- Parking availability proxy

### Version 1.2 (Week 4-5)

**Pro tier features:**
- Batch analysis (upload CSV of addresses)
- Competition alerts (notify when new machines detected)
- Saved searches ("Gyms in San Diego")
- Historical data (track location scores over time)

### Version 2.0 (Month 2-3)

**Paid API integration (after revenue justifies):**
- Foursquare foot traffic → real traffic estimates
- SafeGraph POI data → precise competition mapping
- More accurate recommendations

**User-contributed data:**
- Operators can flag existing machines
- Share performance data (opt-in, anonymized)
- Network effects kick in

### Version 3.0 (Month 4+)

**Vertical expansion:**
- Micro-market intelligence
- ATM location scoring
- Smart store placement

**Enterprise features:**
- Multi-user accounts
- API access for integrations
- Custom scoring algorithms
- White-label reports

---

## Future Revenue Streams

_Full details in FEATURE-BACKLOG.md — running list of all features/ideas_

Beyond core subscriptions, VendRadar can capture revenue from:

### 1. Contact Reveal (Usage-Based) — v1.1 (Week 3-4)
**Revenue Model:** $5-10 per contact reveal

**What it does:**
- "Reveal Decision Maker" button on location results
- Unlocks: Owner/manager name, phone, email, LinkedIn bio
- AI-generated outreach message personalized to location score
- Credit packs: 10/$60, 50/$250, 100/$400

**Why this wins:**
- Completes prospecting workflow (location → contact → pitch)
- Doubles LTV (subscription + usage revenue)
- No competitor does this for vending operators

**Revenue estimate:** +$1.5M ARR (50% of users @ avg $100/mo usage)

---

### 2. Marketplace (Machines & Routes) — v1.2 (Month 2-3)
**Revenue Model:** Listing fees + transaction fees + featured placements

**What it does:**
- Operators list used machines or routes for sale
- Search/filter: location, price, machine type, route size
- Examples:
  - "Route for sale: 25 machines, San Diego offices, $4,500/mo revenue, $85k"
  - "Used Seaga Infinity combo, $1,200, Sacramento pickup"

**Why this wins:**
- No central vending marketplace exists (just Craigslist/Facebook)
- Every listing = SEO gold (indexed pages, organic traffic)
- Network effects: more listings → more buyers → more sellers
- Sticky (operators invested in platform)

**Revenue estimate:** ~$400k/year
- 1,000 listings/year × $75 listing fee = $75k
- 100 route sales × 5% × $60k avg = $300k
- Featured listings: 50 × $29/mo = $17.4k

---

### 3. Affiliate Partnerships — Month 3+
**Revenue Model:** Commission on hardware/software referrals

**Partner categories:**
- **Hardware vendors:** Seaga, Wittern, Crane (3-5% commission = $60-400/sale)
- **Software vendors:** VendSoft, Cantaloupe referrals ($50-200/signup)
- **Service providers:** Payment processors, insurance, financing

**Content strategy:**
- "Best vending machines for gyms" (comparison pages)
- "VendSoft review" (software guides)
- SEO benefit: product pages rank for bottom-funnel keywords

**Why this wins:**
- Zero marginal cost (pure content + links)
- Operators want recommendations anyway
- Legitimizes platform (trusted resource)

**Revenue estimate:** ~$155k/year
- Hardware: 500 sales × $150 avg = $75k
- Software: 300 referrals × $100 = $30k
- Services: $50k

---

### Combined Revenue Potential (Year 1)

| Stream | Est. Revenue | Launch |
|--------|--------------|--------|
| Subscriptions | $568k | Week 1 |
| Contact Reveal | $180k | Month 1 |
| Marketplace | $400k | Month 2 |
| Affiliates | $155k | Month 3 |
| **Total** | **~$1.3M ARR** | - |

**Key insight:** Diversified revenue = resilient business. If subscriptions slow, marketplace/affiliates can carry growth.

---

### Other Future Features (Backlog)

See **FEATURE-BACKLOG.md** for complete list including:
- Competition mapping (user-contributed data)
- CRM integration (Zapier, HubSpot, Salesforce)
- Mobile app (GPS-based scouting)
- Adjacent verticals (micro-markets, ATMs, laundromats)
- White-label reports (Enterprise)
- API access (Enterprise)
- Operator community (forums, success stories)
- Machine learning scoring enhancements

---

## Technical Architecture

### Phase 1: Free Data Sources

**Demographics:**
- US Census Bureau API (free)
  - Median income by census tract
  - Population density
  - Age distribution
  - Employment statistics

**Location data:**
- Google Maps Places API (free tier: 28k map loads/mo)
  - POI categories (gyms, offices, schools)
  - Business hours
  - User ratings (foot traffic proxy)
- Scraped Google Maps search results (careful, ToS)

**Competition mapping:**
- User-contributed data (operators flag competitors)
- Public vending machine directories
- Crowdsourced intel from beta users

### Phase 2: Paid APIs (After Revenue)

**Foot traffic:**
- Foursquare Places API
  - Hourly foot traffic estimates
  - Visit patterns (peak hours)
  - Visitor demographics
- Cost: ~$100-200/mo (depends on query volume)

**POI data:**
- SafeGraph Core Places
  - Detailed business info
  - Polygon boundaries
  - Category classifications
- Cost: ~$100/mo

**Demographics enhancement:**
- Esri Demographics (if needed)
- Precisely (formerly Pitney Bowes)

### Scoring Algorithm (Proprietary)

**Location Score Components (0-100):**

1. **Foot Traffic (30 points)**
   - Nearby POI density
   - Transit proximity
   - Parking availability
   - Peak hour alignment

2. **Demographics Fit (25 points)**
   - Income level (varies by category)
   - Age distribution
   - Population density
   - Employment type

3. **Competition Analysis (25 points)**
   - Nearest competitor distance
   - Competition density (0.5mi radius)
   - Market saturation score

4. **Building/Location Type (20 points)**
   - Category match (gym score ≠ office score)
   - Access level (public vs private)
   - Hours of operation alignment
   - Anchor tenant quality

**Category-Specific Weights:**
- Gyms: Demographics (35), Foot Traffic (30), Competition (20), Building (15)
- Offices: Building (30), Demographics (25), Foot Traffic (25), Competition (20)
- Hospitals: Foot Traffic (35), Building (30), Demographics (20), Competition (15)

---

## Key Metrics & Goals

### Week 1 (Launch)
- [ ] MVP deployed and live
- [ ] Beta post on r/vending
- [ ] 50 beta signups
- [ ] 10 active users

### Month 1
- [ ] 20 paying customers ($1,580 MRR)
- [ ] 100+ total users
- [ ] 3 testimonials/case studies
- [ ] <$200 infrastructure cost

### Month 3
- [ ] 100 paying customers ($7,900 MRR)
- [ ] 500+ total users
- [ ] 20% free→paid conversion
- [ ] 5% monthly churn
- [ ] Break-even on paid APIs

### Month 6
- [ ] 250 paying customers ($19,750 MRR)
- [ ] Add Enterprise tier (5 customers @ $299/mo)
- [ ] Launch micro-market vertical
- [ ] Profitability

### Year 1
- [ ] 600 paying customers ($47,400 MRR = $568k ARR)
- [ ] Expand to ATM/laundromat verticals
- [ ] Raise seed round or stay bootstrapped

---

## Risks & Mitigations

### Risk 1: Operators don't trust AI recommendations

**Mitigation:**
- Show reasoning for every recommendation (transparency)
- Start with manual lookup (builds trust)
- Free tier lets them validate before paying
- Case studies proving recommendations work

### Risk 2: Data accuracy issues with free sources

**Mitigation:**
- Start with free data, validate with beta users
- Add paid APIs incrementally after revenue
- User-contributed data improves over time
- Clear disclaimers: "Estimates based on public data"

### Risk 3: Google Maps ToS violations (scraping)

**Mitigation:**
- Use official APIs wherever possible
- Respect rate limits and ToS
- Plan for Mapbox alternative if needed
- Budget for paid data sources in Phase 2

### Risk 4: Competitors copy the idea

**Mitigation:**
- First-mover advantage in blue ocean market
- Network effects (user data = moat)
- Vending-specific domain expertise (hard to replicate)
- Fast iteration (ship weekly, stay ahead)

### Risk 5: Market too small or operators won't pay

**Mitigation:**
- Validated demand via r/vending research
- Free tier proves value before asking for payment
- Low CAC (organic channels)
- Can expand to adjacent markets (already identified)

---

## Success Criteria

**Product-Market Fit Signals:**
- [ ] 20%+ free → paid conversion
- [ ] <5% monthly churn
- [ ] Organic word-of-mouth referrals
- [ ] Operators sharing in communities: "Check out VendRadar"
- [ ] Feature requests about power-user needs (not basic fixes)

**Business Viability:**
- [ ] $10k MRR by Month 2
- [ ] 70%+ gross margin maintained
- [ ] CAC < $50 (3-month payback)
- [ ] Net revenue retention >100% (upsells to Pro)

**Ready to Scale:**
- [ ] Repeatable acquisition channel
- [ ] Self-service onboarding (no manual handholding)
- [ ] Support load manageable (<10 hours/week)
- [ ] Infrastructure scales without linear cost increase

---

## Team & Responsibilities

**Chris (Founder/CEO):**
- Product vision & strategy
- Go-to-market & sales
- Customer interviews & feedback
- Fundraising (if needed)

**Pax (AI Operator/Head of Ops):**
- Project management & sprint planning
- Research & competitive intelligence
- Documentation & reporting
- Operations & automations

**Dev Team (Hired or Sprint-Built):**
- 9:30 AM sprints: Build MVP features
- Tech stack: Next.js, Google Maps, Census API
- Deploy to Vercel
- Iterate based on user feedback

---

## Next Steps (Immediate)

### Tonight (Feb 16):
- [x] Complete competitive analysis
- [x] Document product requirements
- [x] Update active-tasks.md
- [x] Create project folder structure

### Tomorrow Morning (Feb 17, 9:30 AM Sprint):
- [ ] Build MVP map interface
- [ ] Implement category filters (8 verticals)
- [ ] Connect Census API for demographics
- [ ] Scrape Google Maps for POIs (foot traffic proxy)
- [ ] Build location scoring algorithm
- [ ] Create PDF export functionality
- [ ] Deploy to Vercel

### Tomorrow Evening (Feb 17):
- [ ] Review prototype with Chris
- [ ] Iterate on design/UX
- [ ] Finalize beta launch copy

### This Week:
- [ ] Launch beta on r/vending (free access)
- [ ] Set up user feedback loop (Discord or Telegram group)
- [ ] Track beta metrics (signups, active users, searches)

---

## Project Files

```
projects/vendsite/
├── PROJECT-BRIEF.md              (this file)
├── docs/
│   ├── competitive-analysis.md   (full competitive research)
│   └── market-validation.html    (r/vending research findings)
├── archive/
│   ├── landing-page.html         (old manual-service MVP)
│   ├── generate_report.py        (old PDF generator)
│   └── README.md                 (original concept)
├── src/                          (to be created tomorrow)
│   ├── app/                      (Next.js app)
│   ├── components/               (React components)
│   ├── lib/                      (scoring algorithm, API clients)
│   └── public/                   (assets)
└── reports/                      (generated test reports)
```

---

## Summary

**VendRadar is a category-creating product in a blue ocean market.**

- **Market:** $11.4M ARR TAM, 12,000 target customers, zero direct competitors
- **Problem:** Operators waste days driving around guessing good locations
- **Solution:** AI-powered map that shows exactly where to put machines
- **Moat:** Category search + vending-native intelligence + network effects
- **ROI:** One good location find = 6-24 months of subscription justified
- **Path:** Launch beta this week, 20 customers Month 1, 100 by Month 3

**This works if we ship fast and iterate based on real operator feedback.**

Let's build it.

---

_Document owner: Pax_
_Last updated: Feb 16, 2026 10:05 PM_
_Next review: After MVP launch (target: Feb 23, 2026)_
