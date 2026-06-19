import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCartPlus, FaStar } from 'react-icons/fa';
import { CartContext } from '../../../context/CartContext';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  return (
    <div 
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="card h-100 p-3 bg-white border cursor-pointer position-relative"
      style={{ 
        borderRadius: '12px',
        boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)', 
        transform: isHovered ? 'translateY(-5px)' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Nhãn giảm giá */}
      <span className="position-absolute badge bg-danger fw-bold" style={{ top: '10px', left: '10px', zIndex: 1, padding: '5px 8px' }}>
        -15%
      </span>

      {/* Ảnh sản phẩm */}
      <div className="d-flex justify-content-center align-items-center mb-3" style={{ height: '200px' }}>
        <img src={product.image || product.images?.[0]} alt={product.name} className="img-fluid h-100 object-fit-contain" />
      </div>
      
      {/* Thông tin chi tiết */}
      <div className="d-flex flex-column flex-grow-1">
        <h3 className="text-dark mb-2 lh-base" style={{ fontSize: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '42px' }}>
          {product.name}
        </h3>
        
        <div className="d-flex text-warning small mb-2 align-items-center gap-1">
          <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
          <span className="text-muted small ms-1">(12)</span>
        </div>

        <p className="text-danger fw-bold fs-5 mb-3">
          {product.price.toLocaleString('vi-VN')} ₫
        </p>
      </div>

      {/* Thao tác mua hàng */}
      <button 
        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
        className="btn w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2 mt-auto"
        style={{ 
          backgroundColor: isHovered ? '#ff469e' : '#f5f5f5', 
          color: isHovered ? 'white' : '#333',
          border: isHovered ? 'none' : '1px solid #ddd',
          fontSize: '14px',
          transition: 'all 0.2s'
        }}
      >
        <FaCartPlus size={16} /> Chọn mua
      </button>
    </div>
  );
};

export default ProductCard;