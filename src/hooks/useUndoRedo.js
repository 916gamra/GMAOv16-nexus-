import { useState, useCallback } from 'react';
import { UndoRedoManager } from '../utils/undoRedoManager';

export function useUndoRedo(initialPresent) {
  const [manager] = useState(() => new UndoRedoManager());
  const [present, setPresent] = useState(initialPresent);

  const set = useCallback((newPresent) => {
    manager.push(present);
    setPresent(newPresent);
  }, [manager, present]);

  const undo = useCallback(() => {
    const previous = manager.undo(present);
    setPresent(previous);
  }, [manager, present]);

  const redo = useCallback(() => {
    const next = manager.redo(present);
    setPresent(next);
  }, [manager, present]);

  return [present, set, { undo, redo, canUndo: manager.canUndo(), canRedo: manager.canRedo() }];
}
