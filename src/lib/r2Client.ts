import { S3Client } from "@aws-sdk/client-s3";

const accessKeyId = process.env.R2_ACCESS_KEY_ID;

const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY environment variables."
  );
}

const r2Client = new S3Client({
  endpoint:
    "https://73f03a83682895981b3c6146e96368cd.r2.cloudflarestorage.com/audio-uploads", // Replace <account_id> with your Cloudflare account ID
  region: "auto", // R2 uses 'auto' as the region
  credentials: {
    accessKeyId: accessKeyId, // Ensure this is a string
    secretAccessKey: secretAccessKey, // Ensure this is a string
  },
});

export default r2Client;
