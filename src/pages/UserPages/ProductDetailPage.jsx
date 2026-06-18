import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaArrowLeft, FaCheck, FaPlayCircle, FaCopy, FaFacebook, FaStore, FaComments, FaHandshake } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  vi: {
    back: "Quay lại", share: "Chia sẻ nhận hoa hồng", commissionMsg: "Nhận ngay 10% hoa hồng khi có người mua hàng qua link liên kết của bạn!",
    copied: "Đã sao chép Link Affiliate!", copyLink: "Copy Link Liên Kết", shareFb: "Chia sẻ Facebook", status: "Tình trạng:", inStock: "Còn",
    items: "sản phẩm", outOfStock: "Hết hàng", addToCart: "THÊM VÀO GIỎ", buyNow: "MUA NGAY", temporarilyOut: "TẠM HẾT HÀNG", online: "Đang Online",
    chatNow: "Chat Ngay", viewShop: "Xem Shop", productDetails: "CHI TIẾT SẢN PHẨM", youMayLike: "CÓ THỂ BẠN CŨNG THÍCH", sold: "Đã bán",
    loading: "🔄 Đang tải thông tin sản phẩm...", notFound: "Sản phẩm không tồn tại!"
  },
  en: {
    back: "Back", share: "Share to earn commission", commissionMsg: "Get 10% commission when someone buys through your affiliate link!",
    copied: "Affiliate Link Copied!", copyLink: "Copy Affiliate Link", shareFb: "Share on Facebook", status: "Status:", inStock: "In stock:",
    items: "items", outOfStock: "Out of stock", addToCart: "ADD TO CART", buyNow: "BUY NOW", temporarilyOut: "OUT OF STOCK", online: "Online",
    chatNow: "Chat Now", viewShop: "View Shop", productDetails: "PRODUCT DETAILS", youMayLike: "YOU MAY ALSO LIKE", sold: "Sold",
    loading: "🔄 Loading product info...", notFound: "Product not found!"
  },
  ja: {
    back: "戻る", share: "シェアして報酬を獲得", commissionMsg: "アフィリエイトリンク経由で購入されると10％の報酬を獲得できます！",
    copied: "リンクをコピーしました！", copyLink: "リンクをコピー", shareFb: "Facebookでシェア", status: "状態:", inStock: "残り",
    items: "個", outOfStock: "在庫切れ", addToCart: "カートに追加", buyNow: "今すぐ購入", temporarilyOut: "在庫切れ", online: "オンライン",
    chatNow: "チャット", viewShop: "ショップを見る", productDetails: "製品詳細", youMayLike: "おすすめ", sold: "販売済み",
    loading: "🔄 読み込み中...", notFound: "製品が見つかりません！"
  }
};

