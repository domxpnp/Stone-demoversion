'use client';

import { useEffect, useRef } from 'react';

interface StoneCursorProps {
  label?: string;
  selector?: string;
}

/**
 * A circular cursor follower that scales up and reads `label`
 * whenever the pointer is over an element matching `selector`.
 * Position/visibility are mutated directly on the node to avoid
 * re-rendering on every mousemove.
 */
export default function StoneCursor({ label = 'View Stone', selector = '.slab-card' }: StoneCursorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      const target = e.target as Element | null;
      const hit = target?.closest?.(selector);
      el.classList.toggle('on', !!hit);
    };

    const leave = () => el.classList.remove('on');

    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
    };
  }, [selector]);

  return (
    <div ref={ref} className="cursor-tag" aria-hidden="true">
      <span className="tw" />
      {label}
    </div>
  );
}