import { useRef } from "react";
import { MdRefresh } from "react-icons/md";

const RestartButton = ({
  onRestart: handleRestart,
  className = "",
}: {
  onRestart: () => void;
  className?: string;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    buttonRef.current?.blur();
    handleRestart();
  };

  return (
    <button
      tabIndex={-1}
      ref={buttonRef}
      aria-label="Restart test"
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-slate-500 hover:text-slate-300 hover:bg-surface-700/50 border border-transparent hover:border-surface-600/30 transition-all ${className}`}
      onClick={handleClick}
    >
      <MdRefresh className="w-5 h-5" />
      <span className="text-sm">Restart</span>
    </button>
  );
};

export default RestartButton;
