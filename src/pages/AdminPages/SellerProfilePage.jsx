import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaLock, FaEnvelope, FaPhoneAlt, FaStore, FaArrowLeft, FaCamera, FaMapMarkerAlt, FaUserLock } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';

const SellerProfilePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const currentSellerId = user?.username || user?.name || 'seller';

  const [formData, setFormData] = useState({
    shopName: user?.name || 'Shop Của Bạn',
    email: user?.email || '',
    phone: user?.phone || '',
    address: 'Hà Nội, Việt Nam',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  useEffect(() => {
    const savedProfile = localStorage.getItem(`seller_profile_${currentSellerId}`);
    if (savedProfile) {
      const parsedData = JSON.parse(savedProfile);
      setFormData(prev => ({
        ...prev,
        shopName: parsedData.shopName || prev.shopName,
        email: parsedData.email || prev.email,
        phone: parsedData.phone || prev.phone,
        address: parsedData.address || prev.address
      }));
      if (parsedData.avatar) {
        setAvatarPreview(parsedData.avatar);
      }
    }
  }, [currentSellerId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateInfo = (e) => {
    e.preventDefault();
    
    const profileToSave = {
      shopName: formData.shopName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      avatar: avatarPreview
    };

    localStorage.setItem(`seller_profile_${currentSellerId}`, JSON.stringify(profileToSave));

    const globalUser = JSON.parse(localStorage.getItem('user')) || {};
    globalUser.shopName = formData.shopName;
    globalUser.avatar = avatarPreview;
    localStorage.setItem('user', JSON.stringify(globalUser));

    alert("Cập nhật thông tin cửa hàng thành công!");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return alert("Mật khẩu xác nhận không khớp!");
    }
    alert("Đổi mật khẩu thành công!");
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  if (!user) return null;

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '40px 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        
        <button onClick={() => navigate('/seller/dashboard')} style={{ background: 'none', border: 'none', color: '#ee4d2d', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FaArrowLeft /> Quay lại Kênh Người Bán
        </button>

        <h1 style={{ color: '#ee4d2d', fontSize: '24px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaUserShield color="#ee4d2d" size={28} /> Hồ Sơ 
        </h1>

        <div style={{ display: 'flex', gap: '30px', alignItems: 'stretch' }}>
          
          <div style={{ flex: 1, backgroundColor: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', margin: '0 0 25px 0', color: '#333' }}>Thông Tin Cửa Hàng</h3>
            
            <form onSubmit={handleUpdateInfo} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px', paddingBottom: '20px', borderBottom: '1px dashed #eee' }}>
                <div 
                  onClick={() => fileInputRef.current.click()}
                  style={{ 
                    width: '90px', height: '90px', borderRadius: '50%', border: '2px solid #ee4d2d', 
                    position: 'relative', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#f9f9f9',
                    boxShadow: '0 4px 12px rgba(238,77,45,0.15)'
                  }}
                  title="Nhấn để thay đổi ảnh đại diện"
                >
                  <img 
                    src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.shopName || 'Shop'}&background=ee4d2d&color=fff&size=150`} 
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Shop&background=ee4d2d&color=fff&size=150" }}
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '28px', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <FaCamera color="white" size={14} />
                  </div>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px' }}>Ảnh đại diện Shop</div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '5px', lineHeight: '1.5' }}>Định dạng: JPEG, PNG<br/>Dung lượng tối đa 2MB</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Tên Đăng Nhập (Cố định, dùng để đăng nhập)</label>
                <div style={{ padding: '14px 15px', backgroundColor: '#f0f0f0', border: '1px solid #e0e0e0', borderRadius: '8px', color: '#888', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', cursor: 'not-allowed' }}>
                  <FaUserLock /> {currentSellerId}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Tên Cửa Hàng (Hiển thị với khách hàng)</label>
                <div style={{ position: 'relative' }}>
                  <FaStore style={{ position: 'absolute', top: '16px', left: '15px', color: '#999' }} />
                  <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} required style={{ width: '100%', padding: '14px 15px 14px 45px', border: '1px solid #e0e0e0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fcfcfc', transition: 'border 0.2s' }} onFocus={(e)=>e.target.style.borderColor='#ee4d2d'} onBlur={(e)=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Email liên hệ</label>
                <div style={{ position: 'relative' }}>
                  <FaEnvelope style={{ position: 'absolute', top: '16px', left: '15px', color: '#999' }} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '14px 15px 14px 45px', border: '1px solid #e0e0e0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fcfcfc', transition: 'border 0.2s' }} onFocus={(e)=>e.target.style.borderColor='#ee4d2d'} onBlur={(e)=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Số điện thoại (Hotline Shop)</label>
                <div style={{ position: 'relative' }}>
                  <FaPhoneAlt style={{ position: 'absolute', top: '16px', left: '15px', color: '#999' }} />
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={{ width: '100%', padding: '14px 15px 14px 45px', border: '1px solid #e0e0e0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fcfcfc', transition: 'border 0.2s' }} onFocus={(e)=>e.target.style.borderColor='#ee4d2d'} onBlur={(e)=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Địa chỉ cửa hàng</label>
                <div style={{ position: 'relative' }}>
                  <FaMapMarkerAlt style={{ position: 'absolute', top: '16px', left: '15px', color: '#999' }} />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} required style={{ width: '100%', padding: '14px 15px 14px 45px', border: '1px solid #e0e0e0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fcfcfc', transition: 'border 0.2s' }} onFocus={(e)=>e.target.style.borderColor='#ee4d2d'} onBlur={(e)=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(238, 77, 45, 0.25)' }} onMouseOver={(e)=>e.target.style.backgroundColor='#d73b1c'} onMouseOut={(e)=>e.target.style.backgroundColor='#ee4d2d'}>
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>

          <div style={{ flex: 1, backgroundColor: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', margin: '0 0 25px 0', color: '#333' }}>Đổi Mật Khẩu</h3>
            
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Mật khẩu hiện tại</label>
                <div style={{ position: 'relative' }}>
                  <FaLock style={{ position: 'absolute', top: '16px', left: '15px', color: '#999' }} />
                  <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required style={{ width: '100%', padding: '14px 15px 14px 45px', border: '1px solid #e0e0e0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fcfcfc', transition: 'border 0.2s' }} onFocus={(e)=>e.target.style.borderColor='#ee4d2d'} onBlur={(e)=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <FaLock style={{ position: 'absolute', top: '16px', left: '15px', color: '#999' }} />
                  <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required minLength="6" style={{ width: '100%', padding: '14px 15px 14px 45px', border: '1px solid #e0e0e0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fcfcfc', transition: 'border 0.2s' }} onFocus={(e)=>e.target.style.borderColor='#ee4d2d'} onBlur={(e)=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Xác nhận mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <FaLock style={{ position: 'absolute', top: '16px', left: '15px', color: '#999' }} />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength="6" style={{ width: '100%', padding: '14px 15px 14px 45px', border: '1px solid #e0e0e0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fcfcfc', transition: 'border 0.2s' }} onFocus={(e)=>e.target.style.borderColor='#ee4d2d'} onBlur={(e)=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(238, 77, 45, 0.25)' }} onMouseOver={(e)=>e.target.style.backgroundColor='#d73b1c'} onMouseOut={(e)=>e.target.style.backgroundColor='#ee4d2d'}>
                  Cập Nhật Mật Khẩu
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;