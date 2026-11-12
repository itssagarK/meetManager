import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local uploads directory exists as default / fallback
const localUploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

/**
 * Storage Subsystem for PCS Meet Manager
 * Supports:
 * 1. Cloudflare R2 (S3-compatible API with zero egress fees)
 * 2. Amazon Web Services (AWS) S3 / MinIO / DigitalOcean Spaces
 * 3. Local High-Speed Disk Storage (zero-configuration development fallback)
 */
class StorageService {
  constructor() {
    this.localDir = localUploadDir;
    this.refreshConfig();
  }

  refreshConfig() {
    this.s3Endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT || null;
    this.s3Bucket = process.env.R2_BUCKET || process.env.S3_BUCKET || null;
    this.s3Region = process.env.S3_REGION || 'auto';
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || null;
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || null;
    this.publicBaseUrl = process.env.R2_PUBLIC_URL || process.env.S3_PUBLIC_URL || null;

    // Determine active provider
    if (this.s3Bucket && this.accessKeyId && this.secretAccessKey && this.s3Endpoint) {
      this.provider = this.s3Endpoint.includes('r2.cloudflarestorage.com') ? 'r2' : 's3';
      this.isCloudActive = true;
    } else {
      this.provider = 'local';
      this.isCloudActive = false;
    }
  }

  /**
   * Returns system storage status and telemetry
   */
  getStatus(db) {
    this.refreshConfig();

    let totalRegisteredAssets = 0;
    let totalSizeBytes = 0;

    if (db) {
      try {
        const stats = db.prepare(`
          SELECT COUNT(*) as count, COALESCE(SUM(size_bytes), 0) as total_size 
          FROM media_assets
        `).get();
        if (stats) {
          totalRegisteredAssets = stats.count;
          totalSizeBytes = stats.total_size;
        }
      } catch (_) {}
    }

    return {
      provider: this.provider,
      isCloudActive: this.isCloudActive,
      bucket: this.s3Bucket || null,
      region: this.s3Region,
      endpoint: this.s3Endpoint ? this.s3Endpoint.replace(/\/\/.*@/, '//') : null,
      publicBaseUrl: this.publicBaseUrl || (this.isCloudActive ? null : '/uploads'),
      localUploadDir: this.localDir,
      totalAssets: totalRegisteredAssets,
      totalSizeBytes,
      humanSize: this.formatBytes(totalSizeBytes),
    };
  }

  formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * AWS Signature Version 4 implementation for Cloudflare R2 / S3
   */
  _signS3Request({ method, url, headers, payloadBuffer }) {
    const parsedUrl = new URL(url);
    const host = parsedUrl.host;
    const pathname = parsedUrl.pathname;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = crypto.createHash('sha256').update(payloadBuffer).digest('hex');

    const canonicalHeaders = [
      `content-type:${headers['Content-Type'] || 'application/octet-stream'}`,
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
    ].join('\n') + '\n';

    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      method,
      pathname,
      '', // query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

    const credentialScope = `${dateStamp}/${this.s3Region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    const hmac = (key, string) => crypto.createHmac('sha256', key).update(string).digest();
    const kDate = hmac('AWS4' + this.secretAccessKey, dateStamp);
    const kRegion = hmac(kDate, this.s3Region);
    const kService = hmac(kRegion, 's3');
    const kSigning = hmac(kService, 'aws4_request');

    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...headers,
      Host: host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authHeader,
    };
  }

  /**
   * Upload raw buffer to configured storage (R2/S3 or Local Disk)
   */
  async uploadBuffer(buffer, originalFilename, mimeType = 'application/octet-stream', meta = {}) {
    this.refreshConfig();

    const ext = path.extname(originalFilename) || '.bin';
    const assetKey = `assets/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const fileSize = buffer.length;

    let publicUrl;

    if (this.isCloudActive) {
      try {
        const cleanEndpoint = this.s3Endpoint.replace(/\/$/, '');
        const targetUrl = `${cleanEndpoint}/${this.s3Bucket}/${assetKey}`;

        const headers = this._signS3Request({
          method: 'PUT',
          url: targetUrl,
          headers: {
            'Content-Type': mimeType,
          },
          payloadBuffer: buffer,
        });

        const res = await fetch(targetUrl, {
          method: 'PUT',
          headers,
          body: buffer,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`S3/R2 upload failed (${res.status}): ${errText}`);
        }

        // Generate public URL
        if (this.publicBaseUrl) {
          publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/${assetKey}`;
        } else {
          publicUrl = targetUrl;
        }
      } catch (cloudErr) {
        console.warn('[Storage] Cloud upload encountered error, falling back to local disk:', cloudErr.message);
        publicUrl = this._saveBufferToLocalDisk(buffer, assetKey);
      }
    } else {
      publicUrl = this._saveBufferToLocalDisk(buffer, assetKey);
    }

    // Record asset in media_assets SQLite table if db is provided
    if (meta.db) {
      try {
        meta.db.prepare(`
          INSERT INTO media_assets (
            asset_key, original_name, mime_type, size_bytes, storage_provider, public_url, workspace_id, uploader_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          assetKey,
          originalFilename,
          mimeType,
          fileSize,
          this.provider,
          publicUrl,
          meta.workspaceId || 'default',
          meta.uploaderId || 'system'
        );
      } catch (dbErr) {
        console.warn('[Storage] Could not record media asset in database:', dbErr.message);
      }
    }

    return {
      key: assetKey,
      url: publicUrl,
      provider: this.provider,
      size: fileSize,
      mimeType,
      name: originalFilename,
    };
  }

  _saveBufferToLocalDisk(buffer, assetKey) {
    const filename = path.basename(assetKey);
    const dest = path.join(this.localDir, filename);
    fs.writeFileSync(dest, buffer);
    return `/uploads/${filename}`;
  }

  /**
   * Upload Base64 Data URI string directly to storage
   */
  async uploadBase64(dataUri, originalName = null, meta = {}) {
    if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) {
      return { url: dataUri, provider: 'direct' };
    }

    const match = dataUri.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
    if (!match) return { url: dataUri, provider: 'direct' };

    const mimeType = match[1].toLowerCase();
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const extMap = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'video/webm': 'webm',
      'video/mp4': 'mp4',
    };

