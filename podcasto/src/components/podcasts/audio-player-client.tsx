'use client';

import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack, 
  SkipForward,
  Settings,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AudioPlayerClientProps {
  episodeId: string;
  audioUrl: string;
  title: string;
  audioUrlError?: string;
}

// Playback speed options
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Extracted PlaybackControls component
function PlaybackControls({ 
  isPlaying, 
  onTogglePlay, 
  onSkipBackward, 
  onSkipForward 
}: { 
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onSkipBackward} title="Skip backward 10 seconds">
        <SkipBack className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="default" 
        size="icon" 
        className="h-10 w-10 rounded-full" 
        onClick={onTogglePlay}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      
      <Button variant="ghost" size="icon" onClick={onSkipForward} title="Skip forward 30 seconds">
        <SkipForward className="h-5 w-5" />
      </Button>
    </div>
  );
}

// Extracted VolumeControls component
function VolumeControls({ 
  volume, 
  isMuted, 
  onVolumeChange, 
  onToggleMute 
}: { 
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onToggleMute}>
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>
      
      <div className="w-24 hidden sm:block">
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[isMuted ? 0 : volume]}
          onValueChange={onVolumeChange}
        />
      </div>
    </div>
  );
}

export function AudioPlayerClient({ episodeId, audioUrl, title, audioUrlError }: AudioPlayerClientProps) {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(audioUrlError || null);
  
  // Reference to audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    if (audioUrlError || !audioUrl) {
      setIsLoading(false);
      setError(audioUrlError || 'No audio URL provided');
      return;
    }
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Event listeners with cleanup
    const handleMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleCanPlay = () => {
      setIsLoading(false);
    };
    
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      let errorMessage = 'Failed to load audio. Please try again later.';
      
      if (audioElement.error) {
        switch(audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'The audio loading was aborted.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'A network error occurred while loading the audio.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'The audio could not be decoded. The file might be corrupted.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'The audio format is not supported or the URL is invalid.';
            break;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    };
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    
    // Initialize volume
    audio.volume = volume;
    
    // Load saved position
    const savedPosition = localStorage.getItem(`podcast_position_${episodeId}`);
    if (savedPosition) {
      const position = parseFloat(savedPosition);
      audio.currentTime = position;
      setCurrentTime(position);
    }
    
    // Clean up
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, audioUrlError, episodeId, volume]);
  
  // Save playback position and handle volume changes
  useEffect(() => {
    // Update volume when it changes
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    
    // Save position on unload
    const savePlaybackPosition = () => {
      if (audioRef.current && currentTime > 0) {
        localStorage.setItem(`podcast_position_${episodeId}`, currentTime.toString());
        localStorage.setItem(`podcast_volume_${episodeId}`, volume.toString());
      }
    };
    
    window.addEventListener('beforeunload', savePlaybackPosition);
    
    return () => {
      savePlaybackPosition();
      window.removeEventListener('beforeunload', savePlaybackPosition);
    };
  }, [currentTime, episodeId, volume, isMuted]);
  
  // Helper functions
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        setError('Could not play audio. Please try again later.');
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };
  
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    setIsMuted(!isMuted);
  };
  
  const changePlaybackRate = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };
  
  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Audio Loading Error</AlertTitle>
        <AlertDescription>
          {error}
          {audioUrl && (
            <div className="mt-2 text-xs opacity-70 break-all">
              Audio URL: {audioUrl}
            </div>
          )}
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Render player
  return (
    <div className="w-full rounded-lg border border-gray-200 p-4">
      {/* Progress slider */}
      <div className="mb-4">
        <Slider
          min={0}
          max={duration || 100}
          step={0.1}
          value={[currentTime]}
          onValueChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <PlaybackControls 
          isPlaying={isPlaying}
          onTogglePlay={togglePlayPause}
          onSkipBackward={() => skip(-10)}
          onSkipForward={() => skip(30)}
        />
        
        <div className="flex items-center gap-2">
          <VolumeControls
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
          />
          
          {/* Playback speed menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PLAYBACK_SPEEDS.map(speed => (
                <DropdownMenuItem 
                  key={speed}
                  onClick={() => changePlaybackRate(speed)} 
                  className={playbackRate === speed ? "bg-accent" : ""}
                >
                  {speed}x{speed === 1 ? " (Normal)" : ""}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 