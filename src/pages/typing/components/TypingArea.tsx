import { useRef, useEffect } from 'react';
import '../typing.css';

interface TypingAreaProps {
  words: string[];
  typed: string;
  currentWordIndex: number;
  charStatuses: ('correct' | 'incorrect' | 'pending')[];
  started: boolean;
  onClick: () => void;
  hideOverlay?: boolean;
}

export default function TypingArea({
  words,
  typed,
  currentWordIndex,
  charStatuses,
  started,
  onClick,
  hideOverlay = false,
}: TypingAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started && areaRef.current) {
      areaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [started]);

  return (
    <div
      ref={areaRef}
      id="typing-area"
      className={`typing-area ${started ? 'typing-area--active' : ''}`}
      onClick={onClick}
      aria-label="Typing test area"
      role="textbox"
      aria-multiline="true"
      aria-readonly={false}
    >
      <div className="typing-area__words" aria-hidden="true">
        {words.slice(0, 40).map((word, wordIdx) => {
          const isCurrentWord = wordIdx === currentWordIndex;
          const isPastWord    = wordIdx < currentWordIndex;

          return (
            <span key={wordIdx} className="typing-area__word">
              {word.split('').map((char, charIdx) => {
                let statusClass = 'typing-area__char--pending';

                if (isPastWord) {
                  statusClass = 'typing-area__char--correct';
                } else if (isCurrentWord) {
                  const status = charStatuses[charIdx];
                  if (status === 'correct')   statusClass = 'typing-area__char--correct';
                  else if (status === 'incorrect') statusClass = 'typing-area__char--incorrect';
                  else if (charIdx === typed.length) {
                    statusClass = 'typing-area__char--pending typing-area__char--cursor';
                  }
                }

                return (
                  <span key={charIdx} className={`typing-area__char ${statusClass}`}>
                    {char}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>

      {/* Click-to-start overlay */}
      {!started && !hideOverlay && (
        <div className="typing-area__overlay">
          <div className="typing-area__cta">
            <p className="typing-area__cta-text">Click here or start typing to begin</p>
            <p className="typing-area__cta-hint">Tab → reset &nbsp;·&nbsp; Esc → cancel</p>
          </div>
        </div>
      )}
    </div>
  );
}
