import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TypingMode, TimeDuration } from '../../../components/types';
import AppLayout from '../../../components/layouts/AppLayout';
import ModeSelector from '../components/ModeSelector';
import TimeSelector from '../components/TimeSelector';
import StatsBar from '../components/StatsBar';
import TypingArea from '../components/TypingArea';
import RecentScores from '../components/RecentScores';
import TipsPanel from '../components/TipsPanel';
import { useTypingTest } from '../hooks/useTypingTest';
import '../typing.css';

export default function TypingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<TypingMode>('common-words');
  const [duration, setDuration] = useState<TimeDuration>(60);
  const containerRef = useRef<HTMLDivElement>(null);

  // New states for Start Button & Countdown
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const {
    words,
    typed,
    currentWordIndex,
    charStatuses,
    started,
    timeLeft,
    wpm,
    accuracy,
    totalTyped,
    reset,
  } = useTypingTest(mode, duration);

  const handleModeChange = (newMode: TypingMode) => {
    setMode(newMode);
    setIsReady(false);
    setCountdown(null);
  };

  const handleDurationChange = (d: TimeDuration) => {
    setDuration(d);
    setIsReady(false);
    setCountdown(null);
  };

  const handleAreaClick = () => {
    if (isReady && containerRef.current) {
      containerRef.current.focus();
    }
  };

  const startCountdown = () => {
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsReady(true);
      setCountdown(null);
      // Wait for re-render to focus the typing area (which will be unlocked)
      setTimeout(() => {
        const typingArea = document.querySelector('.typing-area-container');
        if (typingArea) (typingArea as HTMLElement).focus();
      }, 0);
    }
  }, [countdown]);

  return (
    <AppLayout>
      <div className="typing-page">
        <button onClick={() => {
          if (isReady) {
            // If they are in a match, quitting goes home or resets? They asked to go back to dashboard, which navigate('/home') does.
            navigate('/home');
          } else {
            navigate('/home');
          }
        }} className="landing-btn--ghost" style={{ alignSelf: 'flex-start', marginBottom: '2rem', color: isReady ? 'var(--accent-rose)' : 'inherit' }}>
          {isReady ? '← Quit Match' : '← Back to Dashboard'}
        </button>
        {/* Mode + Time selectors */}
        <div className="typing-page__controls">
          <ModeSelector activeMode={mode} onModeChange={handleModeChange} />
          <TimeSelector activeDuration={duration} onDurationChange={handleDurationChange} />
        </div>

        {/* Stats bar */}
        <StatsBar
          wpm={wpm}
          accuracy={accuracy}
          timeLeft={timeLeft}
          totalTyped={totalTyped}
          totalChars={words.join(' ').length}
          onReset={() => {
            reset();
            setIsReady(false);
            setCountdown(null);
          }}
        />

        {/* Typing area with Start Overlay */}
        <div style={{ position: 'relative' }}>
          {(!isReady || countdown !== null) && (
            <div 
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backdropFilter: 'blur(2px)',
                borderRadius: '8px'
              }}
            >
              {countdown === null ? (
                <button 
                  onClick={startCountdown}
                  className="landing-btn--primary"
                  style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}
                >
                  Start Match
                </button>
              ) : (
                <div style={{ fontSize: '5rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                  {countdown}
                </div>
              )}
            </div>
          )}

          <div style={{ pointerEvents: isReady ? 'auto' : 'none', opacity: isReady ? 1 : 0.4 }}>
            <TypingArea
              words={words}
              typed={typed}
              currentWordIndex={currentWordIndex}
              charStatuses={charStatuses}
              started={started}
              hideOverlay={true}
              onClick={handleAreaClick}
            />
          </div>
        </div>

        {/* Bottom panels */}
        <div className="typing-page__panels">
          <RecentScores />
          <TipsPanel />
        </div>
      </div>
    </AppLayout>
  );
}
