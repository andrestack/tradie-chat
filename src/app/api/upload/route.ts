import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Convert the file to a Buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with timestamp
    const filename = `audio-${Date.now()}.wav`;
    const filepath = join(uploadDir, filename);

    // Write the file to the uploads directory
    await writeFile(filepath, buffer);

    return NextResponse.json({
      message: "Audio uploaded successfully",
      filename: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    return NextResponse.json(
      { error: "Error uploading audio file" },
      { status: 500 }
    );
  }
}
