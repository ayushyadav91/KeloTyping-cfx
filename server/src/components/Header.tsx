import { MdKeyboard } from "react-icons/md";

const Header = () => {
  return (
    <header className="flex items-center justify-center gap-3 mb-8">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20">
        <MdKeyboard className="w-6 h-6 text-primary-400" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          SpeedType
        </h1>
        <p className="text-xs text-slate-500 tracking-wide">
          30 second typing test
        </p>
      </div>
    </header>
  );
};

export default Header;
