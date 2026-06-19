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
    <div className="container py-4 py-md-5">
      
      {/* 1. KHU VỰC THÔNG TIN SHOP (HEADER) */}
      <div className="bg-white rounded-3 p-4 shadow-sm mb-4 mb-md-5">
        <div className="row align-items-center gap-4 gap-md-0">
          
          {/* Ảnh đại diện & Nút Chat */}
          <div className="col-12 col-md-4 col-lg-3 d-flex flex-column align-items-center text-center border-end-md pe-md-4">
            <div 
              className="rounded-circle d-flex justify-content-center align-items-center fw-bold mb-3" 
              style={{ width: '100px', height: '100px', backgroundColor: '#ffe6e6', color: '#ee4d2d', fontSize: '40px', border: '3px solid #fce4e4' }}
            >
              {shopProfile.shopName[0].toUpperCase()}
            </div>
            <h2 className="fs-5 text-dark fw-bold mb-3 text-break">{shopProfile.shopName}</h2>
            <button 
              onClick={handleOpenChat} 
              className="btn btn-outline-danger fw-bold d-flex align-items-center gap-2 px-4"
            >
              <FaComments /> Chat Ngay
            </button>
          </div>

          {/* Các chỉ số thống kê */}
          <div className="col-12 col-md-8 col-lg-9 ps-md-4">
            <div className="row g-3">
              <div className="col-12 col-sm-6 d-flex align-items-center gap-2 text-secondary">
                <FaBoxOpen className="text-primary fs-5" /> 
                <span>Sản phẩm trong kho: <strong className="text-danger">{shopProducts.length}</strong></span>
              </div>
              <div className="col-12 col-sm-6 d-flex align-items-center gap-2 text-secondary">
                <FaStar className="text-warning fs-5" /> 
                <span>Đánh giá shop: <strong>{shopProfile.rating}</strong> (/5.0)</span>
              </div>
              <div className="col-12 col-sm-6 d-flex align-items-center gap-2 text-secondary">
                <FaComments className="text-success fs-5" /> 
                <span>Tỉ lệ phản hồi chat: <strong>{shopProfile.responseRate}%</strong></span>
              </div>
              <div className="col-12 col-sm-6 d-flex align-items-center gap-2 text-secondary">
                <FaShoppingCart className="text-info fs-5" /> 
                <span>Đã bán: <strong className="text-success fs-6">{shopProfile.totalSales.toLocaleString('vi-VN')}</strong> sản phẩm</span>
              </div>
              <div className="col-12 col-sm-6 d-flex align-items-center gap-2 text-secondary">
                <FaMapMarkerAlt className="text-danger fs-5" /> 
                <span>Địa điểm: <strong>{shopProfile.address}</strong></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. KHU VỰC SẢN PHẨM CỦA SHOP */}
      <h3 className="border-bottom border-danger border-2 d-inline-block pb-2 text-dark text-uppercase fs-5 fw-bold mb-3">
        Tất cả sản phẩm
      </h3>
      
      {isLoading ? (
        <div className="text-center py-5 text-secondary">🔄 Đang đồng bộ sản phẩm từ hệ thống...</div>
      ) : (
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3 mt-1">
          {shopProducts.length === 0 ? (
            <div className="col-12 text-center text-secondary py-5 w-100">
              Shop này chưa có sản phẩm nào hợp lệ để bán.
            </div>
          ) : (
            shopProducts.map(product => (
              <div key={product.id} className="col">
                <div 
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white rounded p-3 h-100 shadow-sm border cursor-pointer"
                  style={{ transition: 'transform 0.2s', border: '1px solid #f0f0f0' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img 
                    src={product.images?.[0] || product.image || "https://via.placeholder.com/200"} 
                    alt={product.name} 
                    className="w-100 mb-2" 
                    style={{ height: '160px', objectFit: 'contain' }} 
                  />
                  <div 
                    className="text-dark mb-2" 
                    style={{ fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px', lineHeight: '1.4' }}
                  >
                    {product.name}
                  </div>
                  <div className="text-danger fw-bold fs-6">
                    {Number(product.price).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ShopPage;