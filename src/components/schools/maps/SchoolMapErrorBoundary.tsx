'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  heightClassName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SchoolMapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Google Maps container caught error:', error.message, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={`relative w-full ${
            this.props.heightClassName || 'h-72 sm:h-80 md:h-96'
          } rounded-2xl overflow-hidden border border-[#E2E8F0] bg-gradient-to-b from-[#FAF7F2] to-[#F1F5F9] shadow-2xs flex flex-col items-center justify-center p-6 text-center transition-all`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#4338CA] mb-3">
            <AlertCircle className="w-6 h-6 text-[#EA4335]" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#131B2E]">
            Interactive map temporarily unavailable
          </h4>
          <p className="text-[11px] text-[#64748B] max-w-md mt-1 leading-relaxed">
            School onboarding does not depend on the map. You can proceed using the address fields, Google Maps share link, or manual coordinates below.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}
            className="mt-4 inline-flex items-center space-x-1.5 bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#334155] px-3.5 py-1.5 rounded-xl shadow-2xs text-[11px] font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#64748B]" />
            <span>Retry Map</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SchoolMapErrorBoundary;
