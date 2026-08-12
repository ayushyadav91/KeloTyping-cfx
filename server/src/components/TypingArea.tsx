import cn from "classnames";
import { State } from "../hooks/useEngine";
import GeneratedWords from "./GeneratedWords";
import UserTypings from "./UserTypings";

const TypingArea = ({
  words,
  typed,
  cursor,
  state,
}: {
  words: string;
  typed: string;
  cursor: number;
  state: State;
}) => {
  const showHint = state === "start" && cursor === 0;

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "relative text-2xl sm:text-3xl leading-[2.2] break-all px-6 py-8 rounded-2xl border min-h-[12rem] transition-all duration-300",
          {
            "bg-surface-800/60 border-surface-600/40 shadow-inner": state === "run",
            "bg-surface-800/30 border-surface-700/30": state !== "run",
            "opacity-60 pointer-events-none": state === "finish",
          }
        )}
      >
        <GeneratedWords words={words} cursor={cursor} />
        <UserTypings
          className="absolute inset-0 px-6 py-8"
          words={words}
          userInput={typed}
          cursor={cursor}
        />

        {showHint && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-500 text-base sm:text-lg animate-pulse">
              Start typing to begin...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingArea;
