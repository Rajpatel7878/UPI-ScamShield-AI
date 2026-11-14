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
import { useEffect, useRef, useState } from 'react';

const STILL_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg';
const VIDEO_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4';

export default function GlobeBackground({ className = '' }) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event) => setReducedMotion(event.matches);
    setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleLoadedMetadata = () => {
    setVideoReady(true);
  };

  return (
    <div className={`globe-background ${className}`} aria-hidden="true">
      {/* Diagonal light lines */}
      <div className="diagonal-lines" />

      {/* Still image — base layer */}
      <img
        className="globe-image"
        src={STILL_URL}
        alt=""
        decoding="async"
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
        <img src={STILL_URL} alt="" decoding="async" />
      </div>
    </div>
  );
}
