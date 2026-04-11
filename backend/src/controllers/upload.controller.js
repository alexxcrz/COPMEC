import { uploadCellFile } from "../services/cloudinary.service.js";
import { auditSecurityEvent } from "../services/security-events.service.js";

export async function uploadFileController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "File is required in field 'file'.",
      });
    }

    const uploadResult = await uploadCellFile(req.file, "copmec/boards");

    auditSecurityEvent("file_uploaded", req, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      bytes: uploadResult.bytes,
      filePublicId: uploadResult.filePublicId,
      fileUrl: uploadResult.fileUrl,
      fileThumbUrl: uploadResult.fileThumbUrl,
    });

    return res.status(201).json({
      ok: true,
      data: uploadResult,
    });
  } catch (error) {
    return next(error);
  }
}
