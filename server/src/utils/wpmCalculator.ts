export const calculateWpm = (correctCharacters: number, elapsedMs: number): number => {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = correctCharacters / 5;
  return Math.round((words / minutes) * 100) / 100;
};

export const calculateAccuracy = (correctCharacters: number, typedIndex: number): number => {
  if (typedIndex <= 0) return 100;
  return Math.round((correctCharacters / typedIndex) * 10000) / 100;
};

export const calculateProgress = (typedIndex: number, totalLength: number): number => {
  if (totalLength <= 0) return 0;
  return Math.min(100, Math.round((typedIndex / totalLength) * 10000) / 100);
};
