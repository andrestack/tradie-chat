import { NextRequest } from "next/server";
import OpenAI from "openai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "@/lib/r2Client";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    // Safely parse the URL and get the file parameter
    let audioFileName;
    try {
      const urlParams = new URLSearchParams(request.nextUrl.search);
      audioFileName = urlParams.get("file");
    } catch (error) {
      console.error("Error parsing URL:", error);
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!audioFileName) {
      return new Response(JSON.stringify({ error: "File name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Clean the filename
    const fileKey = audioFileName.split("/").pop() || audioFileName;

    // Fetch from R2
    const getObjectParams = {
      Bucket: "audio-uploads",
      Key: fileKey,
    };

    const { Body } = await r2Client.send(new GetObjectCommand(getObjectParams));

    if (!Body) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert the stream to a buffer
    let audioBuffer: Buffer;
    try {
      const chunks: Uint8Array[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of Body as any) {
        chunks.push(chunk);
      }
      audioBuffer = Buffer.concat(chunks);
    } catch (error) {
      console.error("Error converting stream to buffer:", error);
      return new Response(
        JSON.stringify({ error: "Error processing audio file" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a File object from the buffer
    const file = new File([audioBuffer], fileKey, {
      type: "audio/wav", // Adjust based on your file type
    });

    // Send to Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    const transcribedText = transcription.text;

    // Generate chat response
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that helps process and analyze speech transcriptions. Please organize the transcript into a structured format, with sections for speaker's name, project name, hours worked, and expenses if any.",
        },
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: errorMessage, // Use the error message safely
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
