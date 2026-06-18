import React, { useState, useEffect, useContext, useRef } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import { AuthContext } from '../../../context/AuthContext';

const ChatWidget = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [myChats, setMyChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = () => {
    if (!user) return;
    const currentUsername = user.username || user.name || 'guest';
    const allChats = JSON.parse(localStorage.getItem('ecommerce_chats')) || [];
    const userChats = allChats.filter(c => c.userId === currentUsername);
    setMyChats(userChats);
  };

  const markAsRead = (chatId) => {
    const allChats = JSON.parse(localStorage.getItem('ecommerce_chats')) || [];
    let changed = false;
    const updated = allChats.map(c => {
        if (c.id === chatId) {
            const newMsgs = c.messages.map(m => {
                if (m.sender === 'shop' && !m.isRead) {
                    changed = true;
                    return { ...m, isRead: true };
                }
                return m;
            });
            return { ...c, messages: newMsgs };
        }
        return c;
    });
    if (changed) {
        localStorage.setItem('ecommerce_chats', JSON.stringify(updated));
        loadChats();
        window.dispatchEvent(new Event('chatUpdated'));
    }
  };

  useEffect(() => {
    loadChats();
    window.addEventListener('storage', loadChats);
    window.addEventListener('chatUpdated', loadChats);

    const handleOpenChatWithSeller = (e) => {
        const { sellerId, productName, price, image } = e.detail;
        const currentUsername = user?.username || user?.name || 'guest';
        
        let allChats = JSON.parse(localStorage.getItem('ecommerce_chats')) || [];
        let targetChatId = `chat_${currentUsername}_${sellerId}`;
        
        let existingChat = allChats.find(c => c.id === targetChatId);
        if (!existingChat) {
            existingChat = {
                id: targetChatId,
                userId: currentUsername,
                userName: currentUsername,
                avatar: user?.avatar || 'https://via.placeholder.com/150',
                sellerId: sellerId,
                messages: []
            };
            allChats.push(existingChat);
            localStorage.setItem('ecommerce_chats', JSON.stringify(allChats));
        }
        
        setIsOpen(true);
        setActiveChatId(targetChatId);
        markAsRead(targetChatId);
        setChatInput(`[SẢN PHẨM]: ${productName}\n[GIÁ MUA]: ${Number(price).toLocaleString('vi-VN')} đ\n[LINK ẢNH]: ${image}\n--> Chào shop, mình cần tư vấn món này!`);
        loadChats();
    };

    window.addEventListener('openChatWithSeller', handleOpenChatWithSeller);

    return () => {
      window.removeEventListener('storage', loadChats);
      window.removeEventListener('chatUpdated', loadChats);
      window.removeEventListener('openChatWithSeller', handleOpenChatWithSeller);
    };
  }, [user]);

  useEffect(() => {
    if (isOpen && activeChatId) {
      markAsRead(activeChatId);
    }
    scrollToBottom();
  }, [myChats, isOpen, activeChatId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatId) return;

    const allChats = JSON.parse(localStorage.getItem('ecommerce_chats')) || [];
    const updatedAllChats = allChats.map(c => {
      if (c.id === activeChatId) {
        return { 
          ...c, 
          messages: [...c.messages, { sender: 'user', text: chatInput, isRead: false }] 
        };
      }
      return c;
    });

    localStorage.setItem('ecommerce_chats', JSON.stringify(updatedAllChats));
    window.dispatchEvent(new Event('chatUpdated'));
    setChatInput('');
    loadChats();
  };

  if (!user) return null;

  const totalUnread = myChats.reduce((total, chat) => {
    return total + chat.messages.filter(m => m.sender === 'shop' && !m.isRead).length;
  }, 0);

  const activeChat = myChats.find(c => c.id === activeChatId);

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
      {!isOpen && (
        <div onClick={() => setIsOpen(true)} style={{ width: '60px', height: '60px', backgroundColor: '#ee4d2d', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(238, 77, 45, 0.4)', position: 'relative' }}>
          <FaComments size={28} />
          {totalUnread > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#d70018', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '20px', border: '2px solid white' }}>
              {totalUnread}
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <div style={{ width: '350px', height: '480px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 5px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #eee' }}>
          <div style={{ padding: '15px', backgroundColor: '#ee4d2d', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
              {activeChatId && <FaArrowLeft style={{ cursor: 'pointer', marginRight: '5px' }} onClick={() => setActiveChatId(null)} />}
              {activeChatId ? `Shop: ${activeChat?.sellerId}` : 'Danh sách Trò chuyện'}
            </div>
            <FaTimes style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
          </div>

          {!activeChatId ? (
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
              {myChats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>Bạn chưa có cuộc trò chuyện nào.</div>
              ) : (
                myChats.map(c => {
                  const unread = c.messages.filter(m => m.sender === 'shop' && !m.isRead).length;
                  const lastMsg = c.messages[c.messages.length - 1];
                  return (
                    <div key={c.id} onClick={() => { setActiveChatId(c.id); markAsRead(c.id); }} style={{ padding: '15px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: unread > 0 ? '#fff0f6' : 'white' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#ffe6e6', color: '#ee4d2d', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                        {c.sellerId[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '15px' }}>{c.sellerId}</div>
                        <div style={{ fontSize: '13px', color: unread > 0 ? '#333' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread > 0 ? 'bold' : 'normal' }}>
                          {lastMsg ? lastMsg.text : 'Bắt đầu trò chuyện'}
                        </div>
                      </div>
                      {unread > 0 && <span style={{ backgroundColor: '#d70018', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>{unread}</span>}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <>
              <div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeChat?.messages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '10px 15px', borderRadius: '15px', fontSize: '14px', lineHeight: '1.4', backgroundColor: msg.sender === 'user' ? '#ee4d2d' : '#e4e6eb', color: msg.sender === 'user' ? 'white' : '#333', whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: 'white' }}>
                <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Nhập tin nhắn..." style={{ flex: 1, padding: '10px 15px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none', fontSize: '14px', resize: 'none', height: '40px' }} />
                <button type="submit" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ee4d2d', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                  <FaPaperPlane size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;