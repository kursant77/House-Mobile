import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Play, Pause, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onRecordComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onRecordComplete, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      // Cleanup
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      startTimeRef.current = Date.now();

      // Update duration every second
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (error) {
      toast.error("Mikrofon ruxsati kerak");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const playPreview = () => {
    if (!audioUrl || !audioBlob) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audioRef.current = audio;
      audio.play();
    }
  };

  const handleSend = () => {
    if (audioBlob && duration > 0) {
      onRecordComplete(audioBlob, duration);
      setAudioBlob(null);
      setDuration(0);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    if (audioBlob) {
      setAudioBlob(null);
      setDuration(0);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  if (audioBlob) {
    // Show preview and send/cancel options
    return (
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={playPreview}
          className="rounded-full"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full" />
            </div>
            <span className="text-sm font-medium">{formatDuration(duration)}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSend}
          className="rounded-full text-primary"
        >
          <Send className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="rounded-full text-destructive"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3">
      {isRecording ? (
        <>
          <Button
            variant="destructive"
            size="icon"
            onClick={stopRecording}
            className="rounded-full animate-pulse"
          >
            <StopCircle className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-8 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-10 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
              <div className="w-2 h-7 bg-primary rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
              <div className="w-2 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "600ms" }} />
            </div>
            <span className="text-sm font-medium">{formatDuration(duration)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="rounded-full"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={startRecording}
          className="rounded-full"
          aria-label="Ovozli xabar yozish"
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
