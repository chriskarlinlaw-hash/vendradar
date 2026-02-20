const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber, PageBreak, LevelFormat, ExternalHyperlink } = require("docx");

const outputPath = process.argv[2] || "VendRadar-Strategic-Roadmap-v1.docx";

// ── Constants ──
const PAGE_WIDTH = 12240;
const MARGIN = 1440;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 9360
const ACCENT = "1B4F72";
const ACCENT_LIGHT = "D6EAF8";
const ACCENT_MED = "85C1E9";
const DARK = "2C3E50";
const GRAY = "7F8C8D";
const LIGHT_BG = "F8F9FA";
const WHITE = "FFFFFF";
const border = { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

// ── Helpers ──
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 200 }, children: [new TextRun({ text, font: "Arial", bold: true, size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22, color: ACCENT })] });
}

function para(text, opts = {}) {
  return new Paragraph({ spacing: { after: opts.afterSpacing || 160, line: 276 }, alignment: opts.align || AlignmentType.LEFT, children: [new TextRun({ text, font: "Arial", size: opts.size || 22, color: opts.color || DARK, bold: opts.bold || false, italics: opts.italics || false })] });
}

function richPara(runs, opts = {}) {
  return new Paragraph({ spacing: { after: opts.afterSpacing || 160, line: 276 }, alignment: opts.align || AlignmentType.LEFT, children: runs.map(r => new TextRun({ font: "Arial", size: 22, color: DARK, ...r })) });
}

function calloutBox(title, bodyLines, fillColor = ACCENT_LIGHT, accentColor = ACCENT) {
  const rows = [];
  const cellChildren = [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: accentColor })] })];
  bodyLines.forEach(line => {
    cellChildren.push(new Paragraph({ spacing: { after: 60, line: 260 }, children: [new TextRun({ text: line, font: "Arial", size: 20, color: DARK })] }));
  });
  rows.push(new TableRow({ children: [
    new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 12, color: accentColor } }, width: { size: CONTENT_WIDTH, type: WidthType.DXA }, shading: { fill: fillColor, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 200, right: 200 }, children: cellChildren })
  ] }));
  return new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [CONTENT_WIDTH], rows });
}

function dataTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({ children: headers.map((h, i) => new TableCell({
    borders, width: { size: colWidths[i], type: WidthType.DXA },
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: WHITE })] })]
  })) });

  const dataRows = rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => new TableCell({
    borders, width: { size: colWidths[ci], type: WidthType.DXA },
    shading: { fill: ri % 2 === 0 ? WHITE : LIGHT_BG, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(cell), font: "Arial", size: 20, color: DARK })] })]
  })) }));

  return new Table({ width: { size: totalWidth, type: WidthType.DXA }, columnWidths: colWidths, rows: [headerRow, ...dataRows] });
}

function spacer(size = 120) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

// ── Numbering config ──
const numbering = {
  config: [
    { reference: "rec-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "sub-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
    { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numbers2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numbers3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "numbers4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]
};

function bullet(text, ref = "rec-bullets") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 276 }, children: [new TextRun({ text, font: "Arial", size: 22, color: DARK })] });
}

function richBullet(runs, ref = "rec-bullets") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 276 }, children: runs.map(r => new TextRun({ font: "Arial", size: 22, color: DARK, ...r })) });
}

function numberedItem(text, ref = "numbers") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 276 }, children: [new TextRun({ text, font: "Arial", size: 22, color: DARK })] });
}

function richNumbered(runs, ref = "numbers") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 276 }, children: runs.map(r => new TextRun({ font: "Arial", size: 22, color: DARK, ...r })) });
}

// ── Build Document ──
const children = [];

