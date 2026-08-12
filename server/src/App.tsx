import Header from "./components/Header";
import Results from "./components/Results";
import RestartButton from "./components/RestartButton";
import StatsBar from "./components/StatsBar";
import TimerProgress from "./components/TimerProgress";
import TypingArea from "./components/TypingArea";
import useEngine, { COUNTDOWN_SECONDS } from "./hooks/useEngine";
import {
  calculateAccuracyPercentage,
  calculateWPM,
  countErrors,
} from "./utils/helpers";

const App = () => {
  const { words, typed, timeLeft, errors, state, restart, totalTyped, cursor } =
    useEngine();

  const elapsedSeconds = COUNTDOWN_SECONDS - timeLeft;
  const wordsReached = words.substring(0, Math.min(cursor, words.length));
  const liveErrors = countErrors(typed, wordsReached);
  const liveAccuracy = calculateAccuracyPercentage(liveErrors, totalTyped);
  const wpm = calculateWPM(totalTyped, elapsedSeconds || 1);

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-12">
      <Header />

      <div className="space-y-6">
        <StatsBar
          wpm={wpm}
          accuracy={liveAccuracy}
          timeLeft={timeLeft}
          state={state}
        />

        <TimerProgress
          timeLeft={timeLeft}
          totalSeconds={COUNTDOWN_SECONDS}
          state={state}
        />

        <TypingArea
          words={words}
          typed={typed}
          cursor={cursor}
          state={state}
        />

        {state !== "finish" && (
          <div className="flex justify-center">
            <RestartButton onRestart={restart} />
          </div>
        )}

        <Results
          state={state}
          errors={errors}
          accuracyPercentage={calculateAccuracyPercentage(errors, totalTyped)}
          total={totalTyped}
          wpm={wpm}
          onRestart={restart}
        />
      </div>

      <footer className="mt-12 text-center text-xs text-slate-600">
        Press any key to start typing
      </footer>
    </div>
  );
};

export default App;
