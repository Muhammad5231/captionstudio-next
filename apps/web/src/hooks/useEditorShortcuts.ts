import { useEffect } from "react";

interface EditorShortcutHandlers {
  onTogglePlay?: () => void;
  onStepFrameForward?: () => void;
  onStepFrameBackward?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onDeleteSelected?: () => void;
  onConfirm?: () => void;
}

export function useEditorShortcuts(handlers: EditorShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Do not capture shortcuts when typing inside form inputs or editable elements
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Space: Play / Pause
      if (e.code === "Space") {
        e.preventDefault();
        handlers.onTogglePlay?.();
        return;
      }

      // Left / Right arrows
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onSeekBackward?.();
        } else {
          handlers.onStepFrameBackward?.();
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onSeekForward?.();
        } else {
          handlers.onStepFrameForward?.();
        }
        return;
      }

      // Ctrl/Cmd shortcuts
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onRedo?.();
        } else {
          handlers.onUndo?.();
        }
        return;
      }

      if (isCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }

      if (isCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }

      if (isCtrl && e.key.toLowerCase() === "e") {
        e.preventDefault();
        handlers.onExport?.();
        return;
      }

      // Delete key
      if (e.key === "Delete" || e.key === "Backspace") {
        handlers.onDeleteSelected?.();
        return;
      }

      // Enter key
      if (e.key === "Enter") {
        handlers.onConfirm?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, enabled]);
}

