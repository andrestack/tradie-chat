"use client";

import { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";

interface AudioRecorderProps {
  onTranscribe: (audioBlob: Blob) => Promise<void>;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscribe }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      });

      const options = {
        mimeType: "audio/webm;codecs=opus",
      };

      try {
        mediaRecorder.current = new MediaRecorder(stream, options);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Fallback for iOS Safari
        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType: "audio/mp4",
        });
      }

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, {
          type: mediaRecorder.current?.mimeType || "audio/webm;codecs=opus",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);

        try {
          setIsProcessing(true);
          setStatus("Processing audio...");
          await onTranscribe(audioBlob);
          setStatus("Processing complete!");
        } catch (error) {
          console.error("Error processing audio:", error);
          setStatus("Error processing audio");
        } finally {
          setIsProcessing(false);
          audioChunks.current = []; // Clear previous recording
        }
      };

      mediaRecorder.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setStatus("Recording...");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setStatus(
        "Error accessing microphone. Please ensure microphone permissions are granted."
      );
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      setStatus("Processing...");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-8 flex flex-col items-center bg-gradient-to-t from-gray-50 to-transparent pb-12">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
          isRecording
            ? "bg-red-500 animate-pulse"
            : isProcessing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isRecording ? (
          <Square className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      {audioURL && !isRecording && (
        <div className="mt-4">
          <audio controls src={audioURL} className="w-48" />
        </div>
      )}

      {status && (
        <p
          className={`mt-2 text-sm ${
            status.includes("Error")
              ? "text-red-500"
              : status.includes("complete")
              ? "text-green-500"
              : "text-blue-500"
          }`}
        >
          {status}
        </p>
      )}

      {isProcessing && (
        <div className="mt-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
