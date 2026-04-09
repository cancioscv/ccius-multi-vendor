"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollState = "top" | "scrolled-down" | "scrolled-up";

/**
 * Tracks scroll direction without any position-based threshold.
 * The header must be position:fixed (not sticky) so its own height
 * changes never affect window.scrollY — eliminating feedback loops.
 *
 * @param topZone    - px from top where we're always "top" (default 80)
 * @param upDeadband - px of continuous upward scroll before expanding (default 80)
 */
export function useScrollBehavior(topZone = 80, upDeadband = 80) {
  const [scrollState, setScrollState] = useState<ScrollState>("top");
  const stateRef = useRef<ScrollState>("top");
  const lastY = useRef(0);
  const upAccum = useRef(0);

  function setState(s: ScrollState) {
    stateRef.current = s;
    setScrollState(s);
  }

  useEffect(() => {
    lastY.current = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      const dy = y - lastY.current;
      lastY.current = y;

      // Always fully expanded near top — this is safe because
      // at y < topZone the header is NOT changing height (it's already expanded)
      // so no feedback loop can occur here.
      if (y <= topZone) {
        upAccum.current = 0;
        if (stateRef.current !== "top") setState("top");
        return;
      }

      if (dy > 0) {
        // Scrolling down — shrink immediately
        upAccum.current = 0;
        if (stateRef.current !== "scrolled-down") setState("scrolled-down");
      } else if (dy < 0) {
        // Scrolling up — accumulate, expand only after deadband
        upAccum.current += Math.abs(dy);
        if (upAccum.current >= upDeadband && stateRef.current !== "scrolled-up") {
          setState("scrolled-up");
        }
      }
      // dy === 0: do nothing (momentum jitter with no actual movement)
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [topZone, upDeadband]);

  return scrollState;
}
