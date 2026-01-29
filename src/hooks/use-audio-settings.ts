import { useState, useEffect, useCallback } from 'react';
const MUTE_KEY = 'scotted_mute_preference';
const VOLUME_KEY = 'scotted_volume_level';
const EVENT_KEY = 'scotted:audio-change';
export function useAudioSettings() {
  // Initialize state from localStorage
  const [isMuted, setIsMutedState] = useState(() => {
    const saved = localStorage.getItem(MUTE_KEY);
    return saved !== null ? saved === 'true' : true;
  });
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem(VOLUME_KEY);
    return saved !== null ? parseFloat(saved) : 1.0;
  });
  // Helper to broadcast changes
  const broadcastChange = (newMuted: boolean, newVolume: number) => {
    const event = new CustomEvent(EVENT_KEY, {
      detail: { isMuted: newMuted, volume: newVolume }
    });
    window.dispatchEvent(event);
  };
  // Listen for changes from other components
  useEffect(() => {
    const handleAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { isMuted: newMuted, volume: newVolume } = customEvent.detail;
        setIsMutedState(newMuted);
        setVolumeState(newVolume);
      }
    };
    window.addEventListener(EVENT_KEY, handleAudioChange);
    return () => window.removeEventListener(EVENT_KEY, handleAudioChange);
  }, []);
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    localStorage.setItem(VOLUME_KEY, String(clampedVolume));
    // If volume is raised from 0, unmute automatically
    let newMuted = isMuted;
    if (clampedVolume > 0 && isMuted) {
        newMuted = false;
        setIsMutedState(false);
        localStorage.setItem(MUTE_KEY, 'false');
    }
    broadcastChange(newMuted, clampedVolume);
  }, [isMuted]);
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMutedState(newMuted);
    localStorage.setItem(MUTE_KEY, String(newMuted));
    broadcastChange(newMuted, volume);
  }, [isMuted, volume]);
  return {
    isMuted,
    volume,
    setVolume,
    toggleMute
  };
}