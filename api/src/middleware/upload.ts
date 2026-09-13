import multer from "multer";
import { Request } from "express";
import { AppError } from "../schemas/receipt.schema.js";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "../utils/fileValidator.js";

// Use memory storage so we never write unneeded files to disk
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isMimeAllowed = Object.keys(ALLOWED_MIME_TYPES).includes(file.mimetype);
  const ext = file.originalname.split(".").pop()?.toLowerCase();
  const isExtAllowed = ext && Object.values(ALLOWED_MIME_TYPES).flat().includes(ext);

  if (!isMimeAllowed || !isExtAllowed) {
    return cb(
      new AppError(
        "INVALID_FILE_TYPE",
        `Unsupported file type '${file.mimetype}'. Allowed types: JPEG, PNG, WEBP, PDF`,
        400,
        {
          allowedMimes: Object.keys(ALLOWED_MIME_TYPES),
          providedMime: file.mimetype,
          filename: file.originalname
        }
      )
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES // 10MB
  },
  fileFilter
});
