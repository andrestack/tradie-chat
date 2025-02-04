import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "@/lib/r2Client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create Unique Filename
    const filename = `audio-${Date.now()}.wav`;

    // Upload to R2 using AWS SDK v3
    const uploadParams = {
      Bucket: "audio-uploads",
      Key: filename,
      Body: buffer,
      ContentType: "audio/wav",
    };

    await r2Client.send(new PutObjectCommand(uploadParams));

    return NextResponse.json({
      message: "Audio uploaded successfully",
      filename: filename,
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    return NextResponse.json({ error: "Error uploading audio file" }, { status: 500 });
  }
}
