# VendRadar — Unified Financial Model
_Version 2.0 — February 17, 2026_
_Supersedes: vending-machine-tool-business-plan.md (v1.0), PROJECT-BRIEF.md pricing section_

---

## Why This Document Exists

Previous documents had conflicting financial assumptions:
- **Business Plan v1.0:** $49-199/mo pricing, 15% monthly churn, $10-15M TAM
- **Project Brief:** $29-299/mo pricing, no churn estimate, $11.4M TAM
- **Feature Backlog:** $1.4M Year 1 ARR (blended revenue streams)

This document is the **single source of truth** for all financial modeling going forward.

---

## Pricing Model (Final)

| Plan | Monthly | Annual (20% off) | Searches/Mo | Features |
|------|---------|-------------------|-------------|----------|
| **Free** | $0 | — | 3 | Basic scoring only, no AI reasoning, no PDF export |
| **Starter** | $29/mo | $278/yr | 15 | Full scoring, AI reasoning, PDF export |
| **Pro** | $79/mo | $758/yr | Unlimited | Everything in Starter + saved locations, comparison, alerts |
| **Enterprise** | $299/mo | Custom | Unlimited | API access, white-label, priority support, bulk Contact Reveal |

**Why these prices:**
- Free tier is deliberately limited (3 searches, no AI reasoning) to create clear upgrade motivation
- $29 Starter hits the "less than one bad location" threshold — easy justification for small operators
- $79 Pro is the revenue driver — unlimited searches for operators actively expanding
- $299 Enterprise is for consultants and suppliers who need API/white-label

**Add-on: Contact Reveal**
- $5/reveal on Starter, $3/reveal on Pro, included (50/mo) on Enterprise
- This is the highest-margin, lowest-friction monetization lever

---

## Target Market Sizing

### TAM Calculation

| Segment | Count | Avg Plan | Months | Annual Value |
|---------|-------|----------|--------|-------------|
| New operators (1-5 machines) | 50,000/yr | $29/mo (Starter) | 6 avg | $8.7M |
| Active small operators (5-25 machines) | ~40,000 | $79/mo (Pro) | 8 avg | $25.3M |
| Large operators & consultants | ~2,000 | $299/mo (Enterprise) | 12 avg | $7.2M |

**Total Addressable Market: ~$41M** (theoretical ceiling)

### SAM (Serviceable Addressable Market)

Realistically, we can reach and convert:
- 5% of new operators → 2,500/yr
- 2% of active small operators → 800
- 1% of enterprise segment → 20

**SAM: ~$3.6M ARR at maturity** (Year 3-4)

### SOM (Serviceable Obtainable Market — Year 1)

| Quarter | New Customers | Churned | Net Active | MRR |
|---------|--------------|---------|------------|-----|
| Q1 (Launch) | 50 | 5 | 45 | $2,500 |
| Q2 | 80 | 15 | 110 | $6,200 |
| Q3 | 120 | 25 | 205 | $11,500 |
| Q4 | 150 | 35 | 320 | $18,000 |

**Year 1 target: ~$18K MRR / ~$115K total revenue**

---

## Churn Assumptions (Critical)

The v1.0 business plan assumed 15% monthly churn. **This is too high** for a subscription SaaS — it implies losing half your customers every 4.5 months.

### Realistic Churn Model

| Cohort Stage | Monthly Churn | Rationale |
|-------------|---------------|-----------|
| Month 1 (trial/new) | 25% | Many will try and bounce — this is normal |
| Months 2-3 | 15% | Operators finding initial value or leaving |
| Months 4-6 | 8% | Retained users have integrated into workflow |
| Months 7+ | 5% | Sticky users — actively expanding or monitoring |

**Blended annual churn: ~60%** (This is still high for SaaS but realistic for SMB tools)
**Average customer lifespan: ~10 months**

### Implications

- At $79/mo average revenue per paying user: **LTV = ~$790**
- Target CAC must stay under $100 (organic-first strategy keeps this low)
- **LTV:CAC ratio target: 8:1 minimum** (healthy for bootstrapped SaaS)

---

## Revenue Streams Breakdown

### Year 1 Revenue Mix

| Stream | % of Revenue | Year 1 Est. |
|--------|-------------|-------------|
| Subscriptions (Starter + Pro) | 70% | $80K |
| Contact Reveal (per-use) | 20% | $23K |
| Enterprise subscriptions | 5% | $6K |
| Affiliate partnerships | 5% | $6K |
| **Total** | | **~$115K** |

### Year 2 Revenue Mix (Target)

| Stream | % of Revenue | Year 2 Est. |
|--------|-------------|-------------|
| Subscriptions | 60% | $310K |
| Contact Reveal | 25% | $130K |
| Enterprise + API | 10% | $52K |
| Marketplace + Affiliates | 5% | $26K |
| **Total** | | **~$518K** |

---

## Cost Structure

### Monthly Operating Costs

| Item | Month 1-3 | Month 4-6 | Month 7-12 |
|------|-----------|-----------|------------|
| Hosting (Vercel, Supabase) | $50 | $100 | $200 |
| API costs (Google, Census) | $100 | $300 | $600 |
| Marketing/Ads | $0 | $500 | $2,000 |
| Software tools | $100 | $150 | $200 |
| Contact data (Apollo.io) | $0 | $200 | $400 |
| **Total** | **$250** | **$1,250** | **$3,400** |

### Startup Costs

| Item | Cost |
|------|------|
| Domain + branding | $300 |
| Legal (LLC, terms, privacy) | $800 |
| API credits (initial) | $200 |
| **Total** | **$1,300** |

Note: No development costs — Pax (AI operator) handles build. This is a major advantage.

---

## Break-Even Analysis

- Average monthly cost at steady state: $2,500
- Average blended revenue per customer: $55/mo (mix of plans)
- **Break-even: 46 paying customers**
- **Estimated timeline: Month 3-4**

---

## Key Metrics to Track

| Metric | Target (Month 6) | Target (Month 12) |
|--------|-------------------|--------------------|
| MRR | $6,200 | $18,000 |
| Paying customers | 110 | 320 |
| Monthly churn (M4+ cohorts) | <10% | <6% |
| Free → Paid conversion | 15% | 20% |
| Contact Reveal attach rate | 10% | 25% |
| CAC (blended) | <$50 | <$80 |
| NPS | >30 | >40 |

---

## Risks to This Model

1. **Churn higher than modeled:** If Month 7+ churn stays above 8%, LTV drops below $500 and unit economics break. Mitigation: invest heavily in onboarding and "aha moment" (first successful location find).

2. **Free tier too generous:** If 3 free searches/month satisfies most users, conversion suffers. Mitigation: limit free tier to basic scoring only (no AI reasoning, no PDF, no save).

3. **Contact Reveal adoption low:** If operators don't need decision-maker contact info, the per-use revenue stream underperforms. Mitigation: test pricing at $3-5 range and build it into natural workflow.

4. **API costs scale faster than revenue:** Google Places API at scale can get expensive. Mitigation: aggressive caching (locations don't change fast), rate limits on free tier, consider SafeGraph bulk data license at 500+ active users.

---

_This model should be reviewed and updated monthly as real data comes in from beta users._
