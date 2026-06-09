// scripts/upload.js
// Uploads card.png to Cloudinary and saves the public URL to cloudinary_url.txt

const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  console.log('Uploading to Cloudinary...');

  const imagePath = path.resolve(__dirname, '..', 'card.png');

  if (!fs.existsSync(imagePath)) {
    console.error('card.png not found. Run screenshot.js first.');
    process.exit(1);
  }

  try {
    const publicId = 'linkedin-cards/card-' + Date.now();

    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      invalidate: true,
    });

    console.log('Uploaded! URL: ' + result.secure_url);

    fs.writeFileSync(
      path.resolve(__dirname, '..', 'cloudinary_url.txt'),
      result.secure_url
    );

  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    process.exit(1);
  }
})();
