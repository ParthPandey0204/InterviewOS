import React from "react";

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="app-state-page"><section className="app-state-card"><p className="section-kicker">Something went wrong</p><h1>We could not load this page.</h1><p>Try again, or return to your dashboard and start a fresh session.</p><div><button className="primary-action" onClick={() => this.setState({ hasError: false })}>Try again</button><a className="state-link" href="/">Go to dashboard</a></div></section></div>;
    }
    return this.props.children;
  }
}
