import { v2 as cloudinary } from "cloudinary";
import fs from "fs";



// Upload to Cloudinary
export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload file
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "japanee_ecom",
    });

    // Delete local file after upload
    fs.unlinkSync(localFilePath);

    return result; // { url, public_id, ... }
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    fs.unlinkSync(localFilePath); // remove local file even on error
    return null;
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return null;
  }
};
