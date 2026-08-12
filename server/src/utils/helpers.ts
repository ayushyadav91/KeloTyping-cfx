// accept only letters and whitespaces
export const isKeyboardCodeAllowed = (code: string) => {
  return (
    code.startsWith("Key") ||
    code.startsWith("Digit") ||
    code === "Backspace" ||
    code === "Space"
  );
};

export const countErrors = (actual: string, expected: string) => {
  const expectedCharacters = expected.split("");

  return expectedCharacters.reduce((errors, expectedChar, i) => {
    const actualChar = actual[i];
    if (actualChar !== expectedChar) {
      errors++;
    }
    return errors;
  }, 0);
};

export const calculateAccuracyPercentage = (errors: number, total: number) => {
  if (total > 0) {
    const corrects = total - errors;
    return (corrects / total) * 100;
  }

  return 0;
};

export const formatPercentage = (percentage: number) => {
  return percentage.toFixed(0) + "%";
};

export const calculateWPM = (totalTyped: number, elapsedSeconds: number) => {
  if (elapsedSeconds <= 0 || totalTyped <= 0) {
    return 0;
  }

  const minutes = elapsedSeconds / 60;
  return Math.round(totalTyped / 5 / minutes);
};

export const getWordIndexAtCursor = (text: string, cursor: number) => {
  let wordIndex = 0;

  for (let i = 0; i < Math.min(cursor, text.length); i++) {
    if (text[i] === " ") {
      wordIndex++;
    }
  }

  return wordIndex;
};

export const debug = (str: string) => {
  if (process.env.NODE_ENV === "development") {
    console.debug(str);
  }
};
