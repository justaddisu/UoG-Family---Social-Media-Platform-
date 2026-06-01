import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { chatService, userService } from '../services/api';
import { Conversation, Message, User } from '../types';
import { MessageSquare, Send, Sparkles, UserPlus, Info, Users, Compass, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  
  // New chat creations
  const [peerRoster, setPeerRoster] = useState<User[]>([]);
  const [showRoster, setShowRoster] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    fetchPeers();

    // Lazy initialize socket connection to same URL (Port 3000)
    const socket = io({
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket channel online on port 3000');
      if (user) {
        socket.emit('register_identity', user.id);
      }
    });

    socket.on('receive_message', (payload: Message) => {
      // Dynamic feed update if active
      if (selectedConv && payload.conversationId === selectedConv.id) {
        setMessages(prev => [...prev, payload]);
      }
      
      // Re-hydrate list
      fetchChats();
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedConv, user]);

  useEffect(() => {
    if (selectedConv) {
      chatService.getMessages(selectedConv.id).then(setMessages).catch(console.error);
      
      // Instruct socket to join conversation room
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', selectedConv.id);
      }
    }
  }, [selectedConv]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchChats = async () => {
    try {
      const list = await chatService.getConversations();
      setConversations(list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPeers = async () => {
    try {
      const list = await userService.getSuggestions();
      setPeerRoster(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConv) return;

    try {
      const created = await chatService.sendMessage(selectedConv.id, messageText);
      setMessages([...messages, created]);
      
      // Broadcast via socket helper
      if (socketRef.current) {
        socketRef.current.emit('submit_message', {
          conversationId: selectedConv.id,
          message: created
        });
      }

      setMessageText('');
      fetchChats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartDirectChat = async (recipientId: string) => {
    try {
      const conv = await chatService.createConversation(recipientId);
      setSelectedConv(conv);
      setShowRoster(false);
      fetchChats();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-120px)] flex flex-col">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-1 h-full min-h-[450px]">
        
        {/* Left pane: conversations threads list */}
        <div id="chat-sidebar-tech" className="w-full md:w-80 border-r border-slate-150 flex flex-col justify-between">
          <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <MessageSquare className="w-4 h-4 mr-1.5 text-yellow-500 animate-pulse" />
              Chat Channels
            </h3>

            <button
              onClick={() => setShowRoster(!showRoster)}
              className="p-1.5 bg-yellow-500 text-slate-950 rounded-full hover:bg-yellow-400 aspect-square select-none cursor-pointer"
              title="Compose Direct Message"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {showRoster ? (
              <div className="p-3 space-y-2.5">
                <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 px-1">Campus Staff & Students</p>
                {peerRoster.map(peer => (
                  <button
                    key={peer.id}
                    onClick={() => handleStartDirectChat(peer.id)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-transparent transition flex items-center space-x-2.5 cursor-pointer"
                  >
                    <img src={peer.profile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} className="w-8 h-8 rounded-full object-cover" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 leading-none">{peer.profile?.fullName}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{peer.profile?.department}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs px-4">
                No active chat histories. Click the plus icon above to construct conversations with classmates.
              </div>
            ) : (
              conversations.map(conv => {
                const otherMember = conv.members?.find(m => m.userId !== user?.id);
                const isRecipient = otherMember?.user;
                const isActive = selectedConv?.id === conv.id;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 transition flex items-center space-x-3 cursor-pointer ${isActive ? 'bg-yellow-500/10 border-l-4 border-yellow-500' : 'hover:bg-slate-50'}`}
                  >
                    <img 
                      src={isRecipient?.profile?.avatarUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100"} 
                      alt="conversation avatar" 
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border bg-slate-100"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-bold text-slate-900 truncate">
                        {conv.isGroup ? conv.name : isRecipient?.profile?.fullName || 'Academic Fellow'}
                      </h4>
                      <p className="text-slate-400 truncate mt-0.5">
                        {conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content : 'No conversations started yet.'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Active messaging threads */}
        <div id="chat-messages-container" className="flex-1 flex flex-col justify-between bg-slate-50/40">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-150 bg-white flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedConv.isGroup ? selectedConv.name : selectedConv.members?.find(m => m.userId !== user?.id)?.user?.profile?.fullName || 'Active Conversation'}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                </div>
                
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase font-semibold">
                  Secured
                </span>
              </div>

              {/* Message scroll shelf */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    Connection verified. Direct channels are active. Start typing.
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSender = msg.senderId === user?.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] rounded-xl px-4 py-2.5 text-xs font-sans shadow-xs mt-1 ${isSender ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white border text-slate-900 rounded-bl-none'}`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <span className="block text-[8px] opacity-75 mt-1 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* Chat Send form footer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-150 bg-white flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message or share coordinate link..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs outline-none focus:border-yellow-500"
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 p-2.5 rounded-lg shadow-sm font-bold flex items-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-xs text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-2.5" />
              <p className="font-bold text-slate-800">Select a Conversation Thread</p>
              <p className="text-slate-400 mt-1 max-w-xs">Coordinate courses, discuss thesis chapters, or manage student event preparations directly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
