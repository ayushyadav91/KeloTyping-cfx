import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Compact inline mode for per-route boundaries */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production swap this for Sentry.captureException(error, { extra: info })
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.props.inline) {
        return (
          <div className="error-boundary-inline" role="alert">
            <span className="error-boundary-inline__icon">⚠️</span>
            <span className="error-boundary-inline__msg">This section failed to load.</span>
            <button className="error-boundary-inline__retry" onClick={this.handleReset}>
              Retry
            </button>
          </div>
        );
      }

      return (
        <div className="error-boundary-page" role="alert" aria-live="assertive">
          <div className="error-boundary-page__card">
            <div className="error-boundary-page__icon">💥</div>
            <h2 className="error-boundary-page__title">Something went wrong</h2>
            <p className="error-boundary-page__desc">
              This page crashed unexpectedly. Your progress is safe — just reload or try again.
            </p>
            {this.state.errorMessage && (
              <code className="error-boundary-page__detail">{this.state.errorMessage}</code>
            )}
            <div className="error-boundary-page__actions">
              <button
                className="error-boundary-page__btn error-boundary-page__btn--primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button
                className="error-boundary-page__btn error-boundary-page__btn--ghost"
                onClick={() => window.location.assign('/')}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
