const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  ExternalHyperlink, TabStopType, TabStopPosition
} = require("docx");

// ─── Constants ───────────────────────────────────────────────────────────
const PAGE_WIDTH = 12240;
const MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 9360

const COLORS = {
  primary: "1A3A5C",
  accent: "2E75B6",
  success: "2E7D32",
  warning: "E65100",
  danger: "C62828",
  lightBg: "F0F4F8",
  medBg: "E1E8EF",
  darkText: "1A1A1A",
  medText: "4A5568",
  lightText: "718096",
  white: "FFFFFF",
  black: "000000",
  tableBorder: "B0BEC5",
  headerBg: "1A3A5C",
  rowAlt: "F8FAFC",
};

const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};
const cellMargins = { top: 60, bottom: 60, left: 120, right: 120 };

// ─── Helpers ─────────────────────────────────────────────────────────────
function heading(text, level = HeadingLevel.HEADING_1, opts = {}) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
    ...opts,
    children: [new TextRun({ text, bold: true, font: "Arial", size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22, color: COLORS.primary })],
  });
}

function para(text, opts = {}) {
  const runs = [];
  // Simple bold support via **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: "Arial", size: 22, color: opts.color || COLORS.darkText }));
    } else {
      runs.push(new TextRun({ text: part, font: "Arial", size: 22, color: opts.color || COLORS.darkText }));
    }
  }
  return new Paragraph({ spacing: { after: 160 }, ...opts, children: runs });
}

function bulletItem(text, level = 0) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: "Arial", size: 22, color: COLORS.darkText }));
    } else {
      runs.push(new TextRun({ text: part, font: "Arial", size: 22, color: COLORS.darkText }));
    }
  }
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 80 },
    children: runs,
  });
}

function numberItem(text, level = 0) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: "Arial", size: 22, color: COLORS.darkText }));
    } else {
      runs.push(new TextRun({ text: part, font: "Arial", size: 22, color: COLORS.darkText }));
    }
  }
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { after: 80 },
    children: runs,
  });
}

function spacer(height = 120) {
  return new Paragraph({ spacing: { after: height }, children: [] });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.accent, space: 1 } },
    spacing: { before: 200, after: 200 },
    children: [],
  });
}

function calloutBox(title, bodyLines, color = COLORS.warning) {
  const children = [
    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: title, bold: true, font: "Arial", size: 22, color })] }),
  ];
  for (const line of bodyLines) {
    children.push(para(line, { color: COLORS.darkText }));
  }
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [new TableRow({
      children: [new TableCell({
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.SINGLE, size: 12, color },
        },
        shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        children,
      })],
    })],
  });
}

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Arial", size: 20, color: COLORS.white })] })],
  });
}

function dataCell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({
        text,
        font: "Arial",
        size: 20,
        color: opts.color || COLORS.darkText,
        bold: opts.bold || false,
      })],
    })],
  });
}

