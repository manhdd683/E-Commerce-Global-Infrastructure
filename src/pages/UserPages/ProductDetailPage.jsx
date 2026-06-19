import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaArrowLeft, FaCheck, FaPlayCircle, FaCopy, FaFacebook, FaStore, FaComments, FaHandshake } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

const TRANSLATIONS = {
  vi: { back: "Quay lại", share: "Chia sẻ nhận hoa hồng", commissionMsg: "Nhận ngay 10% hoa hồng khi có người mua hàng qua link liên kết của bạn!", copied: "Đã sao chép Link Affiliate!", copyLink: "Copy Link Liên Kết", shareFb: "Chia sẻ Facebook", status: "Tình trạng:", inStock: "Còn", items: "sản phẩm", outOfStock: "Hết hàng", addToCart: "THÊM VÀO GIỎ", buyNow: "MUA NGAY", temporarilyOut: "TẠM HẾT HÀNG", online: "Đang Online", chatNow: "Chat Ngay", viewShop: "Xem Shop", productDetails: "CHI TIẾT SẢN PHẨM", youMayLike: "CÓ THỂ BẠN CŨNG THÍCH", sold: "Đã bán", loading: "🔄 Đang tải thông tin sản phẩm...", notFound: "Sản phẩm không tồn tại!" },
  en: { back: "Back", share: "Share to earn commission", commissionMsg: "Get 10% commission when someone buys through your affiliate link!", copied: "Affiliate Link Copied!", copyLink: "Copy Affiliate Link", shareFb: "Share on Facebook", status: "Status:", inStock: "In stock:", items: "items", outOfStock: "Out of stock", addToCart: "ADD TO CART", buyNow: "BUY NOW", temporarilyOut: "OUT OF STOCK", online: "Online", chatNow: "Chat Now", viewShop: "View Shop", productDetails: "PRODUCT DETAILS", youMayLike: "YOU MAY ALSO LIKE", sold: "Sold", loading: "🔄 Loading product info...", notFound: "Product not found!" },
  ja: { back: "戻る", share: "シェアして報酬を獲得", commissionMsg: "アフィリエイトリンク経由で購入されると10％の報酬を獲得できます！", copied: "リンクをコピーしました！", copyLink: "リンクをコピー", shareFb: "Facebookでシェア", status: "状態:", inStock: "残り", items: "個", outOfStock: "在庫切れ", addToCart: "カートに追加", buyNow: "今すぐ購入", temporarilyOut: "在庫切れ", online: "オンライン", chatNow: "チャット", viewShop: "ショップを見る", productDetails: "製品詳細", youMayLike: "おすすめ", sold: "販売済み", loading: "🔄 読み込み中...", notFound: "製品が見つかりません！" }
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [mainMedia, setMainMedia] = useState(null);
  const [shopDisplayName, setShopDisplayName] = useState('NBH');
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'vi');

  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;
  const affiliateUrl = `${window.location.origin}/product/${id}?aff=${user?.username || user?.id || 'guest'}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateUrl)}`;

  useEffect(() => {
    const handleLangChange = () => setLanguage(localStorage.getItem('app_lang') || 'vi');
    window.addEventListener('languageChanged', handleLangChange);
    return () => window.removeEventListener('languageChanged', handleLangChange);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/products/${id}`);
        const data = response.data;
        setProduct(data);
        setMainMedia(data.images?.[0] || data.image);

        const targetSellerId = data.sellerId || data.seller || 'NBH';
        const savedProfile = localStorage.getItem(`seller_profile_${targetSellerId}`);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.shopName) setShopDisplayName(parsed.shopName);
        } else {
          setShopDisplayName(targetSellerId);
        }

        const allProdsRes = await apiClient.get(`/products`);
        const allProds = allProdsRes.data || [];
        const filteredProds = allProds.filter(p => p.id !== id);
        const shuffled = filteredProds.sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 4));

      } catch (error) {
        console.error(error);
      } finally { 
        setIsLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0); 
  }, [id]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const affCode = urlParams.get('aff');
    
    if (affCode && affCode !== user?.username && affCode !== user?.id) {
      localStorage.setItem('referred_by', affCode);
      const clickedKey = `clicked_${affCode}_${id}`;
      
      if (!sessionStorage.getItem(clickedKey)) {
        const statsKey = `affiliate_stats_${affCode}`;
        let currentStats = JSON.parse(localStorage.getItem(statsKey)) || { clicks: 0, orders: 0, totalCommission: 0, history: [] };
        currentStats.clicks += 1;
        localStorage.setItem(statsKey, JSON.stringify(currentStats));
        sessionStorage.setItem(clickedKey, 'true'); 
      }
    }
  }, [id, user]);

  const handleBuyNow = () => {
    if (product.stock > 0) {
      addToCart(product);
      navigate('/checkout');
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(affiliateUrl).then(() => triggerCopySuccess()).catch(() => runFallbackCopy(affiliateUrl));
    } else {
      runFallbackCopy(affiliateUrl);
    }
  };

  const runFallbackCopy = (textToCopy) => {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { document.execCommand('copy'); triggerCopySuccess(); } 
    catch (error) { alert("Trình duyệt chặn quyền sao chép tự động!"); }
    textArea.remove();
  };

  const triggerCopySuccess = () => {
    setIsCopied(true);
    setTimeout(() => { setIsCopied(false); setShowShareMenu(false); }, 2000);
  };

  const isVideo = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('tiktok.com'));

  const getEmbedUrl = (url) => {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
    return url;
  };

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('openChatWithSeller', { 
        detail: { sellerId: product.sellerId || product.seller || 'NBH', productName: product.name, price: product.price, image: product.images?.[0] || product.image } 
    }));
  };

  if (isLoading) return <div className="text-center mt-5 fs-5">{t.loading}</div>;
  if (!product) return <div className="text-center mt-5 fs-5">{t.notFound}</div>;

  const mediaList = [];
  if (product.video) mediaList.push({ type: 'video', url: product.video });
  if (product.images?.length > 0) product.images.forEach(img => mediaList.push({ type: 'image', url: img }));
  else if (product.image) mediaList.push({ type: 'image', url: product.image });

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <div className="container py-4">
        
        <button onClick={() => navigate(-1)} className="btn btn-link text-danger text-decoration-none p-0 mb-4 fw-bold d-flex align-items-center gap-2">
          <FaArrowLeft /> {t.back}
        </button>

        {/* KHU VỰC CHI TIẾT SẢN PHẨM CHÍNH */}
        <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm mb-5">
          <div className="row g-4 g-md-5">
            
            {/* Cột Trái: Hình Ảnh/Video */}
            <div className="col-12 col-md-5">
              <div className="bg-light rounded overflow-hidden d-flex justify-content-center align-items-center mb-3" style={{ height: '400px', border: '1px solid #eee' }}>
                {isVideo(mainMedia) ? (
                  <iframe width="100%" height="100%" src={getEmbedUrl(mainMedia)} title="Product Video" frameBorder="0" allowFullScreen></iframe>
                ) : (
                  <img src={mainMedia || "https://via.placeholder.com/450"} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>

              {/* Thumbnails */}
              <div className="d-flex gap-2 overflow-auto pb-2">
                {mediaList.map((item, idx) => (
                  <div 
                    key={idx} onClick={() => setMainMedia(item.url)} 
                    className="position-relative cursor-pointer flex-shrink-0 rounded overflow-hidden"
                    style={{ width: '70px', height: '70px', border: mainMedia === item.url ? '2px solid #ee4d2d' : '1px solid #eee', backgroundColor: '#000' }}
                  >
                    {item.type === 'video' ? (
                      <div className="w-100 h-100 d-flex justify-content-center align-items-center">
                        <img src={mediaList.find(m => m.type === 'image')?.url || "https://via.placeholder.com/80"} alt="video" className="position-absolute w-100 h-100" style={{ objectFit: 'cover', opacity: 0.5 }} />
                        <FaPlayCircle size={24} color="white" className="position-relative" />
                      </div>
                    ) : (
                      <img src={item.url} alt={`thumb-${idx}`} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cột Phải: Thông tin & Thao tác */}
            <div className="col-12 col-md-7">
              <h1 className="fs-4 text-dark mb-3 lh-base">{product.name}</h1>
              
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom position-relative">
                <div className="fs-2 fw-bold text-danger">
                  {Number(product.price).toLocaleString('vi-VN')} <span className="fs-4 text-decoration-underline">đ</span>
                </div>

                <div className="position-relative">
                  <button onClick={() => setShowShareMenu(!showShareMenu)} className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-2" style={{ backgroundColor: '#fff8f0', color: '#fd7e14', border: '1px dashed #fd7e14' }}>
                    <FaHandshake size={16} /> <span className="d-none d-sm-inline">{t.share}</span>
                  </button>

                  {showShareMenu && (
                    <div className="position-absolute bg-white border rounded shadow p-3" style={{ top: '100%', right: 0, marginTop: '8px', width: '280px', zIndex: 1050 }}>
                      <p className="small text-muted mb-3" dangerouslySetInnerHTML={{__html: t.commissionMsg.replace('10%', '<strong class="text-warning">10%</strong>')}}></p>
                      <div onClick={handleCopyLink} className={`btn w-100 mb-2 fw-bold text-white ${isCopied ? 'bg-success' : 'bg-warning'} d-flex justify-content-center align-items-center gap-2`}>
                        {isCopied ? <FaCheck /> : <FaCopy />} {isCopied ? t.copied : t.copyLink}
                      </div>
                      <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShowShareMenu(false)} className="btn w-100 fw-bold text-white d-flex justify-content-center align-items-center gap-2" style={{ backgroundColor: '#1877F2' }}>
                        <FaFacebook size={18} /> {t.shareFb}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-secondary mb-4">
                {t.status} <strong className={product.stock > 0 ? 'text-success' : 'text-danger'}>{product.stock > 0 ? `${t.inStock} ${product.stock} ${t.items}` : t.outOfStock}</strong>
              </p>

              {/* Nút Mua Hàng */}
              <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
                <button 
                  onClick={() => addToCart(product)} disabled={product.stock === 0} 
                  className={`btn w-100 py-3 fw-bold d-flex justify-content-center align-items-center gap-2 ${product.stock > 0 ? 'btn-outline-danger' : 'btn-secondary'}`}
                  style={{ backgroundColor: product.stock > 0 ? '#ffedea' : '#f5f5f5' }}
                >
                  <FaShoppingCart size={20} /> {product.stock > 0 ? t.addToCart : t.temporarilyOut}
                </button>
                <button 
                  onClick={handleBuyNow} disabled={product.stock === 0} 
                  className={`btn w-100 py-3 fw-bold text-white ${product.stock > 0 ? 'btn-danger' : 'btn-secondary'}`}
                >
                  {product.stock > 0 ? t.buyNow : t.temporarilyOut}
                </button>
              </div>

              {/* Thông tin Shop */}
              <div className="bg-light p-3 rounded border mb-4 d-flex flex-column flex-sm-row align-items-center gap-3">
                <div className="rounded-circle d-flex justify-content-center align-items-center fw-bold fs-4" style={{ width: '60px', height: '60px', backgroundColor: '#ffe6e6', color: '#ee4d2d' }}>
                  {shopDisplayName[0].toUpperCase()}
                </div>
                <div className="flex-grow-1 text-center text-sm-start">
                  <div className="fs-5 fw-bold text-dark">{shopDisplayName}</div>
                  <div className="small text-success d-flex align-items-center justify-content-center justify-content-sm-start gap-1 mt-1">
                    <span className="rounded-circle bg-success" style={{ width: '8px', height: '8px' }}></span> {t.online}
                  </div>
                </div>
                <div className="d-flex gap-2 w-100 w-sm-auto justify-content-center">
                  <button onClick={handleOpenChat} className="btn btn-outline-danger fw-bold d-flex align-items-center gap-1"><FaComments /> {t.chatNow}</button>
                  <button onClick={() => navigate(`/shop/${product.sellerId || product.seller || 'NBH'}`)} className="btn btn-outline-secondary fw-bold d-flex align-items-center gap-1 bg-white"><FaStore /> {t.viewShop}</button>
                </div>
              </div>

              {/* Chi tiết sản phẩm */}
              <div>
                <h3 className="fs-5 text-dark border-bottom pb-2 mb-3">{t.productDetails}</h3>
                <div className="text-secondary" style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{product.description}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SẢN PHẨM GỢI Ý */}
        {recommendations.length > 0 && (
          <div className="mt-5">
            <h2 className="fs-5 text-danger text-uppercase mb-4 border-start border-danger border-4 ps-2">{t.youMayLike}</h2>
            <div className="row row-cols-2 row-cols-md-4 g-3">
              {recommendations.map(item => (
                <div key={item.id} className="col">
                  <div 
                    onClick={() => navigate(`/product/${item.id}`)} 
                    className="bg-white rounded h-100 shadow-sm border cursor-pointer"
                    style={{ transition: 'transform 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} 
                    onMouseOut={e => e.currentTarget.style.transform = 'none'}
                  >
                    <img src={item.images?.[0] || item.image || "https://via.placeholder.com/200"} alt={item.name} className="w-100 p-2" style={{ height: '200px', objectFit: 'contain' }} />
                    <div className="p-3">
                      <div className="text-dark mb-2" style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px' }}>{item.name}</div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-danger fw-bold">{Number(item.price).toLocaleString('vi-VN')} ₫</span>
                        <span className="text-muted small">{t.sold} {Math.floor(Math.random() * 500) + 10}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPage;