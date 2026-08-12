import cn from "classnames";
import { State } from "../hooks/useEngine";

const TimerProgress = ({
  timeLeft,
  totalSeconds,
  state,
}: {
  timeLeft: number;
  totalSeconds: number;
  state: State;
}) => {
  const progress = (timeLeft / totalSeconds) * 100;
  const isLow = timeLeft <= 10 && state === "run";

  return (
    <div className="w-full h-1.5 bg-surface-700/50 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-1000 ease-linear", {
          "bg-primary-400": !isLow,
          "bg-red-500": isLow,
        })}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default TimerProgress;
