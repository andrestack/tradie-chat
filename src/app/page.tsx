"use client";

import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import { Copy, Check } from "lucide-react";

export default function Home() {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = async () => {
    if (transcription) {
      try {
        await navigator.clipboard.writeText(transcription);
        setCopied(true);
        // Reset the copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        {transcription && (
          <div className="relative group">
            <div className="flex items-start gap-2">
              <h1 className="max-w-[600px]">{transcription}</h1>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        )}
        {!transcription && (
          <h1 className="text-gray-500">Transcription will appear here.</h1>
        )}
      </main>
      <AudioRecorder onTranscribe={handleTranscription} />
    </div>
  );
}
