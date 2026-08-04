const multer = require("multer");

const ONE_MB = 1024 * 1024;
const FIVE_MB = 5 * ONE_MB;

const allowedMimeTypes = new Set([
  "application/msword",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith("image/") || allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only picture, PDF, or Word document files are allowed."));
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: FIVE_MB }
});

upload.minFileSize = ONE_MB;
upload.maxFileSize = FIVE_MB;

module.exports = upload;