// ─── Document ────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: COLORS.primary },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: COLORS.primary },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: COLORS.primary },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ] },
      { reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2)", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ] },
    ],
  },
  sections: [
    // ═══════════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: 15840 },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: [
        spacer(2400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "VENDRADAR", font: "Arial", size: 56, bold: true, color: COLORS.primary })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Foot Traffic Aggregator Engine", font: "Arial", size: 36, color: COLORS.accent })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: "Product Requirements Document v2.0", font: "Arial", size: 24, color: COLORS.medText })],
        }),
        divider(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "Technical Review & Revised Architecture", font: "Arial", size: 24, color: COLORS.medText })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "February 19, 2026", font: "Arial", size: 22, color: COLORS.lightText })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "Authors: Chris Karlin (Claude \u00B7 Cowork) | For: Pax (OpenClaw)", font: "Arial", size: 22, color: COLORS.lightText })],
        }),
        spacer(600),
        new Table({
          width: { size: 6000, type: WidthType.DXA },
          columnWidths: [2400, 3600],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "Status:", font: "Arial", size: 20, bold: true, color: COLORS.medText })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3600, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "REVIEW / PRE-BUILD", font: "Arial", size: 20, bold: true, color: COLORS.warning })] })] }),
            ] }),
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "Priority:", font: "Arial", size: 20, bold: true, color: COLORS.medText })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3600, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "HIGH \u2014 Core scoring engine", font: "Arial", size: 20, color: COLORS.darkText })] })] }),
            ] }),
            new TableRow({ children: [
              new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "Affects:", font: "Arial", size: 20, bold: true, color: COLORS.medText })] })] }),
              new TableCell({ borders: noBorders, width: { size: 3600, type: WidthType.DXA }, margins: cellMargins,
                children: [new Paragraph({ children: [new TextRun({ text: "scoring.ts, types.ts, /api/search, new modules", font: "Arial", size: 20, color: COLORS.darkText })] })] }),
            ] }),
          ],
        }),
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // MAIN CONTENT
    // ═══════════════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: 15840 },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.accent, space: 4 } },
            children: [
              new TextRun({ text: "VendRadar PRD", font: "Arial", size: 18, color: COLORS.medText }),
              new TextRun({ text: "\tFoot Traffic Aggregator v2.0", font: "Arial", size: 18, color: COLORS.medText }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Arial", size: 18, color: COLORS.lightText }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: COLORS.lightText }),
            ],
          })],
        }),
      },
      children: [
        // ── SECTION 1: EXECUTIVE SUMMARY ──────────────────────────────
        heading("1. Executive Summary"),
        para("This document is a technical review of the foot traffic aggregator architecture proposed for VendRadar, plus a revised build plan with additional data source recommendations. It is intended to be read before any code is written."),
        para("The original spec (from Pax\u2019s prompt) proposes building a multi-source foot traffic aggregation engine that pulls from Google Popular Times, Google Places, Yelp, OpenStreetMap, and Foursquare to produce a composite foot traffic score (0\u2013100) with confidence levels and daily visit estimates."),
        para("**The architecture is sound. Several implementation choices need revision.** This document covers what\u2019s solid, what will break in production, and what we should build instead."),

        divider(),

        // ── SECTION 2: WHAT'S SOLID ───────────────────────────────────
        heading("2. What\u2019s Solid in the Current Spec"),
        para("These parts of the original spec are well-designed and should be kept as-is:"),
        bulletItem("**Type definitions** \u2014 The AggregatedFootTraffic and SignalResult interfaces are clean and extensible. The output shape is exactly right for the UI."),
        bulletItem("**Category-specific weights** \u2014 Different vending categories legitimately need different signal priorities. Transit hubs care about Popular Times 40%, offices care about OSM density 20%. This is real domain insight."),
        bulletItem("**Graceful degradation strategy** \u2014 Skip failed sources, don\u2019t crash. Use Promise.allSettled for parallel fetching. This is the correct pattern for multi-source aggregation."),
        bulletItem("**Confidence scoring model** \u2014 HIGH/MEDIUM/LOW based on signal availability is the right abstraction for operators who need to know how much to trust a score."),
        bulletItem("**Insights generator** \u2014 Helping/hurting breakdown gives operators actionable context, not just a number."),
        bulletItem("**Existing codebase quality** \u2014 The current scoring.ts, types.ts, and data-provider.ts are well-organized. The API route properly handles Census + Google Places with fallbacks."),

        divider(),

        // ── SECTION 3: CRITICAL ISSUES ────────────────────────────────
        heading("3. Critical Issues That Need Fixing"),
        spacer(80),

        // 3.1
        heading("3.1 Google Popular Times Scraping on Vercel", HeadingLevel.HEADING_2),
        calloutBox("BLOCKING ISSUE", [
          "The spec proposes Puppeteer with @sparticuz/chromium or the Python populartimes package. Both are problematic on Vercel and should not be built as specified.",
        ], COLORS.danger),
        spacer(80),
        para("**Problem 1: Python populartimes package.** This package hasn\u2019t been maintained in years. It scrapes Google Maps HTML, which Google changes frequently \u2014 it breaks constantly. Running a Python child process from a Next.js serverless function on Vercel is also messy and requires a Python runtime layer."),
        para("**Problem 2: Puppeteer on Vercel.** Vercel serverless functions have a 50MB package size limit, and chromium alone is ~45MB compressed. You\u2019ll also hit Vercel\u2019s 10-second default timeout (extendable to 60s on Pro, 300s on Enterprise). Google actively fights scraping with CAPTCHAs and dynamic rendering."),
        para("**Problem 3: In-memory caching is useless on serverless.** The spec suggests node-cache with 7-day TTL, but each Vercel invocation may hit a different container. Each cold start gets a fresh, empty cache."),
        spacer(80),
        para("**Recommended approach:** Skip Popular Times scraping entirely for V1. Use the Google Places data already being collected (review counts + rating) as the primary engagement proxy. If Popular Times is critical, use BestTime.app ($9/month Basic tier, provides the same hourly busyness 0\u2013100 data via REST API) or set up a separate scraping microservice on Railway/Fly.io where you can run a persistent process. Do not fight the Vercel serverless model with Puppeteer."),

        spacer(120),

        // 3.2
        heading("3.2 Yelp Rate Limit Math", HeadingLevel.HEADING_2),
        para("The spec notes Yelp\u2019s free tier is 500 requests/day. But each VendRadar search queries multiple locations across multiple categories. If a user searches \u201CAustin, TX\u201D with 3 categories and gets 6 results each, that\u2019s 18 Yelp API calls for one search. You\u2019ll burn through 500 in under 30 searches per day."),
        para("**Fix:** Use Yelp\u2019s Business Match endpoint (/v3/businesses/matches) instead of Business Search \u2014 it\u2019s more precise and returns a single match per call. Implement a daily request counter. After 400 calls, gracefully skip Yelp for the rest of the day. Cache Yelp results for 24\u201348 hours since review counts don\u2019t change hourly."),

        spacer(120),

        // 3.3
        heading("3.3 Foursquare at 50 Requests/Day Is Not Worth It", HeadingLevel.HEADING_2),
        para("At 50 requests/day, you\u2019ll exhaust the Foursquare quota after 2\u20133 searches. The weight it carries (10\u201315%) means even a perfect Foursquare signal only moves the composite score by ~10 points at most. The engineering effort and API key management don\u2019t justify the marginal signal improvement."),
        para("**Fix:** Drop Foursquare from V1 entirely. Redistribute its weight across the remaining sources. Add it later when you have budget for a paid tier or need more signal fidelity."),

        spacer(120),

        // 3.4
        heading("3.4 Caching Strategy Must Be Vercel-Aware", HeadingLevel.HEADING_2),
        para("In-memory caches (node-cache, Map objects) are useless beyond a single serverless invocation on Vercel \u2014 each request might hit a different container."),
        para("**Fix:** Use Vercel KV (Redis) if budget allows (free tier: 3,000 requests/day, 256MB storage). Otherwise, use Next.js fetch() with revalidate for CDN-level caching, or the /tmp filesystem as a crude per-container cache (accepting cache misses on cold starts)."),

        spacer(120),

        // 3.5
        heading("3.5 Missing Per-Source Timeouts", HeadingLevel.HEADING_2),
        para("The spec correctly says to use Promise.allSettled for parallelization, but doesn\u2019t mention per-source timeouts. If the Overpass API takes 8 seconds, the whole response waits 8 seconds even though every other source responded in 500ms."),
        para("**Fix:** Wrap each source fetch with Promise.race([fetchSource(), timeout(2000)]). If a source times out, treat it as a failure \u2014 skip it and reduce confidence. This guarantees the aggregate endpoint responds within 3 seconds."),

        spacer(120),

        // 3.6
        heading("3.6 The buildingType Score Is Still a Census Heuristic", HeadingLevel.HEADING_2),
        para("The existing scoring.ts has a TODO comment saying \u201CReplace with Google Places API types field.\u201D The aggregator spec doesn\u2019t address this. Since the aggregator already pulls Google Places data and OpenStreetMap data, this is the perfect time to fix buildingType scoring using real building classification data instead of Census-derived guesswork."),
        para("**Fix:** Create a building-type-classifier.ts that uses Google Places types[] array + OSM building tags to produce a real buildingType score. Keep estimateBuildingTypeFit() as the fallback when Places/OSM data is unavailable."),

        spacer(120),

        // 3.7
        heading("3.7 Overpass API Guardrails", HeadingLevel.HEADING_2),
        para("The spec says \u201CFind all POIs within 500m\u201D without complexity limits. In dense urban areas (Manhattan, downtown Chicago), this can return thousands of results and take 10+ seconds. The Overpass API has informal rate limits and will throttle you."),
        para("**Fix:** Cap Overpass queries to return at most 200 results (use [out:json][timeout:5]). Reduce the radius to 300m in high-density areas. Cache OSM results for 30 days \u2014 POI data changes very slowly."),

        divider(),

        // ── SECTION 4: ADDITIONAL DATA SOURCES ────────────────────────
        heading("4. Additional Data Sources to Consider"),
        para("Beyond the original spec\u2019s five sources, there are several high-value free data sources that would meaningfully improve the aggregator\u2019s accuracy. Here are my recommendations in priority order:"),

        spacer(80),

        // 4.1
        heading("4.1 Walk Score API (FREE tier available)", HeadingLevel.HEADING_2),
        para("Walk Score returns a walkability score (0\u2013100), Transit Score, and Bike Score for any US/Canada address. It\u2019s calculated by analyzing hundreds of walking routes to nearby amenities, weighted by distance. Research published in the NIH confirms Walk Score significantly correlates with pedestrian density, street connectivity, and access to transit \u2014 all direct proxies for foot traffic."),
        para("**What it gives us:** A single 0\u2013100 walkability score that synthesizes amenity density, street connectivity, and transit access into one number \u2014 essentially a pre-built foot traffic proxy."),
        para("**Why it\u2019s valuable for VendRadar:** High Walk Score locations have more pedestrians. For vending categories like transit hubs, hotels, and apartments, Walk Score is arguably a better foot traffic proxy than Google review counts. For categories like manufacturing and hospitals, it matters less."),
        para("**Integration:** Single GET request per address. Returns immediately. Free tier with API key."),
        para("**Recommended weight: 10\u201320%** depending on category (high for transit/hotel/apartment, low for manufacturing/hospital)."),

        spacer(80),

        // 4.2
        heading("4.2 Census LEHD/LODES Employment Data (FREE)", HeadingLevel.HEADING_2),
        para("The Longitudinal Employer-Household Dynamics (LEHD) Origin-Destination Employment Statistics dataset provides the number of jobs located in each census block, where workers live, and where they commute to. This is the only source of fine-grained workplace density data for the entire US, and it\u2019s completely free."),
        para("**What it gives us:** Workplace Area Characteristics (WAC) data tells us how many people work in a given census block. For office buildings, manufacturing plants, and hospitals, this is the most direct measure of \u201Chow many humans are here during work hours.\u201D"),
        para("**Why it\u2019s valuable for VendRadar:** The current system uses Census population data, but population measures where people live, not where they work. A downtown census tract might have 2,000 residents but 50,000 workers. LEHD captures the workers. This is a huge signal for office, manufacturing, and hospital categories."),
        para("**Integration:** Static CSV files downloadable from the Census Bureau (lehd.ces.census.gov/data/lodes/). Can be pre-processed and indexed by census block/tract. No API rate limits. Update annually."),
        para("**Recommended weight: 15\u201325%** for work-destination categories (office, manufacturing, hospital), 0\u20135% for residential categories (apartment)."),

        spacer(80),

        // 4.3
        heading("4.3 EPA Smart Location Database (FREE)", HeadingLevel.HEADING_2),
        para("The EPA\u2019s Smart Location Database provides 90+ built-environment indicators at the census block group level, including: development density, land use diversity, street network design, destination accessibility, and the National Walkability Index. This is pre-computed, authoritative federal data."),
        para("**What it gives us:** Intersection density (walkable grid vs cul-de-sacs), jobs-per-acre (employment concentration), land use entropy (mixed-use vs single-use), transit frequency, and the composite National Walkability Index."),
        para("**Why it\u2019s valuable for VendRadar:** These indicators directly predict whether people walk past a location. A block group with high intersection density, mixed land use, and frequent transit has fundamentally different foot traffic characteristics than a suburban office park \u2014 even if both have the same population. This fills a gap no other source covers."),
        para("**Integration:** Downloadable as shapefile/CSV from epa.gov. Pre-process once, query by block group ID. No API, no rate limits, no cost."),
        para("**Recommended weight: 5\u201310%** as a built-environment quality modifier across all categories."),

        spacer(80),

        // 4.4
        heading("4.4 BestTime.app API ($9/month or 100 free credits)", HeadingLevel.HEADING_2),
        para("BestTime.app provides hourly foot traffic forecasts (0\u2013100% busyness) for public businesses worldwide, using anonymized phone signals. It\u2019s essentially a productized, reliable version of Google Popular Times data, delivered via REST API with no scraping risk."),
        para("**What it gives us:** The exact same hourly busyness histogram (0\u2013100 per hour, per day of week) that the original spec wanted from Google Popular Times scraping \u2014 but without Puppeteer, without IP bans, and without fighting Vercel\u2019s serverless constraints."),
        para("**Why it\u2019s valuable for VendRadar:** This is the single highest-value signal for peak hour identification and daily pattern analysis. The original spec correctly weighted Popular Times at 25\u201340% depending on category. BestTime delivers this data cleanly."),
        para("**Integration:** REST API, returns JSON. Basic plan ($9/mo) gives 450 credits/month. One credit per venue forecast. Cache results for 7 days."),
        para("**Recommended approach:** Start with the 100 free credits to validate the signal\u2019s impact. If it materially improves scoring accuracy, upgrade to $9/month. This replaces the entire Puppeteer scraping stack at 1/100th the complexity."),

        spacer(80),

        // 4.5
        heading("4.5 GTFS Public Transit Feeds (FREE)", HeadingLevel.HEADING_2),
        para("General Transit Feed Specification (GTFS) data from public transit agencies provides exact stop locations, route frequencies, and schedules. Over 2,500 transit agencies worldwide publish GTFS feeds. Unlike the OSM transit data the spec already includes, GTFS gives you schedule frequency (how many buses per hour stop near a location), which is a much stronger foot traffic signal than mere proximity."),
        para("**What it gives us:** Transit stop locations with service frequency data. A bus stop with 40 buses/hour generates far more foot traffic than one with 4 buses/hour \u2014 OSM treats them identically, GTFS differentiates them."),
        para("**Integration:** Static files from transitfeeds.com or individual agency websites. Parse GTFS stop_times.txt to count service frequency per stop. Pre-process and cache."),
        para("**Recommended weight:** Subsume into the existing OpenStreetMap transit signal. Use GTFS frequency as a multiplier on the transit bonus rather than a separate signal."),

        divider(),

        // ── SECTION 5: REVISED DATA SOURCE TABLE ──────────────────────
        heading("5. Revised Data Source Priority Table"),
        spacer(80),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [1800, 1200, 1100, 1300, 1200, 1100, 1660],
          rows: [
            new TableRow({ children: [
              headerCell("Source", 1800), headerCell("Cost", 1200), headerCell("Rate Limit", 1100),
              headerCell("Signal Value", 1300), headerCell("Complexity", 1200), headerCell("Priority", 1100), headerCell("Recommendation", 1660),
            ] }),
            new TableRow({ children: [
              dataCell("Google Places", 1800, { bold: true }), dataCell("Free*", 1200), dataCell("28k/mo", 1100),
              dataCell("HIGH", 1300, { color: COLORS.success }), dataCell("Low", 1200), dataCell("V1 KEEP", 1100, { bold: true }), dataCell("Already built", 1660),
            ] }),
            new TableRow({ children: [
              dataCell("OpenStreetMap", 1800, { bold: true, shading: COLORS.rowAlt }), dataCell("Free", 1200, { shading: COLORS.rowAlt }),
              dataCell("Fair use", 1100, { shading: COLORS.rowAlt }), dataCell("HIGH", 1300, { color: COLORS.success, shading: COLORS.rowAlt }),
              dataCell("Medium", 1200, { shading: COLORS.rowAlt }), dataCell("V1 BUILD", 1100, { bold: true, shading: COLORS.rowAlt }),
              dataCell("Add with guardrails", 1660, { shading: COLORS.rowAlt }),
            ] }),
            new TableRow({ children: [
              dataCell("Yelp Fusion", 1800, { bold: true }), dataCell("Free", 1200), dataCell("500/day", 1100),
              dataCell("MEDIUM", 1300, { color: COLORS.warning }), dataCell("Low", 1200), dataCell("V1 BUILD", 1100, { bold: true }),
              dataCell("Use Business Match", 1660),
            ] }),
            new TableRow({ children: [
              dataCell("Walk Score", 1800, { bold: true, shading: COLORS.rowAlt }), dataCell("Free*", 1200, { shading: COLORS.rowAlt }),
              dataCell("Varies", 1100, { shading: COLORS.rowAlt }), dataCell("HIGH", 1300, { color: COLORS.success, shading: COLORS.rowAlt }),
              dataCell("Very Low", 1200, { shading: COLORS.rowAlt }), dataCell("V1 BUILD", 1100, { bold: true, shading: COLORS.rowAlt }),
              dataCell("NEW \u2014 single API call", 1660, { shading: COLORS.rowAlt }),
            ] }),
            new TableRow({ children: [
              dataCell("Census LEHD", 1800, { bold: true }), dataCell("Free", 1200), dataCell("None", 1100),
              dataCell("HIGH", 1300, { color: COLORS.success }), dataCell("Medium", 1200), dataCell("V1 BUILD", 1100, { bold: true }),
              dataCell("NEW \u2014 pre-process CSVs", 1660),
            ] }),
            new TableRow({ children: [
              dataCell("EPA Smart Loc.", 1800, { bold: true, shading: COLORS.rowAlt }), dataCell("Free", 1200, { shading: COLORS.rowAlt }),
              dataCell("None", 1100, { shading: COLORS.rowAlt }), dataCell("MEDIUM", 1300, { color: COLORS.warning, shading: COLORS.rowAlt }),
              dataCell("Medium", 1200, { shading: COLORS.rowAlt }), dataCell("V1.5", 1100, { shading: COLORS.rowAlt }),
              dataCell("NEW \u2014 nice enrichment", 1660, { shading: COLORS.rowAlt }),
            ] }),
            new TableRow({ children: [
              dataCell("BestTime.app", 1800, { bold: true }), dataCell("$9/mo", 1200), dataCell("450/mo", 1100),
              dataCell("VERY HIGH", 1300, { color: COLORS.success }), dataCell("Very Low", 1200), dataCell("V1 BUILD", 1100, { bold: true }),
              dataCell("NEW \u2014 replaces scraper", 1660),
            ] }),
            new TableRow({ children: [
              dataCell("GTFS Feeds", 1800, { bold: true, shading: COLORS.rowAlt }), dataCell("Free", 1200, { shading: COLORS.rowAlt }),
              dataCell("None", 1100, { shading: COLORS.rowAlt }), dataCell("MEDIUM", 1300, { color: COLORS.warning, shading: COLORS.rowAlt }),
              dataCell("High", 1200, { shading: COLORS.rowAlt }), dataCell("V2", 1100, { shading: COLORS.rowAlt }),
              dataCell("Enhances transit signal", 1660, { shading: COLORS.rowAlt }),
            ] }),
            new TableRow({ children: [
              dataCell("Foursquare", 1800, { bold: true }), dataCell("Free", 1200), dataCell("50/day", 1100),
              dataCell("LOW", 1300, { color: COLORS.danger }), dataCell("Low", 1200), dataCell("DROP", 1100, { bold: true, color: COLORS.danger }),
              dataCell("Not worth 50/day limit", 1660),
            ] }),
            new TableRow({ children: [
              dataCell("Popular Times", 1800, { bold: true, shading: COLORS.rowAlt }), dataCell("Free*", 1200, { shading: COLORS.rowAlt }),
              dataCell("IP risk", 1100, { shading: COLORS.rowAlt }), dataCell("HIGH", 1300, { color: COLORS.success, shading: COLORS.rowAlt }),
              dataCell("Very High", 1200, { shading: COLORS.rowAlt }), dataCell("DROP", 1100, { bold: true, color: COLORS.danger, shading: COLORS.rowAlt }),
              dataCell("Use BestTime instead", 1660, { shading: COLORS.rowAlt }),
            ] }),
          ],
        }),

        divider(),

        // ── SECTION 6: REVISED ARCHITECTURE ───────────────────────────
        heading("6. Revised Build Plan"),
        para("Based on the review above, here\u2019s what I recommend Pax actually builds:"),

        spacer(80),

        heading("6.1 V1 Deliverables (Build Now)", HeadingLevel.HEADING_2),
        spacer(40),

        numberItem("**/src/lib/foot-traffic-aggregator.ts** \u2014 Main aggregator module with 5 source fetchers (Google Places enhanced, OpenStreetMap, Yelp Business Match, Walk Score, BestTime.app). Each fetcher wrapped with 2-second AbortController timeout. All fetched in parallel via Promise.allSettled."),
        numberItem("**/src/lib/building-type-classifier.ts** \u2014 Uses Google Places types[] array + OSM building tags to produce a real buildingType score (0\u2013100). Falls back to the existing estimateBuildingTypeFit() when Places/OSM data is unavailable. This kills the Census heuristic."),
        numberItem("**/src/lib/lehd-data.ts** \u2014 Pre-processed LEHD workplace employment data indexed by census tract. Provides workplace density signal for office, manufacturing, and hospital categories."),
        numberItem("**/src/lib/scoring.ts update** \u2014 Modify calculateLocationScore() to accept AggregatedFootTraffic as the footTraffic parameter. Update buildingType to use the classifier output."),
        numberItem("**/src/lib/types.ts update** \u2014 Add AggregatedFootTraffic, SignalResult, and BuildingClassification interfaces. Replace raw: any with typed per-source interfaces."),
        numberItem("**.env.example additions** \u2014 YELP_API_KEY, WALK_SCORE_API_KEY, BESTTIME_API_KEY. Note: use GOOGLE_MAPS_API_KEY (server-only, no NEXT_PUBLIC prefix) for the aggregator to avoid leaking the key to the browser."),
        numberItem("**Unit tests** (Jest) \u2014 Normalization functions edge cases (0 reviews, 1000+ reviews, all signals missing, single signal only). Integration test verifying graceful degradation when sources fail."),

        spacer(120),

        heading("6.2 V1.5 Deliverables (Next Sprint)", HeadingLevel.HEADING_2),
        bulletItem("EPA Smart Location Database integration for built-environment quality scoring"),
        bulletItem("Vercel KV caching layer (7-day TTL for BestTime/Yelp, 30-day for OSM/LEHD)"),
        bulletItem("GTFS transit frequency data to enhance the OSM transit signal"),

        spacer(120),

        heading("6.3 Dropped from Scope", HeadingLevel.HEADING_2),
        bulletItem("**Google Popular Times scraper** \u2014 replaced by BestTime.app API"),
        bulletItem("**/api/popular-times/route.ts** \u2014 no longer needed"),
        bulletItem("**Foursquare Places API** \u2014 50/day rate limit makes it impractical"),
        bulletItem("**Puppeteer / @sparticuz/chromium** \u2014 not compatible with Vercel\u2019s serverless model for this use case"),

        divider(),

        // ── SECTION 7: REVISED WEIGHTS ────────────────────────────────
        heading("7. Revised Category Weight Profiles"),
        para("With the source changes above, here are the revised weights. These sum to 100 per category and reflect the actual sources being built:"),

        spacer(80),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [1300, 1300, 1300, 1000, 1300, 1260, 1500],
          rows: [
            new TableRow({ children: [
              headerCell("Category", 1300), headerCell("BestTime", 1300), headerCell("Google Pl.", 1300),
              headerCell("Yelp", 1000), headerCell("OSM", 1300), headerCell("Walk Sc.", 1260), headerCell("LEHD Work", 1500),
            ] }),
            ...([
              ["office",        "25", "20", "10", "15", "10", "20"],
              ["gym",           "25", "25", "20", "10", "15", "5"],
              ["hospital",      "30", "15", "5",  "15", "10", "25"],
              ["school",        "25", "20", "10", "15", "20", "10"],
              ["manufacturing", "25", "10", "5",  "25", "5",  "30"],
              ["apartment",     "20", "20", "15", "15", "25", "5"],
              ["hotel",         "30", "25", "20", "10", "15", "0"],
              ["transit",       "35", "15", "5",  "15", "25", "5"],
            ]).map((row, i) => new TableRow({ children: row.map((val, j) =>
              dataCell(val, j === 0 ? 1300 : j === 1 ? 1300 : j === 2 ? 1300 : j === 3 ? 1000 : j === 4 ? 1300 : j === 5 ? 1260 : 1500,
                { bold: j === 0, shading: i % 2 === 1 ? COLORS.rowAlt : undefined })
            ) })),
          ],
        }),

        spacer(80),
        para("Note: When BestTime.app is unavailable (credits exhausted or API down), its weight redistributes proportionally across the remaining available signals. The confidence level drops to MEDIUM or LOW accordingly."),

        divider(),

        // ── SECTION 8: TECHNICAL NOTES ────────────────────────────────
        heading("8. Additional Technical Notes"),
        spacer(80),

        heading("8.1 TypeScript Strict Mode", HeadingLevel.HEADING_3),
        para("The SignalResult interface has raw: any in the original spec. Since the prompt specifies TypeScript strict mode, this should be typed per source (GooglePlacesRaw, YelpRaw, etc.) or at minimum use Record<string, unknown> instead of any."),

        heading("8.2 Normalization Functions", HeadingLevel.HEADING_3),
        para("The Google Places review count normalization uses hardcoded breakpoints (0=0, 50=40, 200=65, etc.). A continuous log function would be cleaner and more maintainable: Math.min(95, Math.floor(20 * Math.log10(reviewCount + 1))). This produces a smooth curve without arbitrary thresholds."),

        heading("8.3 Daily Visits Estimation", HeadingLevel.HEADING_3),
        para("The original spec\u2019s calibration table is incomplete (\u201Cetc.\u201D after a few categories). Before building, fully specify all 8 categories with research-backed ranges. The existing FOOT-TRAFFIC-STRATEGY.md has better-defined ranges per category \u2014 use those as the starting point."),

        heading("8.4 API Key Security", HeadingLevel.HEADING_3),
        para("The existing codebase uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (browser-exposed) in both client and server code. The aggregator should use a server-only GOOGLE_MAPS_API_KEY (no NEXT_PUBLIC prefix) to prevent the key from being bundled into client JavaScript."),

        heading("8.5 Overpass Query Optimization", HeadingLevel.HEADING_3),
        para("For dense urban areas, use Overpass\u2019s [maxsize:] parameter and [timeout:5] to prevent queries from hanging. Count POIs by type (amenity, shop, leisure, tourism) for richer signal quality rather than a raw count."),

        divider(),

        // ── SECTION 9: FILE STRUCTURE ─────────────────────────────────
        heading("9. Updated File Structure"),
        spacer(80),

        para("/src", { color: COLORS.accent }),
        para("  /app"),
        para("    /api"),
        para("      /search/route.ts              \u2190 existing, update to use aggregator"),
        para("  /lib"),
        para("    /types.ts                        \u2190 existing, add new interfaces"),
        para("    /scoring.ts                      \u2190 existing, update to accept AggregatedFootTraffic"),
        para("    /mock-data.ts                    \u2190 existing"),
        para("    /data-provider.ts                \u2190 existing"),
        para("    /foot-traffic-aggregator.ts      \u2190 NEW (main deliverable)"),
        para("    /building-type-classifier.ts     \u2190 NEW (replaces Census heuristic)"),
        para("    /lehd-data.ts                    \u2190 NEW (workplace density signal)"),
        para("    /sources/                        \u2190 NEW directory"),
        para("      /google-places.ts              \u2190 enhanced Places fetcher"),
        para("      /openstreetmap.ts              \u2190 Overpass API fetcher"),
        para("      /yelp.ts                       \u2190 Business Match fetcher"),
        para("      /walk-score.ts                 \u2190 Walk Score API fetcher"),
        para("      /besttime.ts                   \u2190 BestTime.app API fetcher"),
        para("  /__tests__/"),
        para("    /normalization.test.ts            \u2190 NEW"),
        para("    /aggregator.test.ts              \u2190 NEW"),

        divider(),

        // ── SECTION 10: SUMMARY ───────────────────────────────────────
        heading("10. Summary of Changes from Original Spec"),
        spacer(80),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({ children: [
              headerCell("Original Spec", 3120), headerCell("This PRD", 3120), headerCell("Reason", 3120),
            ] }),
            ...([
              ["Puppeteer Popular Times scraper", "BestTime.app API ($9/mo)", "Serverless-compatible, no IP risk"],
              ["Foursquare (50 req/day)", "Dropped", "Rate limit too low for practical use"],
              ["5 data sources", "6 sources + 2 enrichments", "Walk Score, LEHD, EPA added"],
              ["node-cache in-memory", "Vercel KV or fetch revalidate", "Serverless-aware caching"],
              ["No per-source timeouts", "2s AbortController per source", "Guarantees <3s response"],
              ["Census buildingType heuristic", "Google Places + OSM classifier", "Real building data vs guesswork"],
              ["raw: any in SignalResult", "Typed per-source interfaces", "TypeScript strict compliance"],
              ["/api/popular-times route", "Removed", "BestTime replaces scraping"],
            ]).map((row, i) => new TableRow({ children: row.map((val, j) =>
              dataCell(val, 3120, { shading: i % 2 === 1 ? COLORS.rowAlt : undefined })
            ) })),
          ],
        }),

        spacer(200),

        calloutBox("BOTTOM LINE", [
          "This revised architecture gets 80% of the value at 50% of the complexity. It avoids the Puppeteer-on-Vercel trap that would eat days of debugging, adds three high-value free data sources (Walk Score, LEHD, EPA), and replaces the riskiest part of the original spec (scraping) with a $9/month API that delivers the exact same data.",
          "Tell Pax to start with the aggregator module and the BestTime/Walk Score integrations \u2014 those are the highest-impact, lowest-risk pieces.",
        ], COLORS.success),

        spacer(200),

        divider(),
        para("Sources consulted: Placer.ai, BestTime.app, Walk Score API, EPA Smart Location Database, Census LEHD/LODES, SafeGraph/Dewey, Datarade marketplace.", { color: COLORS.lightText }),
      ],
    },
  ],
});

// ─── Generate ────────────────────────────────────────────────────────────
const outputPath = process.argv[2] || "PRD-foot-traffic-aggregator-v2.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Written: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
});