// Title page
children.push(spacer(2000));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "VENDRADAR", font: "Arial", size: 56, bold: true, color: ACCENT })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Strategic Roadmap", font: "Arial", size: 40, color: DARK })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Making the Tool as Valuable as Possible", font: "Arial", size: 28, color: GRAY, italics: true })] }));
children.push(spacer(400));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "February 2026", font: "Arial", size: 22, color: GRAY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "Prepared for Pax / VendRadar", font: "Arial", size: 22, color: GRAY })] }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ── EXECUTIVE SUMMARY ──
children.push(heading("Executive Summary"));
children.push(para("The foot traffic aggregation engine is the technical foundation of VendRadar, but the tool\u2019s real value to vending operators lies in what it does with that data. This document outlines seven strategic recommendations designed to transform VendRadar from a location lookup tool into an indispensable operating system for vending placement decisions."));
children.push(para("The recommendations are ordered by impact and build on each other: a ground-truth feedback loop that makes every other feature smarter over time, revenue estimation that speaks operators\u2019 language, time-of-day intelligence that matches machine types to traffic patterns, category-aware competition analysis, property contact enrichment that shortens the sales cycle, saved searches that create recurring value, and route-aware scoring that serves multi-machine operators."));
children.push(spacer());

children.push(calloutBox("The Core Thesis", [
  "Any developer can pull Yelp counts and Census demographics. VendRadar\u2019s moat isn\u2019t data\u2014it\u2019s interpretation. The scoring algorithm that translates raw signals into \u201Cput a healthy snack machine here, not there, and here\u2019s why\u201D is where the product wins or loses."
]));
children.push(spacer());

// ── 1. GROUND-TRUTH FEEDBACK LOOP ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("1. Ground-Truth Feedback Loop"));
children.push(calloutBox("Priority: Highest \u2014 Build First", [
  "This is the single most impactful feature because it makes every other recommendation better over time. Without real-world calibration, the scoring model is educated guessing."
], "FEF9E7", "B7950B"));
children.push(spacer());

children.push(heading("The Problem", HeadingLevel.HEADING_2));
children.push(para("The current scoring model assigns category weights by intuition. Office buildings get 30% foot traffic, 25% demographics, 20% competition, 25% building type. These weights feel reasonable but are unvalidated. There\u2019s no mechanism to learn whether the model\u2019s recommendations actually correlate with vending revenue."));

children.push(heading("The Solution", HeadingLevel.HEADING_2));
children.push(para("Add a simple outcome reporting mechanism where operators can share placement results. The data model is minimal:"));
children.push(spacer(80));
children.push(dataTable(
  ["Field", "Type", "Purpose"],
  [
    ["Location (lat/lng or address)", "Geo coordinate", "Ties outcome to a scored location"],
    ["Machine category", "Enum (8 types)", "Maps to VendRadar\u2019s category model"],
    ["Weekly gross revenue", "Dollar amount", "The outcome variable"],
    ["Months in operation", "Integer", "Filters out new placements still ramping"],
    ["Machine age/condition", "Optional enum", "Controls for equipment quality"],
    ["Restocking frequency", "Optional", "Controls for operator attentiveness"]
  ],
  [2800, 1800, 4760]
));
children.push(spacer());

children.push(heading("Why It Matters", HeadingLevel.HEADING_2));
children.push(richBullet([{ text: "Model calibration: ", bold: true }, { text: "Even 50 data points let you run a regression against the composite score and see which weights actually predict revenue." }]));
children.push(richBullet([{ text: "Competitive moat: ", bold: true }, { text: "Nobody else has vending-specific placement outcome data. This dataset becomes more valuable with every submission." }]));
children.push(richBullet([{ text: "Feature validation: ", bold: true }, { text: "When you add new signals (BestTime, Walk Score, etc.), you can measure whether they improve predictions." }]));
children.push(richBullet([{ text: "Social proof: ", bold: true }, { text: "\u201COperators who followed VendRadar\u2019s top recommendation averaged $X/week\u201D is the most compelling marketing copy you can write." }]));