    const ext = extMap[mimeType] || 'png';
    const filename = originalName || `capture-${Date.now()}.${ext}`;

    return this.uploadBuffer(buffer, filename, mimeType, meta);
  }

  /**
   * Bulk migration engine: Offloads all SQLite base64 Data URIs & local uploads to Cloud Storage
   */
  async migrateAllLegacyAssets(db) {
    this.refreshConfig();
    const report = {
      scanned: 0,
      migrated: 0,
      failed: 0,
      totalBytesMigrated: 0,
      targetProvider: this.provider,
    };

    if (!db) return report;

    // 1. Migrate Base64 and local disk images from room_messages
    const messages = db.prepare(`
      SELECT id, attachment_url, content 
      FROM room_messages 
      WHERE (attachment_url LIKE 'data:%' OR (attachment_url LIKE '/uploads/%' AND ? = 1))
    `).all(this.isCloudActive ? 1 : 0);

    report.scanned = messages.length;

    for (const msg of messages) {
      try {
        let buffer = null;
        let filename = `asset-msg-${msg.id}.png`;
        let mimeType = 'image/png';

        if (msg.attachment_url.startsWith('data:')) {
          const match = msg.attachment_url.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1].toLowerCase();
            buffer = Buffer.from(match[2], 'base64');
          }
        } else if (msg.attachment_url.startsWith('/uploads/')) {
          const localPath = path.join(this.localDir, path.basename(msg.attachment_url));
          if (fs.existsSync(localPath)) {
            buffer = fs.readFileSync(localPath);
            filename = path.basename(msg.attachment_url);
          }
        }

        if (buffer) {
          const result = await this.uploadBuffer(buffer, filename, mimeType, { db });
          db.prepare(`
            UPDATE room_messages 
            SET attachment_url = ?, storage_provider = ?, storage_key = ?, file_size = ?
            WHERE id = ?
          `).run(result.url, result.provider, result.key, result.size, msg.id);

          report.migrated++;
          report.totalBytesMigrated += buffer.length;
        }
      } catch (err) {
        console.error(`[Storage Migration] Failed for message ${msg.id}:`, err.message);
        report.failed++;
      }
    }

    // Vacuum SQLite to reclaim disk space after large base64 removals
    if (report.migrated > 0) {
      try {
        db.exec('VACUUM');
      } catch (_) {}
    }

    return report;
  }
}

export const storage = new StorageService();
export default storage;
