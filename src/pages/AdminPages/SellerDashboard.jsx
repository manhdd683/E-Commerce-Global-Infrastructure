import React, { useState, useEffect, useContext } from 'react';
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

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 
  const [activeTab, setActiveTab] = useState('analytics');

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

  // --- QUẢN LÝ VOUCHER RIÊNG CỦA SHOP ---
  const [shopVouchers, setShopVouchers] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: '', name: '', type: 'PERCENT', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: ''
  });

  const loadShopVouchers = () => {
    const allShopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
    // Chỉ lấy mã khuyến mãi của chính shop này
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
    if (myShopChats.length > 0 && !activeChatId) {
      setActiveChatId(myShopChats[0].id);
    }
  };

  const markAsRead = (chatId) => {
    const allChats = JSON.parse(localStorage.getItem('ecommerce_chats')) || [];
    let changed = false;
    const updated = allChats.map(c => {
        if (c.id === chatId) {
            const newMsgs = c.messages.map(m => {
                if (m.sender === 'user' && !m.isRead) {
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
        loadSellerChats();
        window.dispatchEvent(new Event('chatUpdated'));
    }
  };

  useEffect(() => {
    if (activeChatId) markAsRead(activeChatId);
  }, [activeChatId]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await apiClient.get(PRODUCT_API_URL).catch(() => ({ data: [] }));
      const allProducts = response.data || [];
      const myProducts = allProducts.filter(p => 
        p.sellerId === currentSellerName || 
        p.seller === currentSellerName || 
        (!p.sellerId && !p.seller && currentSellerName === 'NBH')
      );
      setProducts(myProducts.reverse());
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    } finally {
      setIsLoadingProducts(false);
    }
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
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (currentSellerName) {
      fetchProducts();
      fetchOrders();
      loadSellerChats();
      loadShopVouchers(); // Gọi hàm load voucher của shop
      setWithdrawnAmount(Number(localStorage.getItem(`withdrawn_${currentSellerName}`)) || 0);

      const savedProfile = localStorage.getItem(`seller_profile_${currentSellerName}`);
      if (savedProfile) {
        const parsedData = JSON.parse(savedProfile);
        if (parsedData.shopName) {
          setDisplayShopName(parsedData.shopName);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentSellerName]);

  useEffect(() => {
    window.addEventListener('storage', loadSellerChats);
    window.addEventListener('chatUpdated', loadSellerChats);
    return () => {
      window.removeEventListener('storage', loadSellerChats);
      window.removeEventListener('chatUpdated', loadSellerChats);
    };
  }, [currentSellerName, activeChatId]);

  const handleLogout = () => {
    localStorage.removeItem('user'); 
    navigate('/login');
  };

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
      if (file.size > 5 * 1024 * 1024) {
        alert("Video quá lớn! Vui lòng chọn video dưới 5MB để tránh lỗi hệ thống MockAPI.");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        setNewProduct(prev => ({ ...prev, video: event.target.result }));
      };
    }
  };

  const handleRemoveVideo = () => {
    setNewProduct(prev => ({ ...prev, video: '' }));
    const fileInput = document.getElementById('video-upload-input');
    if (fileInput) fileInput.value = '';
  };

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

  // --- HÀM TẠO & XÓA VOUCHER SHOP ---
  const handleCreateShopVoucherSubmit = (e) => {
    e.preventDefault();
    if (!newVoucher.code || !newVoucher.value || !newVoucher.minSpend || !newVoucher.expiryDate) {
      return alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
    }

    const allShopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
    if (allShopVouchers.some(v => v.code === newVoucher.code)) {
      return alert("Mã Code này đã có Shop khác sử dụng! Vui lòng đặt mã khác.");
    }

    const voucherToSave = {
      ...newVoucher,
      value: Number(newVoucher.value),
      minSpend: Number(newVoucher.minSpend),
      systemLimit: Number(newVoucher.systemLimit) || 9999, 
      systemUsed: 0,
      sellerId: currentSellerName, // Gắn định danh Shop tạo mã
      isSystem: false, // Flag để phân biệt với Voucher toàn sàn
      expiryDate: new Date(newVoucher.expiryDate).toISOString()
    };

    allShopVouchers.push(voucherToSave);
    localStorage.setItem('shop_vouchers', JSON.stringify(allShopVouchers));
    
    alert("Tạo mã Voucher cho Shop thành công!");
    setShowVoucherModal(false);
    setNewVoucher({ code: '', name: '', type: 'PERCENT', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: '' });
    loadShopVouchers();
  };

  const handleDeleteShopVoucher = (code) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã ${code} không?`)) {
      const allShopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
      const updatedVouchers = allShopVouchers.filter(v => v.code !== code);
      localStorage.setItem('shop_vouchers', JSON.stringify(updatedVouchers));
      loadShopVouchers();
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
      if(c.id === activeChatId) {
        return { ...c, messages: [...c.messages, { sender: 'shop', text: chatInput, isRead: false }] };
      }
      return c;
    });

    localStorage.setItem('ecommerce_chats', JSON.stringify(updatedAllChats));
    window.dispatchEvent(new Event('chatUpdated')); 
    setChatInput('');
    loadSellerChats();
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

  const formatYAxis = (value) => {
    if (value === 0) return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}Tr`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString('vi-VN');
  };

  const indexOfLastProduct = currentProductPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalProductPages = Math.ceil(products.length / productsPerPage);

  const indexOfLastOrder = currentOrderPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = regularOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalOrderPages = Math.ceil(regularOrders.length / ordersPerPage);

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8', position: 'relative' }}>
      
      {/* MODAL THÊM/SỬA SẢN PHẨM */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '550px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'sticky', top: 0, backgroundColor: 'white', paddingBottom: '10px', borderBottom: '1px solid #eee', zIndex: 10 }}>
              <h2 style={{ margin: 0, color: '#333' }}>{editingProductId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><FaTimes size={20}/></button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Tên sản phẩm *</label><input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'flex', gap: '15px' }}><div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Giá bán (VND) *</label><input type="number" required min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} /></div><div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Số lượng Kho *</label><input type="number" required min="1" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} /></div></div>
              
              <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', backgroundColor: '#fafafa' }}><label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>Ảnh Sản Phẩm (Tối thiểu 1 ảnh)</label><div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}><input type="text" value={tempImageUrl} onChange={e => setTempImageUrl(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Dán Link ảnh vào đây..." /><button onClick={handleAddImageUrl} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Thêm Link</button></div>
              <div style={{ marginBottom: '10px', fontSize: '13px', color: '#555', fontWeight: 'bold' }}>HOẶC Tải ảnh từ máy tính:</div>
              <input type="file" multiple accept="image/*" onChange={handleImageFileUpload} style={{ marginBottom: '15px', fontSize: '13px' }} /><div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>{newProduct.images.map((img, index) => (<div key={index} style={{ position: 'relative', width: '70px', height: '70px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'white' }}><img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><button type="button" onClick={() => handleRemoveImage(index)} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer' }}>X</button></div>))}</div></div>
              
              <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>Video Tổng Quan (Không bắt buộc)</label>
                <input type="text" value={newProduct.video?.startsWith('data:') ? '' : newProduct.video} onChange={e => setNewProduct({...newProduct, video: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', boxSizing: 'border-box' }} placeholder="Dán Link Video (Youtube/Drive)..." />
                <div style={{ marginBottom: '10px', fontSize: '13px', color: '#555', fontWeight: 'bold' }}>HOẶC Chọn File Video từ máy tính (Tối đa 5MB):</div>
                <input type="file" id="video-upload-input" accept="video/*" onChange={handleVideoFileUpload} style={{ fontSize: '13px', display: 'block' }} />
                {newProduct.video && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#28a745', fontWeight: 'bold' }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}><FaVideo /> Đã tải lên/đính kèm Video!</div>
                    <button type="button" onClick={handleRemoveVideo} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Xóa Video</button>
                  </div>
                )}
              </div>

              <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Mô tả sản phẩm</label><textarea rows="4" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', resize: 'vertical' }} /></div>
              <button type="submit" style={{ marginTop: '10px', padding: '14px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>{editingProductId ? 'CẬP NHẬT' : 'LƯU SẢN PHẨM'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE */}
      {showQRModal && selectedPackage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px', textAlign: 'center' }}>
            <h2 style={{ marginTop: 0, color: '#333' }}>Thanh toán dịch vụ</h2>
            <div style={{ margin: '20px auto', padding: '15px', border: '1px dashed #007bff', display: 'inline-block', borderRadius: '8px' }}><img src={`https://img.vietqr.io/image/${ADMIN_BANK_ID}-${ADMIN_ACCOUNT_NO}-compact2.png?amount=${selectedPackage.price}&addInfo=Thanh toan goi ${selectedPackage.name}&accountName=${encodeURIComponent(ADMIN_ACCOUNT_NAME)}`} alt="QR" style={{ width: '200px' }} /></div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ee4d2d', marginBottom: '20px' }}>{selectedPackage.price.toLocaleString('vi-VN')} ₫</div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}><button onClick={() => setShowQRModal(false)} style={{ padding: '10px 20px', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy bỏ</button><button onClick={handleConfirmPayment} disabled={isProcessingPayment} style={{ padding: '10px 20px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: isProcessingPayment ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>{isProcessingPayment ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu xác nhận'}</button></div>
          </div>
        </div>
      )}

      {/* SIDEBAR BẢNG ĐIỀU KHIỂN */}
      <div style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 10px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <div style={{ padding: '25px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ color: '#ee4d2d', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>Kênh Người Bán</h2>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>Shop: <strong style={{color: '#333'}}>{displayShopName}</strong></div>
          
          <button 
            onClick={() => navigate('/seller/profile')} 
            style={{ 
              marginTop: '15px', width: '100%', padding: '10px', 
              backgroundColor: '#fff0e5', border: '1px solid #ee4d2d', 
              color: '#ee4d2d', borderRadius: '6px', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              gap: '8px', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.3s' 
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ee4d2d'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff0e5'; e.currentTarget.style.color = '#ee4d2d'; }}
          >
            <FaCog /> Thiết lập Hồ sơ
          </button>
        </div>
        
        <ul style={{ listStyle: 'none', padding: '15px 10px', margin: 0, flex: 1, overflowY: 'auto' }}>
          {[
            { id: 'analytics', icon: <FaChartBar />, label: 'Phân tích Bán hàng' },
            { id: 'products', icon: <FaBox />, label: 'Quản lý Sản phẩm' },
            { id: 'orders', icon: <FaClipboardList />, label: 'Xử lý Đơn hàng', badge: pendingOrdersCount },
            { id: 'vouchers', icon: <FaTicketAlt />, label: 'Khuyến mãi Shop' }, // ĐÃ THÊM TAB KHUYẾN MÃI
            { id: 'reviews', icon: <FaStar />, label: 'Đánh giá của Khách' }, 
            { id: 'finance', icon: <FaMoneyBillWave />, label: 'Quản lý Tài chính' },
            { id: 'marketing', icon: <FaBullhorn />, label: 'Công cụ Marketing' },
            { id: 'customers', icon: <FaComments />, label: 'Chat với Khách hàng' } 
          ].map(tab => (
            <li key={tab.id} onClick={() => { setActiveTab(tab.id); setCurrentProductPage(1); setCurrentOrderPage(1); }} style={{ marginBottom: '8px', padding: '12px 15px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', color: activeTab === tab.id ? '#ee4d2d' : '#555', backgroundColor: activeTab === tab.id ? '#fff0e5' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === tab.id ? 'bold' : 'normal', transition: '0.2s', position: 'relative' }}>
              {tab.icon} {tab.label}
              {tab.badge > 0 && <span style={{ position: 'absolute', right: '15px', backgroundColor: '#ee4d2d', color: 'white', fontSize: '12px', padding: '2px 6px', borderRadius: '10px' }}>{tab.badge}</span>}
            </li>
          ))}
        </ul>
        
        <div style={{ padding: '20px' }}>
          <button onClick={handleLogout} style={{ width: '100%', backgroundColor: '#f8f9fa', color: '#555', border: '1px solid #ddd', padding: '10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxHeight: '100vh' }}>
        
        {/* TAB 1: PHÂN TÍCH */}
        {activeTab === 'analytics' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}><h1 style={{ color: '#333', fontSize: '24px', margin: 0 }}>Hiệu quả hoạt động</h1></div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid #ee4d2d' }}>
                <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>DOANH THU THỰC TẾ</div>
                <div style={{ fontSize: '28px', color: '#ee4d2d', fontWeight: 'bold', marginTop: '10px' }}>{totalRevenue.toLocaleString('vi-VN')} ₫</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Từ {completedOrdersCount} đơn hàng</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid #007bff' }}>
                <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>CHỜ XỬ LÝ</div>
                <div style={{ fontSize: '28px', color: '#333', fontWeight: 'bold', marginTop: '10px' }}>{pendingOrdersCount} đơn</div>
                <div style={{ fontSize: '12px', color: '#007bff', marginTop: '5px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('orders')}>Xử lý ngay</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid #ffc107', maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>CẢNH BÁO TỒN KHO <span style={{color: '#d70018'}}>{lowStockProducts.length} SP</span></div>
                {lowStockProducts.length > 0 ? (
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lowStockProducts.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}><img src={p.images?.[0] || p.image || "https://via.placeholder.com/40"} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'contain', border: '1px solid #eee', borderRadius: '4px' }} /><div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: '500', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{p.name}</div><div style={{ fontSize: '12px', color: '#d70018', fontWeight: 'bold' }}>Còn: {p.stock}</div></div></div>
                    ))}
                  </div>
                ) : (<div style={{ marginTop: '20px', fontSize: '14px', color: '#28a745' }}>Tất cả đều đủ hàng.</div>)}
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Biểu đồ Doanh thu 6 tháng gần nhất</h3>
              <div style={{ height: '350px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} tickFormatter={formatYAxis} />
                    <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="revenue" fill="#ee4d2d" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ SẢN PHẨM */}
        {activeTab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h1 style={{ color: '#333', fontSize: '24px', margin: 0 }}>Quản lý Sản phẩm</h1>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => navigate('/seller/bulk-upload')} style={{ backgroundColor: '#f0fdf4', color: '#28a745', border: '1px solid #28a745', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaFileExcel /> Nhập từ Excel
                </button>
                <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#ee4d2d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaPlus /> Thêm sản phẩm mới
                </button>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              {isLoadingProducts ? (
                 <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>🔄 Đang tải dữ liệu...</div>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                        <th style={{ padding: '15px', color: '#555', width: '80px' }}>Ảnh chính</th>
                        <th style={{ padding: '15px', color: '#555' }}>Tên sản phẩm</th>
                        <th style={{ padding: '15px', color: '#555' }}>Giá bán</th>
                        <th style={{ padding: '15px', color: '#555' }}>Kho hàng</th>
                        <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Chưa có sản phẩm nào thuộc shop này</td></tr>
                      ) : (
                        currentProducts.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px 15px' }}><img src={item.images?.[0] || item.image || "https://via.placeholder.com/50"} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }} /></td>
                            <td style={{ padding: '15px', fontWeight: '500', color: '#333' }}>{item.name}</td>
                            <td style={{ padding: '15px', color: '#ee4d2d', fontWeight: 'bold' }}>{item.price.toLocaleString('vi-VN')} ₫</td>
                            <td style={{ padding: '15px' }}>{item.stock <= 5 ? <span style={{ color: '#d70018', fontWeight: 'bold' }}>{item.stock} (Sắp hết)</span> : <span style={{ color: '#28a745' }}>{item.stock}</span>}</td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                              <button onClick={() => handleEditClick(item)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginRight: '15px' }}><FaEdit size={18} /></button>
                              <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}><FaTrash size={18} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {totalProductPages > 1 && (
                    <div style={{ padding: '15px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #eee' }}>
                      <button onClick={() => setCurrentProductPage(prev => Math.max(prev - 1, 1))} disabled={currentProductPage === 1} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: currentProductPage === 1 ? '#f5f5f5' : 'white', cursor: currentProductPage === 1 ? 'not-allowed' : 'pointer' }}>Trước</button>
                      {[...Array(totalProductPages)].map((_, i) => (
                        <button key={i} onClick={() => setCurrentProductPage(i + 1)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: currentProductPage === i + 1 ? '#ee4d2d' : 'white', color: currentProductPage === i + 1 ? 'white' : '#333', cursor: 'pointer', fontWeight: 'bold' }}>{i + 1}</button>
                      ))}
                      <button onClick={() => setCurrentProductPage(prev => Math.min(prev + 1, totalProductPages))} disabled={currentProductPage === totalProductPages} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: currentProductPage === totalProductPages ? '#f5f5f5' : 'white', cursor: currentProductPage === totalProductPages ? 'not-allowed' : 'pointer' }}>Sau</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* TAB 3: XỬ LÝ ĐƠN HÀNG */}
        {activeTab === 'orders' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ color: '#333', fontSize: '24px', margin: 0 }}>Xử lý Đơn hàng</h1>
              <button onClick={fetchOrders} style={{ backgroundColor: '#fff', color: '#555', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Làm mới</button>
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                    <th style={{ padding: '15px', color: '#555', width: '100px' }}>Mã ĐH</th>
                    <th style={{ padding: '15px', color: '#555', width: '200px' }}>Khách hàng</th>
                    <th style={{ padding: '15px', color: '#555' }}>Sản phẩm cần đóng gói</th>
                    <th style={{ padding: '15px', color: '#555', width: '150px' }}>Doanh thu</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: '#555', width: '180px' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Chưa có đơn hàng nào</td></tr>
                  ) : (
                    currentOrders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #eee', backgroundColor: order.status === 'Processing' ? '#fafafa' : 'white' }}>
                        <td style={{ padding: '15px', fontWeight: 'bold', color: order.status === 'Processing' ? '#ee4d2d' : '#333' }}>#{order.id}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: 'bold', color: '#333' }}>{order.customerInfo?.fullName || order.username || 'Khách ẩn danh'}</div>
                          <div style={{ color: '#888', marginTop: '5px', fontSize: '12px' }}>SĐT: {order.customerInfo?.phone || 'N/A'}</div>
                        </td>
                        
                        <td style={{ padding: '15px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: order.items.length > 1 ? '10px' : '0' }}>
                              <img src={item.images?.[0] || item.image || "https://via.placeholder.com/45"} alt={item.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', maxWidth: '220px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '13px', color: '#ee4d2d', fontWeight: 'bold', marginTop: '2px' }}>x{item.quantity}</div>
                              </div>
                            </div>
                          ))}
                        </td>

                        <td style={{ padding: '15px' }}>
                          <div style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '16px' }}>{Number(order.totalPrice || 0).toLocaleString('vi-VN')} ₫</div>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} style={{ padding: '8px 10px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: statusOptions.find(o => o.value === order.status)?.color + '1A', color: statusOptions.find(o => o.value === order.status)?.color || '#333', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                            {statusOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalOrderPages > 1 && (
                <div style={{ padding: '15px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #eee' }}>
                  <button onClick={() => setCurrentOrderPage(prev => Math.max(prev - 1, 1))} disabled={currentOrderPage === 1} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: currentOrderPage === 1 ? '#f5f5f5' : 'white', cursor: currentOrderPage === 1 ? 'not-allowed' : 'pointer' }}>Trước</button>
                  {[...Array(totalOrderPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentOrderPage(i + 1)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: currentOrderPage === i + 1 ? '#ee4d2d' : 'white', color: currentOrderPage === i + 1 ? 'white' : '#333', cursor: 'pointer', fontWeight: 'bold' }}>{i + 1}</button>
                  ))}
                  <button onClick={() => setCurrentOrderPage(prev => Math.min(prev + 1, totalOrderPages))} disabled={currentOrderPage === totalOrderPages} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: currentOrderPage === totalOrderPages ? '#f5f5f5' : 'white', cursor: currentOrderPage === totalOrderPages ? 'not-allowed' : 'pointer' }}>Sau</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ĐÃ THÊM MỚI TAB 8: QUẢN LÝ VOUCHER RIÊNG CỦA SHOP */}
        {activeTab === "vouchers" && (
          <div>
            {showVoucherModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", width: "500px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                  <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#333", textAlign: "center" }}>Tạo Khuyến Mãi Cho Shop</h2>
                  <form onSubmit={handleCreateShopVoucherSubmit}>
                    <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Mã Code</label>
                        <input type="text" required value={newVoucher.code} onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder="VD: MYSHOP10" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Tên/Mô tả ngắn</label>
                        <input type="text" required value={newVoucher.name} onChange={(e) => setNewVoucher({...newVoucher, name: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder="VD: Tri ân khách hàng" />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Loại giảm giá</label>
                        <select value={newVoucher.type} onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}>
                          <option value="PERCENT">Theo % (VD: 10%)</option>
                          <option value="FIXED">Trừ tiền mặt (VD: 50.000đ)</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Mức giảm</label>
                        <input type="number" required min="1" value={newVoucher.value} onChange={(e) => setNewVoucher({...newVoucher, value: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder={newVoucher.type === 'PERCENT' ? '10' : '50000'} />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Đơn tối thiểu (VNĐ)</label>
                        <input type="number" required min="0" value={newVoucher.minSpend} onChange={(e) => setNewVoucher({...newVoucher, minSpend: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Số lượt dùng</label>
                        <input type="number" min="1" value={newVoucher.systemLimit} onChange={(e) => setNewVoucher({...newVoucher, systemLimit: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder="Bỏ trống = Không giới hạn" />
                      </div>
                    </div>

                    <div style={{ marginBottom: "25px" }}>
                      <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Ngày hết hạn</label>
                      <input type="datetime-local" required value={newVoucher.expiryDate} onChange={(e) => setNewVoucher({...newVoucher, expiryDate: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      <button type="button" onClick={() => setShowVoucherModal(false)} style={{ padding: "10px 15px", backgroundColor: "#f8f9fa", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Hủy bỏ</button>
                      <button type="submit" style={{ padding: "10px 15px", backgroundColor: "#ee4d2d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Lưu Khuyến Mãi</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h1 style={{ margin: 0, color: "#333", fontSize: "24px" }}>Quản lý Khuyến Mãi Của Shop</h1>
              <button onClick={() => setShowVoucherModal(true)} style={{ backgroundColor: "#ee4d2d", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaPlus /> Tạo Mã Giảm Giá Mới
              </button>
            </div>
            
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee", backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: "15px", color: "#555" }}>Mã Code</th>
                    <th style={{ padding: "15px", color: "#555" }}>Mức giảm</th>
                    <th style={{ padding: "15px", color: "#555" }}>Đơn tối thiểu</th>
                    <th style={{ padding: "15px", color: "#555" }}>Lượt dùng</th>
                    <th style={{ padding: "15px", color: "#555" }}>Ngày hết hạn</th>
                    <th style={{ padding: "15px", textAlign: "center", color: "#555" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {shopVouchers.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px", color: '#888' }}>Shop của bạn chưa tạo mã khuyến mãi nào.</td></tr>
                  ) : (
                    shopVouchers.map((v, index) => {
                      const isExpired = new Date(v.expiryDate) < new Date();
                      return (
                        <tr key={index} style={{ borderBottom: "1px solid #eee", opacity: isExpired ? 0.5 : 1 }}>
                          <td style={{ padding: "15px" }}>
                            <div style={{ fontWeight: "bold", color: "#ee4d2d", fontSize: '16px' }}>{v.code}</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>{v.name}</div>
                          </td>
                          <td style={{ padding: "15px", fontWeight: "bold", color: '#333' }}>
                            {v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')} ₫`}
                          </td>
                          <td style={{ padding: "15px", color: "#333" }}>{v.minSpend.toLocaleString('vi-VN')} ₫</td>
                          <td style={{ padding: "15px", color: "#333" }}>
                            {v.systemUsed} / {v.systemLimit === 9999 ? '∞' : v.systemLimit}
                          </td>
                          <td style={{ padding: "15px", color: isExpired ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                            {isExpired ? 'Đã hết hạn' : new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ padding: "15px", textAlign: "center" }}>
                            <button onClick={() => handleDeleteShopVoucher(v.code)} style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", padding: '8px', borderRadius: '4px', backgroundColor: '#fff5f5' }}>
                              <FaTrash size={16} /> Thu hồi
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
        )}

        {/* TAB 4: QUẢN LÝ ĐÁNH GIÁ (REVIEWS) */}
        {activeTab === 'reviews' && (
          <div>
            <h1 style={{ color: '#333', fontSize: '24px', margin: '0 0 20px 0' }}>Quản lý Đánh giá sản phẩm</h1>
            <div style={{ display: 'grid', gap: '20px' }}>
              {reviews.map(review => (
                <div key={review.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{review.customer} <span style={{ fontSize: '12px', color: '#888', fontWeight: 'normal', marginLeft: '10px' }}>{review.date}</span></div>
                    <div style={{ color: '#ffc107', display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => <FaStar key={i} color={i < review.rating ? "#ffc107" : "#e4e5e9"} />)}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#ee4d2d', fontWeight: 'bold', marginBottom: '10px' }}>Sản phẩm: {review.productName}</div>
                  <p style={{ color: '#555', lineHeight: '1.5', margin: '0 0 15px 0', fontStyle: 'italic' }}>"{review.comment}"</p>
                  
                  {review.reply ? (
                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#28a745', marginBottom: '5px' }}>Phản hồi của Shop:</strong>
                      <span style={{ color: '#555', fontSize: '14px' }}>{review.reply}</span>
                    </div>
                  ) : (
                    <div>
                      {replyingTo === review.id ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập câu trả lời của bạn..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                          <button onClick={() => handleReplyReview(review.id)} style={{ padding: '0 20px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Gửi</button>
                          <button onClick={() => {setReplyingTo(null); setReplyText('');}} style={{ padding: '0 15px', backgroundColor: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                        </div>
                      ) : (
                        <button onClick={() => setReplyingTo(review.id)} style={{ padding: '8px 15px', backgroundColor: '#fff', color: '#ee4d2d', border: '1px solid #ee4d2d', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Phản hồi đánh giá</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CHAT VỚI KHÁCH HÀNG */}
        {activeTab === 'customers' && (
          <div style={{ display: 'flex', height: '80vh', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            
            {/* Cột trái: Danh sách chat */}
            <div style={{ width: '300px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '18px', color: '#333' }}>Tin nhắn KH ({chats.length})</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {chats.map(chat => {
                  const unread = chat.messages.filter(m => m.sender === 'user' && !m.isRead).length;
                  return (
                    <div key={chat.id} onClick={() => { setActiveChatId(chat.id); markAsRead(chat.id); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', backgroundColor: activeChatId === chat.id ? '#fff0e5' : 'white', transition: '0.2s' }}>
                      <img src={chat.avatar || 'https://via.placeholder.com/40'} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '15px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          {chat.userName || chat.name}
                          {unread > 0 && <span style={{ backgroundColor: '#d70018', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>{unread}</span>}
                        </div>
                        <div style={{ color: unread > 0 ? '#333' : '#888', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread > 0 ? 'bold' : 'normal' }}>
                          {chat.messages[chat.messages.length - 1]?.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột phải: Cửa sổ Chat */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {activeChat ? (
                <>
                  <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#f8f9fa' }}>
                    <img src={activeChat.avatar || 'https://via.placeholder.com/40'} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{activeChat.userName || activeChat.name}</div>
                  </div>
                  
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#fbfbfb', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {activeChat.messages.map((msg, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'shop' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '70%', padding: '12px 18px', borderRadius: '20px', fontSize: '14px', lineHeight: '1.5', backgroundColor: msg.sender === 'shop' ? '#ee4d2d' : '#e4e6eb', color: msg.sender === 'shop' ? 'white' : '#333', borderBottomRightRadius: msg.sender === 'shop' ? '4px' : '20px', borderBottomLeftRadius: msg.sender === 'shop' ? '20px' : '4px' }}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: 'white' }}>
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Nhập tin nhắn phản hồi..." style={{ flex: 1, padding: '15px', borderRadius: '30px', border: '1px solid #ccc', outline: 'none', fontSize: '14px' }} />
                    <button type="submit" style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ee4d2d', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}><FaPaperPlane size={18} /></button>
                  </form>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
                  Vui lòng chọn một cuộc hội thoại để bắt đầu.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: QUẢN LÝ TÀI CHÍNH */}
        {activeTab === 'finance' && (
          <div>
             <h1 style={{ color: '#333', fontSize: '24px', margin: '0 0 20px 0' }}>Tài chính & Đối soát</h1>
             <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: 1, backgroundColor: '#ee4d2d', color: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(238, 77, 45, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '16px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '8px' }}><FaWallet /> Số dư khả dụng</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', margin: '15px 0' }}>{accountBalance.toLocaleString('vi-VN')} ₫</div>
                  </div>
                  <button onClick={handleWithdrawMoney} style={{ alignSelf: 'flex-start', padding: '10px 25px', backgroundColor: 'white', color: '#ee4d2d', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>Rút Tiền Về Ngân Hàng</button>
                </div>

                <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '16px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><FaFileInvoiceDollar /> Minh bạch doanh thu shop {displayShopName}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#555' }}><span>Doanh thu shop thực tế:</span> <strong>{totalRevenue.toLocaleString('vi-VN')} ₫</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#d70018' }}><span>Phí sàn khấu trừ (5%):</span> <strong>-{platformFee.toLocaleString('vi-VN')} ₫</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#d70018' }}><span>Chi phí mua gói Marketing:</span> <strong>-{marketingCost.toLocaleString('vi-VN')} ₫</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#007bff' }}><span>Tiền đã yêu cầu rút:</span> <strong>-{withdrawnAmount.toLocaleString('vi-VN')} ₫</strong></div>
                  <hr style={{ border: 'none', borderTop: '1px dashed #ddd', margin: '20px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#28a745', fontWeight: 'bold' }}><span>Số dư ví thực nhận:</span> <span>{accountBalance.toLocaleString('vi-VN')} ₫</span></div>
                </div>
             </div>
          </div>
        )}

        {/* TAB 7: CÔNG CỤ MARKETING */}
        {activeTab === 'marketing' && (
          <div>
            <h1 style={{ color: '#333', fontSize: '24px', margin: '0 0 20px 0' }}>Trung tâm Marketing</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                <h3 style={{ color: '#ee4d2d', marginTop: 0 }}>Gói Freeship Extra</h3>
                <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>Hỗ trợ phí vận chuyển cho khách hàng. Giúp tăng tỷ lệ chuyển đổi đơn hàng lên tới 30%.</p>
                <div style={{ marginTop: '20px', fontWeight: 'bold' }}>Phí dịch vụ: 500.000 ₫ / tháng</div>
                <button onClick={() => handleBuyPackage('Gói Freeship Extra', 500000)} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Đăng ký mua gói</button>
              </div>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                <h3 style={{ color: '#007bff', marginTop: 0 }}>Quảng cáo Khám phá</h3>
                <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>Đẩy sản phẩm lên trang chủ và các vị trí nổi bật. Tính phí theo mỗi lượt click (CPC).</p>
                <div style={{ marginTop: '20px', fontWeight: 'bold' }}>Nạp tiền từ: 100.000 ₫</div>
                <button onClick={() => handleBuyPackage('Quảng cáo Khám phá', 100000)} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Nạp tiền Quảng cáo</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SellerDashboard;