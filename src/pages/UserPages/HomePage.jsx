import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaShoppingCart, FaMobileAlt, FaHome, FaTshirt, FaFire, FaThLarge, FaBook, FaSpa, FaBasketballBall, FaUtensils, FaBaby } from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import { CartContext } from '../../context/CartContext'; 
import Footer from '../../components/Common/User/Footer';

const TRANSLATIONS = {
  vi: { bannerTitle: "🎉 SIÊU MUA SẮM - CHÀO HÈ 2026!", bannerSub: "Hàng ngàn sản phẩm chính hãng đang giảm giá chạm đáy. Miễn phí vận chuyển toàn quốc.", categoriesTitle: "DANH MỤC NỔI BẬT", catAll: "Tất cả", catTech: "Điện tử & Công nghệ", catHome: "Nhà cửa & Đời sống", catFashion: "Thời trang nam nữ", catBook: "Sách", catBeauty: "Làm đẹp", catSport: "Thể thao", catFood: "Thực phẩm", catBaby: "Mẹ & Bé", suggestionsTitle: "GỢI Ý HÔM NAY", loading: "🔄 Đang tải sản phẩm...", noProducts: "Không tìm thấy sản phẩm nào trong danh mục này.", stockRemaining: "Còn", addToCart: "Thêm vào giỏ", addSuccessMsg: "🎉 Đã thêm sản phẩm vào giỏ hàng thành công!" },
  en: { bannerTitle: "🎉 SUPER SHOPPING - SUMMER 2026!", bannerSub: "Thousands of authentic products at rock-bottom prices. Free nationwide shipping.", categoriesTitle: "FEATURED CATEGORIES", catAll: "All", catTech: "Electronics & Tech", catHome: "Home & Living", catFashion: "Fashion", catBook: "Books", catBeauty: "Beauty", catSport: "Sports", catFood: "Food", catBaby: "Mom & Baby", suggestionsTitle: "TODAY'S SUGGESTIONS", loading: "🔄 Loading products...", noProducts: "No products found in this category.", stockRemaining: "Stock", addToCart: "Add to cart", addSuccessMsg: "🎉 Item added to cart successfully!" },
  ja: { bannerTitle: "🎉 スーパーショッピング - 2026年夏！", bannerSub: "何千もの本物の製品が底値で。全国送料無料。", categoriesTitle: "注目のカテゴリー", catAll: "すべて", catTech: "家電・テクノロジー", catHome: "ホーム＆リビング", catFashion: "ファッション", catBook: "本", catBeauty: "美容", catSport: "スポーツ", catFood: "食品", catBaby: "ママ＆ベビー", suggestionsTitle: "今日の提案", loading: "🔄 製品を読み込んでいます...", noProducts: "このカテゴリに製品は見つかりませんでした。", stockRemaining: "残り", addToCart: "カートに追加", addSuccessMsg: "🎉 商品がカートに正常に追加されました！" }
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
        const validProducts = allProducts.filter(p => p.moderationStatus !== "Banned");
        setProducts(validProducts.reverse());
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();

    const handleLangChange = () => setLanguage(localStorage.getItem('app_lang') || 'vi');
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
    <div className="d-flex flex-column min-vh-100 bg-light">
      
      {/* BANNER CHIẾN DỊCH */}
      <div className="bg-white pb-4">
        <div className="container pt-4">
          <div className="rounded-4 p-4 p-md-5 text-center text-white shadow" style={{ background: 'linear-gradient(90deg, #ff416c 0%, #ff4b2b 100%)' }}>
            <h1 className="fs-2 mb-2 fw-bold">{t.bannerTitle}</h1>
            <p className="fs-6 mb-0 opacity-75">{t.bannerSub}</p>
          </div>
        </div>
      </div>

      <div className="container flex-grow-1 pb-5">
        
        {/* DANH MỤC NỔI BẬT */}
        <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm mt-4">
          <h2 className="fs-5 text-dark mb-4 text-uppercase fw-bold text-center text-md-start">{t.categoriesTitle}</h2>
          <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-3">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => { setActiveCategory(cat.id); if (searchQuery) navigate('/'); }}
                className="d-flex flex-column align-items-center cursor-pointer"
                style={{ width: '90px', opacity: activeCategory === cat.id ? 1 : 0.6, transform: activeCategory === cat.id ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s' }}
              >
                <div className="rounded-4 d-flex justify-content-center align-items-center bg-light" style={{ width: '60px', height: '60px', border: activeCategory === cat.id ? '2px solid #ee4d2d' : '1px solid #eee' }}>
                  {cat.icon}
                </div>
                <span className={`mt-2 text-center small ${activeCategory === cat.id ? 'fw-bold text-danger' : 'text-dark'}`}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GỢI Ý SẢN PHẨM HÔM NAY */}
        <div className="mt-5">
          <div className="d-flex align-items-center gap-2 mb-4 bg-white p-3 rounded-3 border-bottom border-danger border-3 shadow-sm">
            <FaFire className="text-danger fs-4" />
            <h2 className="text-danger m-0 fs-5 fw-bold text-uppercase">{t.suggestionsTitle}</h2>
          </div>

          {isLoading ? (
            <div className="text-center py-5 text-secondary fs-5">{t.loading}</div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-3 text-secondary">{t.noProducts}</div>
              ) : (
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                  {filteredProducts.map(product => (
                    <div className="col" key={product.id}>
                      <div 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="bg-white rounded h-100 shadow-sm border d-flex flex-column cursor-pointer"
                        style={{ transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'none'}
                      >
                        {/* Ảnh sản phẩm */}
                        <div className="position-relative d-flex justify-content-center align-items-center border-bottom p-2" style={{ height: '200px' }}>
                          <img src={product.images?.[0] || product.image || "https://via.placeholder.com/200"} alt={product.name} className="img-fluid" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        
                        {/* Nội dung Card */}
                        <div className="p-3 d-flex flex-column flex-grow-1">
                          <h3 className="fs-6 text-dark mb-2 fw-normal" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px' }}>
                            {product.name}
                          </h3>
                          <div className="mt-auto d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-center mb-3 gap-1">
                            <span className="text-danger fw-bold fs-6">{Number(product.price).toLocaleString('vi-VN')} ₫</span>
                            <span className="small text-muted">{t.stockRemaining} {product.stock}</span>
                          </div>
                          
                          {/* Nút thêm vào giỏ */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product); alert(t.addSuccessMsg); }}
                            className="btn btn-danger w-100 fw-bold d-flex justify-content-center align-items-center gap-2 mt-auto"
                            style={{ backgroundColor: '#ee4d2d', border: 'none' }}
                          >
                            <FaShoppingCart /> <span className="small">{t.addToCart}</span>
                          </button>
                        </div>
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