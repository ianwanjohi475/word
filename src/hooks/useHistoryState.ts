/** Minimal undo/redo state container used by the document editor. */
import { useCallback, useRef, useState } from 'react';

export function useHistoryState<T>(initial: T) {
  const [present, setPresentState] = useState<T>(initial);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const presentRef = useRef(present);
  presentRef.current = present;

  /** Take a snapshot of the current value (call before a mutation batch). */
  const snapshot = useCallback(() => {
    setPast((p) => [...p, presentRef.current].slice(-60));
    setFuture([]);
  }, []);

  /** Update the present value without creating a history entry. */
  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setPresentState((prev) => (typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater));
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [presentRef.current, ...f]);
      setPresentState(prev);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, presentRef.current]);
      setPresentState(next);
      return f.slice(1);
    });
  }, []);

  const reset = useCallback((value: T) => {
    setPast([]);
    setFuture([]);
    setPresentState(value);
  }, []);

  return {
    present,
    set,
    snapshot,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    isDirty: past.length > 0,
  };
}
