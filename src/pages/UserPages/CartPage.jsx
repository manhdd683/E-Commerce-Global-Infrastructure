import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';

const TRANSLATIONS = {
  vi: { cartTitle: "Giỏ hàng của bạn", emptyCartTitle: "Giỏ hàng đang trống", emptyCartDesc: "Chưa có sản phẩm nào trong giỏ hàng của bạn.", continueShopping: "Tiếp tục mua sắm", tableProduct: "Sản phẩm", tablePrice: "Đơn giá", tableQuantity: "Số lượng", tableTotal: "Thành tiền", tableDelete: "Xóa", subtotal: "Tạm tính", items: "món", totalSum: "Tổng cộng:", proceedToCheckout: "Thanh toán", alertSelectItems: "Vui lòng tích chọn ít nhất 1 sản phẩm để thanh toán!" },
  en: { cartTitle: "Your Shopping Cart", emptyCartTitle: "Your cart is empty", emptyCartDesc: "There are currently no items in your cart.", continueShopping: "Continue Shopping", tableProduct: "Product", tablePrice: "Unit Price", tableQuantity: "Quantity", tableTotal: "Total Price", tableDelete: "Delete", subtotal: "Subtotal", items: "items", totalSum: "Total:", proceedToCheckout: "Checkout", alertSelectItems: "Please select at least 1 item to checkout!" },
  ja: { cartTitle: "ショッピングカート", emptyCartTitle: "カートは空です", emptyCartDesc: "現在カートに商品はありません。", continueShopping: "買い物を続ける", tableProduct: "製品", tablePrice: "単価", tableQuantity: "数量", tableTotal: "合計金額", tableDelete: "削除", subtotal: "小計", items: "点", totalSum: "合計:", proceedToCheckout: "レジに進む", alertSelectItems: "チェックアウトするには少なくとも1つの商品を選択してください！" }
};

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity } = useContext(CartContext);

  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'vi');
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

  useEffect(() => {
    const handleLangChange = () => setLanguage(localStorage.getItem('app_lang') || 'vi');
    window.addEventListener('languageChanged', handleLangChange);
    return () => window.removeEventListener('languageChanged', handleLangChange);
  }, []);

  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(cartItems.map(item => item.id));
    else setSelectedIds([]);
  };

  const handleSelectItem = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));
  const totalAmount = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (selectedIds.length === 0) return alert(t.alertSelectItems);
    navigate('/checkout', { state: { selectedItems } });
  };

  return (
    // Đã thay đổi thành min-vh-100 để nền xám phủ kín 100% màn hình, không còn bị lộ chân trắng
    <div className="bg-light min-vh-100 pb-5">
      
      <style>{`
        .cart-summary {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 1020;
          background-color: white;
          padding: 15px 20px;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
          border-radius: 20px 20px 0 0;
          border-top: 1px solid #eee;
        }
        
        /* Giảm spacer lại một chút cho cân đối hơn */
        .mobile-spacer { height: 140px; display: block; }

        @media (min-width: 992px) {
          .cart-summary {
            position: sticky;
            top: 100px;
            bottom: auto;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            padding: 24px;
            border: 1px solid #eee;
          }
          .mobile-spacer { display: none; }
        }
      `}</style>

      <div className="container py-4 py-md-5">
        
        <h1 className="fs-4 text-dark mb-4 border-start border-danger border-4 ps-3 fw-bold">
          {t.cartTitle}
        </h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-4 shadow-sm p-5 text-center border">
            <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" className="mb-4 opacity-50" style={{ width: '120px' }} />
            <h2 className="fs-5 text-secondary mb-2">{t.emptyCartTitle}</h2>
            <p className="text-muted mb-4">{t.emptyCartDesc}</p>
            <Link to="/" className="btn btn-danger fw-bold px-4 py-2 d-inline-flex align-items-center gap-2 rounded-pill">
              <FaArrowLeft /> {t.continueShopping}
            </Link>
          </div>
        ) : (
          <div className="row g-4 flex-column-reverse flex-lg-row">
            
            {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
            <div className="col-12 col-lg-8">
              
              {/* Header Checkbox PC */}
              <div className="bg-white rounded-3 shadow-sm p-3 mb-3 d-none d-md-flex align-items-center border">
                <input 
                  type="checkbox" 
                  checked={cartItems.length > 0 && selectedIds.length === cartItems.length}
                  onChange={handleSelectAll}
                  className="form-check-input me-3 mt-0 cursor-pointer" style={{ width: '20px', height: '20px' }}
                />
                <span className="fw-bold flex-grow-1 text-secondary">{t.tableProduct}</span>
                <span className="fw-bold text-center text-secondary" style={{ width: '120px' }}>{t.tablePrice}</span>
                <span className="fw-bold text-center text-secondary" style={{ width: '120px' }}>{t.tableQuantity}</span>
                <span className="fw-bold text-end text-secondary" style={{ width: '120px' }}>{t.tableTotal}</span>
                <span className="fw-bold text-center ms-3 text-secondary" style={{ width: '40px' }}>{t.tableDelete}</span>
              </div>

              {/* Các Item */}
              <div className="d-flex flex-column gap-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-3 shadow-sm p-3 d-flex flex-column flex-md-row align-items-md-center position-relative border">
                    
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="btn btn-link text-danger p-0 position-absolute d-md-none" 
                      style={{ top: '15px', right: '15px' }}
                    >
                      <FaTrash size={18} />
                    </button>

                    <div className="d-flex align-items-center flex-grow-1 mb-3 mb-md-0 pe-4 pe-md-0">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="form-check-input me-3 mt-0 cursor-pointer flex-shrink-0" style={{ width: '20px', height: '20px' }}
                      />
                      <img src={item.image || item.images?.[0] || 'https://via.placeholder.com/60'} alt={item.name} className="border rounded me-3 object-fit-contain p-1" style={{ width: '80px', height: '80px' }} />
                      <div className="fw-bold text-dark lh-sm" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.name}
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between justify-content-md-end gap-md-0">
                      <div className="text-secondary text-md-center d-md-block d-none fw-bold" style={{ width: '120px' }}>
                        {Number(item.price).toLocaleString('vi-VN')} ₫
                      </div>

                      <div className="d-flex align-items-center justify-content-center border rounded bg-light" style={{ width: '110px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} className="btn btn-sm text-secondary px-2 border-0"><FaMinus size={12}/></button>
                        <span className="fw-bold px-2">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="btn btn-sm text-secondary px-2 border-0"><FaPlus size={12}/></button>
                      </div>

                      <div className="fw-bold text-danger text-end ms-md-3 fs-6 fs-md-5" style={{ width: 'auto', minWidth: '100px' }}>
                        {Number(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                      </div>
                      
                      <button onClick={() => removeFromCart(item.id)} className="btn btn-link text-danger p-0 ms-3 d-none d-md-block" style={{ width: '40px' }} title={t.tableDelete}>
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CỘT PHẢI: THANH TỔNG KẾT */}
            <div className="col-12 col-lg-4">
              <div className="cart-summary">
                
                <div className="d-flex justify-content-between align-items-center mb-3 d-lg-none border-bottom pb-2">
                  <label className="d-flex align-items-center cursor-pointer mb-0">
                    <input type="checkbox" checked={cartItems.length > 0 && selectedIds.length === cartItems.length} onChange={handleSelectAll} className="form-check-input me-2 mt-0" style={{ width: '18px', height: '18px' }} />
                    <span className="fw-bold text-dark small">Chọn tất cả</span>
                  </label>
                  <span className="text-secondary small">{selectedIds.length} {t.items}</span>
                </div>

                <div className="d-none d-lg-flex justify-content-between align-items-center mb-3 text-secondary border-bottom pb-2">
                  <span>{t.subtotal} ({selectedIds.length} {t.items}):</span>
                  <span className="fw-bold text-dark">{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-end mb-3">
                  <span className="fw-bold text-dark fs-5">{t.totalSum}</span>
                  <span className="text-danger fw-bold fs-3 lh-1">{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={selectedIds.length === 0}
                  className={`btn w-100 py-2 py-md-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 ${selectedIds.length === 0 ? 'btn-secondary' : 'btn-danger shadow-sm'}`}
                >
                  {t.proceedToCheckout} <FaArrowRight />
                </button>
              </div>
              
              <div className="mobile-spacer"></div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;