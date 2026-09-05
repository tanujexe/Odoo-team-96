import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary" className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-6">
              An unhandled application error occurred. We have logged the issue.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-100 rounded-lg p-3 text-left mb-6 overflow-x-auto">
                <code className="text-xs text-rose-700 font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <Button
              variant="primary"
              className="w-full"
              icon={RotateCcw}
              onClick={this.handleReset}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
