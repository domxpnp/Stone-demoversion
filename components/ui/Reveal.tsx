'use client';

import { useEffect, useRef, HTMLAttributes, ElementType } from 'react';

interface RevealProps extends HTMLAttributes<HTMLElement> {
  delay?: number;
  tag?: ElementType;
}

export default function Reveal({ children, className = '', style = {}, delay = 0, tag: Tag = 'div', ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
