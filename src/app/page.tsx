"use client";

import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import { Copy, Check } from "lucide-react";

export default function Home() {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranscription = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, upload the audio file
      const formData = new FormData();
      formData.append("audio", audioBlob, `audio-${Date.now()}.wav`);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const { filename } = uploadData;

      if (!filename) {
        throw new Error('No filename received from upload');
      }

      // Now call the main API endpoint for transcription and analysis
      const processResponse = await fetch(`/api?file=${encodeURIComponent(filename)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!processResponse.ok) {
        let errorMessage = 'Failed to process audio';
        try {
          const errorData = await processResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (error) {
          errorMessage = await processResponse.text();
          console.error("Error parsing transcription response:", error);
        }
        throw new Error(`${errorMessage} (Status: ${processResponse.status})`);
      }

      const processData = await processResponse.json();
      
      if (processData.transcription) {
        setTranscription(processData.transcription);
      } else {
        throw new Error('No transcription in response');
      }

      if (processData.chatResponse) {
        setChatResponse(processData.chatResponse);
      } else {
        throw new Error('No chat response in response');
      }

    } catch (error) {
      console.error("Error in handleTranscription:", error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setTranscription(null);
      setChatResponse(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
      setError("Failed to copy to clipboard");
    }
  };
  
  return (
    <main className="flex flex-col w-full min-h-screen bg-gray-50 relative">
      <div className="text-center pt-12 pb-6">
        <h1 className="text-2xl font-semibold font-mono text-gray-800">
          Tell me about your problem <br /> and I will give you no BS advice
        </h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full max-w-2xl mx-auto mb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="w-full max-w-2xl mx-auto mb-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative">
            Processing audio... Please wait...
          </div>
        </div>
      )}

      <div className="flex-1 px-4 pb-32">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          {/* Transcription Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 relative group">
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Transcription
            </h2>
            <div className="flex items-start gap-2">
              <p className="text-gray-800">
                {transcription || (
                  <span className="text-gray-400 italic">
                    Your words will appear here...
                  </span>
                )}
              </p>
              {transcription && (
                <button
                onClick={() => copyToClipboard(transcription)}
                className="opacity-100 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-md transition-all"
                title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Chat Response Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 relative group">
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              AI Response
            </h2>
            <div className="flex items-start gap-2">
              <p className="text-gray-800 whitespace-pre-line">
                {chatResponse || (
                  <span className="text-gray-400 italic">
                    AI analysis will appear here...
                  </span>
                )}
              </p>
              {chatResponse && (
                <button
                onClick={() => copyToClipboard(chatResponse)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-md transition-all"
                title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <AudioRecorder onTranscribe={handleTranscription} />
    </main>
  );
}