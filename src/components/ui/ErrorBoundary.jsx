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
        <div className="bg-gray-900 border border-red-800 rounded-lg p-6 text-center my-4">
          <AlertTriangle size={28} className="mx-auto text-red-400 mb-3" />
          <h3 className="text-sm font-mono text-red-300 font-bold mb-1">
            {this.props.fallbackTitle || "MODULE ENCOUNTERED AN ERROR"}
          </h3>
          <p className="text-xs font-mono text-red-400/80 mb-4">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center px-4 py-2 text-xs font-mono bg-red-900/40 hover:bg-red-900/70 text-red-200 border border-red-700 rounded"
          >
            <RotateCw size={12} className="mr-1.5" /> RETRY MODULE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
