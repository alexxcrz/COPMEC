import { cloudinary, hasCloudinaryConfig } from "../config/cloudinary.js";
import { INTERNAL_STORAGE_ONLY } from "../config/storage.js";

function normalizeCloudinaryError(error) {
  if (error instanceof Error) return error;
  return new Error("Cloudinary upload failed.");
}

function toDataUri(file) {
  const b64 = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${b64}`;
}

function buildThumbnail(uploadResult) {
  const isImage = uploadResult.resource_type === "image";
  const isVideo = uploadResult.resource_type === "video";

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

  if (isVideo) {
    return cloudinary.url(uploadResult.public_id, {
      resource_type: "video",
      format: "jpg",
      start_offset: "0",
      width: 320,
      height: 320,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
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
  if (INTERNAL_STORAGE_ONLY) {
    throw new Error("Cloudinary upload is disabled by INTERNAL_STORAGE_ONLY policy.");
  }

  if (!hasCloudinaryConfig) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  const isImage = String(file.mimetype).startsWith("image/");
  const isVideo = String(file.mimetype).startsWith("video/");
  const isPdf = file.mimetype === "application/pdf";

  let result;
  if (isImage || isPdf) {
    result = await cloudinary.uploader.upload(toDataUri(file), {
      folder,
      resource_type: "image",
      use_filename: true,
      unique_filename: true,
    });
  } else if (isVideo) {
    result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "video",
          use_filename: true,
          unique_filename: true,
          public_id: file.originalname.replaceAll(/\s+/g, "_"),
        },
        (error, uploadResult) => {
          if (error) {
            reject(normalizeCloudinaryError(error));
          } else {
            resolve(uploadResult);
          }
        },
      );
      stream.end(file.buffer);
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
          public_id: file.originalname.replaceAll(/\s+/g, "_"),
        },
        (error, uploadResult) => {
          if (error) {
            reject(normalizeCloudinaryError(error));
          } else {
            resolve(uploadResult);
          }
        },
      );
      stream.end(file.buffer);
    });
  }

  const optimizedUrl = uploadResultUrl(result);

  return {
    fileUrl: optimizedUrl,
    fileThumbUrl: buildThumbnail(result),
    filePublicId: result.public_id,
    fileMimeType: file.mimetype,
    bytes: result.bytes,
    originalName: file.originalname,
  };
}

function uploadResultUrl(uploadResult) {
  if (uploadResult.resource_type === "image") {
    return cloudinary.url(uploadResult.public_id, {
      resource_type: "image",
      quality: "auto",
      fetch_format: "auto",
    });
  }

  if (uploadResult.resource_type === "video") {
    return cloudinary.url(uploadResult.public_id, {
      resource_type: "video",
      quality: "auto",
      fetch_format: "auto",
    });
  }

  return uploadResult.secure_url;
}
