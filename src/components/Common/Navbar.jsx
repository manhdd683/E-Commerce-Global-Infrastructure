import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUser, FaBell, FaBox, FaTags, FaCommentDots, FaStar } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';

// CHUYỂN THÀNH MẢNG GỐC ĐỂ KHỞI TẠO STATE
const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'order', title: 'Giao hàng thành công', message: 'Đơn hàng #12345 của bạn đã được giao thành công. Vui lòng đánh giá sản phẩm nhé!', time: '10 phút trước', read: false, icon: <FaBox color="#28a745" /> },
  { id: 2, type: 'promo', title: 'Khuyến mãi & Ưu đãi', message: 'Ting ting! Mã giảm giá 50.000₫ (SHOPVIP) sắp hết hạn. Săn sale ngay!', time: '2 giờ trước', read: false, icon: <FaTags color="#ff469e" /> },
  { id: 3, type: 'chat', title: 'Tin nhắn từ Shop', message: 'Shop: Dạ vâng ạ, shop đã đóng gói kỹ sản phẩm cho mình rồi nhé!', time: '1 ngày trước', read: true, icon: <FaCommentDots color="#007bff" /> },
  { id: 4, type: 'activity', title: 'Hoạt động', message: 'Đánh giá 5 sao của bạn đã được ghi nhận. Cảm ơn bạn!', time: '2 ngày trước', read: true, icon: <FaStar color="#ffc107" /> }
];

const Navbar = () => {
  const { cartItems } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // State quản lý việc ẩn/hiện bảng thông báo và DANH SÁCH THÔNG BÁO DỰ ÁN
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const notificationRef = useRef(null);

  // Đóng bảng thông báo khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/');
    }
  };

  // --- HÀM XỬ LÝ LOGIC: ĐÁNH DẤU TẤT CẢ LÀ ĐÃ ĐỌC ---
  const handleMarkAllAsRead = () => {
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updated);
  };

  // --- HÀM XỬ LÝ LOGIC: CLICK VÀO TỪNG THÔNG BÁO ĐỂ ĐỌC ---
  const handleReadSingle = (id) => {
    const updated = notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updated);
  };

  // Tính số lượng thông báo chưa đọc động dựa trên State mới
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ backgroundColor: '#fff', padding: '15px 50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#ff469e', fontSize: '24px', fontWeight: 'bold' }}>
        E-Commerce
      </Link>

      <form onSubmit={handleSearch} style={{ display: 'flex', width: '500px' }}>
        <input 
          type="text" 
          placeholder="Tìm kiếm sản phẩm, danh mục..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '10px 15px', border: '1px solid #ff469e', borderRadius: '4px 0 0 4px', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ff469e', color: 'white', border: '1px solid #ff469e', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>
          <FaSearch />
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        
        {/* KHU VỰC THÔNG BÁO (ĐÃ KÍCH HOẠT LOGIC) */}
        {user && (
          <div ref={notificationRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#555' }}
            >
              <FaBell size={24} color={showNotifications ? '#ff469e' : '#555'} style={{ transition: 'color 0.2s' }} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', border: '2px solid white' }}>
                  {unreadCount}
                </span>
              )}
            </div>

            {/* BẢNG DROPDOWN THÔNG BÁO */}
            {showNotifications && (
              <div style={{ position: 'absolute', top: '40px', right: '-80px', width: '380px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', border: '1px solid #eee', overflow: 'hidden', zIndex: 999 }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Thông báo mới nhận</span>
                  
                  {/* ĐÃ THÊM SỰ KIỆN CLICK VÀO ĐÂY */}
                  <span 
                    onClick={handleMarkAllAsRead}
                    style={{ fontSize: '12px', color: '#007bff', cursor: 'pointer', fontWeight: 'normal', userSelect: 'none' }}
                  >
                    Đánh dấu đã đọc
                  </span>
                </div>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleReadSingle(notif.id)} // Click vào từng thông báo đơn lẻ
                      style={{ display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid #f5f5f5', backgroundColor: notif.read ? 'white' : '#fff0f6', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                      <div style={{ marginTop: '3px', fontSize: '18px' }}>
                        {notif.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginBottom: '4px' }}>{notif.title}</div>
                        <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.4', marginBottom: '6px' }}>{notif.message}</div>
                        <div style={{ fontSize: '11px', color: '#999' }}>{notif.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid #eee', fontSize: '14px', color: '#ff469e', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                  Xem tất cả
                </div>
              </div>
            )}
          </div>
        )}

        <Link to="/cart" style={{ textDecoration: 'none', color: '#333', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FaShoppingCart size={24} />
          {cartItems.length > 0 && (
            <span style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '12px', fontWeight: 'bold' }}>
              {cartItems.length}
            </span>
          )}
        </Link>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/profile" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid #eee', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#f9f9f9' }}>
              <FaUser style={{ color: '#ff469e' }} />
              <span>Xin chào, <strong style={{ color: '#ff469e' }}>{user.name}</strong></span>
            </Link>
            
            {user.role === 'USER' && (
              <Link to="/my-orders" style={{ textDecoration: 'none', color: '#ff469e', fontWeight: 'bold', borderRight: '1px solid #ddd', paddingRight: '15px' }}>
                Đơn hàng của tôi
              </Link>
            )}

            <button onClick={logout} style={{ padding: '8px 15px', border: '1px solid #ddd', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' }}>Đăng xuất</button>
          </div>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>Đăng nhập</Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;