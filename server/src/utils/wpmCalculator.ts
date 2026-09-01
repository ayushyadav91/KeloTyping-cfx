export interface TypingStats {
  wpm: number;
  wps: number;
  accuracy: number;
  progressPercent: number;
  elapsedTimeMs: number;
  isCompleted: boolean;
}

export function calculateTypingStats(
  typedIndex: number,
  correctCharacters: number,
  totalCharacters: number,
  startTimeMs: number,
  currentTimeMs: number = Date.now()
): TypingStats {
  const safeTypedIndex = Math.max(0, Math.floor(typedIndex));
  const safeTotalCharacters = Math.max(1, Math.floor(totalCharacters));
  const safeCorrectChars = Math.min(safeTypedIndex, Math.max(0, Math.floor(correctCharacters)));

  const elapsedTimeMs = Math.max(0, currentTimeMs - startTimeMs);
  const elapsedMinutes = elapsedTimeMs / 60000;

  let wpm = 0;
  let wps = 0;

  if (elapsedMinutes > 0 && safeCorrectChars > 0) {
    const rawWpm = (safeCorrectChars / 5) / elapsedMinutes;
    wpm = Math.round(rawWpm * 100) / 100;
    wps = Math.round((wpm / 60) * 100) / 100;
  }

  let accuracy = 100;
  if (safeTypedIndex > 0) {
    const rawAcc = (safeCorrectChars / safeTypedIndex) * 100;
    accuracy = Math.min(100, Math.max(0, Math.round(rawAcc * 100) / 100));
  }

  const calculatedProgress = safeTotalCharacters > 0 
    ? Number(((safeTypedIndex / safeTotalCharacters) * 100).toFixed(1)) 
    : 0;
  const progressPercent = Math.min(calculatedProgress, 100);

  const isCompleted = safeTypedIndex >= safeTotalCharacters;

  return {
    wpm,
    wps,
    accuracy,
    progressPercent,
    elapsedTimeMs,
    isCompleted,
  };
}

