// components/ChatBox.jsx
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../utils/socket';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { FiSend, FiLoader, FiPaperclip, FiX, FiCheck, FiImage, FiFile, FiPlay } from 'react-icons/fi';

export default function ChatBox({ chatId, buyerId, sellerId, productId, otherUserName, buyerName, sellerName }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingName, setTypingName] = useState('');
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachPreview, setAttachPreview] = useState(null); // { url, type, name }
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!chatId || !user) return;

    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.emit('join-chat', { chatId, userId: user.uid });

    socket.on('chat-history', (history) => {
      setMessages(history || []);
      scrollToBottom();
      // Mark as seen when chat opens
      socket.emit('mark-seen', { chatId, userId: user.uid });
    });

    socket.on('receive-message', (msg) => {
      setMessages((prev) => {
        // avoid duplicates
        const exists = prev.find(m => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
      socket.emit('mark-seen', { chatId, userId: user.uid });
    });

    socket.on('messages-seen', ({ userId }) => {
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          seenBy: msg.seenBy?.includes(userId) ? msg.seenBy : [...(msg.seenBy || []), userId],
        }))
      );
    });

    socket.on('messages-delivered', ({ userId }) => {
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          deliveredTo: msg.deliveredTo?.includes(userId) ? msg.deliveredTo : [...(msg.deliveredTo || []), userId],
        }))
      );
    });

    socket.on('user-typing', ({ senderName }) => {
      setIsTyping(true);
      setTypingName(senderName);
    });
    socket.on('user-stop-typing', () => setIsTyping(false));

    return () => {
      socket.off('chat-history');
      socket.off('receive-message');
      socket.off('messages-seen');
      socket.off('messages-delivered');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, [chatId, user]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleTyping = (val) => {
    setText(val);
    socketRef.current?.emit('typing', { chatId, senderName: profile?.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { chatId });
    }, 1500);
  };

  // File upload handler
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/api/chats/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachPreview(data); // { url, type, name }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !attachPreview) return;
    if (!socketRef.current) return;

    socketRef.current.emit('send-message', {
      chatId,
      buyerId,
      sellerId,
      productId,
      buyerName,
      sellerName,
      message: {
        senderId: user.uid,
        senderName: profile?.name || 'User',
        text: text.trim(),
        attachment: attachPreview || undefined,
      },
    });

    socketRef.current.emit('stop-typing', { chatId });
    setText('');
    setAttachPreview(null);
  };

  // Tick logic — seen = double blue, delivered = double grey, sent = single grey
  const getTickIcon = (msg) => {
    const otherId = user.uid === buyerId ? sellerId : buyerId;
    const seen = msg.seenBy?.includes(otherId);
    const delivered = msg.deliveredTo?.includes(otherId);

    if (seen) {
      return (
        <span className="flex text-blue-400" title="Seen">
          <FiCheck size={11} className="-mr-1" />
          <FiCheck size={11} />
        </span>
      );
    } else if (delivered) {
      return (
        <span className="flex text-white/30" title="Delivered">
          <FiCheck size={11} className="-mr-1" />
          <FiCheck size={11} />
        </span>
      );
    } else {
      return <FiCheck size={11} className="text-white/20" title="Sent" />;
    }
  };

  const isMe = (msg) => msg.senderId === user?.uid;

  const renderAttachment = (attachment) => {
    if (!attachment?.url) return null;
    if (attachment.type === 'image') {
      return (
        <a href={attachment.url} target="_blank" rel="noreferrer">
          <img src={attachment.url} alt="attachment" className="max-w-[200px] rounded-lg mt-1 hover:opacity-90 transition-opacity" />
        </a>
      );
    }
    if (attachment.type === 'video') {
      return (
        <video src={attachment.url} controls className="max-w-[240px] rounded-lg mt-1">
          Your browser does not support video.
        </video>
      );
    }
    // Generic file
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 mt-1 bg-white/10 rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/20 transition-colors">
        <FiFile size={14} />
        {attachment.name || 'Download file'}
      </a>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">{otherUserName?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-white text-sm font-medium">{otherUserName}</p>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-500'}`} />
            <span className="text-xs text-white/30">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-white/30 text-sm py-8">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg, i) => (
          <div key={msg._id || i} className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] flex flex-col gap-1 ${isMe(msg) ? 'items-end' : 'items-start'}`}>
              {!isMe(msg) && (
                <span className="text-xs text-white/30 px-1">{msg.senderName}</span>
              )}
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe(msg)
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-dark-700 text-white/90 rounded-bl-sm'
              }`}>
                {msg.text && <p>{msg.text}</p>}
                {renderAttachment(msg.attachment)}
              </div>
              <div className="flex items-center gap-1 px-1">
                <span className="text-xs text-white/20">
                  {msg.createdAt
                    ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })
                    : 'just now'}
                </span>
                {isMe(msg) && getTickIcon(msg)}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-dark-700 px-4 py-2.5 rounded-2xl rounded-bl-sm text-white/40 text-sm flex items-center gap-2">
              <FiLoader className="animate-spin text-xs" />
              {typingName} is typing…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview */}
      {attachPreview && (
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3 bg-dark-700">
          {attachPreview.type === 'image' && (
            <img src={attachPreview.url} className="w-12 h-12 object-cover rounded-lg" />
          )}
          {attachPreview.type === 'video' && (
            <div className="w-12 h-12 bg-dark-600 rounded-lg flex items-center justify-center">
              <FiPlay className="text-white/50" />
            </div>
          )}
          {attachPreview.type === 'file' && (
            <div className="w-12 h-12 bg-dark-600 rounded-lg flex items-center justify-center">
              <FiFile className="text-white/50" />
            </div>
          )}
          <span className="text-white/50 text-xs flex-1 truncate">{attachPreview.name}</span>
          <button onClick={() => setAttachPreview(null)} className="text-white/30 hover:text-white">
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex gap-2 items-center">
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 text-white/30 hover:text-brand-400 transition-colors flex-shrink-0"
          title="Attach file"
        >
          {uploading ? <FiLoader className="animate-spin" size={18} /> : <FiPaperclip size={18} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder={attachPreview ? 'Add a caption…' : 'Type a message…'}
          className="input flex-1 text-sm"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!text.trim() && !attachPreview}
          className="btn-primary px-4 py-2.5 flex-shrink-0"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}