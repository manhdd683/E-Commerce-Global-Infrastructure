import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, FaEdit, FaTrash, FaBox, FaSignOutAlt, FaTimes, 
  FaClipboardList, FaCheckCircle, FaChartBar, FaBullhorn, FaMoneyBillWave, FaComments, FaExclamationCircle, FaWallet, FaFileInvoiceDollar, FaBell, FaStar, FaPaperPlane, FaVideo, FaCog, FaFileExcel, FaTicketAlt
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../context/AuthContext';

const PRODUCT_API_URL = "https://6a296dd8f59cb8f65f1d25ea.mockapi.io/products";
const ORDER_API_URL = "https://6a296dd8f59cb8f65f1d25ea.mockapi.io/orders";

const ADMIN_BANK_ID = "MB"; 
const ADMIN_ACCOUNT_NO = "45136822072005"; 
const ADMIN_ACCOUNT_NAME = "ADMIN HE THONG"; 

const MOCK_REVIEWS = [
  { id: 1, productName: 'SAMSUNG Galaxy S26 Ultra', customer: 'Nguyễn Văn A', rating: 5, comment: 'Máy dùng mượt, shop đóng gói cẩn thận. Giao hàng nhanh!', reply: '', date: '2026-06-14' },
  { id: 2, productName: 'Bình nước Muji', customer: 'Trần Thị B', rating: 4, comment: 'Bình đẹp nhưng nắp hơi cứng, mở hơi khó.', reply: 'Dạ shop cảm ơn góp ý của bạn, nắp mới nên mút xíu ạ, dùng vài hôm sẽ mềm ra nha!', date: '2026-06-12' },
  { id: 3, productName: 'Áo sơ mi nam', customer: 'Lê Hoàng', rating: 1, comment: 'Giao nhầm size rồi shop ơi!!!', reply: '', date: '2026-06-10' },
];

