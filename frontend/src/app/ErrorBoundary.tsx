import React from 'react';
import { Card, Button, PageContainer } from '@/ui';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Replace with a real logger (Sentry, etc.) when needed
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <PageContainer>
          <div role="alert" className="flex items-center justify-center pt-8">
            <Card className="w-full max-w-sm">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="text-gray-300">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Something went wrong</p>
                  <p className="text-sm text-gray-500 mt-1">
                    An unexpected error occurred while rendering this page.
                  </p>
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <pre className="text-xs text-gray-400 text-left max-w-xs w-full overflow-auto bg-gray-50 rounded px-3 py-2">
                    {this.state.error.message}
                  </pre>
                )}
                <Button variant="secondary" onClick={this.reset}>
                  Try Again
                </Button>
              </div>
            </Card>
          </div>
        </PageContainer>
      );
    }

    return this.props.children;
  }
}
