import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { canManageChats, shouldAllowChatApiCall } from '../../utils/chatAuth';

const ChatManagement = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Wait for user to be loaded and check authentication
    if (user !== undefined) {
      setAuthChecked(true);

      if (shouldAllowChatApiCall(user) && canManageChats(user)) {
        // Add a delay to ensure authentication is properly set up
        const timeoutId = setTimeout(() => {
          loadChatRooms();
        }, 1000); // Longer delay to ensure auth is ready

        // Auto-refresh chat rooms every 15 seconds (less frequent)
        const interval = setInterval(() => {
          if (shouldAllowChatApiCall(user) && canManageChats(user)) {
            loadChatRooms();
          }
        }, 15000);

        return () => {
          clearTimeout(timeoutId);
          clearInterval(interval);
        };
      } else {
        // Clear chat rooms if user doesn't have permission
        setChatRooms([]);
        setSelectedChatRoom(null);
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedChatRoom && shouldAllowChatApiCall(user) && canManageChats(user)) {
      loadChatHistory(selectedChatRoom);

      // Auto-refresh messages every 8 seconds for the selected room (less frequent)
      const interval = setInterval(() => {
        if (shouldAllowChatApiCall(user) && canManageChats(user)) {
          loadChatHistory(selectedChatRoom);
        }
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [selectedChatRoom, user]);

  const loadChatRooms = async () => {
    // Don't make API call if user shouldn't be allowed
    if (!canManageChats(user)) {
      console.log('User cannot manage chats:', user?.role);
      setChatRooms([]);
      return;
    }

    try {
      console.log('Loading chat rooms for admin...');
      const response = await api.get('/api/chat/rooms');
      console.log('Chat rooms response:', response.data);

      setChatRooms(response.data || []);
      if (response.data && response.data.length > 0 && !selectedChatRoom) {
        setSelectedChatRoom(response.data[0]);
        console.log('Selected first chat room:', response.data[0]);
      } else if (!response.data || response.data.length === 0) {
        console.log('No chat rooms found - this is normal if no users have started chats yet');
      }
    } catch (error) {
      console.error('Error loading chat rooms:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      });

      if (error?.response?.status === 401 || error.isChatAuthError) {
        localStorage.removeItem('token');
      }
      setChatRooms([]);
    }
  };

  const loadChatHistory = async (chatRoomId) => {
    // Don't make API call if user shouldn't be allowed
    if (!user || !localStorage.getItem('token')) {
      setMessages([]);
      return;
    }

    try {
      const response = await api.get(`/api/chat/history?chatRoomId=${chatRoomId}`);
      setMessages(response.data || []);
    } catch (error) {
      // Silently handle errors
      if (error?.response?.status === 401 || error.isChatAuthError) {
        localStorage.removeItem('token');
      }
      setMessages([]);
    }
  };

  const createTestChat = async () => {
    try {
      console.log('Creating test chat message...');

      // Send a test message to create a chat room
      const response = await api.post('/api/chat/send', {
        message: 'Test message from admin - this creates a chat room for testing'
      });

      console.log('Test chat created:', response.data);

      // Reload chat rooms after creating test chat
      setTimeout(() => {
        loadChatRooms();
      }, 1000);

    } catch (error) {
      console.error('Error creating test chat:', error);
      alert('Failed to create test chat. Make sure you are logged in as admin.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom) return;

    const messageToSend = newMessage.trim();
    const tempMessage = {
      id: 'temp-' + Date.now(),
      message: messageToSend,
      sender: user?.role?.toLowerCase() || 'admin',
      senderName: user?.name || 'Admin',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      const response = await api.post('/api/chat/send', {
        message: messageToSend,
        chatRoomId: selectedChatRoom
      });

      if (response.data && response.data.chatMessage) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessage.id ? response.data.chatMessage : msg
        ));
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatChatRoomName = (chatRoomId) => {
    const emails = chatRoomId.split('_');
    const otherEmail = emails.find(email => email !== user?.email);
    return otherEmail || chatRoomId;
  };

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading Chat Management...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have chat management permissions
  if (!user || !['ADMIN', 'OWNER', 'HOTEL_OWNER', 'HOSPITAL_OWNER', 'SHOP_OWNER'].includes(user.role)) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-lg">Access Denied</p>
          <p className="text-sm">You don't have permission to access chat management.</p>
        </div>
      </div>
    );
  }

  // Also don't render if user doesn't have a valid token
  if (!localStorage.getItem('token')) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🔑</div>
          <p className="text-lg">Authentication Required</p>
          <p className="text-sm">Please log in to access chat management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex">
      {/* Chat Rooms Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chat Support</h3>
          <p className="text-sm text-gray-600">Manage user conversations</p>
          {user && (
            <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              ✅ Logged in as {user.name} ({user.role})
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm mb-3">No active chats yet</p>
              <p className="text-xs text-gray-400 mb-4">
                Chat rooms will appear here when users start conversations
              </p>
              <div className="space-y-2">
                <button
                  onClick={loadChatRooms}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 mr-2"
                >
                  Refresh
                </button>
                <button
                  onClick={createTestChat}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                >
                  Create Test Chat
                </button>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
                <p className="font-semibold mb-1">💡 How to get chat rooms:</p>
                <p>• Click "Create Test Chat" above, OR</p>
                <p>• Have users send messages via the chat widget</p>
                <p>• Chat rooms appear when conversations start</p>
              </div>
            </div>
          ) : (
            chatRooms.map((roomId) => (
              <div
                key={roomId}
                onClick={() => setSelectedChatRoom(roomId)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChatRoom === roomId ? 'bg-blue-50 border-blue-200' : ''
                  }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    {formatChatRoomName(roomId).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {formatChatRoomName(roomId)}
                    </p>
                    <p className="text-sm text-gray-500">User conversation</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedChatRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  {formatChatRoomName(selectedChatRoom).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {formatChatRoomName(selectedChatRoom)}
                  </h4>
                  <p className="text-sm text-gray-500">Active conversation</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'admin' || message.sender === 'owner' ||
                    message.sender === 'hotel_owner' || message.sender === 'hospital_owner' ||
                    message.sender === 'shop_owner'
                    ? 'justify-end'
                    : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${message.sender === 'admin' || message.sender === 'owner' ||
                      message.sender === 'hotel_owner' || message.sender === 'hospital_owner' ||
                      message.sender === 'shop_owner'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    <p className="font-medium text-xs mb-1">
                      {message.senderName}
                    </p>
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Select a chat to start responding</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatManagement;