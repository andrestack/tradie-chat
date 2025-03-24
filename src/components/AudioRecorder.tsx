"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";

interface AudioRecorderProps {
  onTranscribe: (audioBlob: Blob) => Promise<void>;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscribe }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [recordingTime, setRecordingTime] = useState<string>("00:00:00");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const updateTimer = () => {
    const elapsed = Date.now() - startTime.current;
    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / 1000 / 60) % 60);
    const hours = Math.floor(elapsed / 1000 / 60 / 60);

    setRecordingTime(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    );
  };

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
          audioChunks.current = [];
        }
      };

      mediaRecorder.current.start(100);
      setIsRecording(true);
      setStatus("Recording...");
      startTime.current = Date.now();
      timerInterval.current = setInterval(updateTimer, 1000);
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
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-full p-4 flex items-center justify-between ${
          isRecording ? "border-2 border-red-500" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 ${
              isRecording ? "text-red-500" : "text-white"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                isRecording ? "bg-red-500 animate-pulse" : "bg-white"
              }`}
            />
            {isRecording ? "REC" : "Ready"}
          </div>
        </div>

        <div className="text-white text-xl font-mono">{recordingTime}</div>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          {isRecording ? (
            <Square className="w-5 h-5 text-white" />
          ) : (
            <Mic
              className={`w-5 h-5 ${
                isProcessing ? "text-gray-500" : "text-gray-900"
              }`}
            />
          )}
        </button>
      </div>

      {status && (
        <p
          className={`mt-2 text-sm text-center ${
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
        <div className="mt-2 flex justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {audioURL && !isRecording && !isProcessing && (
        <div className="mt-4 flex justify-center">
          <audio controls src={audioURL} className="w-full max-w-md" />
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