children.push(heading("Implementation Notes", HeadingLevel.HEADING_2));
children.push(bullet("Start with a simple form (not an API). Lower friction means more submissions."));
children.push(bullet("Offer something in return: free extended scoring, a \u201Cmarket benchmark\u201D report showing how their location compares to anonymized peers."));
children.push(bullet("Store in a Postgres table or Supabase. Keep it simple."));
children.push(bullet("Run quarterly model recalibration once you have 100+ data points. Monthly once you hit 500+."));
children.push(spacer());

// ── 2. REVENUE ESTIMATION ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("2. Revenue Estimation"));
children.push(calloutBox("Priority: High \u2014 Immediate \u201CAha Moment\u201D", [
  "Operators don\u2019t think in abstract scores from 0\u2013100. They think in dollars per week. Translating the composite score into an estimated revenue range makes the tool dramatically more actionable."
], "D5F5E3", "1E8449"));
children.push(spacer());

children.push(heading("The Problem", HeadingLevel.HEADING_2));
children.push(para("A score of 82 means nothing to a first-time operator evaluating whether to spend $3,000 on a machine and negotiate a lease. \u201C$200\u2013$350/week estimated\u201D tells them everything they need to make a decision."));

children.push(heading("The Solution", HeadingLevel.HEADING_2));
children.push(para("Build a score-to-revenue translation layer using three inputs:"));
children.push(spacer(80));

children.push(richNumbered([{ text: "Industry benchmarks. ", bold: true }, { text: "NAMA (National Automatic Merchandising Association) publishes average vending revenue by location type. This gives you baseline ranges: offices average $200\u2013$400/week, hospitals $300\u2013$600/week, schools $150\u2013$300/week, etc." }]));
children.push(richNumbered([{ text: "Score-to-percentile mapping. ", bold: true }, { text: "A score of 90 in the \u201Coffice\u201D category means this location is in the top 10% of office placements. Apply that percentile to the NAMA range: top 10% of office locations likely hits the upper end, so $350\u2013$450/week." }]));
children.push(richNumbered([{ text: "Feedback loop refinement. ", bold: true }, { text: "As operators report actual revenue (Recommendation #1), calibrate the translation curves against real data. This is where the model goes from \u201Ceducated estimate\u201D to \u201Cdata-driven projection.\u201D" }]));
children.push(spacer());

children.push(heading("Display Format", HeadingLevel.HEADING_2));
children.push(para("Show a range, not a point estimate. Overconfident projections erode trust when reality doesn\u2019t match. A good format:"));
children.push(spacer(80));
children.push(calloutBox("Example Output", [
  "Score: 82/100 (Office \u2014 Snack Machine)",
  "Estimated Weekly Revenue: $250 \u2013 $380",
  "Based on: Industry benchmarks for Class A office buildings with 500+ employees",
  "Confidence: Moderate (limited local data \u2014 report your results to improve estimates)"
], LIGHT_BG, GRAY));
children.push(spacer());
children.push(para("The confidence label and the nudge to report results ties directly back to the feedback loop. Every feature should funnel operators toward contributing data."));

// ── 3. SEASONALITY AND TIME-OF-DAY ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("3. Seasonality and Time-of-Day Intelligence"));

children.push(heading("The Problem", HeadingLevel.HEADING_2));
children.push(para("The current model treats foot traffic as a single number, but vending is deeply time-sensitive. A gym that peaks at 6 AM and 5 PM is gold for energy drinks but irrelevant for late-night snacks. An office building that\u2019s dead on weekends scores differently for a coffee machine than for a snack machine."));

children.push(heading("The Solution", HeadingLevel.HEADING_2));
children.push(para("If you integrate BestTime.app\u2019s hourly busyness data (recommended in the PRD as a replacement for Google Popular Times scraping), don\u2019t just average the 24-hour curve into a single score. Instead:"));
children.push(spacer(80));

