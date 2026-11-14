"use client";

/**
 * GlobeBackground — cinematic particle globe backdrop.
 *
 * Visual direction from the Vaultra design system:
 *  - Still image as the base layer
 *  - Muted looping video overlaid on the still
 *  - Video fades in when its first frame is ready
 *  - Original globe geometry preserved (no CSS/JS-drawn globe)
 *  - Responsive masking and positioning
 *  - Respects prefers-reduced-motion (video disabled)
 *
 * Media assets (supplied):
 *  Still: https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg
 *  Video: https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4
 */
import Image from 'next/image';
import { useRef, useState, useSyncExternalStore } from 'react';

const STILL_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg';
const VIDEO_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4';

function subscribeToReducedMotion(onChange) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function GlobeBackground({ className = '' }) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    () => false,
  );

  const handleLoadedMetadata = () => {
    setVideoReady(true);
  };

  return (
    <div className={`globe-background ${className}`} aria-hidden="true">
      {/* Diagonal light lines */}
      <div className="diagonal-lines" />

      {/* Still image — base layer */}
      <Image
        className="globe-image"
        src={STILL_URL}
        alt=""
        width={1920}
        height={1080}
        unoptimized
        loading="eager"
      />

      {/* Muted looping video — fades in when first frame is ready */}
      {!reducedMotion && (
        <video
          ref={videoRef}
          className={`globe-video ${videoReady ? 'visible' : ''}`}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          onLoadedMetadata={handleLoadedMetadata}
          aria-hidden="true"
        />
      )}

      {/* Vignette overlay — preserves globe geometry while grounding content */}
      <div className="globe-overlay" />

      {/* Glowing rim (red / blue / magenta) around the globe */}
      <div className="globe-rim">
        <Image
          src={STILL_URL}
          alt=""
          width={1920}
          height={1080}
          unoptimized
        />
      </div>
    </div>
  );
}
