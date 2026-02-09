import { useState, useEffect, useCallback, useRef } from "react";

export function useUnsavedChanges<T>(initialData: T) {
  const [isDirty, setIsDirty] = useState(false);
  const initialRef = useRef<string>(JSON.stringify(initialData));

  const checkDirty = useCallback((currentData: T) => {
    const dirty = JSON.stringify(currentData) !== initialRef.current;
    setIsDirty(dirty);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  const updateInitial = useCallback((data: T) => {
    initialRef.current = JSON.stringify(data);
    setIsDirty(false);
  }, []);

  // Browser beforeunload warning
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return { isDirty, checkDirty, markClean, updateInitial };
}
