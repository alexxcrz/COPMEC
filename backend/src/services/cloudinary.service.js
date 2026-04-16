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

export async function uploadCellFile(file, folder = "copmec/cells") {
  if (!hasCloudinaryConfig) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  const isImage = String(file.mimetype).startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  const result = await cloudinary.uploader.upload(toDataUri(file), {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
  });

  return {
    fileUrl: result.secure_url,
    fileThumbUrl: buildThumbnail(result),
    filePublicId: result.public_id,
    fileMimeType: file.mimetype,
    bytes: result.bytes,
    originalName: file.originalname,
  };
}
