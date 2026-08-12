import cn from "classnames";
import { State } from "../hooks/useEngine";

type StatItemProps = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

const StatItem = ({ label, value, highlight = false }: StatItemProps) => {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[5.5rem]">
      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-medium">
        {label}
      </span>
      <span
        className={cn("text-2xl font-semibold tabular-nums", {
          "text-primary-400": highlight,
          "text-slate-200": !highlight,
        })}
      >
        {value}
      </span>
    </div>
  );
};

const StatsBar = ({
  wpm,
  accuracy,
  timeLeft,
  state,
}: {
  wpm: number;
  accuracy: number;
  timeLeft: number;
  state: State;
}) => {
  const isActive = state === "run";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-8 sm:gap-12 py-4 px-6 rounded-2xl border transition-colors duration-300",
        {
          "bg-surface-800/80 border-surface-600/50": isActive,
          "bg-surface-800/40 border-surface-700/30": !isActive,
        }
      )}
    >
      <StatItem label="WPM" value={wpm} highlight={isActive} />
      <div className="w-px h-10 bg-surface-600/50" />
      <StatItem
        label="Accuracy"
        value={`${accuracy.toFixed(0)}%`}
        highlight={isActive}
      />
      <div className="w-px h-10 bg-surface-600/50 hidden sm:block" />
      <StatItem
        label="Time"
        value={timeLeft}
        highlight={state === "run" && timeLeft <= 10}
      />
    </div>
  );
};

export default StatsBar;
