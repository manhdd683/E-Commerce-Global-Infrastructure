import React, { useState, useContext } from 'react'; // 1. Thêm useContext
import { useNavigate } from 'react-router-dom';
import { FaCartPlus, FaStar } from 'react-icons/fa';
import { CartContext } from '../../../context/CartContext'; // 2. Import Kho chứa

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  // 3. Lấy hàm addToCart từ kho chứa ra
  const { addToCart } = useContext(CartContext);

  return (
    <div 
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        border: '1px solid #eaeaea', 
        padding: '15px', 
        borderRadius: '12px', 
        backgroundColor: 'white', 
        boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)', 
        transform: isHovered ? 'translateY(-5px)' : 'none',
        transition: 'all 0.3s ease',
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#ff469e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', zIndex: 1 }}>
        -15%
      </div>

      <img 
        src={product.image} 
        alt={product.name} 
        style={{ width: '100%', height: '200px', objectFit: 'contain', borderRadius: '8px', marginBottom: '15px' }} 
      />
      
      <div>
        <h3 style={{ fontSize: '15px', margin: '0 0 8px', color: '#333', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4', height: '42px' }}>
          {product.name}
        </h3>
        
        <div style={{ display: 'flex', color: '#ffc107', fontSize: '12px', marginBottom: '10px' }}>
          <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
          <span style={{ color: '#999', marginLeft: '5px' }}>(12 đánh giá)</span>
        </div>

        <p style={{ color: '#d70018', fontWeight: 'bold', fontSize: '18px', margin: '0 0 15px' }}>
          {product.price.toLocaleString('vi-VN')} ₫
        </p>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          addToCart(product); // 4. Đổi từ alert() thành hàm gọi API Giỏ hàng thật
        }}
        style={{ backgroundColor: isHovered ? '#ff469e' : '#f5f5f5', color: isHovered ? 'white' : '#333', border: isHovered ? 'none' : '1px solid #ddd', padding: '10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '8px', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s' }}
      >
        <FaCartPlus size={16} /> Chọn mua
      </button>
    </div>
  );
};

export default ProductCard;