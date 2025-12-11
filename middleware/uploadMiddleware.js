// middleware/uploadMiddleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "uploads";
    if (file.fieldname === "profilePic") folder = "uploads/users";
    else if (file.fieldname === "ticketImage") folder = "uploads/tickets";
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // safer filename: <fieldname>-<timestamp>-<random><ext>
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const safeBase = `${file.fieldname}-${timestamp}-${random}`;
    cb(null, safeBase + path.extname(file.originalname).toLowerCase());
  },
});

const allowedTypes = /jpeg|jpg|png/;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mimetypeOk = allowedTypes.test(file.mimetype);
  const extOk = allowedTypes.test(ext);
  if (mimetypeOk && extOk) cb(null, true);
  else cb(new Error("Only .jpeg, .jpg, .png files are allowed!"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;
