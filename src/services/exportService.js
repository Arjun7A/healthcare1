import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const generatePDFReport = async (analyticsData, timeframe) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(24);
  doc.setTextColor(102, 126, 234);
  doc.text('Mood Analytics Report', 20, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 40);
  doc.text(`Timeframe: ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`, 20, 50);
  
  // Add metrics section
  doc.setFontSize(16);
  doc.setTextColor(26, 32, 44);
  doc.text('Key Metrics', 20, 70);
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Average Mood: ${analyticsData.metrics[0].value}/5`, 20, 85);
  doc.text(`Most Common Tag: ${analyticsData.metrics[1].value}`, 20, 95);
  doc.text(`Total Entries: ${analyticsData.metrics[3].value}`, 20, 105);
  
  // Add mood trend data
  if (analyticsData.moodTrendData.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(26, 32, 44);
    doc.text('Mood Trend Data', 20, 130);
    
    const trendTableData = analyticsData.moodTrendData.map(entry => [
      new Date(entry.date).toLocaleDateString(),
      entry.mood.toString(),
      getMoodLabel(entry.mood)
    ]);
    
    doc.autoTable({
      startY: 140,
      head: [['Date', 'Mood Score', 'Mood Level']],
      body: trendTableData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      styles: { fontSize: 8 }
    });
  }
  
  // Add tags frequency
  if (analyticsData.tagsBarData.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(26, 32, 44);
    doc.text('Most Common Activities', 20, doc.lastAutoTable.finalY + 20);
    
    const tagsTableData = analyticsData.tagsBarData.map(tag => [
      tag.tag,
      tag.count.toString()
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 30,
      head: [['Activity', 'Count']],
      body: tagsTableData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      styles: { fontSize: 8 }
    });
  }
  
  // Add insights if available
  if (analyticsData.advancedInsights) {
    doc.setFontSize(16);
    doc.setTextColor(26, 32, 44);
    doc.text('AI Insights', 20, doc.lastAutoTable.finalY + 20);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    
    const insights = [
      analyticsData.advancedInsights.weeklyMoodSummary,
      analyticsData.advancedInsights.triggerPatternDetection,
      analyticsData.advancedInsights.behavioralSuggestion
    ].filter(Boolean);
    
    insights.forEach((insight, index) => {
      const yPos = doc.lastAutoTable.finalY + 35 + (index * 15);
      if (yPos < 280) { // Check if we have space on page
        doc.text(insight.substring(0, 80) + (insight.length > 80 ? '...' : ''), 20, yPos);
      }
    });
  }
  
  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
  }
  
  return doc;
};

export const generateHTMLReport = (analyticsData, timeframe) => {
  const reportDate = new Date().toLocaleDateString();
  const timeframeLabel = timeframe.charAt(0).toUpperCase() + timeframe.slice(1);
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mood Analytics Report - ${timeframeLabel}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a202c;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .report-container {
          max-width: 1200px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .report-header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 40px;
          text-align: center;
        }
        
        .report-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -1px;
        }
        
        .report-subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
        }
        
        .report-content {
          padding: 40px;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .metric-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 8px;
        }
        
        .metric-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 20px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .data-table th {
          background: #667eea;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        
        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .data-table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .insight-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          padding: 20px;
        }
        
        .insight-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 12px;
        }
        
        .insight-content {
          color: #4a5568;
          line-height: 1.6;
        }
        
        .mood-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }
        
        .mood-1 { background: #ef4444; }
        .mood-2 { background: #f97316; }
        .mood-3 { background: #eab308; }
        .mood-4 { background: #22c55e; }
        .mood-5 { background: #3b82f6; }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .report-container {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-header">
          <h1 class="report-title">Mood Analytics Report</h1>
          <p class="report-subtitle">${timeframeLabel} Summary • Generated on ${reportDate}</p>
        </div>
        
        <div class="report-content">
          <!-- Key Metrics -->
          <div class="section">
            <h2 class="section-title">Key Metrics</h2>
            <div class="metrics-grid">
              ${analyticsData.metrics.map(metric => `
                <div class="metric-card">
                  <div class="metric-value">${metric.value}</div>
                  <div class="metric-label">${metric.title}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Mood Trend Data -->
          ${analyticsData.moodTrendData.length > 0 ? `
            <div class="section">
              <h2 class="section-title">Mood Trend Data</h2>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mood Score</th>
                    <th>Mood Level</th>
                  </tr>
                </thead>
                <tbody>
                  ${analyticsData.moodTrendData.map(entry => `
                    <tr>
                      <td>${new Date(entry.date).toLocaleDateString()}</td>
                      <td>${entry.mood}</td>
                      <td><span class="mood-badge mood-${entry.mood}">${getMoodLabel(entry.mood)}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <!-- Most Common Activities -->
          ${analyticsData.tagsBarData.length > 0 ? `
            <div class="section">
              <h2 class="section-title">Most Common Activities</h2>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${analyticsData.tagsBarData.map(tag => `
                    <tr>
                      <td>${tag.tag}</td>
                      <td>${tag.count}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <!-- AI Insights -->
          ${analyticsData.advancedInsights ? `
            <div class="section">
              <h2 class="section-title">AI-Powered Insights</h2>
              <div class="insights-grid">
                ${analyticsData.advancedInsights.weeklyMoodSummary ? `
                  <div class="insight-card">
                    <div class="insight-title">Weekly Mood Summary</div>
                    <div class="insight-content">${analyticsData.advancedInsights.weeklyMoodSummary}</div>
                  </div>
                ` : ''}
                
                ${analyticsData.advancedInsights.triggerPatternDetection ? `
                  <div class="insight-card">
                    <div class="insight-title">Trigger Pattern Detection</div>
                    <div class="insight-content">${analyticsData.advancedInsights.triggerPatternDetection}</div>
                  </div>
                ` : ''}
                
                ${analyticsData.advancedInsights.behavioralSuggestion ? `
                  <div class="insight-card">
                    <div class="insight-title">Behavioral Suggestions</div>
                    <div class="insight-content">${analyticsData.advancedInsights.behavioralSuggestion}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

const getMoodLabel = (mood) => {
  const labels = {
    1: 'Very Low',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Excellent'
  };
  return labels[mood] || 'Unknown';
}; 