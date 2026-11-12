import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../config/constants';

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
  const [storageStatus, setStorageStatus] = useState(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [recentAssets, setRecentAssets] = useState([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState(null);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchStorageStatus = useCallback(async () => {
    try {
      setStorageLoading(true);
      const res = await fetch(getApiUrl('/api/storage/status'));
      if (res.ok) {
        const data = await res.json();
        setStorageStatus(data);
      }
      const assetsRes = await fetch(getApiUrl('/api/storage/assets?limit=5'));
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setRecentAssets(assetsData.assets || []);
      }
    } catch (err) {
      console.warn('Failed to load storage status:', err);
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageStatus();
  }, [fetchStorageStatus]);

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setMigrationMessage(null);
      const res = await fetch(getApiUrl('/api/storage/migrate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });
      const result = await res.json();
      if (result.success) {
        const msg = `Migrated ${result.stats.migrated} assets (${result.stats.alreadyMigrated} already on active storage).`;
        setMigrationMessage({ type: 'success', text: msg });
        if (showToast) showToast(`✅ Storage: ${msg}`);
        fetchStorageStatus();
      } else {
        setMigrationMessage({ type: 'error', text: result.error || 'Migration failed' });
        if (showToast) showToast(`❌ Migration error: ${result.error}`);
      }
    } catch (err) {
      setMigrationMessage({ type: 'error', text: err.message });
      if (showToast) showToast(`❌ Migration error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

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

      {/* Cloudflare R2 / S3 Storage & Media Offloader Card */}
      <div className="storage-management-section">
        <div className="storage-management-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 className="storage-title">Object Storage &amp; Cloud Media Offloading</h3>
              <span className={`storage-badge ${storageStatus?.provider === 'r2' ? 'badge-r2' : storageStatus?.provider === 's3' ? 'badge-s3' : 'badge-local'}`}>
                {storageStatus?.provider === 'r2' ? '☁️ Cloudflare R2' : storageStatus?.provider === 's3' ? '☁️ AWS S3' : '💾 Local Disk (/uploads)'}
              </span>
            </div>
            <p className="storage-subtitle">
              Zero-dependency AWS SigV4 cloud offloading for meeting attachments and screenshots.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-storage-refresh"
              onClick={fetchStorageStatus}
              disabled={storageLoading}
              title="Refresh Storage Metrics"
            >
              <span className={`material-symbols-outlined ${storageLoading ? 'spinning' : ''}`} style={{ fontSize: '18px' }}>
                refresh
              </span>
            </button>
            <button
              type="button"
              className="btn-storage-migrate"
              onClick={handleMigrate}
              disabled={isMigrating}
            >
              <span className={`material-symbols-outlined ${isMigrating ? 'spinning' : ''}`} style={{ fontSize: '18px' }}>
                {isMigrating ? 'sync' : 'cloud_upload'}
              </span>
              {isMigrating ? 'Migrating Assets...' : 'Trigger Cloud Sync'}
            </button>
          </div>
        </div>

        <div className="storage-metrics-grid">
          <div className="storage-metric-box">
            <span className="storage-metric-label">Active Provider</span>
            <div className="storage-metric-val">
              {storageStatus ? storageStatus.provider.toUpperCase() : '...'}
            </div>
            <span className="storage-metric-sub">
              {storageStatus?.configured ? 'Cloud Config Validated' : 'Running on Local Storage'}
            </span>
          </div>

          <div className="storage-metric-box">
            <span className="storage-metric-label">Target Bucket / Store</span>
            <div className="storage-metric-val" style={{ fontSize: '14px', wordBreak: 'break-all' }}>
              {storageStatus?.bucket || '/uploads'}
            </div>
            <span className="storage-metric-sub">
              {storageStatus?.publicDomain ? storageStatus.publicDomain : 'Local Endpoint (/uploads)'}
            </span>
          </div>

          <div className="storage-metric-box">
            <span className="storage-metric-label">Tracked Media Assets</span>
            <div className="storage-metric-val">
              {storageStatus?.stats?.totalAssets ?? 0}
            </div>
            <span className="storage-metric-sub">
              {storageStatus?.stats?.byProvider?.r2 ? `${storageStatus.stats.byProvider.r2} R2 · ` : ''}
              {storageStatus?.stats?.byProvider?.s3 ? `${storageStatus.stats.byProvider.s3} S3 · ` : ''}
              {storageStatus?.stats?.byProvider?.local ? `${storageStatus.stats.byProvider.local} Local` : ''}
              {!storageStatus?.stats?.totalAssets ? 'No attachments yet' : ''}
            </span>
          </div>

          <div className="storage-metric-box">
            <span className="storage-metric-label">Media Volume</span>
            <div className="storage-metric-val">
              {formatBytes(storageStatus?.stats?.totalBytes ?? 0)}
            </div>
            <span className="storage-metric-sub">Offloaded from SQLite</span>
          </div>
        </div>

        {migrationMessage && (
          <div className={`storage-alert ${migrationMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {migrationMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{migrationMessage.text}</span>
          </div>
        )}

        {recentAssets.length > 0 && (
          <div className="storage-recent-assets">
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>
              Recent Media Attachments
            </h4>
            <div className="storage-assets-list">
              {recentAssets.map((asset) => (
                <div key={asset.id} className="storage-asset-row">
                  <span className="material-symbols-outlined storage-asset-icon">
                    {asset.mime_type?.startsWith('image/') ? 'image' : 'attachment'}
                  </span>
                  <div className="storage-asset-info">
                    <span className="storage-asset-name">{asset.original_name || asset.id}</span>
                    <span className="storage-asset-meta">
                      {asset.provider?.toUpperCase()} • {formatBytes(asset.size_bytes)} • {new Date(asset.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <a
                    href={getApiUrl(asset.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="storage-asset-link"
                    title="View Asset"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;