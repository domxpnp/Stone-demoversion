'use client';

import { ImgHTMLAttributes } from 'react';

const FALLBACK = '/photos/blankimg.jpg';

export default function Img({ onError, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      onError={(e) => {
        const el = e.currentTarget;
        if (!el.src.endsWith(FALLBACK)) el.src = FALLBACK;
        onError?.(e);
      }}
    />
  ); 
}
