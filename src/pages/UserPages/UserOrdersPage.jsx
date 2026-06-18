import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaBoxOpen } from 'react-icons/fa';
import apiClient from '../../api/apiClient';

// ĐỒNG BỘ THÔNG TIN ĐỂ KIỂM TRA HẠN VOUCHER KHI HOÀN TRẢ
const VOUCHER_EXPIRY_MAP = {
  'APP666': '2026-12-31T23:59:59.000Z',
  'SHOPVIP': '2026-12-31T23:59:59.000Z',
  'FREESHIP': '2026-12-31T23:59:59.000Z',
  'EXPIRED10': '2025-01-01T00:00:00.000Z',
  'OUTOFORDER': '2026-12-31T23:59:59.000Z',
  'MAGIAMCHOBAN': '2026-12-30T23:59:59.000Z',
  'SALE10': '2026-12-31T23:59:59.000Z',
  'SALE20': '2026-12-31T23:59:59.000Z',
  'SALE50': '2026-12-31T23:59:59.000Z',
  'WELCOME2026': '2026-12-31T23:59:59.000Z',
  'NEWUSER': '2026-12-31T23:59:59.000Z',
  'VIP999': '2026-12-31T23:59:59.000Z',
  'FLASHSALE': '2026-12-31T23:59:59.000Z'
};

const UserOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // TÍCH HỢP STATE CHO THANH TABS
  const [activeTab, setActiveTab] = useState('all');

  const [reviewModal, setReviewModal] = useState({
    isOpen: false, product: null, order: null, rating: 5, comment: '', media: null, mediaType: '', isEditing: false
  });

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const storageKey = loggedInUser?.name ? `claimedVouchers_${loggedInUser.name}` : 'claimedVouchers_guest';

  // CẤU HÌNH CÁC TABS LỌC ĐƠN HÀNG
  const orderTabs = [
    { id: 'all', label: 'Tất cả', statusMatch: ['Processing', 'Completed', 'Canceled', 'Shipping', 'Pending Payment', 'Returned'] },
    { id: 'pending_payment', label: 'Chờ thanh toán', statusMatch: ['Pending Payment'] },
    { id: 'shipping', label: 'Vận chuyển', statusMatch: ['Shipping'] },
    { id: 'pending_delivery', label: 'Chờ giao hàng', statusMatch: ['Processing'] }, 
    { id: 'completed', label: 'Hoàn thành', statusMatch: ['Completed'] },
    { id: 'canceled', label: 'Đã hủy', statusMatch: ['Canceled'] },
    { id: 'returned', label: 'Trả hàng/Hoàn tiền', statusMatch: ['Returned'] }
  ];

  const fetchMyOrders = async () => {
    try {
      setIsLoading(true); // Bật Loading
      const response = await apiClient.get('/orders');
      const allOrders = response.data || [];
      
      // LỌC CHUẨN XÁC: Chỉ lấy đơn do mình mua VÀ KHÔNG PHẢI là đơn mua gói Marketing
      const myOrders = allOrders.filter(order => {
        const isMyOrder = order.userId === loggedInUser?.id || order.username === loggedInUser?.name || order.username === loggedInUser?.username;
        const isNotMarketing = !(order.note && order.note.includes("MARKETING"));
        return isMyOrder && isNotMarketing;
      });

      const sortedOrders = myOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Lỗi lấy lịch sử đơn hàng:", error);
    } finally {
      setIsLoading(false); // CHỐT CHẶN: Luôn tắt Loading dù thành công hay thất bại
    }
  };

  useEffect(() => {
    if (loggedInUser?.name || loggedInUser?.username) {
      fetchMyOrders();
    } else {
      setIsLoading(false); // Tắt loading nếu chưa đăng nhập
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ĐÃ FIX: Lọc đơn hàng dựa trên Tab an toàn hơn
  const currentTabConfig = orderTabs.find(tab => tab.id === activeTab) || orderTabs[0];
  const filteredOrders = orders.filter(order => currentTabConfig.statusMatch.includes(order.status));

  // QUY TẮC 2: QUY ĐỊNH HOÀN TRẢ VOUCHER KHI HỦY ĐƠN
  const handleCancelOrder = async (order) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
      try {
        // 1. Chuyển trạng thái đơn sang Đã hủy (Canceled)
        await apiClient.put(`/orders/${order.id}`, { status: 'Canceled' });

        // 2. Trả lại hàng tồn kho vật lý
        const returnStockPromises = order.items.map(async (item) => {
          try {
            const prodResponse = await apiClient.get(`/products/${item.id}`);
            const restoredStock = prodResponse.data.stock + item.quantity;
            return apiClient.put(`/products/${item.id}`, { stock: restoredStock });
          } catch (err) {
            console.error(`Lỗi hoàn kho:`, err);
          }
        });
        await Promise.all(returnStockPromises);

        // 3. XỬ LÝ QUY TẮC HOÀN VOUCHER VÀO KHO CÁ NHÂN
        const vCode = order.appliedVoucherCode;
        if (vCode && vCode !== 'Không sử dụng') {
          const expiryString = VOUCHER_EXPIRY_MAP[vCode];
          
          if (expiryString) {
            const now = new Date();
            const expiryDate = new Date(expiryString);

            // Kiểm tra voucher còn hạn sử dụng tại thời điểm hoàn hay không
            if (now <= expiryDate) {
              const savedClaimed = localStorage.getItem(storageKey);
              let currentList = savedClaimed ? JSON.parse(savedClaimed) : [];
              
              if (!currentList.includes(vCode)) {
                currentList.push(vCode);
                localStorage.setItem(storageKey, JSON.stringify(currentList));
                alert(`Hủy đơn hàng thành công! Mã ưu đãi [${vCode}] đáp ứng đủ điều kiện (còn hạn dùng) đã được trả lại vào Kho voucher của bạn.`);
              } else {
                alert("Hủy đơn hàng thành công! (Mã giảm giá này đã có sẵn trong ví của bạn).");
              }
            } else {
              alert(`Hủy đơn hàng thành công! Tuy nhiên, mã giảm giá [${vCode}] đã hết hạn sử dụng hệ thống nên không thể hoàn lại vào ví.`);
            }
          }
        } else {
          alert("Hủy đơn hàng thành công!");
        }

        fetchMyOrders(); 
      } catch (error) {
        alert("Hệ thống trục trặc khi hủy đơn!");
      }
    }
  };

  const openReviewModal = (product, order, existingReview = null) => {
    if (existingReview) {
      setReviewModal({
        isOpen: true, product: product, order: order, rating: existingReview.rating, comment: existingReview.comment, media: existingReview.media, mediaType: existingReview.mediaType, isEditing: true
      });
    } else {
      setReviewModal({
        isOpen: true, product: product, order: order, rating: 5, comment: '', media: null, mediaType: '', isEditing: false
      });
    }
  };

  const closeReviewModal = () => {
    setReviewModal({ ...reviewModal, isOpen: false });
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) return alert("Vui lòng chọn file dưới 2MB!");
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onloadend = () => setReviewModal({ ...reviewModal, media: reader.result, mediaType: type });
      reader.readAsDataURL(file);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const prodRes = await apiClient.get(`/products/${reviewModal.product.id}`);
      const currentProduct = prodRes.data;
      let newReview = {};
      let updatedReviews = currentProduct.reviews ? [...currentProduct.reviews] : [];
      const nowIso = new Date().toISOString();

      const reviewerNameStr = loggedInUser?.name || loggedInUser?.username || 'Khách hàng';

      if (reviewModal.isEditing) {
        const oldReview = reviewModal.product.reviewDetails;
        newReview = {
          ...oldReview, rating: reviewModal.rating, comment: reviewModal.comment, media: reviewModal.media, mediaType: reviewModal.mediaType, lastUpdated: nowIso, editCount: (oldReview.editCount || 0) + 1
        };
        updatedReviews = updatedReviews.map(rev => rev.id === oldReview.id ? newReview : rev);
      } else {
        newReview = {
          id: Date.now().toString(), reviewerName: reviewerNameStr, rating: reviewModal.rating, comment: reviewModal.comment, media: reviewModal.media, mediaType: reviewModal.mediaType, originalDate: nowIso, lastUpdated: nowIso, editCount: 0
        };
        updatedReviews.push(newReview);
      }

      await apiClient.put(`/products/${reviewModal.product.id}`, { reviews: updatedReviews });

      const updatedOrderItems = reviewModal.order.items.map(item => {
        if (item.id === reviewModal.product.id) return { ...item, isReviewed: true, reviewDetails: newReview };
        return item;
      });
      await apiClient.put(`/orders/${reviewModal.order.id}`, { items: updatedOrderItems });

      alert(reviewModal.isEditing ? "🎉 Cập nhật thành công!" : "🎉 Cảm ơn bạn!");
      closeReviewModal();
      fetchMyOrders(); 
    } catch (error) {
      alert("Lỗi kết nối!");
    }
  };

  const checkCanEditReview = (reviewDetails) => {
    if (!reviewDetails) return false;
    if ((reviewDetails.editCount || 0) >= 3) return false;
    const startDate = new Date(reviewDetails.originalDate || reviewDetails.date);
    const daysDiff = (new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 7;
  };

  return (
    <div style={{ padding: '40px 50px', maxWidth: '1000px', margin: '0 auto', minHeight: '80vh', backgroundColor: '#f4f6f8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Link to="/" style={{ color: '#ff469e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
          <FaArrowLeft /> Trang chủ
        </Link>
        <h1 style={{ color: '#333', margin: 0, borderLeft: '3px solid #ff469e', paddingLeft: '15px' }}>Đơn hàng của tôi</h1>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS SHOPEE TÍCH HỢP */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: 'white', 
        overflowX: 'auto', 
        borderBottom: '1px solid #ddd',
        marginBottom: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
      }}>
        {orderTabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, minWidth: '120px', textAlign: 'center', padding: '16px 10px',
              cursor: 'pointer', fontSize: '15px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              color: activeTab === tab.id ? '#ff469e' : '#333',
              borderBottom: activeTab === tab.id ? '2px solid #ff469e' : '2px solid transparent',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>🔄 Đang tải...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '100px 20px', textAlign: 'center', borderRadius: '4px' }}>
          <div style={{ width: '100px', height: '100px', backgroundColor: '#f8f9fa', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px auto' }}>
            <FaBoxOpen size={40} color="#ccc" />
          </div>
          <p style={{ color: '#888', fontSize: '16px' }}>Chưa có đơn hàng nào trong mục này.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* LẶP QUA DANH SÁCH ĐÃ LỌC (filteredOrders) */}
          {filteredOrders.map(order => (
            <div key={order.id} style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Mã đơn: <span style={{ color: '#ff469e' }}>#{order.id}</span></div>
                  <div style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}</div>
                  {order.appliedVoucherCode && order.appliedVoucherCode !== 'Không sử dụng' && (
                    <div style={{ marginTop: '5px', fontSize: '13px', color: '#ff469e' }}>Voucher sử dụng: <strong>{order.appliedVoucherCode}</strong></div>
                  )}
                </div>
                <div>
                  {order.status === 'Completed' ? <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Giao thành công</span> : 
                   order.status === 'Canceled' ? <span style={{ color: 'red', fontWeight: 'bold' }}>✕ Đã hủy đơn</span> : 
                   <span style={{ color: 'orange', fontWeight: 'bold' }}>⏳ Đang xử lý</span>}
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                {order.items?.map((item, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{item.name} <strong style={{ color: '#ff469e' }}>x{item.quantity}</strong></span>
                      <div>
                        {order.status === 'Completed' && !item.isReviewed && <button onClick={() => openReviewModal(item, order)} style={{ color: '#ff469e', background: 'none', border: '1px solid #ff469e', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px', fontWeight: 'bold' }}>Đánh giá</button>}
                        {order.status === 'Completed' && item.isReviewed && checkCanEditReview(item.reviewDetails) && <button onClick={() => openReviewModal(item, order, item.reviewDetails)} style={{ color: '#007bff', background: 'none', border: '1px solid #b3d7ff', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px', fontWeight: 'bold' }}>Sửa đánh giá</button>}
                        <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>Hình thức: <strong>{order.customerInfo?.paymentMethod || "COD"}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {order.status === 'Processing' && (
                    <button onClick={() => handleCancelOrder(order)} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy đơn hàng</button>
                  )}
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Tổng chi: <span style={{ color: '#d70018' }}>{Number(order.totalPrice || 0).toLocaleString('vi-VN')} ₫</span></div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL ĐÁNH GIÁ (Giữ nguyên gốc) */}
      {reviewModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '500px' }}>
            <h2>{reviewModal.isEditing ? "Chỉnh sửa đánh giá" : "Đánh giá sản phẩm"}</h2>
            <form onSubmit={submitReview}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar key={star} size={30} color={star <= reviewModal.rating ? '#ffc107' : '#e4e5e9'} style={{ cursor: 'pointer' }} onClick={() => setReviewModal({ ...reviewModal, rating: star })} />
                ))}
              </div>
              <textarea required value={reviewModal.comment} onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })} style={{ width: '100%', padding: '10px', minHeight: '80px', boxSizing: 'border-box' }} placeholder="Nhập bình luận ý kiến..." />
              <div style={{ margin: '15px 0' }}>
                <label style={{ cursor: 'pointer', color: '#007bff' }}> Up tệp đính kèm <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} style={{ display: 'none' }} /></label>
                {reviewModal.media && <div style={{ marginTop: '10px' }}>{reviewModal.mediaType === 'image' ? <img src={reviewModal.media} style={{ width: '80px' }} alt="preview" /> : <video src={reviewModal.media} style={{ width: '120px' }} controls />}</div>}
              </div>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeReviewModal} style={{ padding: '8px 15px', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer', borderRadius: '4px' }}>Hủy</button>
                <button type="submit" style={{ backgroundColor: '#ff469e', color: 'white', border: 'none', padding: '8px 20px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrdersPage;