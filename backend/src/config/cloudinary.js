import { v2 as cloudinary } from "cloudinary";

const hasDiscreteConfig =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

const hasUrlConfig = Boolean(process.env.CLOUDINARY_URL);

const hasCloudinaryConfig = Boolean(hasDiscreteConfig || hasUrlConfig);

if (hasCloudinaryConfig) {
  if (hasUrlConfig) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
    });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

export { cloudinary, hasCloudinaryConfig };
