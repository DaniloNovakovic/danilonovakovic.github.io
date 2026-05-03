import { useCallback, useEffect, useState, type RefCallback } from 'react';

const SIZE_CHANGE_THRESHOLD = 0.5;

interface ResizeObserverSize {
  width: number | undefined;
  height: number | undefined;
}

interface UseResizeObserverResult<T extends Element> extends ResizeObserverSize {
  ref: RefCallback<T>;
}

export function useResizeObserver<T extends Element>(): UseResizeObserverResult<T> {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ResizeObserverSize>({
    width: undefined,
    height: undefined
  });
  const ref = useCallback<RefCallback<T>>((node) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const updateSize = (nextSize: ResizeObserverSize) => {
      setSize((current) => {
        const widthChanged = hasMeaningfulChange(current.width, nextSize.width);
        const heightChanged = hasMeaningfulChange(current.height, nextSize.height);
        return widthChanged || heightChanged ? nextSize : current;
      });
    };

    const initialRect = element.getBoundingClientRect();
    updateSize({
      width: initialRect.width,
      height: initialRect.height
    });

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return {
    ref,
    width: size.width,
    height: size.height
  };
}

function hasMeaningfulChange(current: number | undefined, next: number | undefined): boolean {
  if (current === undefined || next === undefined) {
    return current !== next;
  }
  return Math.abs(current - next) >= SIZE_CHANGE_THRESHOLD;
}
