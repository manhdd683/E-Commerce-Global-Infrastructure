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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result); 
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateInfo = (e) => {
    e.preventDefault();
    const profileToSave = { shopName: formData.shopName, email: formData.email, phone: formData.phone, address: formData.address, avatar: avatarPreview };
    localStorage.setItem(`seller_profile_${currentSellerId}`, JSON.stringify(profileToSave));

    const globalUser = JSON.parse(localStorage.getItem('user')) || {};
    globalUser.shopName = formData.shopName;
    globalUser.avatar = avatarPreview;
    localStorage.setItem('user', JSON.stringify(globalUser));

    alert("Cập nhật thông tin cửa hàng thành công!");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) return alert("Mật khẩu xác nhận không khớp!");
    alert("Đổi mật khẩu thành công!");
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  if (!user) return null;

  return (
    <div className="bg-light min-vh-100 py-4 py-md-5">
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Nút Quay Lại & Tiêu đề */}
        <button onClick={() => navigate('/seller/dashboard')} className="btn btn-link text-danger text-decoration-none fw-bold p-0 d-flex align-items-center gap-2 mb-4">
          <FaArrowLeft /> Quay lại Kênh Người Bán
        </button>

        <h1 className="fs-3 text-danger mb-4 d-flex align-items-center gap-2 fw-bold">
          <FaUserShield size={28} /> Hồ Sơ Cửa Hàng
        </h1>

        {/* 2 Cột: Thông tin & Đổi mật khẩu tự động xếp chồng trên mobile */}
        <div className="row g-4 align-items-stretch">
          
          {/* CỘT 1: THÔNG TIN CỬA HÀNG */}
          <div className="col-12 col-lg-6">
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm h-100 d-flex flex-column">
              <h3 className="fs-5 text-dark border-bottom pb-3 mb-4 fw-bold">Thông Tin Cửa Hàng</h3>
              
              <form onSubmit={handleUpdateInfo} className="d-flex flex-column gap-3 flex-grow-1">
                
                <div className="d-flex align-items-center gap-3 border-bottom border-dashed pb-3 mb-2">
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="rounded-circle border border-2 border-danger position-relative cursor-pointer overflow-hidden shadow-sm"
                    style={{ width: '90px', height: '90px' }}
                    title="Nhấn để thay đổi ảnh đại diện"
                  >
                    <img 
                      src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.shopName || 'Shop'}&background=ee4d2d&color=fff&size=150`} 
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Shop&background=ee4d2d&color=fff&size=150" }}
                      alt="Avatar" className="w-100 h-100 object-fit-cover"
                    />
                    <div className="position-absolute bottom-0 w-100 d-flex justify-content-center align-items-center pb-1" style={{ height: '30px', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <FaCamera color="white" size={14} />
                    </div>
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="d-none" />
                  <div>
                    <div className="fw-bold text-dark fs-6">Ảnh đại diện Shop</div>
                    <div className="text-muted small mt-1">JPEG, PNG (Tối đa 2MB)</div>
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-bold text-secondary">Tên Đăng Nhập (Cố định)</label>
                  <div className="d-flex align-items-center gap-2 form-control bg-light text-muted">
                    <FaUserLock /> {currentSellerId}
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-bold text-secondary">Tên Cửa Hàng (Hiển thị công khai)</label>
                  <div className="position-relative">
                    <FaStore className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} required className="form-control ps-5" />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-bold text-secondary">Email liên hệ</label>
                  <div className="position-relative">
                    <FaEnvelope className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-control ps-5" />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-bold text-secondary">Hotline Shop</label>
                  <div className="position-relative">
                    <FaPhoneAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="form-control ps-5" />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-bold text-secondary">Địa chỉ cửa hàng</label>
                  <div className="position-relative">
                    <FaMapMarkerAlt className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className="form-control ps-5" />
                  </div>
                </div>

                <div className="mt-auto pt-3">
                  <button type="submit" className="btn btn-danger w-100 fw-bold py-2 shadow-sm">Lưu Thông Tin</button>
                </div>
              </form>
            </div>
          </div>

          {/* CỘT 2: ĐỔI MẬT KHẨU */}
          <div className="col-12 col-lg-6">
            <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm h-100 d-flex flex-column">
              <h3 className="fs-5 text-dark border-bottom pb-3 mb-4 fw-bold">Đổi Mật Khẩu</h3>
              
              <form onSubmit={handleChangePassword} className="d-flex flex-column gap-3 flex-grow-1">
                <div>
                  <label className="form-label small fw-bold text-secondary">Mật khẩu hiện tại</label>
                  <div className="position-relative">
                    <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required className="form-control ps-5" />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-bold text-secondary">Mật khẩu mới</label>
                  <div className="position-relative">
                    <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required minLength="6" className="form-control ps-5" />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-bold text-secondary">Xác nhận mật khẩu mới</label>
                  <div className="position-relative">
                    <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength="6" className="form-control ps-5" />
                  </div>
                </div>

                <div className="mt-auto pt-3">
                  <button type="submit" className="btn btn-danger w-100 fw-bold py-2 shadow-sm">Cập Nhật Mật Khẩu</button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;