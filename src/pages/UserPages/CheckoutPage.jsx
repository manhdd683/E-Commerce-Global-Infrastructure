import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { FaMoneyBillWave, FaQrcode, FaTruck, FaCoins, FaHistory, FaBan, FaTicketAlt, FaStore } from 'react-icons/fa';
import apiClient from '../../api/apiClient';

const TRANSLATIONS = {
  vi: {
    emptyCart: "Giỏ hàng của bạn đang trống", continueShopping: "Tiếp tục mua sắm", shippingInfo: "Thông tin nhận hàng",
    fullName: "Họ tên người nhận", phone: "Số điện thoại", address: "Địa chỉ giao hàng", paymentMethod: "Phương thức thanh toán",
    cod: "Thanh toán khi nhận hàng (COD)", bankTransfer: "Chuyển khoản qua mã QR (VietQR)", paymentGuide: "Hướng dẫn thanh toán",
    guide1: "Mở App ngân hàng, chọn tính năng", guide1Bold: "Quét mã QR", guide2: "Hệ thống sẽ tự điền chính xác số tiền cần chuyển là",
    guide3: "Sau khi chuyển khoản, bấm", guide3Bold: "\"Hoàn tất đặt hàng\"", voucherVault: "Kho Voucher Của Bạn",
    huntCode: "Săn Mã", available: "Có Sẵn", used: "Đã Dùng", expired: "Hết Hạn", saveCode: "Lưu Mã", allCollected: "Bạn đã thu thập hết mã của hệ thống.",
    minSpend: "Đơn tối thiểu:", usingCancel: "Đang dùng (Hủy)", use: "Dùng", noAvailable: "Kho chưa có mã nào có sẵn. Hãy qua mục \"Săn mã\" nhé!",
    noUsed: "Chưa có mã nào được sử dụng.", noExpired: "Không có mã hết hạn.", order: "Đơn hàng", shopeeVoucher: "Shopee Voucher",
    deselect: "Bỏ chọn", selectFromVault: "👈 Vui lòng chọn mã giảm giá tại", vaultLeft: "Kho Voucher", useCoins: "Dùng", coins: "Xu",
    subtotal: "Tổng tiền hàng:", shippingFeeLabel: "Phí vận chuyển:", productDiscountLabel: "Giảm giá sản phẩm:",
    shippingDiscountLabel: "Giảm phí vận chuyển:", coinDiscountLabel: "Dùng xu giảm thêm:", totalLabel: "Thành tiền:",
    processing: "ĐANG XỬ LÝ...", orderNow: "ĐẶT HÀNG NGAY", alertSaved: "Bạn đã lưu mã giảm giá này rồi!", alertSavedSuccess: "Đã lưu mã",
    alertInvalid: "Mã giảm giá không tồn tại!", alertUsed: "Bạn đã sử dụng mã này cho đơn hàng trước đó rồi!",
    alertExpired: "Mã giảm giá này đã quá thời hạn hiệu lực!", alertLimit: "Mã này đã hết lượt sử dụng trên toàn hệ thống!",
    alertMinSpend: "Đơn hàng chưa đủ điều kiện! Mã này yêu cầu giá trị đơn hàng tối thiểu từ", alertApplySuccess: "✅ Áp dụng thành công:",
    alertEmpty: "Giỏ hàng trống!", alertOrderBank: "🎉 Đặt hàng thành công! Vui lòng chuyển khoản để xác nhận.",
    alertOrderSuccess: "🎉 Đặt hàng thành công!", alertError: "Hệ thống lỗi, vui lòng thử lại!"
  },
  en: {
    emptyCart: "Your cart is empty", continueShopping: "Continue Shopping", shippingInfo: "Shipping Information",
    fullName: "Full Name", phone: "Phone Number", address: "Shipping Address", paymentMethod: "Payment Method",
    cod: "Cash on Delivery (COD)", bankTransfer: "Bank Transfer via QR Code (VietQR)", paymentGuide: "Payment Guide",
    guide1: "Open your banking app, select", guide1Bold: "Scan QR", guide2: "The system will automatically fill in the exact amount:",
    guide3: "After transferring, click", guide3Bold: "\"ORDER NOW\"", voucherVault: "Your Voucher Vault",
    huntCode: "Hunt", available: "Available", used: "Used", expired: "Expired", saveCode: "Save", allCollected: "You have collected all available vouchers.",
    minSpend: "Min. spend:", usingCancel: "Using (Cancel)", use: "Use", noAvailable: "No vouchers available. Go to \"Hunt\" to get some!",
    noUsed: "No vouchers used yet.", noExpired: "No expired vouchers.", order: "Your Order", shopeeVoucher: "Shopee Voucher",
    deselect: "Deselect", selectFromVault: "👈 Please select a voucher from the", vaultLeft: "Voucher Vault", useCoins: "Use", coins: "Coins",
    subtotal: "Subtotal:", shippingFeeLabel: "Shipping Fee:", productDiscountLabel: "Product Discount:",
    shippingDiscountLabel: "Shipping Discount:", coinDiscountLabel: "Coin Discount:", totalLabel: "Total:",
    processing: "PROCESSING...", orderNow: "ORDER NOW", alertSaved: "You have already saved this voucher!", alertSavedSuccess: "Successfully saved",
    alertInvalid: "Voucher does not exist!", alertUsed: "You have already used this voucher for a previous order!",
    alertExpired: "This voucher has expired!", alertLimit: "This voucher has reached its usage limit!",
    alertMinSpend: "Order doesn't meet requirements! Minimum spend is", alertApplySuccess: "✅ Successfully applied:",
    alertEmpty: "Cart is empty!", alertOrderBank: "🎉 Order placed successfully! Please transfer the funds to confirm.",
    alertOrderSuccess: "🎉 Order placed successfully!", alertError: "System error, please try again!"
  },
  ja: {
    emptyCart: "カートは空です", continueShopping: "買い物を続ける", shippingInfo: "配送情報", fullName: "フルネーム",
    phone: "電話番号", address: "お届け先住所", paymentMethod: "お支払い方法", cod: "代金引換 (COD)",
    bankTransfer: "QRコードによる銀行振込 (VietQR)", paymentGuide: "支払いガイド", guide1: "銀行アプリを開き、", guide1Bold: "QRスキャン",
    guide2: "を選択します。システムが自動的に正確な金額を入力します：", guide3: "振込後、", guide3Bold: "「今すぐ注文」",
    voucherVault: "バウチャー保管庫", huntCode: "探す", available: "利用可能", used: "使用済み", expired: "期限切れ", saveCode: "保存",
    allCollected: "すべてのバウチャーを収集しました。", minSpend: "最低利用額:", usingCancel: "使用中 (解除)", use: "使用",
    noAvailable: "利用可能なバウチャーがありません。「探す」から取得してください！", noUsed: "使用されたバウチャーはありません。",
    noExpired: "期限切れのバウチャーはありません。", order: "ご注文内容", shopeeVoucher: "Shopee バウチャー", deselect: "選択解除",
    selectFromVault: "👈 左側の", vaultLeft: "バウチャー保管庫", useCoins: "使用", coins: "コイン", subtotal: "小計:",
    shippingFeeLabel: "送料:", productDiscountLabel: "商品割引:", shippingDiscountLabel: "送料割引:",
    coinDiscountLabel: "コイン割引:", totalLabel: "合計:", processing: "処理中...", orderNow: "今すぐ注文",
    alertSaved: "このバウチャーは既に保存されています！", alertSavedSuccess: "保存しました", alertInvalid: "バウチャーが存在しません！",
    alertUsed: "このバウチャーは過去の注文で既に使用されています！", alertExpired: "このバウチャーは期限切れです！",
    alertLimit: "このバウチャーは利用上限に達しました！", alertMinSpend: "条件を満たしていません！最低利用額は",
    alertApplySuccess: "✅ 適用成功:", alertEmpty: "カートは空です！", alertOrderBank: "🎉 注文が完了しました！確認のためお振込をお願いします。",
    alertOrderSuccess: "🎉 注文が完了しました！", alertError: "システムエラーが発生しました。もう一度お試しください！"
  }
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

  // --- KẾT HỢP ĐỌC CẢ VOUCHER TOÀN SÀN VÀ VOUCHER CỦA SHOP ---
  const [availableVouchers, setAvailableVouchers] = useState([]);

  useEffect(() => {
    const handleLangChange = () => setLanguage(localStorage.getItem('app_lang') || 'vi');
    window.addEventListener('languageChanged', handleLangChange);
    
    // Đọc danh sách Voucher Admin tạo
    const systemVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
    const formattedSystem = systemVouchers.map(v => ({...v, isSystem: true}));

    // Đọc danh sách Voucher Shop tạo
    const shopVouchers = JSON.parse(localStorage.getItem('shop_vouchers')) || [];
    const formattedShop = shopVouchers.map(v => ({...v, isSystem: false}));

    // Gộp chung vào 1 kho cho User nhìn thấy hết
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

  // --- LOGIC TÍNH TOÁN TIỀN KHI ÁP MÃ VOUCHER SHOP ---
  useEffect(() => {
    if (appliedVoucher) {
      let eligibleAmount = totalAmount; // Mặc định là tổng tiền (nếu là voucher toàn sàn)

      // Nếu là Voucher của riêng 1 Shop -> Chỉ tính tổng tiền của các mặt hàng thuộc Shop đó
      if (!appliedVoucher.isSystem) {
        eligibleAmount = cartItems
          .filter(item => item.sellerId === appliedVoucher.sellerId || item.seller === appliedVoucher.sellerId)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }

      if (appliedVoucher.type === 'PERCENT') {
        setProductDiscount((eligibleAmount * appliedVoucher.value) / 100);
        setShippingDiscount(0);
      } else if (appliedVoucher.type === 'FIXED') {
        // Không được giảm lố qua tổng tiền hợp lệ
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

    // KIỂM TRA ĐIỀU KIỆN ÁP DỤNG CHO VOUCHER SHOP
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
        
        // Trừ lượt dùng Voucher trên kho dữ liệu của Admin hoặc Shop
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
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh', backgroundColor: '#f4f6f8' }}>
        <h2>{t.emptyCart}</h2>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>{t.continueShopping}</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh', backgroundColor: '#f4f6f8' }}>
      <form onSubmit={handlePlaceOrder} style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '25px', color: '#333' }}>{t.shippingInfo}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>{t.fullName}</label>
              <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>{t.phone}</label>
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>{t.address}</label>
              <textarea name="address" required rows="3" value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box', resize: 'none' }}></textarea>
            </div>
            
            <h3 style={{ marginBottom: '15px', color: '#333', fontSize: '18px' }}>{t.paymentMethod}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ padding: '15px', border: formData.paymentMethod === 'COD' ? '2px solid #28a745' : '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: formData.paymentMethod === 'COD' ? '#f0fdf4' : 'white', transition: '0.2s' }}>
                <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} style={{ accentColor: '#28a745', width: '18px', height: '18px' }} /> 
                <FaMoneyBillWave color="#28a745" size={20} />
                <span style={{ fontWeight: 'bold', color: '#333' }}>{t.cod}</span>
              </label>

              <label style={{ padding: '15px', border: formData.paymentMethod === 'BANK' ? '2px solid #007bff' : '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: formData.paymentMethod === 'BANK' ? '#f0f7ff' : 'white', transition: '0.2s' }}>
                <input type="radio" name="paymentMethod" value="BANK" checked={formData.paymentMethod === 'BANK'} onChange={handleChange} style={{ accentColor: '#007bff', width: '18px', height: '18px' }} /> 
                <FaQrcode color="#007bff" size={20} />
                <span style={{ fontWeight: 'bold', color: '#333' }}>{t.bankTransfer}</span>
              </label>
            </div>

            {formData.paymentMethod === 'BANK' && (
              <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px dashed #007bff', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ flex: '0 0 160px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <img src={qrCodeUrl} alt="QR Thanh toán" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{t.paymentGuide}</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#555', lineHeight: '1.8' }}>
                    <li>{t.guide1} <strong>{t.guide1Bold}</strong>.</li>
                    <li>{t.guide2} <strong style={{color: '#ee4d2d'}}>{finalPrice.toLocaleString('vi-VN')} ₫</strong>.</li>
                    <li>{t.guide3} <strong>{t.guide3Bold}</strong>.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333', fontSize: '20px', margin: '0 0 20px 0' }}>
              <FaTicketAlt color="#ff469e" size={24}/> Kho Voucher Của Bạn
            </h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
              <button type="button" onClick={() => setActiveVoucherTab('HUNT')} style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', backgroundColor: activeVoucherTab === 'HUNT' ? '#ff469e' : '#f0f0f0', color: activeVoucherTab === 'HUNT' ? 'white' : '#555', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}>{t.huntCode}</button>
              <button type="button" onClick={() => setActiveVoucherTab('SAVED')} style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', backgroundColor: activeVoucherTab === 'SAVED' ? '#28a745' : '#f0f0f0', color: activeVoucherTab === 'SAVED' ? 'white' : '#555', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}>{t.available} ({myValidVouchers.length})</button>
              <button type="button" onClick={() => setActiveVoucherTab('USED')} style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', backgroundColor: activeVoucherTab === 'USED' ? '#007bff' : '#f0f0f0', color: activeVoucherTab === 'USED' ? 'white' : '#555', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}>{t.used} ({myUsedVouchers.length})</button>
              <button type="button" onClick={() => setActiveVoucherTab('EXPIRED')} style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', backgroundColor: activeVoucherTab === 'EXPIRED' ? '#dc3545' : '#f0f0f0', color: activeVoucherTab === 'EXPIRED' ? 'white' : '#555', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}>{t.expired} ({myExpiredVouchers.length})</button>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '5px' }}>
              
              {activeVoucherTab === 'HUNT' && (
                huntVouchers.length > 0 ? huntVouchers.map(v => (
                  <div key={v.code} style={{ border: v.isSystem ? '1px dashed #ff469e' : '1px dashed #ee4d2d', padding: '15px 20px', borderRadius: '8px', backgroundColor: v.isSystem ? '#fff0f6' : '#fff0e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <div style={{ fontWeight: 'bold', color: v.isSystem ? '#ff469e' : '#ee4d2d', fontSize: '16px' }}>{v.code}</div>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: v.isSystem ? '#ff469e' : '#ee4d2d', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           {v.isSystem ? 'SÀN' : <><FaStore/> {v.sellerId}</>}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#444', fontWeight: 'bold' }}>{v.name}</div>
                    </div>
                    <button type="button" onClick={() => handleClaimVoucher(v.code)} style={{ padding: '8px 15px', backgroundColor: v.isSystem ? '#ff469e' : '#ee4d2d', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>{t.saveCode}</button>
                  </div>
                )) : <div style={{ fontSize: '14px', color: '#888', textAlign: 'center', padding: '20px' }}>{t.allCollected}</div>
              )}

              {activeVoucherTab === 'SAVED' && (
                myValidVouchers.length > 0 ? myValidVouchers.map(v => (
                  <div key={v.code} style={{ border: '1px solid #28a745', padding: '15px 20px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <div style={{ fontWeight: 'bold', color: '#28a745', fontSize: '16px' }}>{v.code}</div>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           {v.isSystem ? 'SÀN' : <><FaStore/> {v.sellerId}</>}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#444', fontWeight: 'bold' }}>{v.name}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>{t.minSpend} {v.minSpend.toLocaleString('vi-VN')} ₫</div>
                    </div>
                    {appliedVoucher?.code === v.code ? (
                      <button type="button" onClick={handleRemoveVoucher} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>{t.usingCancel}</button>
                    ) : (
                      <button type="button" onClick={() => handleApplyVoucher(v.code)} style={{ padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>{t.use}</button>
                    )}
                  </div>
                )) : <div style={{ fontSize: '14px', color: '#888', textAlign: 'center', padding: '20px' }}>{t.noAvailable}</div>
              )}

              {activeVoucherTab === 'USED' && (
                myUsedVouchers.length > 0 ? myUsedVouchers.map(v => (
                  <div key={v.code} style={{ border: '1px solid #eee', padding: '15px 20px', borderRadius: '8px', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#888', fontSize: '16px', textDecoration: 'line-through', marginBottom: '5px' }}>{v.code}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{v.name}</div>
                    </div>
                    <span style={{ fontSize: '13px', color: '#007bff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><FaHistory/> {t.used}</span>
                  </div>
                )) : <div style={{ fontSize: '14px', color: '#888', textAlign: 'center', padding: '20px' }}>{t.noUsed}</div>
              )}

              {activeVoucherTab === 'EXPIRED' && (
                myExpiredVouchers.length > 0 ? myExpiredVouchers.map(v => (
                  <div key={v.code} style={{ border: '1px solid #eee', padding: '15px 20px', borderRadius: '8px', backgroundColor: '#fff0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#888', fontSize: '16px', textDecoration: 'line-through', marginBottom: '5px' }}>{v.code}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{v.name}</div>
                    </div>
                    <span style={{ fontSize: '13px', color: '#dc3545', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><FaBan/> {t.expired}</span>
                  </div>
                )) : <div style={{ fontSize: '14px', color: '#888', textAlign: 'center', padding: '20px' }}>{t.noExpired}</div>
              )}

            </div>
          </div>

        </div>

        <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}>
          
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>{t.order}</h2>
          
          <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px' }}>
                <span style={{ color: '#555', flex: 1, paddingRight: '10px' }}>{item.name} <strong>x {item.quantity}</strong></span>
                <span style={{ fontWeight: 'bold', flexShrink: 0 }}>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
              <FaTicketAlt color="#ff469e"/> Voucher & Khuyến mãi
            </label>
            
            {appliedVoucher ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: '#f0fdf4', border: '1px solid #28a745', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#28a745', fontSize: '14px' }}>{appliedVoucher.code}</div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{appliedVoucher.name}</div>
                </div>
                <button type="button" onClick={handleRemoveVoucher} style={{ padding: '6px 12px', backgroundColor: '#fff', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{t.deselect}</button>
              </div>
            ) : (
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', border: '1px dashed #ccc', borderRadius: '8px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                {t.selectFromVault} <strong style={{color: '#ff469e'}}>{t.vaultLeft}</strong>
              </div>
            )}
          </div>

          {userCoins > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', backgroundColor: '#fff8f0', borderRadius: '8px', margin: '20px 0', border: '1px dashed #ffb703' }}>
              <input type="checkbox" checked={useCoins} onChange={(e) => setUseCoins(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ffb703' }} />
              <span style={{ fontSize: '14px', color: '#333', flex: 1 }}>{t.useCoins} <span style={{color: '#ffb703', fontWeight: 'bold'}}><FaCoins/> {userCoins.toLocaleString('vi-VN')} {t.coins}</span></span>
              <span style={{color: '#28a745', fontWeight: 'bold'}}>-{Math.min(userCoins, subTotal).toLocaleString('vi-VN')} ₫</span>
            </div>
          )}

          <div style={{ borderTop: '2px solid #eee', paddingTop: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
              <span>{t.subtotal}</span><span style={{fontWeight: 'bold'}}>{totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaTruck /> {t.shippingFeeLabel}</span><span style={{fontWeight: 'bold'}}>{shippingFee.toLocaleString('vi-VN')} ₫</span>
            </div>
            {productDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>
                <span>{t.productDiscountLabel}</span><span>-{productDiscount.toLocaleString('vi-VN')} ₫</span>
              </div>
            )}
            {shippingDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>
                <span>{t.shippingDiscountLabel}</span><span>-{shippingDiscount.toLocaleString('vi-VN')} ₫</span>
              </div>
            )}
            {useCoins && coinDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ffb703', fontWeight: 'bold' }}>
                <span>{t.coinDiscountLabel}</span><span>-{coinDiscount.toLocaleString('vi-VN')} ₫</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #eee', paddingTop: '15px', fontSize: '18px', fontWeight: 'bold' }}>
              <span>{t.totalLabel}</span><span style={{ color: '#d70018', fontSize: '24px' }}>{finalPrice.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
          
          <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '16px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(238,77,45,0.3)' }}>
            {isSubmitting ? t.processing : t.orderNow}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;