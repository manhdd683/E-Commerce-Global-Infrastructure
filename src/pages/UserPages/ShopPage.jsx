import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaBoxOpen, FaComments, FaMapMarkerAlt, FaShoppingCart } from 'react-icons/fa';
import apiClient from '../../api/apiClient';

const PRODUCT_API_URL = "https://6a296dd8f59cb8f65f1d25ea.mockapi.io/products";
const ORDER_API_URL = "https://6a296dd8f59cb8f65f1d25ea.mockapi.io/orders";

const ShopPage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  
  const [shopProducts, setShopProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [shopProfile, setShopProfile] = useState({
    shopName: sellerId,
    rating: "4.8",
    totalSales: 0, 
    responseRate: "95",
    joined: "2 năm trước",
    address: "Hà Nội, Việt Nam"
  });

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setIsLoading(true);

        const [productsRes, ordersRes] = await Promise.all([
          apiClient.get(PRODUCT_API_URL).catch(() => ({ data: [] })),
          apiClient.get(ORDER_API_URL).catch(() => ({ data: [] }))
        ]);

        const allProducts = productsRes.data || [];
        const filteredProducts = allProducts.filter(p => 
          (p.sellerId === sellerId || p.seller === sellerId) && 
          p.moderationStatus !== "Banned"
        );
        setShopProducts(filteredProducts.reverse());

        const allOrders = ordersRes.data || [];
        const myCompletedOrders = allOrders.filter(o => 
          (o.sellerId === sellerId || o.seller === sellerId) && o.status === 'Completed'
        );

        let realTotalSales = 0;
        myCompletedOrders.forEach(order => {
          order.items?.forEach(item => {
            realTotalSales += Number(item.quantity || 0);
          });
        });

        const savedProfile = localStorage.getItem(`seller_profile_${sellerId}`);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setShopProfile({
            shopName: parsed.shopName || sellerId,
            rating: parsed.rating || "4.8",
            totalSales: realTotalSales, 
            responseRate: parsed.responseRate || "95",
            joined: parsed.joined || "2 năm trước",
            address: parsed.address || "Hà Nội, Việt Nam"
          });
        } else {
          setShopProfile(prev => ({
            ...prev,
            totalSales: realTotalSales
          }));
        }

      } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu thời gian thực cho Shop:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShopData();
  }, [sellerId]);

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('openChatWithSeller', { 
        detail: { sellerId: sellerId, productName: "bên cửa hàng mình" } 
    }));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      
      {/* 1. KHU VỰC THÔNG TIN SHOP (HEADER) */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', display: 'flex', gap: '40px', boxShadow: '0 2px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', borderRight: '1px solid #eee', paddingRight: '40px', minWidth: '200px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#ffe6e6', color: '#ee4d2d', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', fontWeight: 'bold', border: '3px solid #fce4e4' }}>
            {shopProfile.shopName[0].toUpperCase()}
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#333', textAlign: 'center' }}>{shopProfile.shopName}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleOpenChat} style={{ padding: '8px 15px', backgroundColor: 'white', color: '#ee4d2d', border: '1px solid #ee4d2d', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FaComments /> Chat Ngay
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555' }}>
            <FaBoxOpen color="#007bff" size={20} /> <span>Sản phẩm trong kho: <strong style={{ color: '#ee4d2d' }}>{shopProducts.length}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555' }}>
            <FaStar color="#ffc107" size={20} /> <span>Đánh giá shop: <strong>{shopProfile.rating}</strong> (/5.0)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555' }}>
            <FaComments color="#28a745" size={20} /> <span>Tỉ lệ phản hồi chat: <strong>{shopProfile.responseRate}%</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555' }}>
            <FaShoppingCart color="#17a2b8" size={20} /> <span>Số lượng đã bán : <strong style={{ color: '#28a745', fontSize: '16px' }}>{shopProfile.totalSales.toLocaleString('vi-VN')}</strong> sản phẩm</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#555' }}>
            <FaMapMarkerAlt color="#dc3545" size={20} /> <span>Địa điểm: <strong>{shopProfile.address}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC SẢN PHẨM CỦA SHOP */}
      <h3 style={{ borderBottom: '2px solid #ee4d2d', display: 'inline-block', paddingBottom: '10px', color: '#333', textTransform: 'uppercase' }}>Tất cả sản phẩm</h3>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>🔄 Đang đồng bộ sản phẩm từ hệ thống...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginTop: '20px' }}>
          {shopProducts.length === 0 ? (
            <div style={{ gridColumn: 'span 5', textAlign: 'center', color: '#888', padding: '40px' }}>Shop này chưa có sản phẩm nào hợp lệ để bán.</div>
          ) : (
            shopProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.id}`)}
                style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s', border: '1px solid #f0f0f0' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <img src={product.images?.[0] || product.image || "https://via.placeholder.com/200"} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'contain', marginBottom: '10px' }} />
                <div style={{ fontSize: '14px', color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px', lineHeight: '1.4' }}>{product.name}</div>
                <div style={{ color: '#ee4d2d', fontWeight: 'bold', marginTop: '10px', fontSize: '16px' }}>{Number(product.price).toLocaleString('vi-VN')} ₫</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ShopPage;