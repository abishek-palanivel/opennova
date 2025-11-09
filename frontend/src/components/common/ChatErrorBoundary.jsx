import React from 'react';

class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log chat-specific errors silently
    console.error('Chat Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <div>
                <h4 className="text-sm font-medium text-red-800">Chat Unavailable</h4>
                <p className="text-xs text-red-600 mt-1">
                  Chat service is temporarily unavailable. Please try refreshing the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-red-700 underline mt-2 hover:text-red-800"
                >
                  Refresh Page
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

export default ChatErrorBoundary;