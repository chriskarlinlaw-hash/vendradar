#!/usr/bin/env python3
"""
VendSite Scout - Location Report Generator
Generates PDF-ready HTML reports for vending location analysis
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Configuration
OUTPUT_DIR = Path(__file__).parent / "reports"
DATA_DIR = Path(__file__).parent.parent / "data"

def ensure_dirs():
    """Create necessary directories"""
    OUTPUT_DIR.mkdir(exist_ok=True)
    
def get_location_data(address: str) -> dict:
    """
    Fetch location data from APIs or return mock data
    TODO: Integrate Google Places API, Census API
    """
    # Mock data for demonstration - replace with real API calls
    return {
        "address": address,
        "foot_traffic_daily": "1,200-1,800",
        "foot_traffic_score": 75,
        "competition_count": 2,
        "competition_radius_miles": 0.5,
        "demographics": {
            "primary": "Families, mixed income",
            "median_income": "$65,000",
            "population_within_1mi": "12,500"
        },
        "location_type": "Office Building",
        "hours": "9AM-6PM",
        "amenities": ["Parking", "Break Room", "Elevator"],
        "suggested_placement": "Near main entrance, lobby area",
        "estimated_monthly_revenue": "$150-300",
        "score": 82,
        "recommendation": "Good fit - proceed with negotiation"
    }

def generate_report_html(data: dict) -> str:
    """Generate HTML report from location data"""
    
    score = data.get("score", 0)
    score_class = "high" if score >= 70 else "medium" if score >= 50 else "low"
    score_color = "#22c55e" if score >= 70 else "#f59e0b" if score >= 50 else "#ef4444"
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Location Analysis Report - {data["address"]}</title>
    <style>
        :root {{
            --bg: #ffffff;
            --text: #1a1a2e;
            --accent: #0066cc;
            --border: #e0e0e0;
            --success: #22c55e;
            --warning: #f59e0b;
            --danger: #ef4444;
            --muted: #6b7280;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 20px;
        }}
        .container {{ max-width: 600px; margin: 0 auto; }}
        
        /* Header */
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--border);
        }}
        .logo {{
            font-size: 20px;
            font-weight: 700;
            color: var(--accent);
        }}
        .report-date {{
            font-size: 12px;
            color: var(--muted);
        }}
        
        /* Score Card */
        .score-card {{
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            margin-bottom: 24px;
        }}
        .score-value {{
            font-size: 72px;
            font-weight: 700;
            color: {score_color};
            line-height: 1;
        }}
        .score-label {{
            font-size: 14px;
            color: var(--muted);
            margin-top: 8px;
        }}
        .recommendation {{
            display: inline-block;
            margin-top: 16px;
            padding: 8px 20px;
            background: {score_color};
            color: white;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }}
        
        /* Section */
        .section {{
            margin-bottom: 24px;
        }}
        .section h2 {{
            font-size: 18px;
            margin-bottom: 16px;
            color: var(--accent);
            border-bottom: 2px solid var(--border);
            padding-bottom: 8px;
        }}
        
        /* Metrics Grid */
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }}
        .metric-card {{
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
        }}
        .metric-label {{
            font-size: 12px;
            color: var(--muted);
            margin-bottom: 4px;
        }}
        .metric-value {{
            font-size: 18px;
            font-weight: 600;
        }}
        
        /* Details */
        .detail-row {{
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
        }}
        .detail-row:last-child {{ border-bottom: none; }}
        .detail-label {{ color: var(--muted); font-size: 14px; }}
        .detail-value {{ font-weight: 500; font-size: 14px; }}
        
        /* Tips */
        .tips {{
            background: #fef9c3;
            border: 1px solid #fde047;
            border-radius: 8px;
            padding: 16px;
        }}
        .tips h3 {{
            font-size: 14px;
            margin-bottom: 12px;
            color: #854d0e;
        }}
        .tips ul {{
            margin-left: 16px;
            font-size: 14px;
        }}
        .tips li {{
            margin-bottom: 6px;
            color: #713f12;
        }}
        
        /* Footer */
        .footer {{
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
            text-align: center;
            font-size: 12px;
            color: var(--muted);
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">VendSite Scout</div>
            <div class="report-date">{datetime.now().strftime("%B %d, %Y")}</div>
        </div>
        
        <div class="score-card">
            <div class="score-value">{score}</div>
            <div class="score-label">Location Score</div>
            <div class="recommendation">{data.get("recommendation", "Review carefully")}</div>
        </div>
        
        <div class="section">
            <h2>📍 Location</h2>
            <p style="font-size: 16px; font-weight: 500;">{data["address"]}</p>
            <p style="color: var(--muted); font-size: 14px; margin-top: 4px;">{data.get("location_type", "Commercial")}</p>
        </div>
        
        <div class="section">
            <h2>📊 Key Metrics</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Daily Foot Traffic</div>
                    <div class="metric-value">{data.get("foot_traffic_daily", "N/A")}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Traffic Score</div>
                    <div class="metric-value">{data.get("foot_traffic_score", "N/A")}/100</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Nearby Competitors</div>
                    <div class="metric-value">{data.get("competition_count", 0)} within {data.get("competition_radius_miles", 0.5)}mi</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Est. Monthly Revenue</div>
                    <div class="metric-value">{data.get("estimated_monthly_revenue", "N/A")}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>👥 Demographics</h2>
            <div class="detail-row">
                <span class="detail-label">Primary Audience</span>
                <span class="detail-value">{data.get("demographics", {}).get("primary", "N/A")}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Median Income (1mi radius)</span>
                <span class="detail-value">{data.get("demographics", {}).get("median_income", "N/A")}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Population (1mi radius)</span>
                <span class="detail-value">{data.get("demographics", {}).get("population_within_1mi", "N/A")}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Operating Hours</span>
                <span class="detail-value">{data.get("hours", "N/A")}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>🏪 Competition Analysis</h2>
            <div class="detail-row">
                <span class="detail-label">Vending Machines Nearby</span>
                <span class="detail-value">{data.get("competition_count", 0)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Search Radius</span>
                <span class="detail-value">{data.get("competition_radius_miles", 0.5)} miles</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Competition Level</span>
                <span class="detail-value">{"Low" if data.get("competition_count", 0) < 2 else "Medium" if data.get("competition_count", 0) < 4 else "High"}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>💡 Placement Recommendations</h2>
            <p style="margin-bottom: 12px;"><strong>Best spot:</strong> {data.get("suggested_placement", "Near main entrance")}</p>
            <p><strong>Amenities:</strong> {", ".join(data.get("amenities", []))}</p>
        </div>
        
        <div class="section">
            <div class="tips">
                <h3>📋 Negotiation Tips</h3>
                <ul>
                    <li>Lead with the foot traffic data — shows you're data-driven</li>
                    <li>Offer a percentage of monthly revenue vs. flat rent</li>
                    <li>Ask for 2-year contract with annual CPI adjustment</li>
                    <li>Request exclusivity within the building</li>
                    <li>Mention you'll handle all maintenance and restocking</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>Report generated by VendSite Scout</p>
            <p style="margin-top: 4px;">This analysis is an estimate based on available data. Actual results may vary.</p>
        </div>
    </div>
</body>
</html>'''
    
    return html

def save_report(data: dict) -> Path:
    """Save report to file"""
    # Create safe filename from address
    safe_name = data["address"].replace(",", "").replace(" ", "-")[:50]
    filename = f"report-{safe_name}-{datetime.now().strftime('%Y%m%d')}.html"
    filepath = OUTPUT_DIR / filename
    
    html = generate_report_html(data)
    filepath.write_text(html)
    
    return filepath

def main():
    """Main entry point"""
    ensure_dirs()
    
    # Get address from command line or use default
    address = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "456 Business Park, San Jose, CA"
    
    print(f"Generating report for: {address}")
    
    # Fetch location data
    data = get_location_data(address)
    
    # Generate and save report
    filepath = save_report(data)
    
    print(f"✓ Report saved to: {filepath}")
    print(f"  Score: {data['score']}/100 - {data['recommendation']}")

if __name__ == "__main__":
    main()