/* ── Inline style helpers ── */
const tdStyle = { verticalAlign: 'middle', padding: '12px 16px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', verticalAlign: 'middle' };

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  const [activeTab, setActiveTab] = useState('analytics');
  const fileInputRef = useRef(null);

  const currentSellerName = user?.username || user?.name || 'seller';
  const [displayShopName, setDisplayShopName] = useState(currentSellerName);

  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [currentProductPage, setCurrentProductPage] = useState(1);
  const productsPerPage = 5;
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const ordersPerPage = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '', images: [], video: '' });
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);

  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState('');

  const [shopVouchers, setShopVouchers] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [newVoucher, setNewVoucher] = useState({ code: '', name: '', type: 'PERCENT', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: '' });

  const loadShopVouchers = () => {
    const allShopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
    setShopVouchers(allShopVouchers.filter(v => v.sellerId === currentSellerName));
  };

  const statusOptions = [
    { value: 'Pending Payment', label: 'Chờ thanh toán', color: '#ffc107' },
    { value: 'Processing', label: 'Chờ đóng gói/Giao hàng', color: '#17a2b8' },
    { value: 'Shipping', label: 'Đang vận chuyển', color: '#007bff' },
    { value: 'Completed', label: 'Đã giao (Hoàn thành)', color: '#28a745' },
    { value: 'Canceled', label: 'Đã hủy', color: '#dc3545' },
    { value: 'Returned', label: 'Trả hàng/Hoàn tiền', color: '#6f42c1' }
  ];

  const loadSellerChats = () => {
    const allChats = JSON.parse(localStorage.getItem('ecommerce_chats')) || [];
    const myShopChats = allChats.filter(c => c.sellerId === currentSellerName);
    setChats(myShopChats);
    if (myShopChats.length > 0 && !activeChatId) setActiveChatId(myShopChats[0].id);
  };

  const markAsRead = (chatId) => {
    const allChats = JSON.parse(localStorage.getItem('ecommerce_chats')) || [];
    let changed = false;
    const updated = allChats.map(c => {
        if (c.id === chatId) {
            const newMsgs = c.messages.map(m => {
                if (m.sender === 'user' && !m.isRead) { changed = true; return { ...m, isRead: true }; }
                return m;
            });
            return { ...c, messages: newMsgs };
        }
        return c;
    });
    if (changed) {
        localStorage.setItem('ecommerce_chats', JSON.stringify(updated));
        loadSellerChats();
        window.dispatchEvent(new Event('chatUpdated'));
    }
  };

  useEffect(() => { if (activeChatId) markAsRead(activeChatId); }, [activeChatId]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await apiClient.get(PRODUCT_API_URL).catch(() => ({ data: [] }));
      const allProducts = response.data || [];
      const myProducts = allProducts.filter(p => p.sellerId === currentSellerName || p.seller === currentSellerName || (!p.sellerId && !p.seller && currentSellerName === 'NBH'));
      setProducts(myProducts.reverse());
    } catch (error) { console.error("Lỗi tải sản phẩm:", error); } 
    finally { setIsLoadingProducts(false); }
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await apiClient.get(ORDER_API_URL).catch(() => ({ data: [] }));
      const allOrders = response.data || [];
      const myOrders = allOrders.filter(o => {
        const isClientOrder = (o.sellerId === currentSellerName || o.seller === currentSellerName) && !(o.note && o.note.includes("MARKETING"));
        const isMyMarketingPayment = o.note && o.note.includes("MARKETING") && (o.username === currentSellerName || o.userId === user?.id);
        const isOldOrder = (!o.sellerId && !o.seller && currentSellerName === 'NBH'); 
        return isClientOrder || isMyMarketingPayment || isOldOrder;
      });
      const sortedOrders = myOrders.sort((a, b) => {
        if (a.status === 'Processing' && b.status !== 'Processing') return -1;
        if (a.status !== 'Processing' && b.status === 'Processing') return 1;
        return new Date(b.orderDate) - new Date(a.orderDate);
      });
      setOrders(sortedOrders);
    } catch (error) { console.error("Lỗi tải đơn hàng:", error); } 
    finally { setIsLoadingOrders(false); }
  };

  useEffect(() => {
    if (currentSellerName) {
      fetchProducts(); fetchOrders(); loadSellerChats(); loadShopVouchers();
      setWithdrawnAmount(Number(localStorage.getItem(`withdrawn_${currentSellerName}`)) || 0);
      const savedProfile = localStorage.getItem(`seller_profile_${currentSellerName}`);
      if (savedProfile) {
        const parsedData = JSON.parse(savedProfile);
        if (parsedData.shopName) setDisplayShopName(parsedData.shopName);
      }
    }
  }, [user, currentSellerName]);

  useEffect(() => {
    window.addEventListener('storage', loadSellerChats);
    window.addEventListener('chatUpdated', loadSellerChats);
    return () => { window.removeEventListener('storage', loadSellerChats); window.removeEventListener('chatUpdated', loadSellerChats); };
  }, [currentSellerName, activeChatId]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };

  const handleAddImageUrl = (e) => { e.preventDefault(); if (tempImageUrl.trim() !== '') { setNewProduct(prev => ({ ...prev, images: [...prev.images, tempImageUrl.trim()] })); setTempImageUrl(''); } };
  const handleRemoveImage = (index) => { const updatedImages = newProduct.images.filter((_, i) => i !== index); setNewProduct({ ...newProduct, images: updatedImages }); };
  
  const handleImageFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas'); const MAX_WIDTH = 300; const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          setNewProduct(prev => ({ ...prev, images: [...prev.images, compressedBase64] }));
        };
      };
    });
  };

  const handleVideoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert("Video quá lớn! Vui lòng chọn video dưới 5MB để tránh lỗi hệ thống MockAPI."); e.target.value = ''; return; }
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = (event) => setNewProduct(prev => ({ ...prev, video: event.target.result }));
    }
  };

  const handleRemoveVideo = () => { setNewProduct(prev => ({ ...prev, video: '' })); const fileInput = document.getElementById('video-upload-input'); if (fileInput) fileInput.value = ''; };

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setNewProduct({ name: product.name, price: Math.round(product.price) || 0, stock: Math.round(product.stock) || 0, description: product.description || '', images: product.images || (product.image ? [product.image] : []), video: product.video || '' });
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => { setIsModalOpen(false); setEditingProductId(null); setNewProduct({ name: '', price: '', stock: '', images: [], video: '', description: '' }); setTempImageUrl(''); };

  const handleSaveProduct = async (e) => {
    e.preventDefault(); 
    if (newProduct.images.length === 0) return alert("Vui lòng thêm ít nhất 1 ảnh cho sản phẩm!");
    const productPayload = { name: newProduct.name, price: parseInt(newProduct.price) || 0, stock: parseInt(newProduct.stock) || 0, description: newProduct.description || 'Chưa có mô tả.', images: newProduct.images, image: newProduct.images[0], video: newProduct.video, sellerId: currentSellerName };
    try {
      if (editingProductId) { await apiClient.put(`${PRODUCT_API_URL}/${editingProductId}`, productPayload); alert("Cập nhật thành công!"); } 
      else { await apiClient.post(PRODUCT_API_URL, productPayload); alert("Thêm sản phẩm thành công!"); }
      handleCloseModal(); fetchProducts(); 
    } catch (error) { alert("Lưu thất bại! File tải lên có thể quá nặng so với quy định của MockAPI."); }
  };

  const handleDelete = async (id) => { if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) { try { await apiClient.delete(`${PRODUCT_API_URL}/${id}`); fetchProducts(); } catch (error) { alert("Không thể xóa sản phẩm!"); } } };
  const handleUpdateOrderStatus = async (orderId, newStatus) => { try { await apiClient.put(`${ORDER_API_URL}/${orderId}`, { status: newStatus }); alert("Cập nhật trạng thái thành công!"); fetchOrders(); } catch (error) { alert("Cập nhật thất bại!"); } };

  const handleCreateShopVoucherSubmit = (e) => {
    e.preventDefault();
    if (!newVoucher.code || !newVoucher.value || !newVoucher.minSpend || !newVoucher.expiryDate) return alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
    const allShopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
    if (allShopVouchers.some(v => v.code === newVoucher.code)) return alert("Mã Code này đã có Shop khác sử dụng! Vui lòng đặt mã khác.");
    const voucherToSave = { ...newVoucher, value: Number(newVoucher.value), minSpend: Number(newVoucher.minSpend), systemLimit: Number(newVoucher.systemLimit) || 9999, systemUsed: 0, sellerId: currentSellerName, isSystem: false, expiryDate: new Date(newVoucher.expiryDate).toISOString() };
    allShopVouchers.push(voucherToSave); localStorage.setItem('shop_vouchers', JSON.stringify(allShopVouchers));
    alert("Tạo mã Voucher cho Shop thành công!"); setShowVoucherModal(false); setNewVoucher({ code: '', name: '', type: 'PERCENT', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: '' }); loadShopVouchers();
  };

  const handleDeleteShopVoucher = (code) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã ${code} không?`)) {
      const allShopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
      const updatedVouchers = allShopVouchers.filter(v => v.code !== code);
      localStorage.setItem('shop_vouchers', JSON.stringify(updatedVouchers)); loadShopVouchers();
    }
  };

  const handleBuyPackage = (pkgName, price) => { setSelectedPackage({ name: pkgName, price }); setShowQRModal(true); };
  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    try {
      await apiClient.post(ORDER_API_URL, { userId: user?.id || 'seller_id', username: currentSellerName, sellerId: currentSellerName, items: [{ name: `GÓI DỊCH VỤ: ${selectedPackage.name}`, quantity: 1, price: selectedPackage.price }], totalPrice: selectedPackage.price, status: 'Pending Approval', orderDate: new Date().toISOString(), note: 'YÊU CẦU MUA GÓI MARKETING - CHỜ ADMIN KIỂM TRA SAO KÊ' });
      setTimeout(() => { alert(`Đã gửi yêu cầu mua gói ${selectedPackage.name}! Vui lòng chờ Admin phê duyệt.`); setShowQRModal(false); setIsProcessingPayment(false); fetchOrders(); }, 1500);
    } catch (error) { alert("Lỗi hệ thống khi gửi yêu cầu."); setIsProcessingPayment(false); }
  };

  const handleReplyReview = (reviewId) => {
    if(!replyText.trim()) return;
    const updatedReviews = reviews.map(r => r.id === reviewId ? { ...r, reply: replyText } : r);
    setReviews(updatedReviews); setReplyingTo(null); setReplyText(''); alert("Phản hồi đánh giá thành công!");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if(!chatInput.trim() || !activeChatId) return;
    const allChats = JSON.parse(localStorage.getItem('ecommerce_chats')) || [];
    const updatedAllChats = allChats.map(c => {
      if(c.id === activeChatId) return { ...c, messages: [...c.messages, { sender: 'shop', text: chatInput, isRead: false }] };
      return c;
    });
    localStorage.setItem('ecommerce_chats', JSON.stringify(updatedAllChats));
    window.dispatchEvent(new Event('chatUpdated')); setChatInput(''); loadSellerChats();
  };

  const regularOrders = orders.filter(o => !(o.note && o.note.includes("MARKETING")));
  const totalRevenue = regularOrders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  const platformFee = totalRevenue * 0.05;
  const marketingOrders = orders.filter(o => o.status === 'Completed' && o.note && o.note.includes("MARKETING"));
  const marketingCost = marketingOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  const accountBalance = totalRevenue - platformFee - marketingCost - withdrawnAmount;

  const handleWithdrawMoney = () => {
    if (accountBalance <= 0) return alert("Số dư khả dụng không đủ để rút tiền!");
    const amountToWithdraw = window.prompt(`Số dư hiện tại: ${accountBalance.toLocaleString('vi-VN')} ₫\nVui lòng nhập số tiền bạn muốn rút về tài khoản ngân hàng:`);
    if (amountToWithdraw) {
      const amount = parseInt(amountToWithdraw);
      if (isNaN(amount) || amount <= 0) alert("Số tiền nhập vào không hợp lệ!");
      else if (amount > accountBalance) alert("Số tiền rút không được vượt quá Số dư khả dụng!");
      else {
        const newWithdrawnTotal = withdrawnAmount + amount;
        setWithdrawnAmount(newWithdrawnTotal);
        localStorage.setItem(`withdrawn_${currentSellerName}`, newWithdrawnTotal); 
        alert(`Giao dịch thành công! Đã lên lệnh rút ${amount.toLocaleString('vi-VN')} ₫ về tài khoản ngân hàng.`);
      }
    }
  };

  const pendingOrdersList = regularOrders.filter(o => o.status === 'Processing' || o.status === 'Pending Payment');
  const pendingOrdersCount = pendingOrdersList.length;
  const completedOrdersCount = regularOrders.filter(o => o.status === 'Completed').length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);

  const chartData = [];
  const currentMonth = new Date().getMonth() + 1; 
  const currentYear = new Date().getFullYear();
  for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i; let y = currentYear; if (m <= 0) { m += 12; y -= 1; }
      const monthlyTotal = regularOrders.filter(o => {
          if (o.status !== 'Completed') return false;
          const d = new Date(o.orderDate);
          return (d.getMonth() + 1 === m) && (d.getFullYear() === y);
      }).reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
      chartData.push({ name: `Tháng ${m}`, revenue: monthlyTotal });
  }
  const formatYAxis = (value) => { if (value === 0) return '0'; if (value >= 1000000) return `${(value / 1000000).toFixed(1)}Tr`; if (value >= 1000) return `${(value / 1000).toFixed(0)}K`; return value.toLocaleString('vi-VN'); };

  const indexOfLastProduct = currentProductPage * productsPerPage; const indexOfFirstProduct = indexOfLastProduct - productsPerPage; const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct); const totalProductPages = Math.ceil(products.length / productsPerPage);
  const indexOfLastOrder = currentOrderPage * ordersPerPage; const indexOfFirstOrder = indexOfLastOrder - ordersPerPage; const currentOrders = regularOrders.slice(indexOfFirstOrder, indexOfLastOrder); const totalOrderPages = Math.ceil(regularOrders.length / ordersPerPage);
  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 bg-light position-relative">
      
      <style>{`
        #seller-sidebar { width: 100%; overflow-x: auto; border-bottom: 1px solid #ddd; }
        @media (min-width: 768px) {
          #seller-sidebar { width: 260px; min-width: 260px; height: 100vh; position: sticky; top: 0; overflow-y: auto; overflow-x: hidden; border-bottom: none; }
        }
        #seller-sidebar::-webkit-scrollbar { width: 4px; height: 4px; }
        #seller-sidebar::-webkit-scrollbar-thumb { background-color: #ddd; border-radius: 4px; }

        /* ── FIX: căn giữa dọc tất cả bảng trong dashboard ── */
        .seller-table { width: 100%; border-collapse: collapse; }
        .seller-table th,
        .seller-table td { vertical-align: middle !important; padding: 14px 16px; }
        .seller-table thead th { background-color: #f8f9fa; font-weight: 600; font-size: 13px; color: #6c757d; border-bottom: 1px solid #dee2e6; white-space: nowrap; }
        .seller-table tbody tr { border-bottom: 1px solid #f0f0f0; }
        .seller-table tbody tr:last-child { border-bottom: none; }
        .seller-table tbody tr:hover { background-color: #fff8f8; }
        .seller-table tbody tr.row-warning { background-color: #fff3cd !important; }
        .seller-table tbody tr.row-warning:hover { background-color: #ffeaa0 !important; }
      `}</style>

      {/* MODAL THÊM/SỬA SẢN PHẨM */}
      {isModalOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1050 }}>
          <div className="bg-white p-4 rounded-4 shadow" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 position-sticky top-0 bg-white pb-3 border-bottom" style={{ zIndex: 10 }}>
              <h4 className="m-0 text-dark fw-bold">{editingProductId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h4>
              <button onClick={handleCloseModal} className="btn-close"></button>
            </div>
            <form onSubmit={handleSaveProduct} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label fw-bold text-secondary small mb-1">Tên sản phẩm *</label>
                <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="form-control" />
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-secondary small mb-1">Giá bán (VND) *</label>
                  <input type="number" required min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="form-control" />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold text-secondary small mb-1">Số lượng Kho *</label>
                  <input type="number" required min="1" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="form-control" />
                </div>
              </div>
              
              <div className="border rounded bg-light p-3">
                <label className="form-label fw-bold text-dark mb-2">Ảnh Sản Phẩm (Tối thiểu 1 ảnh)</label>
                <div className="d-flex gap-2 mb-3">
                  <input type="text" value={tempImageUrl} onChange={e => setTempImageUrl(e.target.value)} className="form-control" placeholder="Dán Link ảnh vào đây..." />
                  <button type="button" onClick={handleAddImageUrl} className="btn btn-secondary text-nowrap">Thêm</button>
                </div>
                <div className="fw-bold text-secondary small mb-2">HOẶC Tải ảnh từ máy tính:</div>
                <input type="file" multiple accept="image/*" onChange={handleImageFileUpload} className="form-control mb-3" />
                <div className="d-flex flex-wrap gap-2">
                  {newProduct.images.map((img, index) => (
                    <div key={index} className="position-relative border rounded bg-white overflow-hidden" style={{ width: '70px', height: '70px' }}>
                      <img src={img} alt="preview" className="w-100 h-100 object-fit-cover" />
                      <button type="button" onClick={() => handleRemoveImage(index)} className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex justify-content-center align-items-center" style={{ width: '20px', height: '20px', fontSize: '10px' }}>X</button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded bg-light p-3">
                <label className="form-label fw-bold text-dark mb-2">Video Tổng Quan (Không bắt buộc)</label>
                <input type="text" value={newProduct.video?.startsWith('data:') ? '' : newProduct.video} onChange={e => setNewProduct({...newProduct, video: e.target.value})} className="form-control mb-2" placeholder="Dán Link Video (Youtube/Drive)..." />
                <div className="fw-bold text-secondary small mb-2">HOẶC Chọn File Video từ máy tính (Tối đa 5MB):</div>
                <input type="file" id="video-upload-input" accept="video/*" onChange={handleVideoFileUpload} className="form-control" />
                {newProduct.video && (
                  <div className="d-flex align-items-center gap-2 mt-2 text-success fw-bold small">
                    <FaVideo /> Đã tải lên Video!
                    <button type="button" onClick={handleRemoveVideo} className="btn btn-danger btn-sm py-0 px-2 ms-2">Xóa</button>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label fw-bold text-secondary small mb-1">Mô tả sản phẩm</label>
                <textarea rows="4" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="form-control" style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn btn-danger w-100 fw-bold py-2 mt-2">{editingProductId ? 'CẬP NHẬT' : 'LƯU SẢN PHẨM'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE */}
      {showQRModal && selectedPackage && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="bg-white p-4 rounded-4 shadow text-center" style={{ width: '90%', maxWidth: '400px' }}>
            <h4 className="mb-4 text-dark fw-bold">Thanh toán dịch vụ</h4>
            <div className="border border-primary border-dashed p-2 rounded-3 d-inline-block mb-3 bg-light">
              <img src={`https://img.vietqr.io/image/${ADMIN_BANK_ID}-${ADMIN_ACCOUNT_NO}-compact2.png?amount=${selectedPackage.price}&addInfo=Thanh toan goi ${selectedPackage.name}&accountName=${encodeURIComponent(ADMIN_ACCOUNT_NAME)}`} alt="QR" className="img-fluid" style={{ width: '200px' }} />
            </div>
            <div className="fs-3 fw-bold text-danger mb-4">{selectedPackage.price.toLocaleString('vi-VN')} ₫</div>
            <div className="d-flex justify-content-center gap-2">
              <button onClick={() => setShowQRModal(false)} className="btn btn-light border fw-bold w-50">Hủy bỏ</button>
              <button onClick={handleConfirmPayment} disabled={isProcessingPayment} className="btn btn-primary fw-bold w-50">{isProcessingPayment ? 'Đang gửi...' : 'Xác nhận'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VOUCHER */}
      {showVoucherModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1050 }}>
          <div className="bg-white p-4 rounded-4 shadow" style={{ width: '90%', maxWidth: '500px' }}>
            <h4 className="text-center mb-4 text-dark fw-bold">Tạo Khuyến Mãi Cho Shop</h4>
            <form onSubmit={handleCreateShopVoucherSubmit} className="d-flex flex-column gap-3">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-secondary small mb-1">Mã Code</label>
                  <input type="text" required value={newVoucher.code} onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} className="form-control" placeholder="VD: MYSHOP10" />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold text-secondary small mb-1">Tên/Mô tả</label>
                  <input type="text" required value={newVoucher.name} onChange={(e) => setNewVoucher({...newVoucher, name: e.target.value})} className="form-control" placeholder="VD: Tri ân KH" />
                </div>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-secondary small mb-1">Loại giảm giá</label>
                  <select value={newVoucher.type} onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})} className="form-select">
                    <option value="PERCENT">Theo % (VD: 10%)</option>
                    <option value="FIXED">Trừ tiền mặt</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold text-secondary small mb-1">Mức giảm</label>
                  <input type="number" required min="1" value={newVoucher.value} onChange={(e) => setNewVoucher({...newVoucher, value: e.target.value})} className="form-control" placeholder={newVoucher.type === 'PERCENT' ? '10' : '50000'} />
                </div>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-secondary small mb-1">Đơn tối thiểu (VNĐ)</label>
                  <input type="number" required min="0" value={newVoucher.minSpend} onChange={(e) => setNewVoucher({...newVoucher, minSpend: e.target.value})} className="form-control" />
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold text-secondary small mb-1">Số lượt dùng</label>
                  <input type="number" min="1" value={newVoucher.systemLimit} onChange={(e) => setNewVoucher({...newVoucher, systemLimit: e.target.value})} className="form-control" placeholder="Trống = Vô hạn" />
                </div>
              </div>
              <div>
                <label className="form-label fw-bold text-secondary small mb-1">Ngày hết hạn</label>
                <input type="datetime-local" required value={newVoucher.expiryDate} onChange={(e) => setNewVoucher({...newVoucher, expiryDate: e.target.value})} className="form-control" />
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" onClick={() => setShowVoucherModal(false)} className="btn btn-light border fw-bold">Hủy bỏ</button>
                <button type="submit" className="btn btn-danger fw-bold">Lưu Khuyến Mãi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div id="seller-sidebar" className="bg-white shadow-sm d-flex flex-md-column flex-shrink-0">
        <div className="p-3 border-bottom d-flex flex-row flex-md-column justify-content-between align-items-center align-items-md-start">
          <div>
            <h2 className="fs-5 text-danger fw-bold mb-1">Kênh Người Bán</h2>
            <div className="small text-muted d-none d-md-block">Shop: <strong className="text-dark">{displayShopName}</strong></div>
          </div>
          <button onClick={() => navigate('/seller/profile')} className="btn btn-outline-danger btn-sm fw-bold d-flex align-items-center gap-2 mt-md-3">
            <FaCog /> <span className="d-none d-md-inline">Hồ sơ</span>
          </button>
        </div>
        
        <ul className="list-unstyled p-2 m-0 d-flex flex-row flex-md-column flex-nowrap flex-grow-1">
          {[
            { id: 'analytics', icon: <FaChartBar />, label: 'Phân tích Bán hàng' },
            { id: 'products', icon: <FaBox />, label: 'Quản lý Sản phẩm' },
            { id: 'orders', icon: <FaClipboardList />, label: 'Xử lý Đơn hàng', badge: pendingOrdersCount },
            { id: 'vouchers', icon: <FaTicketAlt />, label: 'Khuyến mãi Shop' },
            { id: 'reviews', icon: <FaStar />, label: 'Đánh giá của Khách' }, 
            { id: 'finance', icon: <FaMoneyBillWave />, label: 'Quản lý Tài chính' },
            { id: 'marketing', icon: <FaBullhorn />, label: 'Công cụ Marketing' },
            { id: 'customers', icon: <FaComments />, label: 'Chat KH' } 
          ].map(tab => (
            <li 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setCurrentProductPage(1); setCurrentOrderPage(1); }} 
              className={`p-2 p-md-3 mb-md-2 rounded cursor-pointer d-flex align-items-center gap-2 transition-all position-relative ${activeTab === tab.id ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-secondary'}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {tab.icon} <span className="d-none d-sm-inline">{tab.label}</span>
              {tab.badge > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ transform: 'translate(-50%, 20%)!important' }}>{tab.badge}</span>}
            </li>
          ))}
        </ul>
        
        <div className="p-3 border-top mt-auto d-none d-md-block">
          <button onClick={handleLogout} className="btn btn-light border w-100 fw-bold d-flex align-items-center justify-content-center gap-2 text-secondary">
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="flex-grow-1 p-3 p-md-4 overflow-auto" style={{ width: '100%' }}>
        
        {/* TAB 1: PHÂN TÍCH */}
        {activeTab === 'analytics' && (
          <div>
            <h1 className="fs-4 text-dark mb-4 fw-bold">Hiệu quả hoạt động</h1>
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="bg-white p-4 rounded-4 shadow-sm border-top border-danger border-4 h-100">
                  <div className="text-secondary small fw-bold mb-2">DOANH THU THỰC TẾ</div>
                  <div className="fs-3 text-danger fw-bold mb-1">{totalRevenue.toLocaleString('vi-VN')} ₫</div>
                  <div className="small text-muted">Từ {completedOrdersCount} đơn hàng</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="bg-white p-4 rounded-4 shadow-sm border-top border-primary border-4 h-100">
                  <div className="text-secondary small fw-bold mb-2">CHỜ XỬ LÝ</div>
                  <div className="fs-3 text-dark fw-bold mb-1">{pendingOrdersCount} đơn</div>
                  <div className="small text-primary fw-bold cursor-pointer" onClick={() => setActiveTab('orders')}>Xử lý ngay</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="bg-white p-4 rounded-4 shadow-sm border-top border-warning border-4 h-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <div className="text-secondary small fw-bold d-flex justify-content-between mb-3">
                    CẢNH BÁO TỒN KHO <span className="text-danger">{lowStockProducts.length} SP</span>
                  </div>
                  {lowStockProducts.length > 0 ? (
                    <div className="d-flex flex-column gap-2">
                      {lowStockProducts.map(p => (
                        <div key={p.id} className="d-flex align-items-center gap-2 pb-2 border-bottom">
                          <img src={p.images?.[0] || p.image || "https://via.placeholder.com/40"} alt={p.name} className="border rounded object-fit-contain" style={{ width: '40px', height: '40px' }} />
                          <div className="overflow-hidden">
                            <div className="small fw-bold text-dark text-truncate">{p.name}</div>
                            <div className="small text-danger fw-bold">Còn: {p.stock}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (<div className="small text-success mt-3">Tất cả đều đủ hàng.</div>)}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-4 shadow-sm border">
              <h3 className="fs-5 text-dark mb-4 fw-bold">Biểu đồ Doanh thu 6 tháng gần nhất</h3>
              <div style={{ height: '350px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <YAxis allowDecimals={false} tickFormatter={formatYAxis} width={60} tick={{fontSize: 12}} />
                    <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="revenue" fill="#ee4d2d" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ SẢN PHẨM */}
        {activeTab === 'products' && (
          <div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
              <h1 className="fs-4 text-dark m-0 fw-bold">Quản lý Sản phẩm</h1>
              <div className="d-flex gap-2">
                <button onClick={() => navigate('/seller/bulk-upload')} className="btn btn-outline-success fw-bold d-flex align-items-center gap-2 px-3">
                  <FaFileExcel /> <span className="d-none d-sm-inline">Nhập Excel</span>
                </button>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-danger fw-bold d-flex align-items-center gap-2 px-3">
                  <FaPlus /> <span className="d-none d-sm-inline">Thêm mới</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-4 shadow-sm overflow-hidden border">
              {isLoadingProducts ? (
                <div className="text-center py-5 text-muted">🔄 Đang tải dữ liệu...</div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="seller-table">
                      <thead>
                        <tr>
                          <th style={{ width: '80px', textAlign: 'center' }}>Ảnh</th>
                          <th style={{ minWidth: '200px' }}>Tên sản phẩm</th>
                          <th>Giá bán</th>
                          <th>Kho hàng</th>
                          <th style={{ textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProducts.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: '#6c757d', padding: '32px' }}>
                              Chưa có sản phẩm nào thuộc shop này
                            </td>
                          </tr>
                        ) : (
                          currentProducts.map((item) => (
                            <tr key={item.id}>
                              <td style={{ textAlign: 'center' }}>
                                <img
                                  src={item.images?.[0] || item.image || "https://via.placeholder.com/50"}
                                  alt={item.name}
                                  style={{ width: '52px', height: '52px', objectFit: 'contain', border: '1px solid #eee', borderRadius: '6px', background: '#fff', padding: '3px' }}
                                />
                              </td>
                              <td style={{ fontWeight: '600', color: '#212529' }}>{item.name}</td>
                              <td style={{ color: '#ee4d2d', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                {item.price.toLocaleString('vi-VN')} ₫
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                {item.stock <= 5
                                  ? <span style={{ color: '#dc3545', fontWeight: '700' }}>{item.stock} (Sắp hết)</span>
                                  : <span style={{ color: '#198754', fontWeight: '700' }}>{item.stock}</span>
                                }
                              </td>
                              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <button onClick={() => handleEditClick(item)} className="btn btn-link text-primary p-0 me-3">
                                  <FaEdit size={18} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-link text-danger p-0">
                                  <FaTrash size={18} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalProductPages > 1 && (
                    <div className="d-flex justify-content-center gap-2 p-3 border-top bg-white">
                      <button onClick={() => setCurrentProductPage(prev => Math.max(prev - 1, 1))} disabled={currentProductPage === 1} className="btn btn-light border fw-bold">Trước</button>
                      {[...Array(totalProductPages)].map((_, i) => (
                        <button key={i} onClick={() => setCurrentProductPage(i + 1)} className={`btn border fw-bold ${currentProductPage === i + 1 ? 'btn-danger' : 'btn-light'}`}>{i + 1}</button>
                      ))}
                      <button onClick={() => setCurrentProductPage(prev => Math.min(prev + 1, totalProductPages))} disabled={currentProductPage === totalProductPages} className="btn btn-light border fw-bold">Sau</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: XỬ LÝ ĐƠN HÀNG */}
        {activeTab === 'orders' && (
          <div>
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
              <h1 className="fs-4 text-dark m-0 fw-bold">Xử lý Đơn hàng</h1>
              <button onClick={fetchOrders} className="btn btn-light border text-secondary fw-bold">🔄 Làm mới</button>
            </div>
            
            <div className="bg-white rounded-4 shadow-sm overflow-hidden border">
              <div className="table-responsive">
                <table className="seller-table">
                  <thead>
                    <tr>
                      <th>Mã ĐH</th>
                      <th>Khách hàng</th>
                      <th style={{ minWidth: '250px' }}>Sản phẩm cần đóng gói</th>
                      <th>Doanh thu</th>
                      <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#6c757d', padding: '32px' }}>
                          Chưa có đơn hàng nào
                        </td>
                      </tr>
                    ) : (
                      currentOrders.map((order) => (
                        <tr key={order.id} className={order.status === 'Processing' ? 'row-warning' : ''}>
                          <td style={{ fontWeight: '700', color: order.status === 'Processing' ? '#dc3545' : '#212529' }}>
                            #{order.id}
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: '#212529', whiteSpace: 'nowrap' }}>
                              {order.customerInfo?.fullName || order.username || 'Khách ẩn danh'}
                            </div>
                            <div style={{ color: '#6c757d', fontSize: '13px', marginTop: '3px' }}>
                              SĐT: {order.customerInfo?.phone || 'N/A'}
                            </div>
                          </td>
                          <td>
                            {order.items?.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: idx < order.items.length - 1 ? '10px' : '0' }}>
                                <img
                                  src={item.images?.[0] || item.image || "https://via.placeholder.com/45"}
                                  alt={item.name}
                                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', flexShrink: 0 }}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#212529', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.name}
                                  </div>
                                  <div style={{ color: '#ee4d2d', fontWeight: '700', fontSize: '13px', marginTop: '2px' }}>
                                    x{item.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </td>
                          <td style={{ color: '#ee4d2d', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {Number(order.totalPrice || 0).toLocaleString('vi-VN')} ₫
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <select 
                              value={order.status} 
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} 
                              className="form-select form-select-sm fw-bold"
                              style={{ 
                                backgroundColor: (statusOptions.find(o => o.value === order.status)?.color || '#333') + '1A',
                                color: statusOptions.find(o => o.value === order.status)?.color || '#333',
                                cursor: 'pointer',
                                minWidth: '180px'
                              }}
                            >
                              {statusOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalOrderPages > 1 && (
                <div className="d-flex justify-content-center gap-2 p-3 border-top bg-white">
                  <button onClick={() => setCurrentOrderPage(prev => Math.max(prev - 1, 1))} disabled={currentOrderPage === 1} className="btn btn-light border fw-bold">Trước</button>
                  {[...Array(totalOrderPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentOrderPage(i + 1)} className={`btn border fw-bold ${currentOrderPage === i + 1 ? 'btn-danger' : 'btn-light'}`}>{i + 1}</button>
                  ))}
                  <button onClick={() => setCurrentOrderPage(prev => Math.min(prev + 1, totalOrderPages))} disabled={currentOrderPage === totalOrderPages} className="btn btn-light border fw-bold">Sau</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: QUẢN LÝ VOUCHER SHOP */}
        {activeTab === "vouchers" && (
          <div>
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
              <h1 className="fs-4 text-dark m-0 fw-bold">Khuyến Mãi Cửa Hàng</h1>
              <button onClick={() => setShowVoucherModal(true)} className="btn btn-danger fw-bold d-flex align-items-center justify-content-center gap-2">
                <FaPlus /> Tạo Mã Mới
              </button>
            </div>
            
            <div className="bg-white rounded-4 shadow-sm overflow-hidden border">
              <div className="table-responsive">
                <table className="seller-table">
                  <thead>
                    <tr>
                      <th>Mã Code</th>
                      <th>Mức giảm</th>
                      <th>Đơn tối thiểu</th>
                      <th style={{ textAlign: 'center' }}>Lượt dùng</th>
                      <th style={{ textAlign: 'center' }}>Hết hạn</th>
                      <th style={{ textAlign: 'center' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopVouchers.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: '#6c757d', padding: '32px' }}>
                          Shop chưa tạo mã khuyến mãi nào.
                        </td>
                      </tr>
                    ) : (
                      shopVouchers.map((v, index) => {
                        const isExpired = new Date(v.expiryDate) < new Date();
                        return (
                          <tr key={index} style={{ opacity: isExpired ? 0.5 : 1 }}>
                            <td>
                              <div style={{ fontWeight: '700', color: '#ee4d2d', fontSize: '15px' }}>{v.code}</div>
                              <div style={{ color: '#6c757d', fontSize: '13px' }}>{v.name}</div>
                            </td>
                            <td style={{ fontWeight: '700', color: '#212529', whiteSpace: 'nowrap' }}>
                              {v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')} ₫`}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{v.minSpend.toLocaleString('vi-VN')} ₫</td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {v.systemUsed} / {v.systemLimit === 9999 ? '∞' : v.systemLimit}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '700', whiteSpace: 'nowrap', color: isExpired ? '#dc3545' : '#198754' }}>
                              {isExpired ? 'Đã hết hạn' : new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => handleDeleteShopVoucher(v.code)} className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 m-auto">
                                <FaTrash /> Thu hồi
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: QUẢN LÝ ĐÁNH GIÁ */}
        {activeTab === 'reviews' && (
          <div>
            <h1 className="fs-4 text-dark mb-4 fw-bold">Đánh giá sản phẩm</h1>
            <div className="row g-4">
              {reviews.map(review => (
                <div key={review.id} className="col-12 col-lg-6">
                  <div className="bg-white p-4 rounded-4 shadow-sm border h-100 d-flex flex-column">
                    <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                      <div>
                        <div className="fw-bold fs-6 text-dark">{review.customer}</div>
                        <div className="small text-muted">{review.date}</div>
                      </div>
                      <div className="d-flex text-warning gap-1">
                        {[...Array(5)].map((_, i) => <FaStar key={i} color={i < review.rating ? "#ffc107" : "#e4e5e9"} />)}
                      </div>
                    </div>
                    <div className="small text-danger fw-bold mb-2">SP: {review.productName}</div>
                    <p className="text-secondary fst-italic flex-grow-1">"{review.comment}"</p>
                    
                    {review.reply ? (
                      <div className="bg-light p-3 rounded-3 border-start border-success border-4 mt-3">
                        <strong className="d-block small text-success mb-1">Phản hồi của Shop:</strong>
                        <span className="text-secondary small">{review.reply}</span>
                      </div>
                    ) : (
                      <div className="mt-3">
                        {replyingTo === review.id ? (
                          <div className="d-flex gap-2 flex-wrap">
                            <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập câu trả lời..." className="form-control form-control-sm w-100 mb-2" />
                            <div className="d-flex gap-2 w-100">
                               <button onClick={() => handleReplyReview(review.id)} className="btn btn-danger btn-sm fw-bold px-3 flex-grow-1">Gửi</button>
                               <button onClick={() => {setReplyingTo(null); setReplyText('');}} className="btn btn-light border btn-sm flex-grow-1">Hủy</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setReplyingTo(review.id)} className="btn btn-outline-danger btn-sm fw-bold px-3">Phản hồi đánh giá</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CHAT VỚI KHÁCH HÀNG */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-4 shadow-sm border overflow-hidden d-flex flex-column flex-md-row" style={{ height: '75vh' }}>
            <div className="border-end d-flex flex-column" style={{ width: '100%', maxWidth: '350px' }}>
              <div className="bg-light p-3 border-bottom fw-bold fs-5 text-dark">Tin nhắn KH ({chats.length})</div>
              <div className="overflow-auto flex-grow-1">
                {chats.map(chat => {
                  const unread = chat.messages.filter(m => m.sender === 'user' && !m.isRead).length;
                  return (
                    <div key={chat.id} onClick={() => { setActiveChatId(chat.id); markAsRead(chat.id); }} className={`p-3 border-bottom cursor-pointer d-flex align-items-center gap-3 transition-all ${activeChatId === chat.id ? 'bg-danger bg-opacity-10' : 'bg-white'}`}>
                      <img src={chat.avatar || 'https://via.placeholder.com/40'} alt="avatar" className="rounded-circle flex-shrink-0 border" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                      <div className="overflow-hidden w-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="fw-bold text-dark text-truncate pe-2">{chat.userName || chat.name}</div>
                          {unread > 0 && <span className="badge rounded-pill bg-danger">{unread}</span>}
                        </div>
                        <div className={`small text-truncate ${unread > 0 ? 'fw-bold text-dark' : 'text-muted'}`}>
                          {chat.messages[chat.messages.length - 1]?.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-grow-1 d-flex flex-column bg-light w-100">
              {activeChat ? (
                <>
                  <div className="bg-white p-3 border-bottom d-flex align-items-center gap-3 shadow-sm z-1">
                    <img src={activeChat.avatar || 'https://via.placeholder.com/40'} alt="avatar" className="rounded-circle border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                    <div className="fw-bold fs-5 text-dark">{activeChat.userName || activeChat.name}</div>
                  </div>
                  
                  <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3">
                    {activeChat.messages.map((msg, index) => (
                      <div key={index} className={`d-flex ${msg.sender === 'shop' ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div className={`p-2 px-3 rounded-4 shadow-sm ${msg.sender === 'shop' ? 'bg-danger text-white' : 'bg-white text-dark border'}`} style={{ maxWidth: '85%', fontSize: '15px' }}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="bg-white p-3 border-top d-flex gap-2 align-items-center shadow-sm z-1">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Nhập tin nhắn..." className="form-control rounded-pill px-4 py-2" />
                    <button type="submit" className="btn btn-danger rounded-circle d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: '45px', height: '45px' }}><FaPaperPlane /></button>
                  </form>
                </>
              ) : (
                <div className="w-100 h-100 d-flex justify-content-center align-items-center text-muted fs-5">
                  Vui lòng chọn khách hàng để chat.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: QUẢN LÝ TÀI CHÍNH */}
        {activeTab === 'finance' && (
          <div>
            <h1 className="fs-4 text-dark mb-4 fw-bold">Tài chính & Đối soát</h1>
            <div className="row g-4">
              <div className="col-12 col-lg-5">
                <div className="text-white p-4 p-md-5 rounded-4 shadow d-flex flex-column justify-content-between h-100" style={{ background: 'linear-gradient(135deg, #ff4b2b, #ff416c)' }}>
                  <div>
                    <div className="fs-5 opacity-75 d-flex align-items-center gap-2 mb-2"><FaWallet /> Số dư khả dụng</div>
                    <div className="fw-bold lh-1 mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)' }}>{accountBalance.toLocaleString('vi-VN')} ₫</div>
                  </div>
                  <button onClick={handleWithdrawMoney} className="btn btn-light text-danger fw-bold rounded-pill px-4 py-2 align-self-start shadow-sm w-100 w-sm-auto">Rút Tiền Về Bank</button>
                </div>
              </div>

              <div className="col-12 col-lg-7">
                <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                  <h4 className="fs-5 text-dark fw-bold d-flex align-items-center gap-2 border-bottom pb-3 mb-4"><FaFileInvoiceDollar className="text-primary"/> Minh bạch doanh thu shop {displayShopName}</h4>
                  <div className="d-flex flex-column gap-3 fs-6">
                    <div className="d-flex justify-content-between text-secondary"><span>Doanh thu shop thực tế:</span> <strong className="text-dark">{totalRevenue.toLocaleString('vi-VN')} ₫</strong></div>
                    <div className="d-flex justify-content-between text-secondary"><span>Phí sàn khấu trừ (5%):</span> <strong className="text-danger">-{platformFee.toLocaleString('vi-VN')} ₫</strong></div>
                    <div className="d-flex justify-content-between text-secondary"><span>Chi phí mua gói Marketing:</span> <strong className="text-danger">-{marketingCost.toLocaleString('vi-VN')} ₫</strong></div>
                    <div className="d-flex justify-content-between text-secondary"><span>Tiền đã yêu cầu rút:</span> <strong className="text-primary">-{withdrawnAmount.toLocaleString('vi-VN')} ₫</strong></div>
                    <hr className="border-secondary border-dashed my-2" />
                    <div className="d-flex justify-content-between fs-5 fw-bold text-dark"><span>Ví thực nhận:</span> <span className="text-success">{accountBalance.toLocaleString('vi-VN')} ₫</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: CÔNG CỤ MARKETING */}
        {activeTab === 'marketing' && (
          <div>
            <h1 className="fs-4 text-dark mb-4 fw-bold">Trung tâm Marketing</h1>
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-danger h-100 d-flex flex-column">
                  <h3 className="fs-4 text-danger fw-bold mb-3">Gói Freeship Extra</h3>
                  <p className="text-secondary lh-lg mb-4 flex-grow-1">Hỗ trợ phí vận chuyển cho khách hàng. Giúp shop tăng tỷ lệ chuyển đổi đơn hàng lên tới 30% và xuất hiện nổi bật hơn.</p>
                  <div className="fw-bold text-dark fs-5 mb-4">Phí dịch vụ: 500.000 ₫ <span className="fs-6 text-muted fw-normal">/ tháng</span></div>
                  <button onClick={() => handleBuyPackage('Gói Freeship Extra', 500000)} className="btn btn-danger w-100 py-3 fw-bold fs-6 shadow-sm">Đăng ký mua gói</button>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border border-primary h-100 d-flex flex-column">
                  <h3 className="fs-4 text-primary fw-bold mb-3">Quảng cáo Khám phá</h3>
                  <p className="text-secondary lh-lg mb-4 flex-grow-1">Đẩy sản phẩm lên trang chủ và các vị trí nổi bật nhất. Tính phí theo mỗi lượt click (CPC). Dừng bất cứ khi nào bạn muốn.</p>
                  <div className="fw-bold text-dark fs-5 mb-4">Nạp tiền từ: 100.000 ₫</div>
                  <button onClick={() => handleBuyPackage('Quảng cáo Khám phá', 100000)} className="btn btn-primary w-100 py-3 fw-bold fs-6 shadow-sm">Nạp tiền Quảng cáo</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SellerDashboard;