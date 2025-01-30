"use client";

import { useState, useRef } from "react";

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
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">Audio Recorder</h2>

      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Stop Recording
          </button>
        )}
      </div>

      {audioURL && (
        <div className="mt-4">
          <audio controls src={audioURL} />
        </div>
      )}

      {uploadStatus && (
        <p
          className={`mt-2 ${
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
