import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaBoxOpen } from 'react-icons/fa';
import apiClient from '../../api/apiClient';

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
  const [activeTab, setActiveTab] = useState('all');

  const [reviewModal, setReviewModal] = useState({
    isOpen: false, product: null, order: null, rating: 5, comment: '', media: null, mediaType: '', isEditing: false
  });

  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const storageKey = loggedInUser?.name ? `claimedVouchers_${loggedInUser.name}` : 'claimedVouchers_guest';

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
      setIsLoading(true);
      const response = await apiClient.get('/orders');
      const allOrders = response.data || [];
      
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInUser?.name || loggedInUser?.username) {
      fetchMyOrders();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentTabConfig = orderTabs.find(tab => tab.id === activeTab) || orderTabs[0];
  const filteredOrders = orders.filter(order => currentTabConfig.statusMatch.includes(order.status));

  // --- Logic Hoàn Voucher ---
  const handleCancelOrder = async (order) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
      try {
        await apiClient.put(`/orders/${order.id}`, { status: 'Canceled' });

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

        const vCode = order.appliedVoucherCode;
        if (vCode && vCode !== 'Không sử dụng') {
          const expiryString = VOUCHER_EXPIRY_MAP[vCode];
          if (expiryString) {
            const now = new Date();
            const expiryDate = new Date(expiryString);
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

  // --- Logic Đánh giá Sản phẩm ---
  const openReviewModal = (product, order, existingReview = null) => {
    if (existingReview) {
      setReviewModal({ isOpen: true, product: product, order: order, rating: existingReview.rating, comment: existingReview.comment, media: existingReview.media, mediaType: existingReview.mediaType, isEditing: true });
    } else {
      setReviewModal({ isOpen: true, product: product, order: order, rating: 5, comment: '', media: null, mediaType: '', isEditing: false });
    }
  };

  const closeReviewModal = () => setReviewModal({ ...reviewModal, isOpen: false });

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
        newReview = { ...oldReview, rating: reviewModal.rating, comment: reviewModal.comment, media: reviewModal.media, mediaType: reviewModal.mediaType, lastUpdated: nowIso, editCount: (oldReview.editCount || 0) + 1 };
        updatedReviews = updatedReviews.map(rev => rev.id === oldReview.id ? newReview : rev);
      } else {
        newReview = { id: Date.now().toString(), reviewerName: reviewerNameStr, rating: reviewModal.rating, comment: reviewModal.comment, media: reviewModal.media, mediaType: reviewModal.mediaType, originalDate: nowIso, lastUpdated: nowIso, editCount: 0 };
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
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '30px 0' }}>
      <div className="container">
        
        {/* Header & Nút Quay Lại */}
        <div className="d-flex align-items-center mb-4">
          <Link to="/" style={{ color: '#ff469e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
            <FaArrowLeft /> Trang chủ
          </Link>
          <h2 className="ms-3 ps-3 border-start border-3 border-danger mb-0 text-dark fw-bold">Đơn hàng của tôi</h2>
        </div>

        {/* Thanh Điều Hướng Tabs */}
        <div className="d-flex overflow-auto bg-white border-bottom sticky-top shadow-sm mb-4" style={{ zIndex: 10, top: '60px' }}>
          {orderTabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-3 text-center text-nowrap cursor-pointer flex-grow-1 border-bottom border-3 ${activeTab === tab.id ? 'fw-bold text-danger border-danger' : 'text-dark border-transparent'}`}
              style={{ minWidth: 'max-content', transition: 'all 0.2s ease', cursor: 'pointer' }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Khu vực Hiển Thị Đơn Hàng */}
        {isLoading ? (
          <div className="text-center py-5">🔄 Đang tải...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-5 text-center rounded shadow-sm">
            <div className="d-inline-flex justify-content-center align-items-center bg-light rounded-circle mb-3" style={{ width: '100px', height: '100px' }}>
              <FaBoxOpen size={40} color="#ccc" />
            </div>
            <p className="text-muted fs-5">Chưa có đơn hàng nào trong mục này.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white border rounded p-3 p-md-4 shadow-sm">
                
                {/* Header Đơn Hàng */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center border-bottom pb-3 mb-3">
                  <div className="mb-2 mb-md-0">
                    <div className="fw-bold text-dark">Mã đơn: <span className="text-danger">#{order.id}</span></div>
                    <div className="text-muted small mt-1">Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}</div>
                    {order.appliedVoucherCode && order.appliedVoucherCode !== 'Không sử dụng' && (
                      <div className="mt-1 small text-danger">Voucher sử dụng: <strong>{order.appliedVoucherCode}</strong></div>
                    )}
                  </div>
                  <div>
                    {order.status === 'Completed' ? <span className="text-success fw-bold">✓ Giao thành công</span> : 
                     order.status === 'Canceled' ? <span className="text-danger fw-bold">✕ Đã hủy đơn</span> : 
                     <span className="text-warning fw-bold">⏳ Đang xử lý</span>}
                  </div>
                </div>

                {/* Danh Sách Sản Phẩm */}
                <div className="mb-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 border-bottom pb-2">
                      <span className="mb-2 mb-md-0">{item.name} <strong className="text-danger">x{item.quantity}</strong></span>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        {order.status === 'Completed' && !item.isReviewed && (
                          <button onClick={() => openReviewModal(item, order)} className="btn btn-outline-danger btn-sm fw-bold">Đánh giá</button>
                        )}
                        {order.status === 'Completed' && item.isReviewed && checkCanEditReview(item.reviewDetails) && (
                          <button onClick={() => openReviewModal(item, order, item.reviewDetails)} className="btn btn-outline-primary btn-sm fw-bold">Sửa đánh giá</button>
                        )}
                        <span className="fw-bold fs-6 text-dark">{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Đơn Hàng (Tổng Tiền & Thao Tác) */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center border-top pt-3 mt-3">
                  <div className="text-muted small mb-2 mb-md-0">Hình thức: <strong>{order.customerInfo?.paymentMethod || "COD"}</strong></div>
                  <div className="d-flex align-items-center gap-3 w-100 w-md-auto justify-content-between justify-content-md-end">
                    {order.status === 'Processing' && (
                      <button onClick={() => handleCancelOrder(order)} className="btn btn-danger btn-sm fw-bold">Hủy đơn</button>
                    )}
                    <div className="fs-5 fw-bold">Tổng chi: <span className="text-danger">{Number(order.totalPrice || 0).toLocaleString('vi-VN')} ₫</span></div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* MODAL ĐÁNH GIÁ KÈM RESPONSIVE */}
        {reviewModal.isOpen && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
            <div className="bg-white rounded p-3 p-md-4 shadow" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h4 className="mb-3 border-bottom pb-2 text-center text-md-start">{reviewModal.isEditing ? "Chỉnh sửa đánh giá" : "Đánh giá sản phẩm"}</h4>
              
              <form onSubmit={submitReview}>
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FaStar key={star} size={35} color={star <= reviewModal.rating ? '#ffc107' : '#e4e5e9'} className="cursor-pointer" onClick={() => setReviewModal({ ...reviewModal, rating: star })} />
                  ))}
                </div>
                
                <textarea required value={reviewModal.comment} onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })} className="form-control mb-3" rows="3" placeholder="Nhập bình luận ý kiến..." />
                
                <div className="mb-3">
                  <label className="text-primary cursor-pointer d-block text-center border p-2 rounded bg-light"> 
                    + Thêm hình ảnh/video 
                    <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="d-none" />
                  </label>
                  {reviewModal.media && (
                    <div className="mt-2 text-center">
                      {reviewModal.mediaType === 'image' 
                        ? <img src={reviewModal.media} className="img-thumbnail" style={{ height: '80px', objectFit: 'cover' }} alt="preview" /> 
                        : <video src={reviewModal.media} className="img-thumbnail" style={{ height: '80px' }} controls />}
                    </div>
                  )}
                </div>
                
                <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                  <button type="button" onClick={closeReviewModal} className="btn btn-light border fw-bold w-50 w-md-auto">Hủy</button>
                  <button type="submit" className="btn btn-danger fw-bold w-50 w-md-auto">Xác nhận</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrdersPage;