import React from 'react';

export const AnalyticsView = ({
  completionRate = 0,
  meetingCount = 0,
  totalCount = 0,
  highPriorityCount = 0,
  activeStreak = 0,
  heatmapTotalActions = 0,
  heatmapDays = [],
  selectedDate,
  setSelectedDate,
  showToast,
}) => {
  return (
    <div className="analytics-card">
      <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px' }}>Productivity &amp; Meeting Analytics</h2>
      <p style={{ fontSize: '13px', margin: 0, fontWeight: '600' }}>
        Performance breakdown for scheduled tasks and executive meetings.
      </p>

      <div className="analytics-grid">
        <div className="analytics-metric-box">
          <span style={{ fontSize: '13px', fontWeight: '700' }}>Task Completion Rate</span>
          <div className="analytics-val" style={{ color: 'var(--color-blue)' }}>{completionRate}%</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${completionRate}%`, background: 'var(--color-blue)' }}></div>
          </div>
        </div>

        <div className="analytics-metric-box">
          <span style={{ fontSize: '13px', fontWeight: '700' }}>Scheduled Meetings</span>
          <div className="analytics-val" style={{ color: 'var(--color-green)' }}>{meetingCount} sessions</div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${totalCount > 0 ? (meetingCount / totalCount) * 100 : 0}%`, background: 'var(--color-green)' }}
            ></div>
          </div>
        </div>

        <div className="analytics-metric-box">
          <span style={{ fontSize: '13px', fontWeight: '700' }}>High Priority Items</span>
          <div className="analytics-val" style={{ color: 'var(--color-red)' }}>{highPriorityCount} urgent</div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${totalCount > 0 ? (highPriorityCount / totalCount) * 100 : 0}%`, background: 'var(--color-red)' }}
            ></div>
          </div>
        </div>
      </div>

      {/* 90-Day Activity Heatmap Card */}
      <div className="heatmap-section">
        <div className="heatmap-header">
          <div>
            <h3 className="heatmap-title">90-Day Consistency Heatmap</h3>
            <p className="heatmap-subtitle">Completed tasks and scheduled meetings over the last 3 months</p>
          </div>
          <div className="heatmap-stats">
            <div className="heatmap-stat-chip">
              <span className="stat-label">Current Streak</span>
              <span className="stat-val">{activeStreak} Days</span>
            </div>
            <div className="heatmap-stat-chip">
              <span className="stat-label">90-Day Output</span>
              <span className="stat-val">{heatmapTotalActions} Actions</span>
            </div>
          </div>
        </div>

        <div className="heatmap-grid">
          {heatmapDays.map((d) => {
            let levelClass = 'level-0';
            if (d.score === 1) levelClass = 'level-1';
            else if (d.score === 2) levelClass = 'level-2';
            else if (d.score === 3) levelClass = 'level-3';
            else if (d.score >= 4) levelClass = 'level-4';

            return (
              <div
                key={d.date}
                className={`heatmap-cell ${levelClass} ${selectedDate === d.date ? 'selected' : ''}`}
                title={`${d.date}: ${d.completedCount} completed, ${d.meetingsCount} meetings`}
                onClick={() => {
                  setSelectedDate(d.date);
                  if (showToast) showToast(`Selected date: ${d.date}`);
                }}
              ></div>
            );
          })}
        </div>

        <div className="heatmap-footer">
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
            Click any cell to inspect schedule for that day
          </span>
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="legend-cell level-0"></div>
            <div className="legend-cell level-1"></div>
            <div className="legend-cell level-2"></div>
            <div className="legend-cell level-3"></div>
            <div className="legend-cell level-4"></div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
