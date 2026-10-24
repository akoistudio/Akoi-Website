'use client';

import { Slider as Primitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Studio parameters use one thumb. Keep its accessible name on the interactive
// thumb so screen readers announce the parameter, range, and current value.
export function Slider({
  className,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      data-slot="slider"
      className={cn(
        'relative flex w-full touch-none items-center select-none',
        className,
      )}
      {...props}
    >
      <Primitive.Track
        data-slot="slider-track"
        className="relative h-1.5 grow overflow-hidden rounded-full bg-muted"
      >
        <Primitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-primary"
        />
      </Primitive.Track>
      <Primitive.Thumb
        data-slot="slider-thumb"
        aria-label={label}
        aria-labelledby={labelledBy}
        className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 focus-visible:ring-4 focus-visible:outline-hidden"
      />
    </Primitive.Root>
  );
}
