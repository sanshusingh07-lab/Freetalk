import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 5;
const MAX_FILE_SIZE = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/posts';
    if (req.originalUrl.includes('avatar')) dest = 'uploads/avatars';
    if (req.originalUrl.includes('report')) dest = 'uploads/reports';

    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Generate cryptographically secure unguessable random name
    const safeName = `media-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'));
  }
  cb(null, true);
};

export const uploadMedia = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

/**
 * Validates the file content using magic byte inspection.
 * Rejects and deletes files that do not match genuine image signatures.
 */
export function validateImageMagicBytes(filePath) {
  let fd;
  try {
    const buffer = Buffer.alloc(16);
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    fd = null;

    if (bytesRead < 4) return false;

    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

    // GIF: GIF87a or GIF89a (47 49 46 38 37/39 61)
    const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 &&
                  buffer[3] === 0x38 && (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61;

    // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
    const isWebp = bytesRead >= 12 &&
                   buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                   buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

    return isJpeg || isPng || isGif || isWebp;
  } catch (err) {
    console.error('[Upload Security] Failed to read magic bytes:', err.message);
    if (fd) {
      try { fs.closeSync(fd); } catch (_) {}
    }
    return false;
  }
}

/**
 * Express middleware to verify uploaded file content via magic bytes.
 */
export function verifyUploadedMedia(req, res, next) {
  if (!req.file) return next();

  const isValid = validateImageMagicBytes(req.file.path);
  if (!isValid) {
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupErr) {
      console.error('[Upload Security] Cleanup error:', cleanupErr.message);
    }
    return res.status(400).json({
      success: false,
      message: 'Uploaded file content is invalid or does not match a supported image format (JPEG, PNG, WEBP, GIF).',
      code: 'INVALID_FILE_CONTENT'
    });
  }

  next();
}