children.push(richBullet([{ text: "Define \u201Cgolden hours\u201D per category. ", bold: true }, { text: "Office snack machines peak 10 AM\u20132 PM. Gym beverage machines peak 6\u20139 AM and 4\u20137 PM. Transit station machines peak 7\u20139 AM and 5\u20137 PM. Weight the busyness data during these windows more heavily." }]));
children.push(richBullet([{ text: "Weekday vs. weekend split. ", bold: true }, { text: "An apartment complex scores higher on weekends (residents are home). An office building scores near-zero on weekends. The model should weight accordingly." }]));
children.push(richBullet([{ text: "Surface the hourly curve in the UI. ", bold: true }, { text: "A sparkline or small bar chart showing the 24-hour traffic pattern gives operators intuition they can\u2019t get from a number alone. \u201COh, this location has a lunch rush but nothing after 3 PM\u201D is actionable intel." }]));
children.push(richBullet([{ text: "Seasonal adjustments. ", bold: true }, { text: "University locations drop 40\u201360% during summer break. Tourist areas spike in season. If you can flag these patterns (even with a simple \u201Cseasonal warning\u201D badge), operators avoid nasty surprises." }]));
children.push(spacer());

children.push(heading("Category-Specific Golden Hours", HeadingLevel.HEADING_2));
children.push(dataTable(
  ["Category", "Primary Peak", "Secondary Peak", "Dead Zones", "Weekend Factor"],
  [
    ["Office", "11 AM \u2013 1 PM", "3 PM \u2013 4 PM", "Before 7 AM, After 7 PM", "0.1x (near zero)"],
    ["Gym/Fitness", "6 \u2013 9 AM", "4 \u2013 7 PM", "10 AM \u2013 3 PM", "0.8x (still active)"],
    ["Hospital", "All day (24/7)", "Shift changes: 7, 3, 11", "None", "0.9x"],
    ["School/University", "11 AM \u2013 2 PM", "3 \u2013 5 PM", "Before 8 AM, After 9 PM", "0.15x"],
    ["Manufacturing", "Shift start/end", "Lunch break", "Between shifts", "0.3x (some 24/7)"],
    ["Apartment", "5 \u2013 9 PM", "Weekend afternoons", "Weekday mornings", "1.3x"],
    ["Hotel", "7 \u2013 10 AM", "9 PM \u2013 12 AM", "2 \u2013 5 PM", "1.2x"],
    ["Transit", "7 \u2013 9 AM", "5 \u2013 7 PM", "10 PM \u2013 5 AM", "0.5x"]
  ],
  [1600, 1800, 1800, 2200, 1960]
));
children.push(spacer());

// ── 4. COMPETITION ANALYSIS ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("4. Category-Aware Competition Analysis"));

children.push(heading("The Problem", HeadingLevel.HEADING_2));
children.push(para("The current competition signal counts nearby vending machines, but that\u2019s incomplete. Three Coca-Cola machines next door sounds bad\u2014unless you\u2019re placing a healthy food machine. Category-level competition matters far more than raw count."));

children.push(heading("The Solution", HeadingLevel.HEADING_2));
children.push(para("Upgrade the competition module to classify existing machines by type and compare against the operator\u2019s intended category:"));
children.push(spacer(80));

children.push(richNumbered([{ text: "Pull nearby vending machines from Google Places ", bold: true }, { text: "using type filters. Google\u2019s \u201Cvending_machine\u201D type returns nearby machines with name, brand, and sometimes photos." }], "numbers2"));
children.push(richNumbered([{ text: "Classify by category. ", bold: true }, { text: "Use the machine name/brand to infer type: \u201CCoca-Cola\u201D and \u201CPepsi\u201D are beverage machines. \u201CHealthy You Vending\u201D is healthy snacks. \u201CRedbox\u201D is entertainment. Even rough classification (beverage / snack / specialty / unknown) is useful." }], "numbers2"));
children.push(richNumbered([{ text: "Score competition by category overlap. ", bold: true }, { text: "Three beverage machines nearby is bad for a new beverage placement but irrelevant for a snack machine. The competition score should reflect category-specific saturation." }], "numbers2"));
children.push(richNumbered([{ text: "Output a simple label: ", bold: true }, { text: "\u201CSaturated,\u201D \u201CModerate,\u201D or \u201CUnderserved\u201D per category. This is more actionable than a 0\u2013100 score." }], "numbers2"));
children.push(spacer());

