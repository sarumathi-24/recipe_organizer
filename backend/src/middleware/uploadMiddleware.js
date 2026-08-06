const multer = require("multer");

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
  fileFilter
});

module.exports = upload;
