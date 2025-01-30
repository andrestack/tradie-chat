"use client";

import { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";

interface AudioRecorderProps {
  onTranscribe: (audioFileName: string) => void; // Prop to handle transcription
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscribe }) => {
  // State to manage recording status and audio URL
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  // Disable lint rule for this section
  /* eslint-disable */
  const [audioFileName, setAudioFileName] = useState<string | null>(null);

  // Refs to store MediaRecorder and audio chunks
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Function to start recording
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create new MediaRecorder instance
      mediaRecorder.current = new MediaRecorder(stream);

      // Handle data available event
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      // Handle recording stop event
      mediaRecorder.current.onstop = async () => {
        // Combine audio chunks into a single blob
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);

        try {
          const fileName = await uploadAudio(audioBlob);
          setAudioFileName(fileName);
          onTranscribe(fileName);
        } catch (error) {
          console.error("Error handling audio:", error);
        }

        audioChunks.current = [];
      };

      // Start recording
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);

      // Stop all audio tracks
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Function to upload audio
  const uploadAudio = async (audioBlob: Blob) => {
    try {
      setUploadStatus("Uploading...");

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadStatus("Upload successful!");
      return data.filename;
    } catch (error) {
      console.error("Error uploading audio:", error);
      setUploadStatus("Upload failed");
      throw error;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-8 flex flex-col items-center bg-gradient-to-t from-gray-50 to-transparent pb-12">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
          isRecording
            ? "bg-red-500 animate-pulse"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isRecording ? (
          <Square className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
      {audioURL && (
        <div className="mt-4">
          <audio controls src={audioURL} className="w-48" />
        </div>
      )}
      {uploadStatus && (
        <p
          className={`mt-2 text-sm ${
            uploadStatus.includes("failed") ? "text-red-500" : "text-green-500"
          }`}
        >
          {uploadStatus}
        </p>
      )}
    </div>
  );
};

export default AudioRecorder;