children.push(calloutBox("Competitive Intelligence Bonus", [
  "If you can identify the brands of nearby machines, you unlock a powerful insight: \u201CThis location has 2 Coca-Cola machines but no snack options.\u201D That\u2019s a whitespace opportunity that operators can\u2019t see with any other tool."
]));
children.push(spacer());

// ── 5. LANDLORD/PROPERTY CONTACT ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("5. Landlord / Property Manager Contact Enrichment"));

children.push(heading("The Problem", HeadingLevel.HEADING_2));
children.push(para("The biggest friction in vending isn\u2019t finding a good location\u2014it\u2019s getting permission to place a machine there. An operator can identify the perfect office building, but then spends days Googling the property management company, calling front desks, and leaving voicemails. VendRadar scores the location but leaves the hardest part of the job untouched."));

children.push(heading("The Solution", HeadingLevel.HEADING_2));
children.push(para("Surface property contact information alongside location scores. Even partial coverage is a massive differentiator\u2014no competing tool does this."));
children.push(spacer(80));

children.push(heading("Data Sources", HeadingLevel.HEADING_3));
children.push(dataTable(
  ["Source", "What It Provides", "Coverage", "Cost"],
  [
    ["County Assessor Records", "Property owner name, mailing address, parcel data", "Near-universal for commercial", "Free (public records)"],
    ["Google Places", "Business name of property mgmt company at address", "Moderate (larger properties)", "Included in existing API usage"],
    ["Commercial RE APIs (Reonomy, ATTOM)", "Owner, management company, tenant list, sale history", "Excellent for commercial", "$200\u2013$500/mo"],
    ["LinkedIn Company Search", "Property mgmt company contact info", "Good for named companies", "Manual or API ($)"],
    ["Building signage (Street View)", "Property management company name, phone number", "Variable", "Free (Google Street View API)"]
  ],
  [2000, 2800, 2000, 2560]
));
children.push(spacer());

children.push(heading("Recommended Approach", HeadingLevel.HEADING_3));
children.push(para("Start with free sources (county assessor records + Google Places). Most counties publish assessor data online and many have bulk download options. This alone gets you property owner names for the majority of commercial locations. Layer in a commercial RE API later if the feature proves valuable."));
children.push(spacer());

children.push(calloutBox("Display Example", [
  "Property Contact (Partial \u2014 verify before reaching out)",
  "Owner: Westfield Commercial Properties LLC",
  "Management: CBRE Group (likely \u2014 listed at this address)",
  "Source: County assessor records, Google Places",
  "Tip: Call the building\u2019s front desk and ask for the facilities manager."
], LIGHT_BG, GRAY));
children.push(spacer());

// ── 6. SAVED SEARCHES AND ALERTS ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("6. Saved Searches and Alerts"));

children.push(heading("The Problem", HeadingLevel.HEADING_2));
children.push(para("VendRadar is currently a one-shot lookup tool. An operator searches, reviews results, and leaves. There\u2019s no reason to come back unless they\u2019re actively scouting a new location. This makes it hard to justify recurring SaaS pricing\u2014operators will use it once or twice and cancel."));

children.push(heading("The Solution", HeadingLevel.HEADING_2));
children.push(para("Turn VendRadar into an ongoing intelligence service with saved searches and change alerts:"));
children.push(spacer(80));

children.push(richBullet([{ text: "Saved search zones. ", bold: true }, { text: "Let operators define areas they care about (e.g., \u201Coffice buildings within 10 miles of downtown Austin\u201D). Store the search parameters and re-run them on a schedule." }]));
children.push(richBullet([{ text: "Weekly digest emails. ", bold: true }, { text: "\u201C3 new office buildings permitted in your target zone.\u201D \u201CNew restaurant opened at 5th and Main\u2014foot traffic score jumped from 62 to 78.\u201D This is the kind of intel operators can\u2019t get anywhere else." }]));
children.push(richBullet([{ text: "Score change alerts. ", bold: true }, { text: "If a location\u2019s score changes significantly (new construction, business closure, transit route change), notify operators who have saved that area." }]));
children.push(richBullet([{ text: "New construction / permit data. ", bold: true }, { text: "Many cities publish building permit data. A new 200-unit apartment complex permitted in your zone is a signal that no one else is surfacing." }]));
children.push(spacer());

