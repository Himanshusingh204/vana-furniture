const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure upload folder exists
if (!fs.existsSync(config.CAD_UPLOAD_DIR)) {
  fs.mkdirSync(config.CAD_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.dwg', '.dxf', '.step', '.stp', '.pdf', '.obj', '.zip'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.CAD_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = `cad-${Date.now()}-${sanitizedBase.substring(0, 30)}${ext}`;
    cb(null, safeName);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Security Rejection: Invalid file type '${ext}'. Only CAD files (.dwg, .dxf, .step, .stp, .pdf, .obj, .zip) are allowed.`), false);
  }
}

const uploadCad = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.MAX_CAD_FILE_SIZE
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Magic-byte (content) validation. Extension whitelisting alone only checks
// the filename a client claims — a renamed executable (`malware.exe` ->
// `malware.pdf`) sails through fileFilter above. These checks read the
// actual bytes on disk after multer writes the file and reject anything
// whose content doesn't match its claimed extension.
// ─────────────────────────────────────────────────────────────────────────
const MAGIC_BYTE_VALIDATORS = {
  '.pdf': (buf) => buf.slice(0, 4).toString('latin1') === '%PDF',
  // ZIP local-file-header (PK\x03\x04), empty archive (PK\x05\x06), or
  // spanned archive (PK\x07\x08) signatures.
  '.zip': (buf) =>
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    ((buf[2] === 0x03 && buf[3] === 0x04) ||
      (buf[2] === 0x05 && buf[3] === 0x06) ||
      (buf[2] === 0x07 && buf[3] === 0x08)),
  // AutoCAD DWG binary files start with a version tag like "AC1015", "AC1032".
  '.dwg': (buf) => buf.slice(0, 2).toString('latin1') === 'AC',
  // STEP/ISO-10303-21 files are ASCII text beginning with this header string.
  '.step': (buf) => buf.slice(0, 13).toString('latin1').toUpperCase() === 'ISO-10303-21;',
  '.stp': (buf) => buf.slice(0, 13).toString('latin1').toUpperCase() === 'ISO-10303-21;'
};

// .dxf (ASCII or binary CAD interchange) and .obj (Wavefront, plain text)
// have no single reliable fixed magic number across valid real-world files,
// so a strict signature check would produce false rejections. For these we
// only apply a cheap safety net: reject if the file begins with a Windows
// PE ("MZ") or ELF executable header, which indicates a disguised
// executable rather than a genuine text-based CAD asset.
function isDisguisedExecutable(buf) {
  if (buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a) return true; // "MZ" - PE/EXE/DLL
  if (buf.length >= 4 && buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return true; // ELF
  return false;
}

/**
 * Validates that a file's on-disk content matches its claimed extension.
 * Returns { valid: true } or { valid: false, reason }.
 * Reads only the first 32 bytes — cheap even for the 50MB upload cap.
 */
function validateMagicBytes(filePath, ext) {
  const extension = (ext || path.extname(filePath)).toLowerCase();
  let buf;
  try {
    const fd = fs.openSync(filePath, 'r');
    buf = Buffer.alloc(32);
    const bytesRead = fs.readSync(fd, buf, 0, 32, 0);
    fs.closeSync(fd);
    buf = buf.slice(0, bytesRead);
  } catch (e) {
    return { valid: false, reason: 'Unable to read uploaded file for content verification.' };
  }

  const validator = MAGIC_BYTE_VALIDATORS[extension];
  if (validator) {
    if (!validator(buf)) {
      return { valid: false, reason: `File content does not match the expected format for '${extension}' files.` };
    }
    return { valid: true };
  }

  if (isDisguisedExecutable(buf)) {
    return { valid: false, reason: `File content looks like an executable, not a '${extension}' CAD/document file.` };
  }
  return { valid: true };
}

module.exports = {
  uploadCad,
  ALLOWED_EXTENSIONS,
  validateMagicBytes
};
