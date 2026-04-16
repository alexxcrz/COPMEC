import { cloudinary, hasCloudinaryConfig } from "../config/cloudinary.js";

function toDataUri(file) {
  const b64 = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${b64}`;
}

function buildThumbnail(uploadResult) {
  const isImage = uploadResult.resource_type === "image";

  if (isImage) {
    return cloudinary.url(uploadResult.public_id, {
      width: 240,
      height: 240,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
      fetch_format: "auto",
    });
  }

  if (uploadResult.resource_type === "raw") {
    // Solo PDFs soportan extracción de página en Cloudinary
    const mightBePdf = uploadResult.format === "pdf" ||
      String(uploadResult.public_id).toLowerCase().endsWith(".pdf");
    if (mightBePdf) {
      return cloudinary.url(uploadResult.public_id, {
        resource_type: "raw",
        format: "jpg",
        page: 1,
        width: 240,
        height: 240,
        crop: "fill",
      });
    }
    return uploadResult.secure_url;
  }

  return uploadResult.secure_url;
}

export async function uploadCellFile(file, folder = "copmec/cells") {
  if (!hasCloudinaryConfig) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  const isImage = String(file.mimetype).startsWith("image/");
  const isPdf = file.mimetype === "application/pdf";
  // PDFs y imágenes se suben como resource_type "image" (Cloudinary los soporta)
  // Otros (xlsx, docx, txt) como "raw"
  const resourceType = (isImage || isPdf) ? "image" : "raw";

  let result;
  if (isImage || isPdf) {
    result = await cloudinary.uploader.upload(toDataUri(file), {
      folder,
      resource_type: "image",
      use_filename: true,
      unique_filename: true,
    });
  } else {
    // Archivos raw (Excel, Word, txt): usar upload_stream con buffer
    result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "raw",
          use_filename: true,
          unique_filename: true,
          public_id: file.originalname.replace(/\s+/g, "_"),
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        },
      );
      stream.end(file.buffer);
    });
  }

  return {
    fileUrl: result.secure_url,
    fileThumbUrl: buildThumbnail(result),
    filePublicId: result.public_id,
    fileMimeType: file.mimetype,
    bytes: result.bytes,
    originalName: file.originalname,
  };
}
