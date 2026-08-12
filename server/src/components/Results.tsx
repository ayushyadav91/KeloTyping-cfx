import { motion } from "framer-motion";
import { MdRefresh } from "react-icons/md";
import { State } from "../hooks/useEngine";
import { formatPercentage } from "../utils/helpers";

const Results = ({
  state,
  errors,
  accuracyPercentage,
  total,
  wpm,
  onRestart,
}: {
  state: State;
  errors: number;
  accuracyPercentage: number;
  total: number;
  wpm: number;
  onRestart: () => void;
}) => {
  if (state !== "finish") {
    return null;
  }

  const stats = [
    { label: "WPM", value: wpm, accent: true },
    { label: "Accuracy", value: formatPercentage(accuracyPercentage), accent: false },
    { label: "Errors", value: errors, accent: false, error: true },
    { label: "Characters", value: total, accent: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full mt-8"
    >
      <div className="rounded-2xl border border-surface-600/40 bg-surface-800/60 p-6 sm:p-8">
        <h2 className="text-center text-lg font-semibold text-slate-300 mb-6 tracking-wide uppercase">
          Test Complete
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-surface-900/40"
            >
              <span className="text-[0.65rem] uppercase tracking-[0.15em] text-slate-500">
                {stat.label}
              </span>
              <span
                className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                  stat.error
                    ? "text-red-400"
                    : stat.accent
                    ? "text-primary-400"
                    : "text-slate-200"
                }`}
              >
                {stat.value}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          tabIndex={-1}
          onClick={onRestart}
          className="mt-6 mx-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-400 hover:bg-primary-500/20 transition-colors"
        >
          <MdRefresh className="w-5 h-5" />
          <span className="text-sm font-medium">Try Again</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Results;
