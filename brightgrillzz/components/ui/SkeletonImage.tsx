'use client'

import Image, { type ImageProps } from 'next/image'
import * as React from 'react'
import { cn } from '@/lib/utils'

// Images that fade in over a pulsing skeleton, so a tile never sits blank while
// a photo (often a remote Cloudinary URL) is still downloading. Both variants
// expect a positioned (relative/absolute) parent — the skeleton is absolute.

/** next/image (typically `fill`) with a skeleton placeholder until it loads. */
export function SkeletonImage({ className, onLoad, onError, ...props }: ImageProps) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 animate-pulse bg-muted transition-opacity duration-300',
          loaded ? 'opacity-0' : 'opacity-100',
        )}
      />
      <Image
        {...props}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        onError={(e) => {
          setLoaded(true) // stop the shimmer even if the image 404s
          onError?.(e)
        }}
        className={cn('transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
      />
    </>
  )
}

/** Plain <img> (e.g. a video poster) with the same skeleton behaviour. */
export function SkeletonImg({
  src,
  alt = '',
  className,
}: {
  src: string
  alt?: string
  className?: string
}) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 animate-pulse bg-muted transition-opacity duration-300',
          loaded ? 'opacity-0' : 'opacity-100',
        )}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn('transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
      />
    </>
  )
}
