import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/layouts/AppLayout';
import TypingArea from '../../typing/components/TypingArea';
import { useTypingTest } from '../../typing/hooks/useTypingTest';
import { useAppDispatch, useAppState } from '../../../store/AppContext';
import type { MultiResult, TestResult } from '../../../components/types';
import '../multiplayer.css';
import '../../typing/typing.css';

interface LocationState {
  opponentName?: string;
  opponents?: string[];
  matchMode?: 'private' | 'quick';
  playersCount?: number;
}

/* ── Realistic opponent bots ── */
function useOpponentBots(opponents: string[], totalChars: number, started: boolean) {
  const [botsState, setBotsState] = useState(opponents.map(name => ({
    name,
    progress: 0,
    wpm: 0,
    finished: false,
    targetWpm: 90 + Math.floor(Math.random() * 80) // 90–170 WPM
  })));

  useEffect(() => {
    if (!started || totalChars === 0) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      setBotsState(prev => {
        let anyChanged = false;
        const next = prev.map(bot => {
          if (bot.finished) return bot;
          const elapsed = Date.now() - startTime;
          const charsPerMs = (bot.targetWpm * 5) / 60000;
          const progress = Math.min(Math.round(charsPerMs * elapsed), totalChars);
          const jitter = Math.floor(Math.random() * 3) - 1;
          const actual = Math.max(0, Math.min(progress + jitter, totalChars));
          const wpm = Math.round((actual / 5) / Math.max(elapsed / 60000, 0.001));
          const finished = actual >= totalChars;
          anyChanged = true;
          return { ...bot, progress: actual, wpm, finished };
        });
        return anyChanged ? next : prev;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [started, totalChars]); // opponents is omitted to prevent resetting bots on re-renders

  return botsState;
}

export default function MultiplayerMatchPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const location     = useLocation();
  const navigate     = useNavigate();
  const dispatch     = useAppDispatch();
  const { user }     = useAppState();

  const state: LocationState = (location.state as LocationState) || {};
  const opponents = state.opponents || (state.opponentName ? [state.opponentName] : ['BlazingKeys']);
  const matchMode    = state.matchMode    || 'private';

  const [matchFinished, setMatchFinished] = useState(false);
  const [winner, setWinner]               = useState<'user' | 'opponent' | null>(null);
  const [finalResult, setFinalResult]     = useState<TestResult | null>(null);

  const handleFinish = (result: TestResult) => {
    setFinalResult(result);
    // User wins only if no bot has finished yet
    if (!bots.some(b => b.finished)) setWinner('user');
    setMatchFinished(true);
  };

  const {
    words, typed, currentWordIndex, charStatuses,
    started, finished, timeLeft, wpm, totalTyped, reset,
  } = useTypingTest('common-words', 60, { onFinish: handleFinish });

  const totalChars = words.join(' ').length;
  const bots = useOpponentBots(opponents, totalChars, started);
  const anyBotFinished = bots.some(b => b.finished);

  // If ANY opponent finishes first, user loses (but can keep typing)
  useEffect(() => {
    if (anyBotFinished && !finished && !matchFinished) {
      setWinner('opponent');
      setMatchFinished(true);
    }
  }, [anyBotFinished, finished, matchFinished]);

  useEffect(() => {
    if (!matchFinished) return;
    // Grab the latest result (either set by onFinish or computed from current wpm)
    const latestResult = finalResult;
    const userFinalWpm = latestResult ? latestResult.wpm : wpm;
    const userFinalAcc = latestResult ? latestResult.accuracy : 100;

    const bestBot = bots.length > 0 ? bots.reduce((prev, curr) => prev.progress > curr.progress ? prev : curr) : { name: 'Opponent', wpm: 0 };

    const multiResult: MultiResult = {
      id:               `multi_${Date.now()}`,
      roomCode:         roomCode || 'QM-????',
      matchMode,
      opponentName:     bestBot.name,
      userWpm:          userFinalWpm,
      opponentWpm:      bestBot.wpm,
      userAccuracy:     userFinalAcc,
      opponentAccuracy: 94,
      winner:           winner || 'draw',
      date:             new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MULTI_RESULT', payload: multiResult });
  }, [matchFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  const userPct     = totalChars > 0 ? Math.min((totalTyped / totalChars) * 100, 100) : 0;
  const userInitial = (user?.username?.[0] || 'Y').toUpperCase();

  return (
    <AppLayout>
      <div className="match-page anim-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => navigate('/multiplayer')} className="landing-btn--ghost" style={{ alignSelf: 'flex-start', marginBottom: '2rem', color: 'var(--accent-rose)' }}>
          ← Quit Match
        </button>
        {/* Header */}
        <div className="match-page__header">
          <div className="match-page__room-badge">
            <span className="match-page__room-icon">🔒</span>
            <span className="match-page__room-code">{roomCode}</span>
          </div>
          <div className="match-page__mode">
            {matchMode === 'private' ? 'Private Match' : 'Quick Match'}
            {state.playersCount && (
              <span style={{ marginLeft: '0.5rem', color: 'var(--accent-violet)', fontSize: '0.9em' }}>
                • {state.playersCount} Players
              </span>
            )}
          </div>
          <div className="match-page__timer" aria-live="polite">
            <span className={`match-page__timer-value ${timeLeft <= 10 ? 'match-page__timer-value--danger' : ''}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Racing Lanes */}
        <div className="match-lanes">
          {/* User lane */}
          <div className={`match-lane match-lane--user ${winner === 'user' ? 'match-lane--winner' : ''} ${winner === 'opponent' && matchFinished ? 'match-lane--loser' : ''}`}>
            <div className="match-lane__info">
              <div className="match-lane__avatar match-lane__avatar--user">{userInitial}</div>
              <div className="match-lane__details">
                <span className="match-lane__name">{user?.username || 'You'}</span>
                <span className="match-lane__pct">{Math.round(userPct)}%</span>
              </div>
              <div className="match-lane__wpm">
                <span className="match-lane__wpm-value">{wpm}</span>
                <span className="match-lane__wpm-label">wpm</span>
              </div>
            </div>
            <div className="match-lane__bar" role="progressbar" aria-valuenow={Math.round(userPct)}>
              <div className="match-lane__bar-fill match-lane__bar-fill--user" style={{ width: `${userPct}%` }}>
                <div className="match-lane__car">🏎️</div>
              </div>
            </div>
          </div>

          {/* Opponent lanes */}
          {bots.map((bot, idx) => {
            const oppPct = totalChars > 0 ? Math.min((bot.progress / totalChars) * 100, 100) : 0;
            const oppInitial = bot.name[0].toUpperCase();
            return (
              <div key={idx} className={`match-lane match-lane--opp ${winner === 'opponent' && bot.finished ? 'match-lane--winner' : ''} ${winner === 'user' && matchFinished ? 'match-lane--loser' : ''}`}>
                <div className="match-lane__info">
                  <div className="match-lane__avatar match-lane__avatar--opp">{oppInitial}</div>
                  <div className="match-lane__details">
                    <span className="match-lane__name">{bot.name}</span>
                    <span className="match-lane__pct">{Math.round(oppPct)}%</span>
                  </div>
                  <div className="match-lane__wpm">
                    <span className="match-lane__wpm-value">{bot.wpm}</span>
                    <span className="match-lane__wpm-label">wpm</span>
                  </div>
                </div>
                <div className="match-lane__bar" role="progressbar" aria-valuenow={Math.round(oppPct)}>
                  <div className="match-lane__bar-fill match-lane__bar-fill--opp" style={{ width: `${oppPct}%` }}>
                    <div className="match-lane__car">🚗</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Typing Area */}
        <TypingArea
          words={words}
          typed={typed}
          currentWordIndex={currentWordIndex}
          charStatuses={charStatuses}
          started={started}
          hideOverlay={true}
          onClick={() => {}}
        />

        {matchFinished && (
          <div className="match-result-overlay" role="dialog" aria-label="Match result">
            <div className="match-result-card anim-pop-in">

              {/* Icon + Title */}
              <div className="match-result-card__icon">
                {winner === 'user' ? '🏆' : winner === 'opponent' ? '💔' : '🤝'}
              </div>
              <h2 className="match-result-card__title">
                {winner === 'user' ? 'You Won!' : winner === 'opponent' ? 'You Lost' : 'Draw!'}
              </h2>

              {/* Score Comparison */}
              <div className="match-result-card__scores">
                <div className="match-result-card__score">
                  <span className="match-result-card__score-name">{user?.username || 'You'}</span>
                  <span className="match-result-card__score-wpm" style={{ color: 'var(--accent-cyan)' }}>
                    {finalResult ? finalResult.wpm : wpm} wpm
                  </span>
                  <span className="match-result-card__score-acc">
                    {finalResult ? finalResult.accuracy : 100}% acc
                  </span>
                </div>
                <span className="match-result-card__vs">vs</span>
                <div className="match-result-card__score">
                  <span className="match-result-card__score-name">{bots.length > 0 ? bots.reduce((prev, curr) => prev.progress > curr.progress ? prev : curr).name : 'Opponent'}</span>
                  <span className="match-result-card__score-wpm" style={{ color: 'var(--accent-violet)' }}>
                    {bots.length > 0 ? bots.reduce((prev, curr) => prev.progress > curr.progress ? prev : curr).wpm : 0} wpm
                  </span>
                  <span className="match-result-card__score-acc">94% acc</span>
                </div>
              </div>

              {/* Saved indicator */}
              <div className="match-result-card__saved">
                ✅ Match saved to your history
              </div>

              {/* Actions */}
              <div className="match-result-card__actions">
                <button
                  id="match-home-btn"
                  className="mp-find-btn"
                  onClick={() => navigate('/multiplayer')}
                >
                  🏠 Back to Home
                </button>
                <button
                  id="match-results-btn"
                  className="mp-ghost-btn"
                  onClick={() => navigate('/results')}
                >
                  📊 Full Results
                </button>
                <button
                  id="match-rematch-btn"
                  className="mp-ghost-btn"
                  onClick={() => {
                    reset();
                    setMatchFinished(false);
                    setWinner(null);
                    setFinalResult(null);
                  }}
                >
                  ↺ Rematch
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
