'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../Dashboard/Navbar';
import MessageInput from './MessageInput';

interface ConversationMessage {
  _id: string;
  content: string;
  sender: { _id: string };
  recipient: { _id: string };
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
}

const Conversation = () => {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [error, setError] = useState('');

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchMessages = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get(
        `/api/messages/conversation/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.messages || []);
    } catch (err: any) {
      console.error('Poll messages error:', err);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchConversation = async () => {
      try {
        const currentUserResponse = await axios.get('/api/users/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentId = currentUserResponse.data.authId._id;
        setCurrentUserId(currentId);

        const response = await axios.get(
          `/api/messages/conversation/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data.messages || []);

        const userResponse = await axios.get(
          `/api/auth/userById/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecipientUsername(
          userResponse.data.authId?.username || 'Unknown'
        );
      } catch (err: any) {
        console.error(
          'Fetch conversation error:',
          err.response?.data || err.message
        );
        setError(
          err.response?.data?.message || 'Failed to load conversation'
        );
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        } else if (err.response?.status === 404) {
          console.log(`User ID ${userId} not found in database`);
        }
      }
    };

    fetchConversation();

    // Poll for new messages (serverless replacement for Socket.IO)
    pollingRef.current = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSendMessage = async (content: string) => {
    try {
      const token = getToken();
      const response = await axios.post(
        '/api/messages/send',
        { recipientId: userId, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, response.data.data]);
    } catch (err: any) {
      console.error(
        'Send message error:',
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  if (error)
    return (
      <div className="text-center mt-10 text-red-500">{error}</div>
    );

  return (
    <div
      className="h-screen flex flex-col md:flex-row overflow-hidden bg-theme-background"
    >
      <Navbar />
      <div className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 text-center py-3 border-b border-theme-color bg-theme-background">
          <h2 className="text-lg md:text-xl font-bold text-theme-color">
            Chat with {recipientUsername}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-4">
          {messages.length === 0 ? (
            <p
              className="text-center text-theme-color-60"
            >
              No messages yet
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`p-2 rounded-lg max-w-xs ${
                  msg.recipient._id === currentUserId
                    ? 'bg-gray-200 dark:bg-gray-700 self-start'
                    : 'bg-blue-500 text-white self-end'
                }`}
              >
                <p>{msg.content}</p>
                <p
                  className={`text-xs ${
                    msg.sender._id === currentUserId
                      ? 'text-gray-200'
                      : 'text-black dark:text-gray-300'
                  }`}
                >
                  {new Date(
                    msg.timestamp || msg.createdAt || ''
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))
          )}
        </div>
        <div
          className="flex-shrink-0 p-4 border-t border-theme-color bg-theme-background"
        >
          <MessageInput onSend={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default Conversation;
