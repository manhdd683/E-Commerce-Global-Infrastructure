import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FaShoppingCart, FaMobileAlt, FaHome, FaTshirt, FaFire, FaThLarge, 
  FaBook, FaSpa, FaBasketballBall, FaUtensils, FaBaby
} from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import { CartContext } from '../../context/CartContext'; 
import Footer from '../../components/Common/User/Footer';

// BỘ TỪ ĐIỂN DỊCH THUẬT CHO TRANG CHỦ
const TRANSLATIONS = {
  vi: {
    bannerTitle: "🎉 SIÊU MUA SẮM - CHÀO HÈ 2026!",
    bannerSub: "Hàng ngàn sản phẩm chính hãng đang giảm giá chạm đáy. Miễn phí vận chuyển toàn quốc.",
    categoriesTitle: "DANH MỤC NỔI BẬT",
    catAll: "Tất cả",
    catTech: "Điện tử & Công nghệ",
    catHome: "Nhà cửa & Đời sống",
    catFashion: "Thời trang nam nữ",
    catBook: "Sách",
    catBeauty: "Làm đẹp",
    catSport: "Thể thao",
    catFood: "Thực phẩm",
    catBaby: "Mẹ & Bé",
    suggestionsTitle: "GỢI Ý HÔM NAY",
    loading: "🔄 Đang tải sản phẩm...",
    noProducts: "Không tìm thấy sản phẩm nào trong danh mục này.",
    stockRemaining: "Còn",
    addToCart: "Thêm vào giỏ",
    addSuccessMsg: "🎉 Đã thêm sản phẩm vào giỏ hàng thành công!"
  },
  en: {
    bannerTitle: "🎉 SUPER SHOPPING - SUMMER 2026!",
    bannerSub: "Thousands of authentic products at rock-bottom prices. Free nationwide shipping.",
    categoriesTitle: "FEATURED CATEGORIES",
    catAll: "All",
    catTech: "Electronics & Tech",
    catHome: "Home & Living",
    catFashion: "Fashion",
    catBook: "Books",
    catBeauty: "Beauty",
    catSport: "Sports",
    catFood: "Food",
    catBaby: "Mom & Baby",
    suggestionsTitle: "TODAY'S SUGGESTIONS",
    loading: "🔄 Loading products...",
    noProducts: "No products found in this category.",
    stockRemaining: "Stock",
    addToCart: "Add to cart",
    addSuccessMsg: "🎉 Item added to cart successfully!"
  },
  ja: {
    bannerTitle: "🎉 スーパーショッピング - 2026年夏！",
    bannerSub: "何千もの本物の製品が底値で。全国送料無料。",
    categoriesTitle: "注目のカテゴリー",
    catAll: "すべて",
    catTech: "家電・テクノロジー",
    catHome: "ホーム＆リビング",
    catFashion: "ファッション",
    catBook: "本",
    catBeauty: "美容",
    catSport: "スポーツ",
    catFood: "食品",
    catBaby: "ママ＆ベビー",
    suggestionsTitle: "今日の提案",
    loading: "🔄 製品を読み込んでいます...",
    noProducts: "このカテゴリに製品は見つかりませんでした。",
    stockRemaining: "残り",
    addToCart: "カートに追加",
    addSuccessMsg: "🎉 商品がカートに正常に追加されました！"
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  
  const [searchParams] = useSearchParams(); 
  const searchQuery = searchParams.get('search') || ''; 

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'vi');
  const { addToCart } = useContext(CartContext);
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

  const categories = [
    { id: 'all', name: t.catAll, icon: <FaThLarge size={24} color="#ee4d2d" />, keywords: [] },
    { id: 'electronics', name: t.catTech, icon: <FaMobileAlt size={24} color="#007bff" />, keywords: ['samsung', 'galaxy', 'iphone', 'laptop', 'điện thoại', 'máy tính', 'tablet', 'tai nghe', 'macbook', 'mac'] },
    { id: 'home', name: t.catHome, icon: <FaHome size={24} color="#28a745" />, keywords: ['bát', 'chén', 'sứ', 'nồi', 'chảo', 'bếp', 'bàn', 'ghế'] },
    { id: 'fashion', name: t.catFashion, icon: <FaTshirt size={24} color="#6f42c1" />, keywords: ['áo', 'quần', 'giày', 'dép', 'túi', 'váy', 'thời trang'] },
    { id: 'book', name: t.catBook, icon: <FaBook size={24} color="#fd7e14" />, keywords: ['sách', 'truyện', 'giáo trình', 'tiểu thuyết', 'văn học'] },
    { id: 'beauty', name: t.catBeauty, icon: <FaSpa size={24} color="#e83e8c" />, keywords: ['kem', 'son', 'mỹ phẩm', 'dưỡng da', 'nước hoa'] },
    { id: 'sports', name: t.catSport, icon: <FaBasketballBall size={24} color="#dc3545" />, keywords: ['bóng đá', 'cầu lông', 'gym', 'thể thao', 'vợt'] },
    { id: 'food', name: t.catFood, icon: <FaUtensils size={24} color="#20c997" />, keywords: ['bánh', 'kẹo', 'sữa', 'nước ngọt', 'đồ ăn'] },
    { id: 'baby', name: t.catBaby, icon: <FaBaby size={24} color="#17a2b8" />, keywords: ['sữa', 'tã', 'bỉm', 'đồ chơi trẻ em', 'em bé'] }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/products');
        const allProducts = response.data || [];
        
        // ĐÃ FIX: Chỉ lấy những sản phẩm HỢP LỆ (Không bị Admin Banned)
        const validProducts = allProducts.filter(p => p.moderationStatus !== "Banned");
        
        // Đảo ngược mảng để sản phẩm mới nhất lên đầu
        setProducts(validProducts.reverse());
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();

    const handleLangChange = () => {
      setLanguage(localStorage.getItem('app_lang') || 'vi');
    };
    window.addEventListener('languageChanged', handleLangChange);
    return () => window.removeEventListener('languageChanged', handleLangChange);
  }, []);

  const filteredProducts = products.filter(product => {
    const categoryDef = categories.find(c => c.id === activeCategory);
    const productNameLower = product.name.toLowerCase();
    
    const matchCategory = activeCategory === 'all' || categoryDef.keywords.some(keyword => productNameLower.includes(keyword));
    const matchSearch = productNameLower.includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ backgroundColor: '#fff', paddingBottom: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px' }}>
          <div style={{ 
            background: 'linear-gradient(90deg, #ff416c 0%, #ff4b2b 100%)', 
            borderRadius: '12px', 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: 'white',
            boxShadow: '0 4px 15px rgba(255, 65, 108, 0.3)'
          }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>{t.bannerTitle}</h1>
            <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>{t.bannerSub}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', flex: 1, paddingBottom: '50px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', color: '#333', marginTop: 0, marginBottom: '20px', textTransform: 'uppercase' }}>{t.categoriesTitle}</h2>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (searchQuery) {
                    navigate('/');
                  }
                }}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  width: '120px',
                  opacity: activeCategory === cat.id ? 1 : 0.6,
                  transform: activeCategory === cat.id ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: '60px', height: '60px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '16px', 
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  border: activeCategory === cat.id ? '2px solid #ee4d2d' : '1px solid #eee'
                }}>
                  {cat.icon}
                </div>
                <span style={{ marginTop: '10px', fontSize: '13px', color: '#333', textAlign: 'center', fontWeight: activeCategory === cat.id ? 'bold' : 'normal' }}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', borderBottom: '3px solid #ee4d2d' }}>
            <h2 style={{ color: '#ee4d2d', margin: 0, fontSize: '20px', textTransform: 'uppercase' }}>
              <FaFire style={{ marginRight: '8px', position: 'relative', top: '2px' }} />
              {t.suggestionsTitle}
            </h2>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#888', fontSize: '18px' }}>
              {t.loading}
            </div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '8px', color: '#888' }}>
                  {t.noProducts}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => navigate(`/product/${product.id}`)}
                      style={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(255, 212, 36, 0.9)', color: '#ee4d2d', fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
                      </div>

                      <div style={{ height: '220px', padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #fafafa' }}>
                        <img 
                          src={product.images?.[0] || product.image || "https://via.placeholder.com/200"} 
                          alt={product.name} 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      
                      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h3 style={{ 
                          fontSize: '14px', color: '#333', margin: '0 0 10px 0', fontWeight: 'normal',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px'
                        }}>
                          {product.name}
                        </h3>
                        
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#ee4d2d', fontWeight: 'bold', fontSize: '16px' }}>
                            {Number(product.price).toLocaleString('vi-VN')} ₫
                          </span>
                          <span style={{ fontSize: '12px', color: '#888' }}>
                            {t.stockRemaining} {product.stock}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '0 15px 15px 15px' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); 
                            addToCart(product); 
                            alert(t.addSuccessMsg);
                          }}
                          style={{ 
                            width: '100%', padding: '10px', 
                            backgroundColor: '#ee4d2d', color: 'white', 
                            border: 'none', borderRadius: '4px', 
                            cursor: 'pointer', fontWeight: 'bold',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                          }}
                        >
                          <FaShoppingCart /> {t.addToCart}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default HomePage;