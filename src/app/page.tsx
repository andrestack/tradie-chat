"use client";

import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";

export default function Home() {
  const [transcription, setTranscription] = useState<string | null>(null);

  const handleTranscription = async (audioFileName: string) => {
    try {
      // Remove leading "uploads/" if it exists
      const sanitizedFileName = audioFileName.replace(/^uploads\//, "");
      const response = await fetch(
        `http://localhost:3000/api?file=${sanitizedFileName}`
      );

      // Check if the response is okay (status code 200-299)
      if (!response.ok) {
        const errorText = await response.text(); // Get the error text
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setTranscription(data.message);
    } catch (error) {
      console.error("Error fetching transcription:", error);
      setTranscription("Failed to fetch transcription."); // Update the UI to reflect the error
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1>{transcription || "Transcription will appear here."}</h1>
      </main>
      <AudioRecorder onTranscribe={handleTranscription} />
    </div>
  );
}
