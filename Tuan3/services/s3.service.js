const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const s3 = new S3Client({ 
  region: process.env.AWS_REGION || "ap-southeast-1"
});

// Upload hình ảnh lên S3
exports.uploadImage = async (file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  const fileExtension = path.extname(file.originalname);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fs.readFileSync(file.path),
    ContentType: file.mimetype
    // Note: ACL "public-read" đã bị deprecated, sử dụng bucket policy thay thế
  });

  await s3.send(command);

  // Trả về URL công khai của hình ảnh
  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-southeast-1"}.amazonaws.com/${fileName}`;
  return imageUrl;
};

// Xóa hình ảnh từ S3
exports.deleteImage = async (imageUrl) => {
  if (!imageUrl) {
    return;
  }

  try {
    // Extract key từ URL
    const urlParts = imageUrl.split("/");
    const key = urlParts[urlParts.length - 1];

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    });

    await s3.send(command);
    console.log(`Deleted image from S3: ${key}`);
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    // Không throw error để không ảnh hưởng đến việc xóa sản phẩm
  }
};