const ProductDetailPage = () => {
  // --- CONTEXT & ROUTING ---
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  
  // --- STATE ---
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

  // --- EFFECTS ---
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

  // --- HANDLERS ---
  const handleBuyNow = () => {
    if (product.stock > 0) {
      addToCart(product);
      navigate('/checkout');
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(affiliateUrl)
        .then(() => triggerCopySuccess())
        .catch(() => runFallbackCopy(affiliateUrl));
    } else {
      runFallbackCopy(affiliateUrl);
    }
  };

  const runFallbackCopy = (textToCopy) => {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      triggerCopySuccess();
    } catch (error) {
      alert("Trình duyệt chặn quyền sao chép tự động!");
    }
    textArea.remove();
  };

  const triggerCopySuccess = () => {
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

  const isVideo = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('tiktok.com'));

  const getEmbedUrl = (url) => {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
    return url;
  };

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('openChatWithSeller', { 
        detail: { 
          sellerId: product.sellerId || product.seller || 'NBH', 
          productName: product.name, price: product.price, image: product.images?.[0] || product.image
        } 
    }));
  };

  // --- RENDER GUARDS ---
  if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px' }}>{t.loading}</div>;
  if (!product) return <div style={{ textAlign: 'center', marginTop: '50px' }}>{t.notFound}</div>;

  const mediaList = [];
  if (product.video) mediaList.push({ type: 'video', url: product.video });
  if (product.images?.length > 0) product.images.forEach(img => mediaList.push({ type: 'image', url: img }));
  else if (product.image) mediaList.push({ type: 'image', url: product.image });

  // --- MAIN UI ---
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* HEADER ACTIONS */}
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#ee4d2d', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '15px' }}>
        <FaArrowLeft /> {t.back}
      </button>

      {/* PRODUCT CONTENT */}
      <div style={{ display: 'flex', gap: '40px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        
        {/* MEDIA SECTION */}
        <div style={{ flex: '0 0 450px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ width: '100%', height: '450px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' }}>
            {isVideo(mainMedia) ? (
              <iframe width="100%" height="100%" src={getEmbedUrl(mainMedia)} title="Product Video" frameBorder="0" allowFullScreen></iframe>
            ) : (
              <img src={mainMedia || "https://via.placeholder.com/450"} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            {mediaList.map((item, idx) => (
              <div key={idx} onClick={() => setMainMedia(item.url)} style={{ width: '80px', height: '80px', flexShrink: 0, border: mainMedia === item.url ? '2px solid #ee4d2d' : '1px solid #eee', borderRadius: '6px', cursor: 'pointer', overflow: 'hidden', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                {item.type === 'video' ? (
                  <>
                    <img src={mediaList.find(m => m.type === 'image')?.url || "https://via.placeholder.com/80"} alt="video" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                    <FaPlayCircle size={24} color="white" style={{ position: 'absolute' }} />
                  </>
                ) : (
                  <img src={item.url} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', color: '#333', margin: '0 0 15px 0', lineHeight: '1.4' }}>{product.name}</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
            <p style={{ fontSize: '32px', color: '#ee4d2d', fontWeight: 'bold', margin: 0 }}>
              {Number(product.price).toLocaleString('vi-VN')} <span style={{ fontSize: '24px', textDecoration: 'underline' }}>đ</span>
            </p>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowShareMenu(!showShareMenu)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 15px', backgroundColor: '#fff8f0', color: '#fd7e14', border: '1px dashed #fd7e14', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                <FaHandshake size={16} /> {t.share}
              </button>

              {showShareMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '280px', zIndex: 10, padding: '15px' }}>
                  <div style={{ fontSize: '13px', color: '#555', marginBottom: '10px', lineHeight: '1.5' }}>
                    <span dangerouslySetInnerHTML={{__html: t.commissionMsg.replace('10%', '<strong style="color: #fd7e14">10%</strong>')}} />
                  </div>
                  <div onClick={handleCopyLink} style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: isCopied ? '#28a745' : '#fd7e14', color: 'white', borderRadius: '6px', fontWeight: 'bold', transition: '0.2s', marginBottom: '10px' }}>
                    {isCopied ? <FaCheck /> : <FaCopy />}
                    <span>{isCopied ? t.copied : t.copyLink}</span>
                  </div>
                  <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShowShareMenu(false)} style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textDecoration: 'none', color: 'white', backgroundColor: '#1877F2', borderRadius: '6px', fontWeight: 'bold' }}>
                    <FaFacebook size={18} />
                    <span>{t.shareFb}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          <p style={{ color: '#555', marginBottom: '30px', fontSize: '15px' }}>
            {t.status} <strong style={{ color: product.stock > 0 ? '#28a745' : '#d70018' }}>{product.stock > 0 ? `${t.inStock} ${product.stock} ${t.items}` : t.outOfStock}</strong>
          </p>

          {/* CHECKOUT BUTTONS */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <button 
              onClick={() => addToCart(product)} 
              disabled={product.stock === 0} 
              style={{ flex: 1, padding: '15px 0', backgroundColor: product.stock > 0 ? '#ffedea' : '#f5f5f5', color: product.stock > 0 ? '#ee4d2d' : '#888', border: product.stock > 0 ? '1px solid #ee4d2d' : '1px solid #ccc', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: product.stock > 0 ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            >
              <FaShoppingCart size={20} /> {product.stock > 0 ? t.addToCart : t.temporarilyOut}
            </button>

            <button 
              onClick={handleBuyNow} 
              disabled={product.stock === 0} 
              style={{ flex: 1, padding: '15px 0', backgroundColor: product.stock > 0 ? '#ee4d2d' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: product.stock > 0 ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {product.stock > 0 ? t.buyNow : t.temporarilyOut}
            </button>
          </div>

          {/* SHOP INFO */}
          <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#fcfcfc' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ffe6e6', color: '#ee4d2d', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold' }}>{shopDisplayName[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{shopDisplayName}</div>
              <div style={{ fontSize: '13px', color: '#28a745', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}><span style={{width: '8px', height: '8px', backgroundColor: '#28a745', borderRadius: '50%', display: 'inline-block'}}></span> {t.online}</div>
            </div>
            <button onClick={handleOpenChat} style={{ padding: '10px 20px', border: '1px solid #ee4d2d', backgroundColor: '#fff0f6', color: '#ee4d2d', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><FaComments size={18}/> {t.chatNow}</button>
            <button onClick={() => navigate(`/shop/${product.sellerId || product.seller || 'NBH'}`)} style={{ padding: '10px 20px', border: '1px solid #ddd', backgroundColor: 'white', color: '#555', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><FaStore size={18}/> {t.viewShop}</button>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>{t.productDetails}</h3>
            <div style={{ color: '#555', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>{product.description}</div>
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '20px', color: '#ee4d2d', textTransform: 'uppercase', marginBottom: '20px', borderLeft: '4px solid #ee4d2d', paddingLeft: '10px' }}>{t.youMayLike}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {recommendations.map(item => (
              <div key={item.id} onClick={() => navigate(`/product/${item.id}`)} style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <img src={item.images?.[0] || item.image || "https://via.placeholder.com/200"} alt={item.name} style={{ width: '100%', height: '200px', objectFit: 'contain', padding: '10px' }} />
                <div style={{ padding: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#333', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px' }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', color: '#ee4d2d', fontWeight: 'bold' }}>{Number(item.price).toLocaleString('vi-VN')} ₫</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{t.sold} {Math.floor(Math.random() * 500) + 10}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;