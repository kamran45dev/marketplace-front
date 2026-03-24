// pages/chat.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ChatBox from '../components/ChatBox';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiMessageSquare, FiLoader } from 'react-icons/fi';

export default function ChatPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchChats();
  }, [user]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/chats');
      setChats(data);
    } catch (err) {
      console.error('Failed to load chats:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <Layout title="Messages">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-bold text-white mb-8">Messages</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ height: '600px' }}>
          {/* Chat List */}
          <div className="card overflow-y-auto">
            <div className="p-4 border-b border-white/5">
              <p className="text-white/50 text-xs uppercase tracking-wider">Conversations</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <FiLoader className="animate-spin text-brand-500" />
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-10">
                <FiMessageSquare className="text-white/10 text-3xl mx-auto mb-2" />
                <p className="text-white/30 text-sm">No conversations yet</p>
              </div>
            ) : (
              chats.map((chat) => {
                const isActive = activeChat?.chatId === chat.chatId;
                const lastMsg = chat.messages?.[chat.messages.length - 1];
                const otherName = profile?.role === 'buyer' ? (chat.sellerName || 'Seller') : (chat.buyerName || 'Buyer');
                return (
                  <button
                    key={chat.chatId}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${isActive ? 'bg-brand-900/20 border-l-2 border-l-brand-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{otherName[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{otherName}</p>
                        <p className="text-white/30 text-xs truncate">{lastMsg?.text || 'No messages yet'}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Chat Window */}
          <div className="md:col-span-2 card overflow-hidden">
            {activeChat ? (
              <ChatBox
                chatId={activeChat.chatId}
                buyerId={activeChat.buyerId}
                sellerId={activeChat.sellerId}
                productId={activeChat.productId}
                otherUserName={profile?.role === 'buyer' ? (activeChat.sellerName || 'Seller') : (activeChat.buyerName || 'Buyer')}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FiMessageSquare className="text-white/10 text-5xl mx-auto mb-3" />
                  <p className="text-white/30">Select a conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}