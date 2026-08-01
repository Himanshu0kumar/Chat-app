import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';

export function VoiceRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all audio tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[Voice Recording Error]', err);
      alert('Could not access microphone. Please grant permission.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSendAudio = () => {
    if (!audioChunksRef.current.length) return;
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Audio = reader.result;
      onSend({
        audioData: base64Audio,
        duration: recordingTime,
        mimeType: 'audio/webm',
      });
    };

    reader.readAsDataURL(audioBlob);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-800/50 rounded-2xl px-4 py-2 text-white w-full animate-fadeIn">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-mono text-sm text-red-400 font-semibold">{formatTime(recordingTime)}</span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-1">
            <div className="w-1 h-3 bg-emerald-400 animate-pulse"></div>
            <div className="w-1 h-6 bg-emerald-400 animate-pulse delay-75"></div>
            <div className="w-1 h-4 bg-emerald-400 animate-pulse delay-150"></div>
            <div className="w-1 h-7 bg-emerald-400 animate-pulse delay-100"></div>
            <div className="w-1 h-2 bg-emerald-400 animate-pulse"></div>
            <span className="text-xs text-emerald-300 ml-2">Recording voice note...</span>
          </div>

          <button
            onClick={stopRecording}
            className="p-2 bg-red-600/80 hover:bg-red-600 rounded-full text-white transition-all shadow-md"
            title="Stop Recording"
          >
            <Square className="w-4 h-4 fill-white" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={togglePlayback}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white transition-all shadow-md"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <span className="font-mono text-sm text-emerald-300">{formatTime(recordingTime)}</span>

          {audioUrl && (
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          <div className="flex-1 text-xs text-emerald-400/80 italic truncate">
            Voice note ready to send
          </div>

          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Discard"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleSendAudio}
            className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full transition-all shadow-lg shadow-emerald-500/20"
            title="Send Voice Note"
          >
            <Send className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
