import { useState, useEffect, useRef, useCallback } from "react";

interface ScrollPosition {
  x: number;
  y: number;
}

interface UseScrollPositionOptions {
  /** Element to track scroll position of (defaults to window) */
  element?: React.RefObject<HTMLElement>;
  /** Throttle delay in ms */
  throttleMs?: number;
  /** Whether to restore scroll position on mount */
  restoreOnMount?: boolean;
  /** Storage key for persisting scroll position */
  storageKey?: string;
}

/**
 * Hook for tracking scroll position with optional persistence
 */
export function useScrollPosition(
  options: UseScrollPositionOptions = {}
): {
  scrollPosition: ScrollPosition;
  saveScrollPosition: () => void;
  restoreScrollPosition: () => void;
  scrollToTop: () => void;
  scrollToElement: (element: HTMLElement) => void;
  isScrollingUp: boolean;
  isAtTop: boolean;
  isAtBottom: boolean;
} {
  const {
    element,
    throttleMs = 100,
    restoreOnMount = false,
    storageKey,
  } = options;

  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ x: 0, y: 0 });
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollY = useRef(0);
  const throttleTimer = useRef<ReturnType<typeof setTimeout>>();

  const getScrollElement = useCallback(() => {
    return element?.current || window;
  }, [element]);

  const getScrollPosition = useCallback((): ScrollPosition => {
    const el = getScrollElement();
    if (el === window) {
      return {
        x: window.scrollX || window.pageXOffset,
        y: window.scrollY || window.pageYOffset,
      };
    }
    const htmlEl = el as HTMLElement;
    return {
      x: htmlEl.scrollLeft,
      y: htmlEl.scrollTop,
    };
  }, [getScrollElement]);

  const handleScroll = useCallback(() => {
    if (throttleTimer.current) return;

    throttleTimer.current = setTimeout(() => {
      const pos = getScrollPosition();
      setScrollPosition(pos);
      setIsScrollingUp(pos.y < lastScrollY.current);
      lastScrollY.current = pos.y;
      throttleTimer.current = undefined;
    }, throttleMs);
  }, [getScrollPosition, throttleMs]);

  // Track scroll
  useEffect(() => {
    const el = getScrollElement();
    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [getScrollElement, handleScroll]);

  // Restore on mount
  useEffect(() => {
    if (restoreOnMount && storageKey) {
      try {
        const saved = sessionStorage.getItem(`scroll_${storageKey}`);
        if (saved) {
          const pos = JSON.parse(saved);
          window.scrollTo(pos.x, pos.y);
        }
      } catch {
        // Ignore errors
      }
    }
  }, [restoreOnMount, storageKey]);

  const saveScrollPosition = useCallback(() => {
    if (storageKey) {
      try {
        sessionStorage.setItem(
          `scroll_${storageKey}`,
          JSON.stringify(getScrollPosition())
        );
      } catch {
        // Ignore errors
      }
    }
  }, [storageKey, getScrollPosition]);

  const restoreScrollPosition = useCallback(() => {
    if (storageKey) {
      try {
        const saved = sessionStorage.getItem(`scroll_${storageKey}`);
        if (saved) {
          const pos = JSON.parse(saved);
          window.scrollTo({ left: pos.x, top: pos.y, behavior: "auto" });
        }
      } catch {
        // Ignore errors
      }
    }
  }, [storageKey]);

  const scrollToTop = useCallback(() => {
    const el = getScrollElement();
    if (el === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      (el as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [getScrollElement]);

  const scrollToElement = useCallback((targetElement: HTMLElement) => {
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Calculate isAtTop and isAtBottom
  const el = getScrollElement();
  const isAtTop = scrollPosition.y === 0;
  let isAtBottom = false;

  if (el === window) {
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    isAtBottom = scrollPosition.y + clientHeight >= scrollHeight - 10;
  } else {
    const htmlEl = el as HTMLElement;
    isAtBottom =
      scrollPosition.y + htmlEl.clientHeight >= htmlEl.scrollHeight - 10;
  }

  return {
    scrollPosition,
    saveScrollPosition,
    restoreScrollPosition,
    scrollToTop,
    scrollToElement,
    isScrollingUp,
    isAtTop,
    isAtBottom,
  };
}
