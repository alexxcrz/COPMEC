import { uploadCellFile } from "../services/cloudinary.service.js";

export async function uploadFileController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "File is required in field 'file'.",
      });
    }

    const uploadResult = await uploadCellFile(req.file, "copmec/boards");

    return res.status(201).json({
      ok: true,
      data: uploadResult,
    });
  } catch (error) {
    return next(error);
  }
}
