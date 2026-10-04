import React from 'react';
import ErrorLogger from '../infrastructure/logger/ErrorLogger';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary Component
 * ✅ التقاط الأخطاء في React
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorLogger.error('ErrorBoundary caught error', { error, errorInfo });
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
              حدث خطأ
            </h1>

            <p className="text-gray-600 text-center mb-4">
              {this.state.error.message}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4 p-3 bg-gray-100 rounded text-sm text-gray-700 max-h-48 overflow-auto">
                <summary className="cursor-pointer font-semibold mb-2">
                  تفاصيل الخطأ
                </summary>
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                إعادة محاولة
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
              >
                الرئيسية
              </button>
            </div>

            {this.state.errorCount > 3 && (
              <p className="text-red-600 text-center mt-4 text-sm">
                ⚠️ حدثت أخطاء متعددة. يرجى إعادة تحميل الصفحة.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