children.push(heading("Why This Justifies SaaS Pricing", HeadingLevel.HEADING_2));
children.push(para("Without saved searches, VendRadar is a tool. With them, it\u2019s a service. The pricing shift is natural:"));
children.push(spacer(80));

children.push(dataTable(
  ["Tier", "Model", "Justification"],
  [
    ["Free", "5 searches/month, no saves", "Top of funnel, demonstrates value"],
    ["Pro ($29/mo)", "Unlimited searches, 3 saved zones, weekly digests", "Active operators scouting regularly"],
    ["Business ($79/mo)", "Everything + API access, 10 saved zones, daily alerts, team sharing", "Multi-route operators and small fleets"]
  ],
  [1800, 3500, 4060]
));
children.push(spacer());

children.push(calloutBox("Retention Lever", [
  "Saved searches solve the hardest SaaS problem: getting users to come back. Instead of waiting for operators to remember VendRadar exists, you\u2019re pushing relevant intel to their inbox every week. The digest email becomes the reason they don\u2019t cancel."
], "FADBD8", "E74C3C"));
children.push(spacer());

// ── 7. ROUTE OPTIMIZATION ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("7. Route-Aware Location Scoring"));

children.push(heading("The Problem", HeadingLevel.HEADING_2));
children.push(para("Operators with 10+ machines don\u2019t evaluate locations in isolation. A location scoring 78 that\u2019s 2 miles from their existing cluster is worth more than a location scoring 85 that\u2019s 45 minutes away. Drive time, restocking efficiency, and route density all factor into the real ROI of a placement."));

children.push(heading("The Solution", HeadingLevel.HEADING_2));
children.push(para("This is a V2/V3 feature, but the data model should be architected now to support it:"));
children.push(spacer(80));

children.push(richNumbered([{ text: "Store user machine locations. ", bold: true }, { text: "Let operators pin their existing machines on the map. This creates a \u201Cfleet view\u201D that\u2019s immediately useful even without scoring changes." }], "numbers3"));
children.push(richNumbered([{ text: "Route proximity score. ", bold: true }, { text: "For each new location recommendation, calculate driving distance/time to the nearest existing machine. Use Google Directions API (or OSRM for free). Weight closer locations higher." }], "numbers3"));
children.push(richNumbered([{ text: "Cluster analysis. ", bold: true }, { text: "Identify natural groupings in an operator\u2019s existing fleet and recommend new locations that strengthen existing clusters rather than creating isolated outliers." }], "numbers3"));
children.push(richNumbered([{ text: "Route optimization view. ", bold: true }, { text: "Once an operator has 5+ machines pinned, offer a \u201Csuggest next placement\u201D mode that balances location quality score with route efficiency. \u201CHere are the top 5 locations that score above 70 and add less than 15 minutes to your current restocking route.\u201D" }], "numbers3"));
children.push(spacer());

children.push(calloutBox("Data Model Prep (Build Now)", [
  "Add a user_machines table: user_id, lat, lng, category, placed_date, status (active/removed).",
  "This costs almost nothing to build and unlocks the fleet view immediately. Route scoring can be layered on later without schema changes."
], "D5F5E3", "1E8449"));
children.push(spacer());

// ── IMPLEMENTATION PRIORITY ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("Implementation Priority Matrix"));
children.push(para("The recommendations are ordered by a combination of impact, effort, and dependency structure. Some features make others better (the feedback loop improves revenue estimation), so sequencing matters."));
children.push(spacer());

