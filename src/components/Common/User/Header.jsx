import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaShoppingCart, FaBell, FaUser, FaSignOutAlt, 
  FaClipboardList, FaBoxOpen, FaGift, FaGlobe, FaHandshake, FaUserCircle 
} from 'react-icons/fa';
import { CartContext } from '../../../context/CartContext';
import { AuthContext } from '../../../context/AuthContext';
import apiClient from '../../../api/apiClient';
import ChatWidget from './ChatWidget';
import CoinWidget from './CoinWidget';

const ORDER_API_URL = "https://6a296dd8f59cb8f65f1d25ea.mockapi.io/orders";

const TRANSLATIONS = {
  vi: { searchPlaceholder: "Tìm kiếm sản phẩm...", newNotif: "Thông báo mới nhận", markRead: "Đánh dấu đã đọc", viewAll: "Xem tất cả", profile: "Hồ sơ cá nhân", myOrders: "Đơn hàng của tôi", affiliate: "Tiếp thị liên kết", logout: "Đăng xuất", login: "Đăng nhập" },
  en: { searchPlaceholder: "Search for products...", newNotif: "New Notifications", markRead: "Mark as read", viewAll: "View all", profile: "My Profile", myOrders: "My Orders", affiliate: "Affiliate Dashboard", logout: "Log out", login: "Login" },
  ja: { searchPlaceholder: "製品を検索する...", newNotif: "新しい通知", markRead: "既読にする", viewAll: "すべて見る", profile: "プロフィール", myOrders: "私の注文", affiliate: "アフィリエイト", logout: "ログアウト", login: "ログイン" }
};

const getRelativeTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const Header = () => {
  const { cartItems } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'vi');

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const langRef = useRef(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (langRef.current && !langRef.current.contains(event.target)) setIsLangOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchOrderNotifications = async () => {
      try {
        const response = await apiClient.get(ORDER_API_URL);
        const myOrders = (response.data || []).filter(o => 
          (o.username === user.username || o.userId === user.id) && !(o.note && o.note.includes("MARKETING"))
        );

        const now = new Date().getTime();
        let generatedNotifs = [
          { id: 'promo_1', title: 'Khuyến mãi & Ưu đãi', message: `Mã giảm giá 50K sắp hết hạn. Săn sale ngay!`, timestamp: now - (2 * 3600000), iconType: 'promo', link: '/', read: false },
          { id: 'wallet_1', title: 'Cập nhật Ví', message: 'Bạn được hoàn +10.000 Xu từ giao dịch mua hàng.', timestamp: now - (5 * 3600000), iconType: 'wallet', link: '/profile', read: false }
        ];

        myOrders.forEach(order => {
          let message = ''; let iconType = 'order_processing';
          if (order.status === 'Completed') { message = `Đơn #${order.id} giao thành công.`; iconType = 'order_completed'; }
          else if (order.status === 'Shipping') { message = `Đơn #${order.id} đang được giao.`; iconType = 'order_shipping'; }
          if (message) generatedNotifs.push({ id: `order_${order.id}`, title: 'Cập nhật Đơn hàng', message, timestamp: new Date(order.orderDate).getTime(), iconType, link: '/my-orders', read: false });
        });

        generatedNotifs.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(generatedNotifs.map(n => ({ ...n, time: getRelativeTime(n.timestamp) })).slice(0, 10)); 
      } catch (error) { console.error("Lỗi:", error); }
    };
    fetchOrderNotifications();
  }, [user]);

  const handleSearch = (e) => { e.preventDefault(); navigate(`/?search=${encodeURIComponent(searchTerm)}`); };
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const handleReadSingle = (notif) => {
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setIsNotifOpen(false);
    navigate(notif.link);
  };

  const langConfig = { vi: { label: 'Tiếng Việt', flag: 'VN' }, en: { label: 'English', flag: 'EN' }, ja: { label: '日本語', flag: 'JP' } };
  const changeLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('app_lang', code); 
    setIsLangOpen(false);
    window.dispatchEvent(new Event('languageChanged')); 
  };

  return (
    <header className="bg-white sticky-top" style={{ zIndex: 1000, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      
      {/* CSS CHO HIỆU ỨNG VÀ BẢNG DROPDOWN */}
      <style>{`
        .custom-dropdown { 
          background-color: white; 
          border-radius: 12px; 
          box-shadow: 0 8px 30px rgba(0,0,0,0.12); 
          border: 1px solid #f0f0f0; 
          z-index: 1050; 
          overflow: hidden;
        }
        .icon-btn { color: #555; transition: 0.2s; cursor: pointer; }
        .icon-btn:hover { color: #ff469e; }
        
        /* Search bar focus effect */
        .search-input:focus { 
          border-color: #ff469e !important; 
          background-color: #fff !important; 
          box-shadow: 0 0 0 0.25rem rgba(255, 70, 158, 0.15) !important; 
        }

        /* Mobile Layout */
        @media (max-width: 767px) {
          .custom-dropdown { position: fixed; top: 70px; left: 50%; transform: translateX(-50%); width: 92vw; }
          .notif-scroll { max-height: 60vh; overflow-y: auto; }
        }

        /* PC Layout */
        @media (min-width: 768px) {
          .custom-dropdown { position: absolute; top: 100%; margin-top: 15px; }
          .notif-dropdown { right: -20px; width: 360px; }
          .lang-dropdown { right: 0; width: 140px; }
          .user-dropdown { right: 0; width: 220px; }
          .notif-scroll { max-height: 380px; overflow-y: auto; }
        }
      `}</style>

      <div className="container py-2 py-md-3">
        <div className="row align-items-center">
          
          {/* CỘT 1: LOGO */}
          <div className="col-auto col-md-3 pe-0">
            <Link to="/" className="text-decoration-none">
              <h1 className="m-0 text-nowrap fw-black" style={{ color: '#ff469e', fontSize: 'clamp(22px, 5vw, 28px)', letterSpacing: '-0.5px' }}>
                E-Commerce
              </h1>
            </Link>
          </div>

          {/* CỘT 2: CÁC NÚT CHỨC NĂNG (Nằm chung hàng với Logo trên Mobile) */}
          <div className="col col-md-4 order-md-3 d-flex justify-content-end align-items-center gap-3 gap-md-4 ps-0">
            
            {/* Chọn ngôn ngữ */}
            <div ref={langRef} className="position-relative">
              <div onClick={() => setIsLangOpen(!isLangOpen)} className="d-flex align-items-center gap-1 icon-btn fw-bold" style={{ fontSize: '14px' }}>
                <FaGlobe size={22} /> <span className="d-none d-md-inline">{langConfig[language].flag}</span>
              </div>
              {isLangOpen && (
                <div className="custom-dropdown lang-dropdown">
                  {Object.entries(langConfig).map(([code, { label, flag }]) => (
                    <div key={code} onClick={() => changeLanguage(code)} className="d-flex align-items-center gap-2 p-3 cursor-pointer border-bottom" style={{ backgroundColor: language === code ? '#fff0f6' : 'white', color: language === code ? '#ff469e' : '#333', fontSize: '14px' }}>
                      <span className="fw-bold">{flag}</span> <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thông báo */}
            <div ref={notifRef} className="position-relative">
              <div onClick={() => setIsNotifOpen(!isNotifOpen)} className="position-relative icon-btn">
                <FaBell size={22} color={isNotifOpen ? '#ff469e' : ''} />
                {unreadCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white" style={{ fontSize: '10px', padding: '3px 6px' }}>{unreadCount}</span>}
              </div>
              
              {isNotifOpen && (
                <div className="custom-dropdown notif-dropdown">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
                    <span className="fw-bold text-dark fs-6">{t.newNotif}</span>
                    <span onClick={handleMarkAllAsRead} className="text-primary cursor-pointer" style={{ fontSize: '13px' }}>{t.markRead}</span>
                  </div>
                  
                  <div className="notif-scroll">
                    {notifications.length === 0 ? (
                      <div className="text-center p-5 text-muted small">Không có thông báo nào</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} onClick={() => handleReadSingle(notif)} className={`d-flex gap-3 p-3 border-bottom cursor-pointer transition-all ${notif.read ? 'bg-white' : 'bg-danger bg-opacity-10'}`}>
                          <div className="mt-1 flex-shrink-0">
                            {notif.iconType === 'promo' ? <FaGift color="#ff469e" size={20}/> : <FaBoxOpen color="#28a745" size={20}/>}
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '14px' }}>{notif.title}</div>
                            <div className="text-secondary lh-sm mb-1" style={{ fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{notif.message}</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{notif.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div onClick={() => { setIsNotifOpen(false); navigate('/my-orders'); }} className="p-3 text-center bg-light text-danger fw-bold cursor-pointer border-top" style={{ fontSize: '14px' }}>
                    {t.viewAll}
                  </div>
                </div>
              )}
            </div>

            {/* Giỏ hàng */}
            <Link to="/cart" className="position-relative d-flex align-items-center icon-btn">
              <FaShoppingCart size={22} />
              {cartItemCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white" style={{ fontSize: '10px', padding: '3px 6px' }}>{cartItemCount}</span>}
            </Link>

            {/* Tài khoản User */}
            {user ? (
              <div ref={dropdownRef} className="position-relative">
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="d-flex align-items-center gap-2 cursor-pointer">
                  {user.avatar && !user.avatar.includes('via.placeholder') ? (
                    <img src={user.avatar} alt="User" className="rounded-circle object-fit-cover shadow-sm border border-light" style={{ width: '32px', height: '32px' }} />
                  ) : (
                    <FaUserCircle size={30} className="text-secondary icon-btn" />
                  )}
                  <span className="d-none d-md-inline fw-bold text-dark text-truncate" style={{ fontSize: '14px', maxWidth: '100px' }}>{user.username || user.name}</span>
                </div>
                
                {isDropdownOpen && (
                  <div className="custom-dropdown user-dropdown">
                    <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="d-flex align-items-center gap-3 p-3 text-dark text-decoration-none border-bottom hover-bg-light">
                      <FaUser className="text-primary" /> <span className="fw-bold">{t.profile}</span>
                    </Link>
                    <Link to="/my-orders" onClick={() => setIsDropdownOpen(false)} className="d-flex align-items-center gap-3 p-3 text-dark text-decoration-none border-bottom hover-bg-light">
                      <FaClipboardList className="text-warning" /> <span className="fw-bold">{t.myOrders}</span>
                    </Link>
                    <div onClick={() => { setIsDropdownOpen(false); navigate('/affiliate'); }} className="d-flex align-items-center gap-3 p-3 text-dark cursor-pointer border-bottom bg-warning bg-opacity-10">
                      <FaHandshake className="text-danger" /> <span className="fw-bold text-danger">{t.affiliate}</span>
                    </div>
                    <div onClick={() => { setIsDropdownOpen(false); logout(); navigate('/login'); }} className="d-flex align-items-center gap-3 p-3 text-danger cursor-pointer hover-bg-light">
                      <FaSignOutAlt /> <span className="fw-bold">{t.logout}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-outline-danger btn-sm fw-bold px-3 text-nowrap rounded-pill">{t.login}</Link>
            )}

          </div>

          {/* CỘT 3: THANH TÌM KIẾM BO TRÒN (Nằm dưới trên Mobile, giữa trên PC) */}
          <div className="col-12 col-md-5 order-md-2 mt-3 mt-md-0">
            <form onSubmit={handleSearch} className="position-relative">
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="form-control search-input pe-5" 
                style={{ fontSize: '14px', borderRadius: '50rem', border: '1px solid #eaeaea', backgroundColor: '#f8f9fa', padding: '10px 20px', transition: 'all 0.2s' }} 
              />
              <button 
                type="submit" 
                className="btn position-absolute end-0 top-0 bottom-0 text-white d-flex align-items-center justify-content-center" 
                style={{ backgroundColor: '#ff469e', borderRadius: '0 50rem 50rem 0', padding: '0 25px', border: 'none' }}
              >
                <FaSearch size={15} />
              </button>
            </form>
          </div>

        </div>
      </div>

      {user && <CoinWidget />}
      <ChatWidget />
    </header>
  );
};

export default Header;