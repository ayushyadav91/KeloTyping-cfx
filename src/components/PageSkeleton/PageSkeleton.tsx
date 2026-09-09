import './PageSkeleton.css';

export default function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-hidden="true" aria-label="Loading page...">
      {/* Navbar placeholder */}
      <div className="page-skeleton__navbar">
        <div className="page-skeleton__logo" />
        <div className="page-skeleton__nav-links">
          <div className="page-skeleton__nav-link" />
          <div className="page-skeleton__nav-link" />
          <div className="page-skeleton__nav-link" />
        </div>
      </div>

      {/* Body placeholder */}
      <div className="page-skeleton__body">
        <div className="page-skeleton__title" />
        <div className="page-skeleton__block" />
        <div className="page-skeleton__row">
          <div className="page-skeleton__card" />
          <div className="page-skeleton__card" />
        </div>
      </div>
    </div>
  );
}
