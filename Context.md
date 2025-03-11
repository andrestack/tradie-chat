# Tradie Chat Application Documentation

## Overview

The Tradie Chat application is a web-based voice recording and transcription system that allows users to record audio messages, transcribe them, and receive AI-powered analysis of the content. The application is built using Next.js 14, TypeScript, and integrates with OpenAI's Whisper API for transcription and GPT-4 for content analysis.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Storage**: Cloudflare R2 (S3-compatible storage)
- **AI Services**: OpenAI (Whisper API for transcription, GPT-4 for analysis)
- **UI Components**: Custom components with Lucide icons
- **Styling**: TailwindCSS with custom configurations

## Application Structure

```
src/
├── app/
│   ├── api/
│   │   ├── route.ts           # Main API endpoint for transcription and analysis
│   │   └── upload/            # File upload endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Main application page
├── components/
│   ├── AudioRecorder.tsx     # Audio recording component
│   └── ui/                   # UI components
└── lib/
    ├── r2Client.ts           # Cloudflare R2 client configuration
    └── utils.ts              # Utility functions
```

## Core Components

### 1. Main Page (page.tsx)

- **Purpose**: Serves as the main application interface
- **Key Features**:
  - State management for transcription and chat responses
  - Audio recording integration
  - Copy to clipboard functionality
  - Error handling and loading states
  - Responsive UI with transcription and AI analysis cards

### 2. AudioRecorder Component (AudioRecorder.tsx)

- **Purpose**: Handles audio recording functionality
- **Key Features**:
  - Media stream handling
  - Recording state management
  - Audio format handling (WebM/Opus with MP4 fallback for iOS)
  - Real-time status updates
  - Audio playback after recording
  - Error handling for permissions and recording issues

### 3. API Routes

#### Main API Route (route.ts)

- **Purpose**: Handles audio processing and AI interactions
- **Functionality**:
  1. Retrieves audio file from R2 storage
  2. Transcribes audio using OpenAI Whisper API
  3. Analyzes content using GPT-4
  4. Returns structured response with transcription and analysis

#### Upload Route

- **Purpose**: Handles file uploads to R2 storage
- **Functionality**:
  - Processes audio file uploads
  - Stores files in Cloudflare R2
  - Returns file reference for later processing

## Implementation Details

### Audio Recording Process

1. User initiates recording through the UI
2. AudioRecorder component captures audio using MediaRecorder API
3. Audio is recorded in chunks (100ms intervals)
4. On stop:
   - Chunks are combined into a single Blob
   - Audio is saved temporarily for playback
   - File is uploaded to R2 storage
   - Processing begins

### Transcription and Analysis Flow

1. Audio file is retrieved from R2 storage
2. File is sent to OpenAI Whisper API for transcription
3. Transcribed text is processed by GPT-4 with specific instructions
4. Results are formatted and returned to the frontend
5. UI updates with transcription and analysis

### Error Handling

- Comprehensive error handling at all levels:
  - Audio permission errors
  - Recording errors
  - Upload failures
  - API processing errors
  - Network issues
- User-friendly error messages
- Graceful degradation

## Environment Setup

### Required Environment Variables

```
OPEN_API_KEY=your_openai_api_key
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ACCOUNT_ID=your_r2_account_id
```

### Cloudflare R2 Configuration

- Bucket name: "audio-uploads"
- CORS configuration required for direct uploads
- S3-compatible API endpoints

## Cursor Settings Prompt

```json
{
  "systemPrompt": "You are an AI assistant specialized in processing audio transcriptions for tradespeople. Your role is to:
1. Extract key information from transcriptions including:
   - Speaker name/identification
   - Project details
   - Hours worked
   - Materials used
   - Expenses incurred
2. Format the information in a clear, structured way
3. Identify any follow-up actions or important notes
4. Maintain context across multiple recordings
5. Flag any potential issues or missing information

Please analyze the transcription and provide a structured response with these sections clearly labeled. If any information is missing or unclear, note it as 'Not specified' rather than making assumptions.",
  "temperature": 0.7,
  "maxTokens": 150,
  "model": "gpt-4"
}
```

## Security Considerations

1. API key protection in environment variables
2. Secure file handling and storage
3. Input validation and sanitization
4. Error message security (no sensitive information exposure)
5. CORS configuration for R2 storage

## Performance Optimizations

1. Chunked audio recording
2. Efficient file handling
3. Optimized API calls
4. Client-side caching where appropriate
5. Responsive UI with loading states

## Extension Points

1. Additional audio format support
2. Enhanced analysis capabilities
3. User authentication
4. Project management features
5. Reporting and analytics
6. Multi-language support

This documentation provides a comprehensive overview of the application's architecture and implementation details, suitable for senior developers to understand and implement the system in different templates while maintaining the core logic and functionality.
