'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, BarChart3, Waves } from 'lucide-react';
import { getEpisodeAudioUrl } from '@/lib/actions/episode-actions';
import { AudioVisualizer, VisualizerVariant } from './audio-visualizer';

interface CompactAudioPlayerProps {
  episodeId: string;
  title: string;
}

export function CompactAudioPlayer({ episodeId, title: _title }: CompactAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, _setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Visualizer variant state
  const [visualizerVariant, setVisualizerVariant] = useState<VisualizerVariant>(() => {
    const saved = localStorage.getItem('visualizer_variant');
    return (saved as VisualizerVariant) || 'bars';
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Save visualizer variant preference
  useEffect(() => {
    localStorage.setItem('visualizer_variant', visualizerVariant);
  }, [visualizerVariant]);
  
  // Fetch audio URL
  useEffect(() => {
    const fetchAudioUrl = async () => {
      try {
        const result = await getEpisodeAudioUrl(episodeId);
        if (result.error) {
          setError(result.error);
          setIsLoading(false);
        } else if (result.url) {
          setAudioUrl(result.url);
        } else {
          setError('Could not load audio URL');
          setIsLoading(false);
        }
      } catch {
        setError('Failed to fetch audio');
        setIsLoading(false);
      }
    };
    
    fetchAudioUrl();
  }, [episodeId]);
  
  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
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
    
    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
    };
    
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    
    audio.volume = volume;
    
    const savedPosition = localStorage.getItem(`podcast_position_${episodeId}`);
    if (savedPosition) {
      const position = parseFloat(savedPosition);
      audio.currentTime = position;
      setCurrentTime(position);
    }
    
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, episodeId, volume]);
  
  // Save playback position and handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    
    const savePlaybackPosition = () => {
      if (audioRef.current && currentTime > 0) {
        localStorage.setItem(`podcast_position_${episodeId}`, currentTime.toString());
      }
    };
    
    window.addEventListener('beforeunload', savePlaybackPosition);
    
    return () => {
      savePlaybackPosition();
      window.removeEventListener('beforeunload', savePlaybackPosition);
    };
  }, [currentTime, episodeId, volume, isMuted]);
  
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setError('Could not play audio');
      });
    }

    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  if (error) {
    return <div className="text-xs text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-shrink-0">
        <Button
          variant="default"
          size="sm"
          className="h-8 w-8 sm:h-7 sm:w-7 rounded-full p-0 touch-manipulation"
          onClick={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <AudioVisualizer
          audioRef={audioRef}
          isPlaying={isPlaying}
          height={40}
          waveColor="#9ca3af"
          progressColor="#3b82f6"
          variant={visualizerVariant}
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>{formatDuration(currentTime)}</span>
          <span>{duration > 0 ? formatDuration(duration) : '--:--'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 sm:h-5 sm:w-5 p-0 touch-manipulation"
          onClick={() => setVisualizerVariant(prev => prev === 'bars' ? 'wave' : 'bars')}
          disabled={isLoading}
          title={`Switch to ${visualizerVariant === 'bars' ? 'wave' : 'bars'} style`}
        >
          {visualizerVariant === 'bars' ? (
            <Waves className="h-3 w-3" />
          ) : (
            <BarChart3 className="h-3 w-3" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 sm:h-5 sm:w-5 p-0 touch-manipulation"
          onClick={toggleMute}
          disabled={isLoading}
        >
          {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
} 