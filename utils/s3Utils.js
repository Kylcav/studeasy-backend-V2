const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Upload image to S3
const uploadToS3 = async (file, folder = 'profile-images') => {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' // Make the file publicly accessible
    };

    const result = await s3.upload(uploadParams).promise();
    return result.Location; // Return the S3 URL
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
};

// Delete image from S3
const deleteFromS3 = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    
    // Extract the key from the S3 URL
    const urlParts = imageUrl.split('/');
    const key = urlParts.slice(3).join('/'); // Remove the bucket name and domain parts
    
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(deleteParams).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    // Don't throw error for deletion failures as it's not critical
  }
};

module.exports = {
  upload,
  uploadToS3,
  deleteFromS3
};
