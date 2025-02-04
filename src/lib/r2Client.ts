import { S3Client } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  endpoint:
    "https://73f03a83682895981b3c6146e96368cd.r2.cloudflarestorage.com/audio-uploads", // Replace <account_id> with your Cloudflare account ID
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID, // Your R2 Access Key ID
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY, // Your R2 Secret Access Key
  },
  region: "auto", // R2 uses 'auto' as the region
});

export default r2Client;
