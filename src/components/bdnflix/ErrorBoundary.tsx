"use client";

import { Component, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Graceful error boundary that catches render errors and shows a
 * Netflix-style error screen with retry options.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("BDnFlix Error Boundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f] px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="flex items-center justify-center gap-0 mb-8">
              <span className="text-4xl font-black tracking-tighter text-white">BD</span>
              <span className="text-4xl font-black tracking-tighter bdnflix-red">Nflix</span>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-bdnflix-red/10 border-2 border-bdnflix-red/30 flex items-center justify-center"
            >
              <AlertTriangle className="w-10 h-10 bdnflix-red" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-white/50 text-sm mb-2">
              An unexpected error occurred while loading BDnFlix.
            </p>
            {this.state.error?.message && (
              <p className="text-white/30 text-xs mb-6 font-mono bg-white/5 rounded p-2 break-all">
                {this.state.error.message}
              </p>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-bdnflix-red hover:bg-bdnflix-red-dark text-white font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleHome}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
