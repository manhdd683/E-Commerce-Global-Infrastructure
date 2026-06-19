import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { FaMoneyBillWave, FaQrcode, FaTruck, FaCoins, FaHistory, FaBan, FaTicketAlt, FaStore } from 'react-icons/fa';
import apiClient from '../../api/apiClient';

const TRANSLATIONS = {
  vi: { emptyCart: "Giỏ hàng của bạn đang trống", continueShopping: "Tiếp tục mua sắm", shippingInfo: "Thông tin nhận hàng", fullName: "Họ tên người nhận", phone: "Số điện thoại", address: "Địa chỉ giao hàng", paymentMethod: "Phương thức thanh toán", cod: "Thanh toán khi nhận hàng (COD)", bankTransfer: "Chuyển khoản qua mã QR (VietQR)", paymentGuide: "Hướng dẫn thanh toán", guide1: "Mở App ngân hàng, chọn tính năng", guide1Bold: "Quét mã QR", guide2: "Hệ thống sẽ tự điền chính xác số tiền cần chuyển là", guide3: "Sau khi chuyển khoản, bấm", guide3Bold: "\"Hoàn tất đặt hàng\"", voucherVault: "Kho Voucher Của Bạn", huntCode: "Săn Mã", available: "Có Sẵn", used: "Đã Dùng", expired: "Hết Hạn", saveCode: "Lưu Mã", allCollected: "Bạn đã thu thập hết mã của hệ thống.", minSpend: "Đơn tối thiểu:", usingCancel: "Đang dùng (Hủy)", use: "Dùng", noAvailable: "Kho chưa có mã nào có sẵn. Hãy qua mục \"Săn mã\" nhé!", noUsed: "Chưa có mã nào được sử dụng.", noExpired: "Không có mã hết hạn.", order: "Đơn hàng", shopeeVoucher: "Shopee Voucher", deselect: "Bỏ chọn", selectFromVault: "👈 Vui lòng chọn mã giảm giá tại", vaultLeft: "Kho Voucher", useCoins: "Dùng", coins: "Xu", subtotal: "Tổng tiền hàng:", shippingFeeLabel: "Phí vận chuyển:", productDiscountLabel: "Giảm giá sản phẩm:", shippingDiscountLabel: "Giảm phí vận chuyển:", coinDiscountLabel: "Dùng xu giảm thêm:", totalLabel: "Thành tiền:", processing: "ĐANG XỬ LÝ...", orderNow: "ĐẶT HÀNG NGAY", alertSaved: "Bạn đã lưu mã giảm giá này rồi!", alertSavedSuccess: "Đã lưu mã", alertInvalid: "Mã giảm giá không tồn tại!", alertUsed: "Bạn đã sử dụng mã này cho đơn hàng trước đó rồi!", alertExpired: "Mã giảm giá này đã quá thời hạn hiệu lực!", alertLimit: "Mã này đã hết lượt sử dụng trên toàn hệ thống!", alertMinSpend: "Đơn hàng chưa đủ điều kiện! Mã này yêu cầu giá trị đơn hàng tối thiểu từ", alertApplySuccess: "✅ Áp dụng thành công:", alertEmpty: "Giỏ hàng trống!", alertOrderBank: "🎉 Đặt hàng thành công! Vui lòng chuyển khoản để xác nhận.", alertOrderSuccess: "🎉 Đặt hàng thành công!", alertError: "Hệ thống lỗi, vui lòng thử lại!" },
  en: { emptyCart: "Your cart is empty", continueShopping: "Continue Shopping", shippingInfo: "Shipping Information", fullName: "Full Name", phone: "Phone Number", address: "Shipping Address", paymentMethod: "Payment Method", cod: "Cash on Delivery (COD)", bankTransfer: "Bank Transfer via QR Code (VietQR)", paymentGuide: "Payment Guide", guide1: "Open your banking app, select", guide1Bold: "Scan QR", guide2: "The system will automatically fill in the exact amount:", guide3: "After transferring, click", guide3Bold: "\"ORDER NOW\"", voucherVault: "Your Voucher Vault", huntCode: "Hunt", available: "Available", used: "Used", expired: "Expired", saveCode: "Save", allCollected: "You have collected all available vouchers.", minSpend: "Min. spend:", usingCancel: "Using (Cancel)", use: "Use", noAvailable: "No vouchers available. Go to \"Hunt\" to get some!", noUsed: "No vouchers used yet.", noExpired: "No expired vouchers.", order: "Your Order", shopeeVoucher: "Shopee Voucher", deselect: "Deselect", selectFromVault: "👈 Please select a voucher from the", vaultLeft: "Voucher Vault", useCoins: "Use", coins: "Coins", subtotal: "Subtotal:", shippingFeeLabel: "Shipping Fee:", productDiscountLabel: "Product Discount:", shippingDiscountLabel: "Shipping Discount:", coinDiscountLabel: "Coin Discount:", totalLabel: "Total:", processing: "PROCESSING...", orderNow: "ORDER NOW", alertSaved: "You have already saved this voucher!", alertSavedSuccess: "Successfully saved", alertInvalid: "Voucher does not exist!", alertUsed: "You have already used this voucher for a previous order!", alertExpired: "This voucher has expired!", alertLimit: "This voucher has reached its usage limit!", alertMinSpend: "Order doesn't meet requirements! Minimum spend is", alertApplySuccess: "✅ Successfully applied:", alertEmpty: "Cart is empty!", alertOrderBank: "🎉 Order placed successfully! Please transfer the funds to confirm.", alertOrderSuccess: "🎉 Order placed successfully!", alertError: "System error, please try again!" },
  ja: { emptyCart: "カートは空です", continueShopping: "買い物を続ける", shippingInfo: "配送情報", fullName: "フルネーム", phone: "電話番号", address: "お届け先住所", paymentMethod: "お支払い方法", cod: "代金引換 (COD)", bankTransfer: "QRコードによる銀行振込 (VietQR)", paymentGuide: "支払いガイド", guide1: "銀行アプリを開き、", guide1Bold: "QRスキャン", guide2: "を選択します。システムが自動的に正確な金額を入力します：", guide3: "振込後、", guide3Bold: "「今すぐ注文」", voucherVault: "バウチャー保管庫", huntCode: "探す", available: "利用可能", used: "使用済み", expired: "期限切れ", saveCode: "保存", allCollected: "すべてのバウチャーを収集しました。", minSpend: "最低利用額:", usingCancel: "使用中 (解除)", use: "使用", noAvailable: "利用可能なバウチャーがありません。「探す」から取得してください！", noUsed: "使用されたバウチャーはありません。", noExpired: "期限切れのバウチャーはありません。", order: "ご注文内容", shopeeVoucher: "Shopee バウチャー", deselect: "選択解除", selectFromVault: "👈 左側の", vaultLeft: "バウチャー保管庫", useCoins: "使用", coins: "コイン", subtotal: "小計:", shippingFeeLabel: "送料:", productDiscountLabel: "商品割引:", shippingDiscountLabel: "送料割引:", coinDiscountLabel: "コイン割引:", totalLabel: "合計:", processing: "処理中...", orderNow: "今すぐ注文", alertSaved: "このバウチャーは既に保存されています！", alertSavedSuccess: "保存しました", alertInvalid: "バウチャーが存在しません！", alertUsed: "このバウチャーは過去の注文で既に使用されています！", alertExpired: "このバウチャーは期限切れです！", alertLimit: "このバウチャーは利用上限に達しました！", alertMinSpend: "条件を満たしていません！最低利用額は", alertApplySuccess: "✅ 適用成功:", alertEmpty: "カートは空です！", alertOrderBank: "🎉 注文が完了しました！確認のためお振込をお願いします。", alertOrderSuccess: "🎉 注文が完了しました！", alertError: "システムエラーが発生しました。もう一度お試しください！" }
};

