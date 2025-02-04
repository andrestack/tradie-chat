import { NextRequest } from "next/server";
import fs from "fs";
import OpenAI from "openai";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY, // Ensure your API key is set in .env
});

export async function GET(request: NextRequest) {
  try {
    // Extract the file name from the query parameters
    const url = new URL(request.url);
    const audioFileName = url.searchParams.get("file");

    if (!audioFileName) {
      return new Response(JSON.stringify({ error: "File name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(
        path.join(process.cwd(), "public", "uploads", audioFileName)
      ),
      model: "whisper-1",
    });

    const transcribedText = transcription.text;

    // Generate chat response using GPT-4
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI assistant that helps process and analyze speech transcriptions. Please organise the transcript into a structured format, with sections for speaker's name, project name, hours worked, and expenses if any. You can summarise the transcript into a few sentences before the structured format." },
        { role: "user", content: transcribedText },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return new Response(
      JSON.stringify({
        transcription: transcribedText,
        chatResponse: chatResponse.choices[0].message.content,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


// on the client: create an audio recorder with a microphone
// on the client: create a button to start recording
// on the client: create a button to stop recording
// on the client: create a button to send the recording to the server, using a blob and fetch
// on the server: read the blob into memory and send it to the openai api
// on the server: return the transcription as a json object
// on the client: display the transcription in the browser in a text aread with a copy to clipboard button
