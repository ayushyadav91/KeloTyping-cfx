import cn from "classnames";
import Caret from "./Caret";

const UserTypings = ({
  userInput,
  words,
  cursor,
  className = "",
}: {
  userInput: string;
  words: string;
  cursor: number;
  className?: string;
}) => {
  const typedCharacters = userInput.split("");

  return (
    <div className={cn(className, "select-none")}>
      {typedCharacters.map((char, index) => (
        <Character
          key={`${char}_${index}`}
          actual={char}
          expected={words[index]}
        />
      ))}
      {cursor < words.length && <Caret />}
    </div>
  );
};

const Character = ({
  actual,
  expected,
}: {
  actual: string;
  expected: string;
}) => {
  const isCorrect = actual === expected;
  const isWhiteSpace = expected === " ";

  return (
    <span
      className={cn({
        "text-red-400": !isCorrect && !isWhiteSpace,
        "text-primary-300": isCorrect && !isWhiteSpace,
        "bg-red-500/40 text-red-300": !isCorrect && isWhiteSpace,
      })}
    >
      {expected}
    </span>
  );
};

export default UserTypings;
