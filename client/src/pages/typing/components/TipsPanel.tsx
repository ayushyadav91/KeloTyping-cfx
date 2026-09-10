import '../typing.css';

const TIPS = [
  'Focus on accuracy before speed',
  'Keep your eyes on the text, not the keyboard',
  'Use proper finger placement for efficiency',
  'Practice regularly — even 10 minutes a day helps',
  'Relax your hands; tension slows you down',
];

export default function TipsPanel() {
  return (
    <div className="tips-panel">
      <p className="tips-panel__title">Tips</p>
      <ul className="tips-panel__list" aria-label="Typing tips">
        {TIPS.map((tip, i) => (
          <li key={i} className="tips-panel__item">
            <span className="tips-panel__arrow" aria-hidden="true">→</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
