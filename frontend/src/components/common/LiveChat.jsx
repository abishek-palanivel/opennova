import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { shouldAllowChatApiCall, getGuestName } from '../../utils/chatAuth';

const LiveChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    
    // Check if we have new messages (not from user sending)
    if (messages.length > prevMessagesLength.current && prevMessagesLength.current > 0) {
      setHasNewMessages(true);
      // Clear the new message indicator after 3 seconds
      setTimeout(() => setHasNewMessages(false), 3000);
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen, user]); // Add user dependency to reinitialize when auth state changes

  // Add continuous polling for new messages when chat is open and user is authenticated
  useEffect(() => {
    let pollInterval;
    
    if (isOpen && shouldAllowChatApiCall(user)) {
      // Poll for new messages every 3 seconds when chat is open (more frequent)
      pollInterval = setInterval(() => {
        pollForNewMessages();
      }, 3000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isOpen, user]);



  const initializeChat = async () => {
    // Always start with a welcome message for all users
    const welcomeMessage = {
      id: 'welcome',
      message: user 
        ? "Hello! I'm here to help you with any questions about OpenNova. How can I assist you today?"
        : "Hello! Welcome to OpenNova support. You can ask questions here, or log in for personalized assistance.",
      sender: 'admin',
      timestamp: new Date().toISOString(),
      senderName: 'Support Team'
    };

    // Always show welcome message first
    setMessages([welcomeMessage]);

    // Only try to load chat history if user is authenticated and has a valid token
    if (!shouldAllowChatApiCall(user)) {
      return;
    }

    // Add a small delay to ensure authentication is properly set up
    setTimeout(async () => {
      try {
        // For authenticated users, try to load chat history
        const response = await api.get('/api/chat/history');
        
        if (response?.data && response.data.length > 0) {
          // Replace welcome message with actual chat history
          setMessages(response.data);
        }
        // If no history, keep the welcome message
      } catch (error) {
        // Silently handle all errors - don't show error messages to users
        // Just keep the welcome message
        if (error?.response?.status === 401 || error.isChatAuthError) {
          localStorage.removeItem('token');
        }
      }
    }, 500);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    const tempMessage = {
      id: 'temp-' + Date.now(),
      message: messageToSend,
      sender: user ? user.role?.toLowerCase() || 'user' : 'guest',
      senderName: user?.name || 'Guest User',
      timestamp: new Date().toISOString()
    };

    // Add message to local state immediately
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      let response;
      
      // Check if user is authenticated and has valid token
      if (shouldAllowChatApiCall(user)) {
        // Authenticated user - try authenticated message first
        try {
          response = await api.post('/api/chat/send', {
            message: messageToSend
          });
        } catch (authError) {
          if (authError?.response?.status === 401 || authError.isChatAuthError) {
            // Token expired or invalid, fall back to guest mode silently
            localStorage.removeItem('token');
            
            response = await api.post('/api/chat/guest/send', {
              message: messageToSend,
              guestName: getGuestName(user)
            });
          } else {
            throw authError;
          }
        }
      } else {
        // Guest user - use guest endpoint
        response = await api.post('/api/chat/guest/send', {
          message: messageToSend,
          guestName: getGuestName(user)
        });
      }

      // Replace temp message with actual message from server
      if (response.data && response.data.chatMessage) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id ? response.data.chatMessage : msg
        ));
      } else if (response.data && response.data.success) {
        // For guest messages, create a confirmation message
        const confirmMessage = {
          id: 'confirm-' + Date.now(),
          message: response.data.message || "Message sent successfully",
          sender: 'system',
          timestamp: new Date().toISOString(),
          senderName: 'System'
        };
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id ? confirmMessage : msg
        ));
      }

      setLoading(false);

      // Only poll for responses if user is authenticated and has valid token
      if (shouldAllowChatApiCall(user)) {
        setTimeout(() => {
          pollForNewMessages();
        }, 3000);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Keep the message but mark it as failed
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id
          ? { ...msg, failed: true, id: 'failed-' + Date.now() }
          : msg
      ));
      
      // Add error message
      const errorMessage = {
        id: 'error-' + Date.now(),
        message: "Failed to send message. Please try again or refresh the page.",
        sender: 'system',
        timestamp: new Date().toISOString(),
        senderName: 'System'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setLoading(false);
    }
  };

  const pollForNewMessages = async () => {
    // Only poll if user is authenticated and has valid token
    if (!shouldAllowChatApiCall(user)) return;
    
    try {
      // Get chat history
      const response = await api.get('/api/chat/history');
      if (response?.data) {
        const newMessages = response.data;
        
        // Update messages if we have new ones or if the content has changed
        if (newMessages.length !== messages.length || 
            JSON.stringify(newMessages) !== JSON.stringify(messages)) {
          setMessages(newMessages);
        }
      }
    } catch (error) {
      // Silently handle all polling errors to avoid console noise
      if (error?.response?.status === 401 || error.isChatAuthError) {
        localStorage.removeItem('token');
      }
    }
  };





  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>

        {/* Notification Badge */}
        <div className={`absolute -top-2 -right-2 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center ${
          hasNewMessages ? 'bg-red-500 animate-bounce' : 'bg-green-500 animate-pulse'
        }`}>
          {hasNewMessages ? '🔔' : '💬'}
        </div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">👨‍💼</span>
                </div>
                <div>
                  <h3 className="font-semibold">Live Support</h3>
                  <p className="text-xs text-blue-100">Connected to Admin Support</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Live Support Indicator */}
          <div className={`px-4 py-2 border-b border-green-200 ${
            hasNewMessages ? 'bg-blue-50' : 'bg-green-50'
          }`}>
            <div className={`flex items-center text-xs ${
              hasNewMessages ? 'text-blue-700' : 'text-green-700'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                hasNewMessages ? 'bg-blue-500 animate-bounce' : 'bg-green-500 animate-pulse'
              }`}></div>
              {hasNewMessages ? 'New message received!' : 'Live Support • Admin will respond shortly'}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'admin' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${message.sender === 'admin'
                    ? 'bg-gray-100 text-gray-800'
                    : message.failed
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-blue-600 text-white'
                    }`}
                >
                  <p className="font-medium text-xs mb-1">
                    {message.senderName}
                    {message.failed && <span className="ml-1 text-red-500">⚠️</span>}
                  </p>
                  <p>{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                    {message.failed && <span className="ml-1">Failed to send</span>}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={user ? "Type your message..." : "Ask a question (login for full support)..."}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            {!user && (
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">
                  For personalized support, 
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="text-blue-600 hover:text-blue-700 ml-1 underline"
                  >
                    log in here
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LiveChat;