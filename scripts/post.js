// scripts/post.js
// Reads post text from post_text.txt and image URL from cloudinary_url.txt
// then posts to LinkedIn with the image

const fs = require('fs');
const path = require('path');

const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const PERSON_URN = process.env.LINKEDIN_PERSON_URN;

if (!ACCESS_TOKEN || !PERSON_URN) {
  console.error('Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_URN');
  process.exit(1);
}

const urlFile = path.resolve(__dirname, '..', 'cloudinary_url.txt');
if (!fs.existsSync(urlFile)) {
  console.error('cloudinary_url.txt not found. Run upload.js first.');
  process.exit(1);
}
const imageUrl = fs.readFileSync(urlFile, 'utf8').trim();

let postText = process.env.POST_TEXT;
const textFile = path.resolve(__dirname, '..', 'post_text.txt');
if (!postText && fs.existsSync(textFile)) {
  postText = fs.readFileSync(textFile, 'utf8').trim();
}
if (!postText) {
  postText = 'New tech tip! #dotnet #csharp #softwaredevelopment';
}

(async () => {
  console.log('Posting to LinkedIn...');

  try {
    // Step 1: Register image upload
    const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: PERSON_URN,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          }],
        },
      }),
    });

    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      console.error('LinkedIn register upload failed:', JSON.stringify(registerData));
      process.exit(1);
    }

    const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerData.value.asset;
    console.log('Asset URN: ' + asset);

    // Step 2: Fetch image from Cloudinary and upload to LinkedIn
    const imgRes = await fetch(imageUrl);
    const imgBuffer = await imgRes.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + ACCESS_TOKEN,
        'Content-Type': 'image/png',
      },
      body: imgBuffer,
    });

    if (!uploadRes.ok) {
      console.error('LinkedIn image upload failed:', uploadRes.status);
      process.exit(1);
    }
    console.log('Image uploaded to LinkedIn');

    // Step 3: Create the post
    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: PERSON_URN,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postText },
            shareMediaCategory: 'IMAGE',
            media: [{
              status: 'READY',
              description: { text: 'Tech card' },
              media: asset,
              title: { text: 'Tech Tip' },
            }],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const postData = await postRes.json();
    if (!postRes.ok) {
      console.error('LinkedIn post failed:', JSON.stringify(postData));
      process.exit(1);
    }

    console.log('Posted to LinkedIn! Post ID: ' + postData.id);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
