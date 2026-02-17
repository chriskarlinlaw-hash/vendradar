import jsPDF from 'jspdf';
import { LocationData, CategoryConfig } from './types';
import { getScoreColor, getScoreLabel } from './scoring';

/**
 * Generates a PDF location report for a given location and category.
 * Downloads automatically to the user's browser.
 */
export async function generateLocationPDF(
  location: LocationData,
  category: CategoryConfig
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper: hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 0, g: 0, b: 0 };
  };

  // ── HEADER BAR ──
  doc.setFillColor(17, 24, 39); // gray-900
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('VendRadar', margin, 18);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Location Intelligence Report', margin, 26);

  // Date
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 34);

  // Score badge (right side of header)
  const scoreColor = hexToRgb(getScoreColor(location.score.overall));
  doc.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b);
  doc.roundedRect(pageWidth - margin - 30, 8, 30, 30, 4, 4, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(String(location.score.overall), pageWidth - margin - 15, 24, { align: 'center' });
  doc.setFontSize(7);
  doc.text(getScoreLabel(location.score.overall), pageWidth - margin - 15, 32, { align: 'center' });

  y = 55;

  // ── LOCATION INFO ──
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(location.address, margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(`Category: ${category.name}  |  Lat: ${location.lat.toFixed(4)}  |  Lng: ${location.lng.toFixed(4)}`, margin, y);
  y += 12;

  // ── SCORE BREAKDOWN ──
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Score Breakdown', margin, y);
  y += 8;

  const scores = [
    { label: 'Foot Traffic', score: location.score.footTraffic, weight: category.scoringWeights.footTraffic },
    { label: 'Demographics', score: location.score.demographics, weight: category.scoringWeights.demographics },
    { label: 'Competition', score: location.score.competition, weight: category.scoringWeights.competition },
    { label: 'Building Type', score: location.score.buildingType, weight: category.scoringWeights.buildingType },
  ];

  scores.forEach((item) => {
    // Label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`${item.label} (${item.weight}% weight)`, margin, y);
    doc.text(`${item.score}/100`, margin + contentWidth - 1, y, { align: 'right' });
    y += 4;

    // Bar background
    doc.setFillColor(243, 244, 246); // gray-100
    doc.roundedRect(margin, y, contentWidth, 4, 2, 2, 'F');

    // Bar fill
    const barColor = hexToRgb(getScoreColor(item.score));
    doc.setFillColor(barColor.r, barColor.g, barColor.b);
    const barWidth = (item.score / 100) * contentWidth;
    doc.roundedRect(margin, y, barWidth, 4, 2, 2, 'F');
    y += 10;
  });

  y += 4;

  // ── KEY METRICS ──
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', margin, y);
  y += 8;

  const metrics = [
    { label: 'Median Household Income', value: `$${location.demographics.medianIncome.toLocaleString()}` },
    { label: 'Population (0.5mi radius)', value: location.demographics.population.toLocaleString() },
    { label: 'Median Age', value: String(Math.round(location.demographics.medianAge)) },
    { label: 'Employment Rate', value: `${(location.demographics.employmentRate * 100).toFixed(0)}%` },
    { label: 'Est. Daily Foot Traffic', value: location.footTraffic.dailyEstimate.toLocaleString() },
    { label: 'Peak Hours', value: location.footTraffic.peakHours.join(', ') },
    { label: 'Nearby Competitors', value: location.competition.count === 0 ? 'None detected' : `${location.competition.count} within 0.5 miles` },
    { label: 'Nearest Competitor', value: location.competition.nearestDistance > 0 ? `${location.competition.nearestDistance.toFixed(1)} miles` : 'N/A' },
    { label: 'Near Transit', value: location.footTraffic.proximityToTransit ? 'Yes' : 'No' },
    { label: 'Market Saturation', value: location.competition.saturationLevel.charAt(0).toUpperCase() + location.competition.saturationLevel.slice(1) },
  ];

  // Draw as 2-column table
  const colWidth = contentWidth / 2;
  metrics.forEach((metric, idx) => {
    const col = idx % 2;
    const xPos = margin + col * colWidth;

    if (col === 0 && idx > 0) y += 0; // already incremented

    // Alternating row background
    if (col === 0) {
      if (Math.floor(idx / 2) % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 4, contentWidth, 8, 'F');
      }
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(metric.label, xPos, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(metric.value, xPos + colWidth - 5, y, { align: 'right' });

    if (col === 1) y += 8;
  });
  // Handle odd number of metrics
  if (metrics.length % 2 !== 0) y += 8;

  y += 6;

  // ── AI ANALYSIS ──
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Analysis', margin, y);
  y += 8;

  // Blue background box
  doc.setFillColor(239, 246, 255); // blue-50
  const aiBoxHeight = location.aiReasoning.length * 7 + 6;
  doc.roundedRect(margin, y - 3, contentWidth, aiBoxHeight, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 64, 175); // blue-800
  location.aiReasoning.forEach((reason) => {
    doc.text(`•  ${reason}`, margin + 4, y + 2);
    y += 7;
  });

  y += 8;

  // ── RECOMMENDED PRODUCT MIX ──
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Product Mix', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(21, 128, 61); // green-700
  doc.text(category.productFit.join('  •  '), margin, y);
  y += 6;

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text(`Peak hours for ${category.name}: ${category.peakHours}`, margin, y);
  y += 12;

  // ── FOOTER ──
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text('VendRadar Location Intelligence Report  •  vendradar.com', margin, y);
  doc.text('Data is estimated. Always verify locations in person before committing.', margin, y + 4);
  doc.text(`Report ID: ${location.id}`, pageWidth - margin, y, { align: 'right' });

  // ── DOWNLOAD ──
  const safeName = location.address.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40);
  doc.save(`VendRadar-Report-${safeName}.pdf`);
}
