import { NextRequest,  } from "next/server";
import fs from "fs";
import OpenAI from "openai";
import path from "path";



const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function GET(request: NextRequest){
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(path.join(process.cwd(), "public", "heytony.mp3")),
    model: "whisper-1",
  });
  return new Response(JSON.stringify({ message: transcription.text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
});
}

// on the client: create an audio recorder with a microphone
// on the client: create a button to start recording
// on the client: create a button to stop recording
// on the client: create a button to send the recording to the server, using a blob and fetch 
// on the server: read the blob into memory and send it to the openai api 
// on the server: return the transcription as a json object 
// on the client: display the transcription in the browser in a text aread with a copy to clipboard button 
