"use client";

import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import { Copy, Check } from "lucide-react";

export default function Home() {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTranscription = async (audioFileName: string) => {
    try {
      const sanitizedFileName = audioFileName.replace(/^uploads\//, "");
      const response = await fetch(
        `http://localhost:3000/api?file=${sanitizedFileName}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setTranscription(data.message);
    } catch (error) {
      console.error("Error fetching transcription:", error);
      setTranscription("Failed to fetch transcription.");
    }
  };

  const copyToClipboard = async () => {
    if (transcription) {
      try {
        await navigator.clipboard.writeText(transcription);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  return (
    <main className="flex flex-col w-full min-h-screen bg-gray-50 relative">
      <div className="text-center pt-12 pb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Tell me about it
        </h1>
      </div>
      <div className="flex-1 px-4 pb-32">
        <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 min-h-[200px] relative group">
          {transcription ? (
            <div className="flex items-start gap-2">
              <p className="text-gray-800">{transcription}</p>
              <button
                onClick={copyToClipboard}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-md transition-all"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-gray-400 italic">
              Your words will appear here...
            </span>
          )}
        </div>
      </div>
      <AudioRecorder onTranscribe={handleTranscription} />
    </main>
  );
}
