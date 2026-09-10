import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TypingMode, TimeDuration, TestResult } from '../../../components/types';
import { generateWords, generateQuote } from '../services/words.service';
import { useAppDispatch } from '../../../store/AppContext';
import { api } from '../../../components/api';

interface UseTypingTestOptions {
  /** If provided, called with result instead of auto-navigating to /results */
  onFinish?: (result: TestResult) => void;
}

export function useTypingTest(
  mode: TypingMode,
  duration: TimeDuration,
  options: UseTypingTestOptions = {}
) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { onFinish } = options;

  const [words, setWords] = useState<string[]>([]);
  const [typed, setTyped] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [charStatuses, setCharStatuses] = useState<('correct' | 'incorrect' | 'pending')[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [keyErrors, setKeyErrors] = useState<Record<string, number>>({});

  const wpmInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(0);

  const loadContent = useCallback(() => {
    if (mode === 'quotes') setWords(generateQuote().split(' '));
    else setWords(generateWords(80));
    setTyped('');
    setCurrentWordIndex(0);
    setCharStatuses([]);
    setStarted(false);
    setFinished(false);
    setTimeLeft(duration);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setTotalTyped(0);
    setWpmHistory([]);
    setKeyErrors({});
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (wpmInterval.current) clearInterval(wpmInterval.current);
  }, [mode, duration]);

  useEffect(() => { loadContent(); }, [loadContent]);

  const startTimer = useCallback(() => {
    startTime.current = Date.now();
    timerInterval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval.current!);
          clearInterval(wpmInterval.current!);
          setFinished(true);
          return 0 as TimeDuration;
        }
        return (prev - 1) as TimeDuration;
      });
    }, 1000);

    wpmInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 60000;
      const current = Math.round(totalTyped / 5 / Math.max(elapsed, 0.001)) || 0;
      setWpmHistory(h => [...h, current]);
    }, 5000);
  }, [totalTyped]);

  useEffect(() => {
    if (!finished) return;
    const elapsed = (Date.now() - startTime.current) / 60000;
    const finalWpm = Math.round(totalTyped / 5 / Math.max(elapsed, 0.001)) || 0;
    const finalAcc = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
    const finalHistory = wpmHistory.length > 0 ? wpmHistory : [finalWpm];

    const result: TestResult = {
      id: `test_${Date.now()}`,
      wpm: finalWpm,
      accuracy: finalAcc,
      errors,
      streak: 1, // will be recomputed in reducer based on history
      rawWpm: Math.round(finalWpm * 1.15),
      time: duration,
      chars: totalTyped,
      mode,
      wpmOverTime: finalHistory,
      keyErrors,
      date: new Date().toISOString(),
    };

    // Persist to global context
    dispatch({ type: 'ADD_RESULT', payload: result });
    sessionStorage.setItem('lastResult', JSON.stringify(result));

    // Save to backend database if authenticated
    if (localStorage.getItem('token')) {
      api.results.save({
        wpm: finalWpm,
        accuracy: finalAcc,
        errors,
        totalTyped,
        duration: duration,
      }).catch(() => {});
    }

    if (onFinish) {
      onFinish(result);
    } else {
      setTimeout(() => navigate('/results'), 300);
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (finished) return;
    if (e.key === 'Tab') { e.preventDefault(); loadContent(); return; }
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (!started && e.key.length === 1) {
      setStarted(true);
      startTimer();
    }

    const currentWord = words[currentWordIndex] || '';

    if (e.key === ' ') {
      e.preventDefault();
      if (typed.length === 0) return;
      setCurrentWordIndex(i => i + 1);
      setTyped('');
      setCharStatuses([]);
      setTotalTyped(t => t + typed.length + 1);
      return;
    }

    if (e.key === 'Backspace') {
      if (typed.length > 0) {
        setTyped(t => t.slice(0, -1));
        setCharStatuses(s => s.slice(0, -1));
      }
      return;
    }

    if (e.key.length === 1) {
      const expectedChar = currentWord[typed.length];
      const isCorrect = e.key === expectedChar;
      if (!isCorrect) {
        setErrors(err => err + 1);
        if (expectedChar) setKeyErrors(prev => ({ ...prev, [expectedChar]: (prev[expectedChar] || 0) + 1 }));
      }
      setTyped(t => t + e.key);
      setCharStatuses(s => [...s, isCorrect ? 'correct' : 'incorrect']);
    }
  }, [finished, started, words, currentWordIndex, typed, startTimer, loadContent, errors, keyErrors]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (started && totalTyped > 0) {
      const elapsed = (Date.now() - startTime.current) / 60000;
      setWpm(Math.round(totalTyped / 5 / Math.max(elapsed, 0.001)) || 0);
      setAccuracy(Math.round(((totalTyped - errors) / totalTyped) * 100));
    }
  }, [totalTyped, errors, started]);

  return {
    words, typed, currentWordIndex, charStatuses,
    started, finished, timeLeft,
    wpm, accuracy, errors, totalTyped,
    reset: loadContent,
  };
}