children.push(dataTable(
  ["#", "Recommendation", "Impact", "Effort", "Dependencies", "When to Build"],
  [
    ["1", "Ground-Truth Feedback Loop", "Highest", "Low (simple form + table)", "None", "Phase 1 (now)"],
    ["2", "Revenue Estimation", "High", "Medium (needs NAMA data)", "Benefits from #1", "Phase 1"],
    ["3", "Time-of-Day Intelligence", "High", "Medium (needs BestTime API)", "Needs aggregator built", "Phase 2"],
    ["4", "Category-Aware Competition", "Medium-High", "Medium (Google Places rework)", "Needs aggregator built", "Phase 2"],
    ["5", "Property Contact Enrichment", "High", "High (multi-source data)", "Independent", "Phase 3"],
    ["6", "Saved Searches + Alerts", "High (retention)", "Medium (cron + email infra)", "Core scoring stable", "Phase 3"],
    ["7", "Route-Aware Scoring", "Medium", "High (maps + fleet model)", "User base established", "Phase 4 (V2)"]
  ],
  [400, 2000, 1000, 1800, 1800, 2360]
));
children.push(spacer());

children.push(heading("Phased Rollout", HeadingLevel.HEADING_2));
children.push(spacer(80));

children.push(calloutBox("Phase 1: Foundation (Weeks 1\u20133)", [
  "Build the feedback form and user_machines table schema.",
  "Integrate NAMA benchmarks and build score-to-revenue translation.",
  "Ship revenue estimates on every location card.",
  "Start collecting operator outcome data immediately."
], ACCENT_LIGHT, ACCENT));
children.push(spacer(80));

children.push(calloutBox("Phase 2: Intelligence (Weeks 4\u20136)", [
  "Integrate BestTime.app hourly data into the aggregator.",
  "Build golden-hours weighting per category.",
  "Upgrade competition module to classify machines by category.",
  "Add hourly traffic sparklines to the UI."
], "D5F5E3", "1E8449"));
children.push(spacer(80));

children.push(calloutBox("Phase 3: Stickiness (Weeks 7\u201310)", [
  "Build saved search zones with weekly digest emails.",
  "Integrate county assessor data for property contact enrichment.",
  "Add score change alerts and new construction/permit tracking.",
  "Launch tiered pricing (Free / Pro / Business)."
], "FEF9E7", "B7950B"));
children.push(spacer(80));

children.push(calloutBox("Phase 4: Scale (V2, Month 4+)", [
  "Fleet view: operators pin existing machines on the map.",
  "Route proximity scoring with Google Directions or OSRM.",
  "Cluster analysis and \u201Csuggest next placement\u201D mode.",
  "First model recalibration using feedback loop data."
], "FADBD8", "E74C3C"));
children.push(spacer());

// ── CLOSING ──
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(heading("Summary"));
children.push(para("The foot traffic aggregator is necessary infrastructure, but it\u2019s not the product. The product is the confidence an operator feels when VendRadar says \u201Cthis location will probably earn you $250\u2013$380/week for a snack machine, there\u2019s no snack competition within 500 feet, the building is managed by CBRE, and here\u2019s the facilities manager\u2019s number.\u201D"));
children.push(para("That\u2019s not a lookup tool. That\u2019s a placement decision engine. And it\u2019s worth paying for monthly."));
children.push(spacer());

children.push(calloutBox("If you build one thing from this document", [
  "Build the feedback loop (#1). It costs almost nothing, it makes every other feature smarter over time, and the dataset it creates is your only defensible moat. Everything else is a feature. The feedback loop is a flywheel."
]));

// ── Assemble Document ──
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: ACCENT }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: ACCENT }, paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: DARK }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering,
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "VendRadar \u2014 Strategic Roadmap", font: "Arial", size: 18, color: GRAY, italics: true })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", font: "Arial", size: 18, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: GRAY })] })] })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Written: ${outputPath} (${Math.round(buffer.length / 1024)} KB)`);
});
