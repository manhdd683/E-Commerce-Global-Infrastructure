import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaShoppingCart, FaBell, FaUser, FaSignOutAlt, 
  FaClipboardList, FaBoxOpen, FaGift, FaGlobe, FaHandshake 
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
          { id: 'promo_1', title: 'Khuyến mãi & Ưu đãi', message: `Mã giảm giá 50K sắp hết hạn. Săn sale ngay!`, timestamp: now - (2 * 3600000), iconType: 'promo', link: '/' },
          { id: 'wallet_1', title: 'Cập nhật Ví', message: 'Bạn được hoàn +10.000 Xu từ giao dịch mua hàng.', timestamp: now - (5 * 3600000), iconType: 'wallet', link: '/profile' }
        ];

        myOrders.forEach(order => {
          let message = ''; let iconType = 'order_processing';
          if (order.status === 'Completed') { message = `Đơn #${order.id} giao thành công.`; iconType = 'order_completed'; }
          else if (order.status === 'Shipping') { message = `Đơn #${order.id} đang được giao.`; iconType = 'order_shipping'; }
          if (message) generatedNotifs.push({ id: `order_${order.id}`, title: 'Cập nhật Đơn hàng', message, timestamp: new Date(order.orderDate).getTime(), iconType, link: '/my-orders' });
        });

        generatedNotifs.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(generatedNotifs.map(n => ({ ...n, time: getRelativeTime(n.timestamp) })).slice(0, 10)); 
      } catch (error) { console.error("Lỗi:", error); }
    };
    fetchOrderNotifications();
  }, [user]);

  const handleSearch = (e) => { e.preventDefault(); navigate(`/?search=${encodeURIComponent(searchTerm)}`); };
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const langConfig = { vi: { label: 'Tiếng Việt', flag: 'VN' }, en: { label: 'English', flag: 'EN' }, ja: { label: '日本語', flag: 'JP' } };
  const changeLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('app_lang', code); 
    setIsLangOpen(false);
    window.dispatchEvent(new Event('languageChanged')); 
  };

  return (
    <header style={{ backgroundColor: 'white', borderBottom: '1px solid #eaeaea', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div className="container py-2 py-md-3">
        {/* Đổi thành justify-content-between và dùng col-auto */}
        <div className="row align-items-center justify-content-between">
          
          {/* CỘT 1: LOGO (col-auto giúp ôm sát nội dung) */}
          <div className="col-auto col-md-3 col-lg-3 mb-2 mb-md-0">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1 className="text-nowrap" style={{ margin: 0, color: '#ff469e', fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: '900' }}>
                E-Commerce
              </h1>
            </Link>
          </div>

          {/* CỘT 2: THANH TÌM KIẾM */}
          <div className="col-12 col-md-5 col-lg-5 order-3 order-md-2 mt-2 mt-md-0">
            <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', border: '2px solid #ff469e', borderRadius: '4px', overflow: 'hidden' }}>
              <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: 'none', outline: 'none', fontSize: '14px' }} />
              <button type="submit" style={{ width: '50px', backgroundColor: '#ff469e', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><FaSearch size={16} /></button>
            </form>
          </div>

          {/* CỘT 3: CÁC NÚT CHỨC NĂNG (gap-2 trên mobile cho đỡ chật, gap-md-4 trên PC) */}
          <div className="col-auto col-md-4 col-lg-4 order-2 order-md-3 d-flex justify-content-end align-items-center gap-2 gap-md-4">
            
            <div ref={langRef} style={{ position: 'relative' }}>
              <div onClick={() => setIsLangOpen(!isLangOpen)} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>
                <FaGlobe size={20} /> <span className="d-none d-md-inline">{langConfig[language].flag}</span>
              </div>
              {isLangOpen && (
                <div style={{ position: 'absolute', top: '30px', right: '-10px', width: '130px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #eee', overflow: 'hidden' }}>
                  {Object.entries(langConfig).map(([code, { label, flag }]) => (
                    <div key={code} onClick={() => changeLanguage(code)} style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: language === code ? '#fff0f6' : 'white', color: language === code ? '#ff469e' : '#333', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontWeight: 'bold' }}>{flag}</span> <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div ref={notifRef} style={{ position: 'relative' }}>
              <div onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#555', position: 'relative' }}>
                <FaBell size={20} />
                {notifications.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#d70018', color: 'white', fontSize: '11px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{notifications.length}</span>}
              </div>
              {isNotifOpen && (
                <div style={{ position: 'absolute', top: '35px', right: '-10px', width: '300px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', border: '1px solid #eee', overflow: 'hidden', zIndex: 1001 }}>
                  <div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t.newNotif}</span><span style={{ fontSize: '12px', color: '#007bff', cursor: 'pointer', fontWeight: 'normal' }}>{t.markRead}</span>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.map(notif => (
                      <div key={notif.id} onClick={() => { setIsNotifOpen(false); navigate(notif.link); }} style={{ display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}>
                        <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'center', minWidth: '24px' }}>
                          {notif.iconType === 'promo' ? <FaGift color="#ff469e" size={20}/> : <FaBoxOpen color="#28a745" size={20}/>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginBottom: '4px' }}>{notif.title}</div>
                          <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>{notif.message}</div>
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>{notif.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div onClick={() => {setIsNotifOpen(false); navigate('/my-orders');}} style={{ padding: '12px', textAlign: 'center', backgroundColor: '#fdfdfd', color: '#ff469e', fontWeight: 'bold', cursor: 'pointer', borderTop: '1px solid #eee' }}>{t.viewAll}</div>
                </div>
              )}
            </div>

            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', color: '#555', textDecoration: 'none', position: 'relative' }}>
              <FaShoppingCart size={20} />
              {cartItemCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-12px', backgroundColor: '#d70018', color: 'white', fontSize: '12px', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{cartItemCount}</span>}
            </Link>

            {user ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#f8f9fa', padding: '4px 10px', borderRadius: '20px', border: '1px solid #eee' }}>
                  <img src={user.avatar || 'https://via.placeholder.com/30'} alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  <span className="d-none d-md-inline" style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>{user.username || user.name}</span>
                </div>
                
                {isDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', width: '250px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #eee', overflow: 'hidden', zIndex: 1001 }}>
                    <Link to="/profile" onClick={() => setIsDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', color: '#333', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}>
                      <FaUser color="#007bff" /> <span>{t.profile}</span>
                    </Link>
                    <Link to="/my-orders" onClick={() => setIsDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', color: '#333', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}>
                      <FaClipboardList color="#ffc107" /> <span>{t.myOrders}</span>
                    </Link>
                    <div onClick={() => { setIsDropdownOpen(false); navigate('/affiliate'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', color: '#333', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', backgroundColor: '#fff8f0' }}>
                      <FaHandshake color="#fd7e14" /> <span style={{ fontWeight: 'bold', color: '#fd7e14' }}>{t.affiliate}</span>
                    </div>
                    <div onClick={() => { setIsDropdownOpen(false); logout(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', color: '#d70018', cursor: 'pointer' }}>
                      <FaSignOutAlt /> <span style={{ fontWeight: 'bold' }}>{t.logout}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{ padding: '4px 10px', border: '1px solid #ddd', borderRadius: '4px', textDecoration: 'none', color: '#333', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}>{t.login}</Link>
            )}

          </div>
        </div>
      </div>

      {user && <CoinWidget />}
      <ChatWidget />
    </header>
  );
};

export default Header;