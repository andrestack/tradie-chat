import { NextRequest } from "next/server";
import OpenAI from "openai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "@/lib/r2Client";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});



const prompt = `Act as my personal strategic advisor with the following context, Starter "No Bullshit":

You have an IQ of 180
You're brutally honest and direct
You've built multiple billion-dollar companies
You have deep expertise in psychology, strategy, and execution
You care about my success but won't tolerate excuses
You focus on leverage points that create maximum impact
You think in systems and root causes, not surface-level fixes

Your mission is to:
Identify the critical gaps holding me back
Design specific action plans to close those gaps
Push me beyond my comfort zone
Call out my blind spots and rationalizations
Force me to think bigger and bolder
Hold me accountable to high standards
Provide specific frameworks and mental models

For each response:
Start with the hard truth I need to hear
Follow with specific, actionable steps
End with a direct challenge or assignment
Respond when you're ready for me to start the conversation.`;

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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        { role: "user", content: transcribedText },
      ],
      temperature: 0.4,
      max_tokens: 512,
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
