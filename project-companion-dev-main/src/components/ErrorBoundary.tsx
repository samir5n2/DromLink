import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-50 border border-red-200 rounded-lg text-left">
          <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong!</h1>
          <p className="font-mono text-sm bg-white p-4 rounded shadow overflow-auto">
            {this.state.error?.toString()}
          </p>
          <pre className="mt-4 font-mono text-xs bg-white p-4 rounded shadow overflow-auto">
            {this.state.errorInfo?.componentStack}
          </pre>
          <button 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
