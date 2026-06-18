import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';

// BỘ TỪ ĐIỂN DỊCH THUẬT CHO GIỎ HÀNG
const TRANSLATIONS = {
  vi: {
    cartTitle: "Giỏ hàng của bạn",
    emptyCartTitle: "Giỏ hàng đang trống",
    emptyCartDesc: "Chưa có sản phẩm nào trong giỏ hàng của bạn.",
    continueShopping: "Tiếp tục mua sắm",
    tableProduct: "Sản phẩm",
    tablePrice: "Đơn giá",
    tableQuantity: "Số lượng",
    tableTotal: "Thành tiền",
    tableDelete: "Xóa",
    subtotal: "Tạm tính",
    items: "món",
    totalSum: "Tổng cộng:",
    proceedToCheckout: "Tiến hành thanh toán",
    alertSelectItems: "Vui lòng tích chọn ít nhất 1 sản phẩm để thanh toán!"
  },
  en: {
    cartTitle: "Your Shopping Cart",
    emptyCartTitle: "Your cart is empty",
    emptyCartDesc: "There are currently no items in your cart.",
    continueShopping: "Continue Shopping",
    tableProduct: "Product",
    tablePrice: "Unit Price",
    tableQuantity: "Quantity",
    tableTotal: "Total Price",
    tableDelete: "Delete",
    subtotal: "Subtotal",
    items: "items",
    totalSum: "Total:",
    proceedToCheckout: "Proceed to Checkout",
    alertSelectItems: "Please select at least 1 item to checkout!"
  },
  ja: {
    cartTitle: "ショッピングカート",
    emptyCartTitle: "カートは空です",
    emptyCartDesc: "現在カートに商品はありません。",
    continueShopping: "買い物を続ける",
    tableProduct: "製品",
    tablePrice: "単価",
    tableQuantity: "数量",
    tableTotal: "合計金額",
    tableDelete: "削除",
    subtotal: "小計",
    items: "点",
    totalSum: "合計:",
    proceedToCheckout: "レジに進む",
    alertSelectItems: "チェックアウトするには少なくとも1つの商品を選択してください！"
  }
};

const CartPage = () => {
  const navigate = useNavigate();
  // Lấy các hàm và dữ liệu từ kho chứa CartContext
  const { cartItems, removeFromCart, updateQuantity } = useContext(CartContext);

  // --- QUẢN LÝ NGÔN NGỮ ---
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'vi');
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

  useEffect(() => {
    const handleLangChange = () => setLanguage(localStorage.getItem('app_lang') || 'vi');
    window.addEventListener('languageChanged', handleLangChange);
    return () => window.removeEventListener('languageChanged', handleLangChange);
  }, []);

  // --- LOGIC TÍCH CHỌN SẢN PHẨM ---
  // Lưu trữ danh sách ID các sản phẩm đang được tích chọn
  const [selectedIds, setSelectedIds] = useState([]);

  // Hàm Chọn tất cả / Bỏ chọn tất cả
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(cartItems.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Hàm Tích chọn / Bỏ chọn từng sản phẩm
  const handleSelectItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Lọc ra danh sách những món ĐÃ CHỌN và chỉ tính tiền những món này
  const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));
  const totalAmount = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Hàm xử lý khi bấm nút Thanh toán
  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      return alert(t.alertSelectItems);
    }
    // Gửi đúng những món đã chọn sang trang Checkout
    navigate('/checkout', { state: { selectedItems } });
  };
  // ------------------------------------

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', minHeight: '80vh' }}>
      <h1 style={{ color: '#333', marginBottom: '30px', borderLeft: '5px solid #ff469e', paddingLeft: '15px' }}>{t.cartTitle}</h1>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" style={{ width: '150px', marginBottom: '20px', opacity: 0.5 }} />
          <h2 style={{ color: '#666' }}>{t.emptyCartTitle}</h2>
          <p style={{ color: '#999', marginBottom: '30px' }}>{t.emptyCartDesc}</p>
          <Link to="/" style={{ padding: '12px 25px', backgroundColor: '#ff469e', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
            <FaArrowLeft style={{ marginRight: '8px' }}/> {t.continueShopping}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '30px', flexDirection: 'column' }}>
          
          {/* Danh sách sản phẩm trong giỏ */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
                  {/* CỘT CHECKBOX CHỌN TẤT CẢ */}
                  <th style={{ padding: '15px 10px', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={cartItems.length > 0 && selectedIds.length === cartItems.length}
                      onChange={handleSelectAll}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff469e' }}
                    />
                  </th>
                  <th style={{ padding: '15px 10px' }}>{t.tableProduct}</th>
                  <th style={{ padding: '15px 10px' }}>{t.tablePrice}</th>
                  <th style={{ padding: '15px 10px', textAlign: 'center' }}>{t.tableQuantity}</th>
                  <th style={{ padding: '15px 10px', textAlign: 'right' }}>{t.tableTotal}</th>
                  <th style={{ padding: '15px 10px', textAlign: 'center' }}>{t.tableDelete}</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    {/* CỘT CHECKBOX TỪNG SẢN PHẨM */}
                    <td style={{ padding: '15px 10px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff469e' }}
                      />
                    </td>
                    <td style={{ padding: '15px 10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <img src={item.image || item.images?.[0] || 'https://via.placeholder.com/60'} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '6px', padding: '5px' }} />
                      <div style={{ fontWeight: '500', color: '#333', maxWidth: '250px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.name}
                      </div>
                    </td>
                    <td style={{ padding: '15px 10px', color: '#666', whiteSpace: 'nowrap' }}>
                      {Number(item.price).toLocaleString('vi-VN')} ₫
                    </td>
                    <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '30px', height: '30px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaMinus size={10} color="#555"/>
                        </button>
                        <span style={{ fontWeight: 'bold', width: '30px' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '30px', height: '30px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaPlus size={10} color="#555"/>
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold', color: '#d70018', whiteSpace: 'nowrap' }}>
                      {Number(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                    </td>
                    <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }} title={t.tableDelete}>
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phần tổng kết và nút thanh toán */}
          <div style={{ alignSelf: 'flex-end', width: '100%', maxWidth: '350px', backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '16px', color: '#555' }}>
              <span>{t.subtotal} ({selectedIds.length} {t.items}):</span>
              <span>{totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              <span>{t.totalSum}</span>
              <span style={{ color: '#d70018', fontSize: '24px' }}>{totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              style={{ 
                width: '100%', padding: '15px', 
                backgroundColor: selectedIds.length === 0 ? '#ccc' : '#28a745', 
                color: 'white', border: 'none', borderRadius: '6px', 
                fontSize: '16px', fontWeight: 'bold', 
                cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'all 0.2s'
              }}
            >
              {t.proceedToCheckout} <FaArrowRight />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default CartPage;