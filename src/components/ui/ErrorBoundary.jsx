// src/components/ui/ErrorBoundary.jsx
import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected rendering error occurred.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="system-window rounded-2xl p-6 text-center my-4 border-rose-500/40">
          <AlertTriangle size={28} className="mx-auto text-rose-400 mb-3" />
          <h3 className="text-sm font-semibold text-rose-300 mb-1">
            {this.props.fallbackTitle || "MODULE ENCOUNTERED AN ERROR"}
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center px-4 py-2 text-xs font-mono bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/40 rounded-lg transition-colors"
          >
            <RotateCw size={12} className="mr-1.5" /> RETRY MODULE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
