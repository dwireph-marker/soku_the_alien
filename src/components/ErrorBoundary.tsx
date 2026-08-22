import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackName?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const msg = String(error?.message || '').toLowerCase();
    const name = String(error?.name || '').toLowerCase();
    if (
      msg.includes('closing') ||
      msg.includes('hidden') ||
      msg.includes('database is closing') ||
      msg.includes('closing/hidden') ||
      msg.includes('database is hidden') ||
      msg.includes('database is closed') ||
      msg.includes('indexeddb') ||
      name.includes('indexeddb')
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.fallbackName ? `: ${this.props.fallbackName}` : ''}] Caught error:`, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 mx-auto max-w-xl bg-stone-900/90 border border-rose-500/30 rounded-2xl text-stone-100 shadow-xl backdrop-blur-md font-sans">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-stone-100">
                {this.props.fallbackName ? `${this.props.fallbackName} Error` : 'Something went wrong'}
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                {this.state.error?.message || 'A component encountered an error, but the application remains stable.'}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-medium text-stone-200 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
