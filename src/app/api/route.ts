import { NextRequest } from "next/server";
import fs from "fs";
import OpenAI from "openai";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function GET(request: NextRequest) {
  // Extract the file name from the query parameters
  const url = new URL(request.url);
  const audioFileName = url.searchParams.get("file"); // Get the 'file' parameter from the URL

  // Check if the file name is provided
  if (!audioFileName) {
    return new Response(JSON.stringify({ error: "File name is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(
      path.join(process.cwd(), "public", "uploads", audioFileName)
    ), // Use the dynamic file name
    model: "whisper-1",
  });

  return new Response(JSON.stringify({ message: transcription.text }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// on the client: create an audio recorder with a microphone
// on the client: create a button to start recording
// on the client: create a button to stop recording
// on the client: create a button to send the recording to the server, using a blob and fetch
// on the server: read the blob into memory and send it to the openai api
// on the server: return the transcription as a json object
// on the client: display the transcription in the browser in a text aread with a copy to clipboard button
