import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught an error:', error, info);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080808] text-white grid place-items-center px-6">
          <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl text-center">
            <div className="text-4xl mb-4">🍕</div>
            <h1 className="text-2xl font-black mb-2">Pizzapolis hit a snag</h1>
            <p className="text-sm text-white/70 leading-6 mb-5">
              The app ran into an unexpected error. Reload and try again. If it keeps happening,
              review the browser console and the latest deployment logs.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#df5b43] px-5 font-semibold text-white hover:bg-[#c84b35]"
            >
              Reload app
            </button>
            {this.state.error ? (
              <pre className="mt-4 overflow-auto rounded-2xl bg-black/30 p-3 text-left text-[11px] text-white/60">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