const BANK_ID = "MB"; 
const ACCOUNT_NO = "45136822072005"; 
const ACCOUNT_NAME = "DUONG DUC MANH"; 
const QR_INFO_TEXT = "Thanh toan don hang"; 

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'vi');
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

  const [availableVouchers, setAvailableVouchers] = useState([]);

  useEffect(() => {
    const handleLangChange = () => setLanguage(localStorage.getItem('app_lang') || 'vi');
    window.addEventListener('languageChanged', handleLangChange);
    
    const systemVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
    const formattedSystem = systemVouchers.map(v => ({...v, isSystem: true}));

    const shopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
    const formattedShop = shopVouchers.map(v => ({...v, isSystem: false}));

    setAvailableVouchers([...formattedSystem, ...formattedShop]);

    return () => window.removeEventListener('languageChanged', handleLangChange);
  }, []);

  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalItemsCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const shippingFee = totalItemsCount > 0 ? 30000 + (totalItemsCount - 1) * 5000 : 0;

  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [activeVoucherTab, setActiveVoucherTab] = useState('HUNT');
  
  const [productDiscount, setProductDiscount] = useState(0);
  const [shippingDiscount, setShippingDiscount] = useState(0);

  const currentUserKey = user?.username || user?.name || 'guest';
  
  const savedStorageKey = `claimedVouchers_${currentUserKey}`;
  const [claimedVouchers, setClaimedVouchers] = useState(() => {
    const saved = localStorage.getItem(savedStorageKey);
    return saved ? JSON.parse(saved) : [];
  });

  const usedStorageKey = `usedVouchers_${currentUserKey}`;
  const [usedVouchers, setUsedVouchers] = useState(() => {
    const saved = localStorage.getItem(usedStorageKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);

  useEffect(() => localStorage.setItem(savedStorageKey, JSON.stringify(claimedVouchers)), [claimedVouchers, savedStorageKey]);
  useEffect(() => localStorage.setItem(usedStorageKey, JSON.stringify(usedVouchers)), [usedVouchers, usedStorageKey]);

  useEffect(() => {
    const savedCoins = localStorage.getItem('user_coins') || '0';
    setUserCoins(parseInt(savedCoins));
  }, []);

  useEffect(() => {
    if (appliedVoucher) {
      let eligibleAmount = totalAmount; 

      if (!appliedVoucher.isSystem) {
        eligibleAmount = cartItems
          .filter(item => item.sellerId === appliedVoucher.sellerId || item.seller === appliedVoucher.sellerId)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }

      if (appliedVoucher.type === 'PERCENT') {
        setProductDiscount((eligibleAmount * appliedVoucher.value) / 100);
        setShippingDiscount(0);
      } else if (appliedVoucher.type === 'FIXED') {
        setProductDiscount(Math.min(appliedVoucher.value, eligibleAmount));
        setShippingDiscount(0);
      } else if (appliedVoucher.type === 'SHIPPING') {
        setProductDiscount(0);
        setShippingDiscount(Math.min(appliedVoucher.value, shippingFee));
      }
    } else {
      setProductDiscount(0);
      setShippingDiscount(0);
    }
  }, [appliedVoucher, totalAmount, shippingFee, cartItems]);

  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', paymentMethod: 'COD' });

  const subTotal = (totalAmount - productDiscount > 0 ? totalAmount - productDiscount : 0) 
                 + (shippingFee - shippingDiscount > 0 ? shippingFee - shippingDiscount : 0);

  const coinDiscount = useCoins ? Math.min(userCoins, subTotal) : 0;
  const finalPrice = subTotal - coinDiscount;

  const qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${finalPrice}&addInfo=${encodeURIComponent(QR_INFO_TEXT)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleClaimVoucher = (code) => {
    if (claimedVouchers.includes(code)) return alert(t.alertSaved);
    setClaimedVouchers([...claimedVouchers, code]);
    alert(`${t.alertSavedSuccess} ${code}!`);
    setActiveVoucherTab('SAVED'); 
  };

  const handleApplyVoucher = (code) => {
    const foundVoucher = availableVouchers.find(v => v.code === code);
    if (!foundVoucher) return alert(t.alertInvalid);
    if (usedVouchers.includes(code)) return alert(t.alertUsed);

    const now = new Date();
    const expiry = new Date(foundVoucher.expiryDate);
    if (now > expiry) return alert(t.alertExpired);
    if (foundVoucher.systemUsed >= foundVoucher.systemLimit) return alert(t.alertLimit);

    if (!foundVoucher.isSystem) {
      const shopItemsTotal = cartItems
        .filter(item => item.sellerId === foundVoucher.sellerId || item.seller === foundVoucher.sellerId)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      if (shopItemsTotal === 0) {
        return alert(`Bạn chưa mua sản phẩm nào của Shop "${foundVoucher.sellerId}" để có thể áp dụng mã này!`);
      }
      if (shopItemsTotal < foundVoucher.minSpend) {
        return alert(`Mã này yêu cầu mua TỐI THIỂU ${foundVoucher.minSpend.toLocaleString('vi-VN')}đ các sản phẩm từ Shop "${foundVoucher.sellerId}"!`);
      }
    } else {
      if (totalAmount < foundVoucher.minSpend) {
        return alert(`${t.alertMinSpend} ${foundVoucher.minSpend.toLocaleString('vi-VN')} ₫`);
      }
    }

    setAppliedVoucher(foundVoucher);
  };

  const handleRemoveVoucher = () => setAppliedVoucher(null);

  const handlePlaceOrder = async (e) => {
    e.preventDefault(); 
    if (cartItems.length === 0) return alert(t.alertEmpty);

    setIsSubmitting(true);
    const orderStatus = formData.paymentMethod === 'BANK' ? 'Pending Payment' : 'Processing';
    const targetSellerId = cartItems[0]?.sellerId || cartItems[0]?.seller || 'NBH'; 

    const orderPayload = {
      userId: user?.id || 'guest_id', 
      username: currentUserKey, 
      sellerId: targetSellerId, 
      customerInfo: formData, items: cartItems, totalPrice: finalPrice, originalPrice: totalAmount,
      shippingFee: shippingFee, productDiscount: productDiscount, shippingDiscount: shippingDiscount,
      coinDiscount: coinDiscount, appliedVoucherCode: appliedVoucher ? appliedVoucher.code : 'Không sử dụng',
      orderDate: new Date().toISOString(), status: orderStatus
    };

    try {
      await apiClient.post('/orders', orderPayload);
      
      const updateStockPromises = cartItems.map((item) => {
        const newStock = item.stock - item.quantity;
        return apiClient.put(`/products/${item.id}`, { stock: newStock > 0 ? newStock : 0 });
      });
      await Promise.all(updateStockPromises);
      
      if (appliedVoucher) {
        setClaimedVouchers(claimedVouchers.filter(c => c !== appliedVoucher.code));
        setUsedVouchers([...usedVouchers, appliedVoucher.code]);
        
        if (appliedVoucher.isSystem) {
          const sysVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
          const updated = sysVouchers.map(v => v.code === appliedVoucher.code ? { ...v, systemUsed: (v.systemUsed || 0) + 1 } : v);
          localStorage.setItem('system_vouchers', JSON.stringify(updated));
        } else {
          const shopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
          const updated = shopVouchers.map(v => v.code === appliedVoucher.code ? { ...v, systemUsed: (v.systemUsed || 0) + 1 } : v);
          localStorage.setItem('shop_vouchers', JSON.stringify(updated));
        }
      }

      if (useCoins) {
        localStorage.setItem('user_coins', (userCoins - coinDiscount).toString());
        window.dispatchEvent(new Event('coinsUpdated'));
      }

      const referrer = localStorage.getItem('referred_by');
      if (referrer) {
        const commission = finalPrice * 0.1; 
        const statsKey = `affiliate_stats_${referrer}`;
        let currentStats = JSON.parse(localStorage.getItem(statsKey)) || { clicks: 0, orders: 0, totalCommission: 0, history: [] };
        
        currentStats.orders += 1;
        currentStats.totalCommission += commission;
        currentStats.history.push({
          date: new Date().toISOString(),
          orderTotal: finalPrice,
          commission: commission
        });
        
        localStorage.setItem(statsKey, JSON.stringify(currentStats));
        localStorage.removeItem('referred_by'); 
      }

      alert(formData.paymentMethod === 'BANK' ? t.alertOrderBank : t.alertOrderSuccess);
      clearCart(); 
      navigate('/my-orders'); 
    } catch (error) {
      alert(t.alertError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const now = new Date();
  const huntVouchers = availableVouchers.filter(v => !claimedVouchers.includes(v.code) && !usedVouchers.includes(v.code) && new Date(v.expiryDate) >= now);
  const myValidVouchers = availableVouchers.filter(v => claimedVouchers.includes(v.code) && !usedVouchers.includes(v.code) && new Date(v.expiryDate) >= now);
  const myExpiredVouchers = availableVouchers.filter(v => claimedVouchers.includes(v.code) && !usedVouchers.includes(v.code) && new Date(v.expiryDate) < now);
  const myUsedVouchers = availableVouchers.filter(v => usedVouchers.includes(v.code));

  if (cartItems.length === 0) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh', backgroundColor: '#f4f6f8' }}>
        <h2 className="mb-4">{t.emptyCart}</h2>
        <button onClick={() => navigate('/')} className="btn btn-danger px-4 py-2 fw-bold">{t.continueShopping}</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container">
        <form onSubmit={handlePlaceOrder} className="row g-4 flex-column-reverse flex-lg-row">
          
          {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG & KHO VOUCHER */}
          <div className="col-12 col-lg-7">
            
            {/* THÔNG TIN GIAO HÀNG */}
            <div className="bg-white p-4 rounded-3 shadow-sm mb-4">
              <h2 className="fs-5 text-dark mb-4 fw-bold">{t.shippingInfo}</h2>
              
              <div className="mb-3">
                <label className="form-label fw-bold">{t.fullName}</label>
                <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="form-control" />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">{t.phone}</label>
                <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="form-control" />
              </div>
              
              <div className="mb-4">
                <label className="form-label fw-bold">{t.address}</label>
                <textarea name="address" required rows="3" value={formData.address} onChange={handleChange} className="form-control" style={{ resize: 'none' }}></textarea>
              </div>
              
              {/* PHƯƠNG THỨC THANH TOÁN */}
              <h3 className="fs-6 text-dark mb-3 fw-bold">{t.paymentMethod}</h3>
              <div className="d-flex flex-column gap-3">
                
                <label className={`p-3 rounded-3 border cursor-pointer d-flex align-items-center gap-2 transition-all ${formData.paymentMethod === 'COD' ? 'border-success bg-success bg-opacity-10' : 'bg-white'}`}>
                  <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} className="form-check-input mt-0" style={{ width: '18px', height: '18px' }} /> 
                  <FaMoneyBillWave className="text-success fs-5" />
                  <span className="fw-bold text-dark">{t.cod}</span>
                </label>

                <label className={`p-3 rounded-3 border cursor-pointer d-flex align-items-center gap-2 transition-all ${formData.paymentMethod === 'BANK' ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}>
                  <input type="radio" name="paymentMethod" value="BANK" checked={formData.paymentMethod === 'BANK'} onChange={handleChange} className="form-check-input mt-0" style={{ width: '18px', height: '18px' }} /> 
                  <FaQrcode className="text-primary fs-5" />
                  <span className="fw-bold text-dark">{t.bankTransfer}</span>
                </label>

              </div>

              {/* HƯỚNG DẪN QR TRÊN MOBILE NẰM DỌC, MÁY TÍNH NẰM NGANG */}
              {formData.paymentMethod === 'BANK' && (
                <div className="mt-4 p-3 p-md-4 bg-light rounded-3 border border-primary border-dashed d-flex flex-column flex-sm-row gap-3 gap-md-4 align-items-center align-items-sm-start">
                  <div className="bg-white p-2 rounded-3 shadow-sm flex-shrink-0" style={{ width: '160px' }}>
                    <img src={qrCodeUrl} alt="QR Thanh toán" className="img-fluid rounded" />
                  </div>
                  <div className="text-center text-sm-start w-100">
                    <h4 className="fs-6 text-primary mb-3 fw-bold">{t.paymentGuide}</h4>
                    <ul className="text-muted small ps-3 mb-0 text-start" style={{ lineHeight: '1.8' }}>
                      <li>{t.guide1} <strong>{t.guide1Bold}</strong>.</li>
                      <li>{t.guide2} <strong className="text-danger">{finalPrice.toLocaleString('vi-VN')} ₫</strong>.</li>
                      <li>{t.guide3} <strong>{t.guide3Bold}</strong>.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* KHO VOUCHER */}
            <div className="bg-white p-4 rounded-3 shadow-sm">
              <h3 className="fs-5 text-dark d-flex align-items-center gap-2 mb-4 fw-bold">
                <FaTicketAlt className="text-danger"/> Kho Voucher Của Bạn
              </h3>
              
              {/* TABS VUỐT ĐƯỢC TRÊN ĐIỆN THOẠI */}
              <div className="d-flex gap-2 mb-4 overflow-auto pb-2 text-nowrap">
                <button type="button" onClick={() => setActiveVoucherTab('HUNT')} className={`btn rounded-pill px-3 py-2 fw-bold text-sm ${activeVoucherTab === 'HUNT' ? 'btn-danger' : 'btn-light text-secondary'}`}>{t.huntCode}</button>
                <button type="button" onClick={() => setActiveVoucherTab('SAVED')} className={`btn rounded-pill px-3 py-2 fw-bold text-sm ${activeVoucherTab === 'SAVED' ? 'btn-success' : 'btn-light text-secondary'}`}>{t.available} ({myValidVouchers.length})</button>
                <button type="button" onClick={() => setActiveVoucherTab('USED')} className={`btn rounded-pill px-3 py-2 fw-bold text-sm ${activeVoucherTab === 'USED' ? 'btn-primary' : 'btn-light text-secondary'}`}>{t.used} ({myUsedVouchers.length})</button>
                <button type="button" onClick={() => setActiveVoucherTab('EXPIRED')} className={`btn rounded-pill px-3 py-2 fw-bold text-sm ${activeVoucherTab === 'EXPIRED' ? 'btn-secondary bg-secondary text-white' : 'btn-light text-secondary'}`}>{t.expired} ({myExpiredVouchers.length})</button>
              </div>

              <div className="d-flex flex-column gap-3 overflow-auto pe-1" style={{ maxHeight: '350px' }}>
                
                {activeVoucherTab === 'HUNT' && (
                  huntVouchers.length > 0 ? huntVouchers.map(v => (
                    <div key={v.code} className={`p-3 rounded-3 d-flex justify-content-between align-items-center border ${v.isSystem ? 'border-danger border-dashed bg-danger bg-opacity-10' : 'border-warning border-dashed bg-warning bg-opacity-10'}`}>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className={`fw-bold fs-6 ${v.isSystem ? 'text-danger' : 'text-warning'}`}>{v.code}</div>
                          <span className={`badge ${v.isSystem ? 'bg-danger' : 'bg-warning'} d-flex align-items-center gap-1`}>
                             {v.isSystem ? 'SÀN' : <><FaStore/> {v.sellerId}</>}
                          </span>
                        </div>
                        <div className="small fw-bold text-dark">{v.name}</div>
                      </div>
                      <button type="button" onClick={() => handleClaimVoucher(v.code)} className={`btn btn-sm fw-bold ${v.isSystem ? 'btn-danger' : 'btn-warning text-white'}`}>{t.saveCode}</button>
                    </div>
                  )) : <div className="text-muted text-center py-3 small">{t.allCollected}</div>
                )}

                {activeVoucherTab === 'SAVED' && (
                  myValidVouchers.length > 0 ? myValidVouchers.map(v => (
                    <div key={v.code} className="p-3 rounded-3 d-flex justify-content-between align-items-center border border-success bg-success bg-opacity-10">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className="fw-bold text-success fs-6">{v.code}</div>
                          <span className="badge bg-success d-flex align-items-center gap-1">
                             {v.isSystem ? 'SÀN' : <><FaStore/> {v.sellerId}</>}
                          </span>
                        </div>
                        <div className="small fw-bold text-dark">{v.name}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{t.minSpend} {v.minSpend.toLocaleString('vi-VN')} ₫</div>
                      </div>
                      {appliedVoucher?.code === v.code ? (
                        <button type="button" onClick={handleRemoveVoucher} className="btn btn-outline-danger btn-sm fw-bold bg-white">{t.usingCancel}</button>
                      ) : (
                        <button type="button" onClick={() => handleApplyVoucher(v.code)} className="btn btn-success btn-sm fw-bold">{t.use}</button>
                      )}
                    </div>
                  )) : <div className="text-muted text-center py-3 small">{t.noAvailable}</div>
                )}

                {activeVoucherTab === 'USED' && (
                  myUsedVouchers.length > 0 ? myUsedVouchers.map(v => (
                    <div key={v.code} className="p-3 rounded-3 d-flex justify-content-between align-items-center border bg-light opacity-75">
                      <div>
                        <div className="fw-bold text-secondary text-decoration-line-through mb-1">{v.code}</div>
                        <div className="small text-muted">{v.name}</div>
                      </div>
                      <span className="badge text-primary bg-primary bg-opacity-10 d-flex align-items-center gap-1"><FaHistory/> {t.used}</span>
                    </div>
                  )) : <div className="text-muted text-center py-3 small">{t.noUsed}</div>
                )}

                {activeVoucherTab === 'EXPIRED' && (
                  myExpiredVouchers.length > 0 ? myExpiredVouchers.map(v => (
                    <div key={v.code} className="p-3 rounded-3 d-flex justify-content-between align-items-center border bg-light opacity-75">
                      <div>
                        <div className="fw-bold text-secondary text-decoration-line-through mb-1">{v.code}</div>
                        <div className="small text-muted">{v.name}</div>
                      </div>
                      <span className="badge text-danger bg-danger bg-opacity-10 d-flex align-items-center gap-1"><FaBan/> {t.expired}</span>
                    </div>
                  )) : <div className="text-muted text-center py-3 small">{t.noExpired}</div>
                )}

              </div>
            </div>

          </div>

          {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG (Dính chặt khi cuộn trên PC) */}
          <div className="col-12 col-lg-5">
            <div className="bg-white p-4 rounded-3 shadow-sm sticky-top" style={{ top: '20px' }}>
              
              <h2 className="fs-5 text-dark mb-4 fw-bold border-bottom pb-3">{t.order}</h2>
              
              <div className="mb-4 overflow-auto pe-2" style={{ maxHeight: '250px' }}>
                {cartItems.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between mb-3 small">
                    <span className="text-muted text-truncate me-3" style={{ flex: 1 }}>{item.name} <strong className="text-dark">x {item.quantity}</strong></span>
                    <span className="fw-bold text-dark text-nowrap">{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
                  </div>
                ))}
              </div>

              <div className="border-top pt-3 mb-4">
                <label className="fw-bold small text-dark d-block mb-2"><FaTicketAlt className="text-danger me-1"/> Voucher & Khuyến mãi</label>
                
                {appliedVoucher ? (
                  <div className="d-flex justify-content-between align-items-center p-2 bg-success bg-opacity-10 border border-success rounded-3">
                    <div>
                      <div className="fw-bold text-success small">{appliedVoucher.code}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{appliedVoucher.name}</div>
                    </div>
                    <button type="button" onClick={handleRemoveVoucher} className="btn btn-outline-danger btn-sm py-1 px-2 fw-bold" style={{ fontSize: '11px' }}>{t.deselect}</button>
                  </div>
                ) : (
                  <div className="p-3 bg-light border border-dashed rounded-3 text-center text-muted small">
                    {t.selectFromVault} <strong className="text-danger">{t.vaultLeft}</strong>
                  </div>
                )}
              </div>

              {userCoins > 0 && (
                <div className="d-flex align-items-center gap-2 p-3 bg-warning bg-opacity-10 border border-warning border-dashed rounded-3 mb-4">
                  <input type="checkbox" checked={useCoins} onChange={(e) => setUseCoins(e.target.checked)} className="form-check-input mt-0" style={{ width: '18px', height: '18px' }} />
                  <span className="small text-dark flex-grow-1">{t.useCoins} <span className="text-warning fw-bold"><FaCoins/> {userCoins.toLocaleString('vi-VN')} {t.coins}</span></span>
                  <span className="text-success fw-bold small">-{Math.min(userCoins, subTotal).toLocaleString('vi-VN')} ₫</span>
                </div>
              )}

              <div className="border-top pt-3 mb-4 d-flex flex-column gap-2 small text-muted">
                <div className="d-flex justify-content-between">
                  <span>{t.subtotal}</span><span className="fw-bold text-dark">{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="d-flex align-items-center gap-1"><FaTruck /> {t.shippingFeeLabel}</span><span className="fw-bold text-dark">{shippingFee.toLocaleString('vi-VN')} ₫</span>
                </div>
                
                {productDiscount > 0 && (
                  <div className="d-flex justify-content-between text-success fw-bold">
                    <span>{t.productDiscountLabel}</span><span>-{productDiscount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                {shippingDiscount > 0 && (
                  <div className="d-flex justify-content-between text-success fw-bold">
                    <span>{t.shippingDiscountLabel}</span><span>-{shippingDiscount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                {useCoins && coinDiscount > 0 && (
                  <div className="d-flex justify-content-between text-warning fw-bold">
                    <span>{t.coinDiscountLabel}</span><span>-{coinDiscount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                
                <div className="d-flex justify-content-between border-top border-dashed pt-3 mt-2 fs-5 fw-bold text-dark">
                  <span>{t.totalLabel}</span><span className="text-danger">{finalPrice.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="btn btn-danger w-100 py-3 fw-bold fs-6 rounded-3 shadow-sm">
                {isSubmitting ? t.processing : t.orderNow}
              </button>
              
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;