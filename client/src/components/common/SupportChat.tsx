import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX, FiSend, FiShield, FiHeadphones, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import supportService from '../../services/supportService';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import type { EditingMessage, SupportMessage } from '../../types';

const SupportChat = () => {
  const { user, theme, isModalOpen } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<EditingMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle scroll visibility
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const fetchUnreadCount = async () => {
    if (!user?.token) return;
    try {
      const data = await supportService.getUserUnreadCount(user.token);
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!user?.token) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user?.token]);

  useEffect(() => {
    if (isOpen && user) {
      fetchMessages();
      setUnreadCount(0);
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!user?.token) return;
    try {
      const data = await supportService.getUserMessages(user.token);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || loading) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      setLoading(true);
      const data = await supportService.sendUserMessage(user.token, content);
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('send_failed'));
      setNewMessage(content);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessage = async (e) => {
    e.preventDefault();
    if (!editingMessage?.content.trim() || !user) return;

    try {
      const data = await supportService.updateMessage(user.token, editingMessage.id, editingMessage.content);
      setMessages(messages.map(m => m._id === editingMessage.id ? data : m));
      setEditingMessage(null);
      toast.success(t('msg_updated'));
    } catch (error) {
      toast.error(t('error_update'));
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm(t('confirm_withdraw_msg'))) return;
    try {
      await supportService.deleteMessage(user.token, id);
      setMessages(messages.filter(m => m._id !== id));
      toast.success(t('msg_withdrawn'));
    } catch (error) {
      toast.error(t('delete_error'));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user || user.role === 'admin') return null;

  return (
    <>
      {/* Mobile Full Screen Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[99990] flex flex-col"
          >
            {/* Header - Zalo Style */}
            <div className="relative p-4 bg-gradient-to-r from-primary to-red-700 flex items-center justify-between text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="relative flex items-center gap-3">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <FiX size={20} />
                </button>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <FiHeadphones size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-[0.1em]">{t('support_moviezone')}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{t('online')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages - Full Height */}
            <div 
              ref={scrollRef}
              className={`flex-grow overflow-y-auto p-4 space-y-4 ${
                theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gray-50'
              }`}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <FiMessageCircle size={40} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest mb-1">{t('hello_user')}</p>
                    <p className="text-xs font-bold">{t('how_can_we_help')}</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={msg._id || index}
                    className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'} items-end gap-2`}
                  >
                    {msg.isAdmin && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mb-1">
                        <FiShield size={14} className="text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-medium shadow-md leading-relaxed group relative ${
                      msg.isAdmin 
                        ? (theme === 'dark' ? 'bg-white/10 text-white rounded-bl-none' : 'bg-white text-dark rounded-bl-none')
                        : 'bg-primary text-white rounded-br-none shadow-lg shadow-primary/20'
                    }`}>
                      {editingMessage?.id === msg._id ? (
                        <form onSubmit={handleUpdateMessage} className="flex flex-col gap-2 min-w-[200px]">
                          <textarea
                            autoFocus
                            className={`w-full bg-transparent border-b border-white/20 outline-none text-sm py-1 resize-none ${msg.isAdmin ? 'text-dark' : 'text-white'}`}
                            value={editingMessage.content}
                            onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditingMessage(null);
                              if (e.key === 'Enter' && !e.shiftKey) handleUpdateMessage(e);
                            }}
                          />
                          <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingMessage(null)} className="text-xs uppercase font-black opacity-60 hover:opacity-100">{t('cancel')}</button>
                            <button type="submit" className="text-xs uppercase font-black hover:underline">{t('save')}</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="break-words">{msg.content}</p>
                          {msg.isEdited && (
                            <span className={`text-[9px] font-black uppercase opacity-40 block mt-1 ${msg.isAdmin ? 'text-left' : 'text-right'}`}>
                              {t('edited_label')}
                            </span>
                          )}
                          <span className={`text-[9px] block mt-1 opacity-50 font-bold ${msg.isAdmin ? 'text-left' : 'text-right'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {/* Hover Actions */}
                          {!msg.isAdmin && (
                            <div className="absolute top-0 right-full mr-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                              <button 
                                onClick={() => setEditingMessage({ id: msg._id, content: msg.content })}
                                className="text-neutral-500 hover:text-blue-500 transition-colors"
                              >
                                <FiEdit2 size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMessage(msg._id)}
                                className="text-neutral-500 hover:text-red-500 transition-colors"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input - Fixed Bottom */}
            <div className={`p-4 border-t shadow-lg ${
              theme === 'dark' ? 'border-white/10 bg-[#0f0f0f]' : 'border-black/5 bg-white'
            }`}>
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('type_support_message')}
                    className={`w-full pl-5 pr-14 py-4 rounded-2xl text-sm font-medium outline-none transition-all shadow-inner border ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 focus:border-primary text-white placeholder:text-neutral-600' 
                        : 'bg-gray-100 border-black/5 focus:border-primary text-dark placeholder:text-neutral-400'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend size={18} className="fill-current" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Compact Chat */}
      <div className="hidden lg:block fixed bottom-24 right-8 z-[9990] support-chat-container">
        <AnimatePresence>
          {/* Only show icon if scrolled down and trailer is not open */}
          {isVisible && !isModalOpen && (
            <div className="relative">
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                    className={`absolute bottom-16 right-0 w-[340px] h-[450px] rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border ${
                      theme === 'dark' 
                        ? 'bg-[#0f0f0f]/95 border-white/10 backdrop-blur-xl' 
                        : 'bg-white/95 border-black/5 backdrop-blur-xl'
                    }`}
                  >
                    {/* Header: More compact */}
                    <div className="relative p-4 bg-gradient-to-r from-primary to-red-700 flex items-center justify-between text-white overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                      <div className="relative flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                          <FiHeadphones size={18} className="animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-black text-[10px] uppercase tracking-[0.1em]">{t('support_moviezone')}</h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                            <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest">{t('online')}</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsOpen(false)} 
                        className="relative w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                      >
                        <FiX size={16} />
                      </button>
                    </div>

                    {/* Messages: Smaller padding and text */}
                    <div 
                      ref={scrollRef}
                      className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-primary/20"
                    >
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FiMessageCircle size={24} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-0.5">{t('hello_user')}</p>
                            <p className="text-[9px] font-bold">{t('how_can_we_help')}</p>
                          </div>
                        </div>
                      ) : (
                        messages.map((msg, index) => (
                          <div 
                            key={msg._id || index}
                            className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'} items-end gap-1.5`}
                          >
                            {msg.isAdmin && (
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mb-0.5">
                                <FiShield size={10} className="text-primary" />
                              </div>
                            )}
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] font-medium shadow-sm leading-snug group relative ${
                              msg.isAdmin 
                                ? (theme === 'dark' ? 'bg-white/10 text-white rounded-bl-none' : 'bg-gray-100 text-dark rounded-bl-none')
                                : 'bg-primary text-white rounded-br-none shadow-lg shadow-primary/20'
                            }`}>
                              {editingMessage?.id === msg._id ? (
                                <form onSubmit={handleUpdateMessage} className="flex flex-col gap-1.5 min-w-[150px]">
                                  <textarea
                                    autoFocus
                                    className={`w-full bg-transparent border-b border-white/20 outline-none text-[12px] py-0.5 resize-none text-white`}
                                    value={editingMessage.content}
                                    onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') setEditingMessage(null);
                                      if (e.key === 'Enter' && !e.shiftKey) handleUpdateMessage(e);
                                    }}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setEditingMessage(null)} className="text-[8px] uppercase font-black opacity-60 hover:opacity-100">{t('cancel')}</button>
                                    <button type="submit" className="text-[8px] uppercase font-black hover:underline">{t('save')}</button>
                                  </div>
                                </form>
                              ) : (
                                <>
                                  <p className="break-words">{msg.content}</p>
                                  {msg.isEdited && (
                                    <span className={`text-[7px] font-black uppercase opacity-40 block mt-0.5 ${msg.isAdmin ? 'text-left' : 'text-right'}`}>
                                      {t('edited_label')}
                                    </span>
                                  )}
                                  <span className={`text-[7px] block mt-0.5 opacity-50 font-bold ${msg.isAdmin ? 'text-left' : 'text-right'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  
                                  {/* Hover Actions */}
                                  {!msg.isAdmin && (
                                    <div className="absolute top-0 right-full mr-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                                      <button 
                                        onClick={() => setEditingMessage({ id: msg._id, content: msg.content })}
                                        className="text-neutral-500 hover:text-blue-500 transition-colors"
                                      >
                                        <FiEdit2 size={10} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteMessage(msg._id)}
                                        className="text-neutral-500 hover:text-red-500 transition-colors"
                                      >
                                        <FiTrash2 size={10} />
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input: More compact */}
                    <div className={`p-4 border-t ${
                      theme === 'dark' ? 'border-white/10' : 'border-black/5'
                    }`}>
                      <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('type_support_message')}
                            className={`w-full pl-4 pr-10 py-2.5 rounded-xl text-[12px] font-medium outline-none transition-all shadow-inner border ${
                              theme === 'dark' 
                                ? 'bg-white/5 border-white/10 focus:border-primary text-white placeholder:text-neutral-600' 
                                : 'bg-gray-50 border-black/5 focus:border-primary text-dark placeholder:text-neutral-400'
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={loading || !newMessage.trim()}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all disabled:opacity-0"
                          >
                            <FiSend size={16} className="fill-current" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-2xl bg-primary text-white shadow-[0_10px_30px_rgba(229,9,20,0.4)] flex items-center justify-center hover:bg-red-700 hover:-translate-y-1 active:scale-95 transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isOpen ? (
                  <FiX size={24} className="relative z-10" />
                ) : (
                  <FiMessageCircle size={24} className="relative z-10 fill-current" />
                )}
                
                {!isOpen && (
                  <div className="absolute right-full mr-4 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.1em] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-none border border-white/10">
                    {t('support_label')}
                  </div>
                )}

                {!isOpen && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-primary shadow-lg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SupportChat;
