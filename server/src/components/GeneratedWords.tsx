import cn from "classnames";
import { getWordIndexAtCursor } from "../utils/helpers";

const GeneratedWords = ({
  words,
  cursor,
}: {
  words: string;
  cursor: number;
}) => {
  const wordList = words.split(" ");
  const currentWordIndex = getWordIndexAtCursor(words, cursor);

  return (
    <div className="text-slate-600 select-none">
      {wordList.map((word, index) => (
        <span key={`${word}-${index}`}>
          <span
            className={cn("rounded px-0.5 transition-colors duration-150", {
              "bg-surface-600/40": index === currentWordIndex,
            })}
          >
            {word}
          </span>
          {index < wordList.length - 1 && " "}
        </span>
      ))}
    </div>
  );
};

export default GeneratedWords;
