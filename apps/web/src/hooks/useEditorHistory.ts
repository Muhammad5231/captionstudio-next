import { useState, useCallback, useEffect } from "react";
import { CaptionTrackData } from "@/lib/api";

interface UseEditorHistoryReturn {
  currentTrack: CaptionTrackData | null;
  setCurrentTrack: (track: CaptionTrackData | null, pushToHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  resetHistory: (initialTrack: CaptionTrackData) => void;
}

export function useEditorHistory(initialTrack: CaptionTrackData | null): UseEditorHistoryReturn {
  const [history, setHistory] = useState<CaptionTrackData[]>(initialTrack ? [initialTrack] : []);
  const [currentIndex, setCurrentIndex] = useState<number>(initialTrack ? 0 : -1);

  const currentTrack = currentIndex >= 0 && currentIndex < history.length ? history[currentIndex] : null;

  const resetHistory = useCallback((track: CaptionTrackData) => {
    setHistory([track]);
    setCurrentIndex(0);
  }, []);

  const setCurrentTrack = useCallback((track: CaptionTrackData | null, pushToHistory: boolean = true) => {
    if (!track) return;
    if (pushToHistory) {
      setHistory((prev) => {
        // Slice off any redone states ahead of current index
        const nextHistory = prev.slice(0, currentIndex + 1);
        return [...nextHistory, track];
      });
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Replace in-place
      setHistory((prev) => {
        const nextHistory = [...prev];
        nextHistory[currentIndex] = track;
        return nextHistory;
      });
    }
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    currentTrack,
    setCurrentTrack,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}

