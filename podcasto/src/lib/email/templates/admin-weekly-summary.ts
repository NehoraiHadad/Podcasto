/**
 * Email template for weekly generation summary sent to admins
 * Provides overview of generation attempts, success rates, and problematic podcasts
 */

export interface AdminWeeklySummaryData {
  weekStartDate: Date;
  weekEndDate: Date;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  dailyBreakdown: Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }>;
  problematicPodcasts: Array<{
    podcast_title: string;
    total_attempts: number;
    failed_attempts: number;
    failure_rate: number;
  }>;
  reportsUrl: string;
}

/**
 * Generates HTML and plain text email for admin weekly summary
 */
export function generateAdminWeeklySummaryEmail(
  data: AdminWeeklySummaryData
): { html: string; text: string } {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const weekRange = `${formatDate(data.weekStartDate)} – ${formatDate(data.weekEndDate)}`;

  // Determine success rate badge color
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
    if (rate >= 50) return { bg: '#fef9c3', text: '#854d0e', border: '#fde047' };
    return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
  };

  const successRateColors = getSuccessRateColor(data.successRate);

  const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Generation Report</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 24px;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .summary-card {
      padding: 16px;
      border-radius: 6px;
      text-align: center;
    }
    .summary-card .label {
      font-size: 13px;
      color: #666666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-card .value {
      font-size: 28px;
      font-weight: 600;
      margin: 0;
    }
    .card-blue {
      background-color: #dbeafe;
      border: 1px solid #93c5fd;
    }
    .card-blue .value {
      color: #1e40af;
    }
    .card-green {
      background-color: #dcfce7;
      border: 1px solid #86efac;
    }
    .card-green .value {
      color: #166534;
    }
    .card-red {
      background-color: #fee2e2;
      border: 1px solid #fca5a5;
    }
    .card-red .value {
      color: #991b1b;
    }
    .card-rate {
      background-color: ${successRateColors.bg};
      border: 1px solid ${successRateColors.border};
    }
    .card-rate .value {
      color: ${successRateColors.text};
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 32px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .table-wrapper {
      overflow-x: auto;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      background-color: #f9fafb;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px 8px;
      border-bottom: 1px solid #e5e7eb;
      color: #1f2937;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success {
      background-color: #dcfce7;
      color: #166534;
    }
    .badge-warning {
      background-color: #fef9c3;
      color: #854d0e;
    }
    .badge-danger {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: #6b7280;
      font-size: 14px;
      background-color: #f9fafb;
      border-radius: 6px;
      margin: 16px 0;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: opacity 0.2s ease-in-out;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 13px;
      color: #999999;
      background-color: #f9f9f9;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .summary-cards {
        grid-template-columns: 1fr;
      }
      table {
        font-size: 12px;
      }
      th, td {
        padding: 8px 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Generation Report</h1>
      <p>${weekRange}</p>
    </div>
    <div class="content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card card-blue">
          <div class="label">Total Attempts</div>
          <div class="value">${data.totalAttempts}</div>
        </div>
        <div class="summary-card card-green">
          <div class="label">Successful</div>
          <div class="value">${data.successfulAttempts}</div>
        </div>
        <div class="summary-card card-red">
          <div class="label">Failed</div>
          <div class="value">${data.failedAttempts}</div>
        </div>
        <div class="summary-card card-rate">
          <div class="label">Success Rate</div>
          <div class="value">${data.successRate.toFixed(1)}%</div>
        </div>
      </div>

      <!-- Daily Breakdown -->
      <h2 class="section-title">Daily Breakdown</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th class="text-center">Total</th>
              <th class="text-center">Successful</th>
              <th class="text-center">Failed</th>
              <th class="text-right">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.dailyBreakdown.map(day => `
            <tr>
              <td>${day.date}</td>
              <td class="text-center">${day.total}</td>
              <td class="text-center">${day.successful}</td>
              <td class="text-center">${day.failed}</td>
              <td class="text-right">
                <span class="badge ${day.successRate >= 80 ? 'badge-success' : day.successRate >= 50 ? 'badge-warning' : 'badge-danger'}">
                  ${day.successRate.toFixed(0)}%
                </span>
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Problematic Podcasts -->
      <h2 class="section-title">Problematic Podcasts</h2>
      ${data.problematicPodcasts.length > 0 ? `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Podcast</th>
              <th class="text-center">Total Attempts</th>
              <th class="text-center">Failed</th>
              <th class="text-right">Failure Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.problematicPodcasts.map(podcast => `
            <tr>
              <td>${podcast.podcast_title}</td>
              <td class="text-center">${podcast.total_attempts}</td>
              <td class="text-center">${podcast.failed_attempts}</td>
              <td class="text-right">
                <span class="badge ${podcast.failure_rate >= 50 ? 'badge-danger' : podcast.failure_rate >= 20 ? 'badge-warning' : 'badge-success'}">
                  ${podcast.failure_rate.toFixed(0)}%
                </span>
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : `
      <div class="empty-state">
        ✅ No problematic podcasts this week. All systems running smoothly!
      </div>
      `}

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${data.reportsUrl}" class="cta-button">View Full Reports</a>
      </div>
    </div>
    <div class="footer">
      <p>This is your automated weekly generation summary for Podcasto admins.</p>
      <p><a href="${data.reportsUrl}">View detailed analytics dashboard</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
📊 WEEKLY GENERATION REPORT
${weekRange}

=== SUMMARY ===
Total Attempts: ${data.totalAttempts}
Successful: ${data.successfulAttempts}
Failed: ${data.failedAttempts}
Success Rate: ${data.successRate.toFixed(1)}%

=== DAILY BREAKDOWN ===
${data.dailyBreakdown.map(day => 
  `${day.date}: ${day.total} total (${day.successful} successful, ${day.failed} failed) - ${day.successRate.toFixed(0)}% success`
).join('\n')}

=== PROBLEMATIC PODCASTS ===
${data.problematicPodcasts.length > 0 
  ? data.problematicPodcasts.map(podcast => 
      `${podcast.podcast_title}: ${podcast.failed_attempts}/${podcast.total_attempts} failed (${podcast.failure_rate.toFixed(0)}%)`
    ).join('\n')
  : 'No problematic podcasts this week. All systems running smoothly!'
}

View full reports: ${data.reportsUrl}

—
Podcasto Admin Team
This is your automated weekly generation summary.
  `.trim();

  return { html, text };
}
