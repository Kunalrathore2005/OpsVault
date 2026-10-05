import { useState, useRef, useEffect } from 'react';
import { Play, Sparkles, Shield, Activity, Radio } from 'lucide-react';

export default function HeroVideo() {
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setVideoLoaded(true);
    const handleError = () => {
      // If local asset somehow fails, fallback to CDN
      if (video.src.includes('/assets/hero/opsvault-hero-video.mp4')) {
        video.src = 'https://cdn.dribbble.com/userupload/48639998/file/8579b8a145ee067d6fb59638636666c8.mp4';
        video.load();
      } else {
        setVideoError(true);
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    // Explicitly attempt play for browsers with strict policies
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback, muted is set so this is rare
      });
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <div className="landing-hero-video-container">
      {/* Ambient background glow */}
      <div className="landing-hero-video-glow" aria-hidden="true" />

      {/* 3D Layered Frame */}
      <div className="landing-hero-video-frame">
        {/* Top Product Window Header Bar */}
        <div className="landing-hero-video-header">
          <div className="landing-mockup-dots">
            <span className="landing-mockup-dot red" />
            <span className="landing-mockup-dot yellow" />
            <span className="landing-mockup-dot green" />
          </div>

          <div className="landing-hero-video-badge">
            <Radio size={12} className="landing-hero-video-live-dot" />
            <span>OpsVault OS 2.4 · Live Workspace</span>
          </div>

          <div className="landing-hero-video-status">
            <Activity size={13} color="var(--success)" />
            <span>99.9% Uptime</span>
          </div>
        </div>

        {/* Video Player Wrapper */}
        <div className="landing-hero-video-viewport">
          <video
            ref={videoRef}
            src="/assets/hero/opsvault-hero-video.mp4"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            preload="auto"
            className={`landing-hero-video-element ${videoLoaded ? 'loaded' : ''}`}
            aria-label="OpsVault Platform Showcase Video"
          />

          {/* Floating Metric Badge cleanly overlaid on top of video */}
          <div className="landing-hero-floating-pill">
            <div className="floating-pill-icon">
              <Sparkles size={14} />
            </div>
            <div className="floating-pill-text">
              <strong>Autonomous Engine Active</strong>
              <span>Continuous Task &amp; SLA Guard</span>
            </div>
          </div>

          {/* Fallback placeholder if video is buffering */}
          {!videoLoaded && !videoError && (
            <div className="landing-hero-video-placeholder">
              <div className="landing-hero-video-loader-spinner" />
              <span>Loading Live Operational View...</span>
            </div>
          )}

          {videoError && (
            <div className="landing-hero-video-placeholder error">
              <Shield size={24} color="var(--primary)" />
              <span>Interactive Operations Workspace</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

