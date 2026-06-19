import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import { FaUserCircle, FaCamera, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaLock, FaArrowLeft } from 'react-icons/fa';

const USER_API_URL = "https://6a2e651ac9776ca6c0c48fe5.mockapi.io/users";

const UserUserProfilePage = () => {
  const { user, login } = useContext(AuthContext); 
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({ id: '', username: '', phone: '', dob: '', email: '', avatar: '', role: '', status: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(USER_API_URL);
        const allUsers = response.data || [];
        const myProfile = allUsers.find(u => u.username === user.username);
        
        if (myProfile) {
          setProfileData({
            id: myProfile.id,
            username: myProfile.username || '',
            phone: myProfile.phone || '',
            dob: myProfile.dob || '',
            email: myProfile.email || (myProfile.username.includes('@') ? myProfile.username : 'chua_cap_nhat@gmail.com'),
            avatar: myProfile.avatar || '',
            role: myProfile.role || 'USER',
            status: myProfile.status || 'Active'
          });
        } else {
          setProfileData({
            id: user.id || '',
            username: user.username || user.name || '',
            phone: user.phone || '',
            dob: user.dob || '',
            email: user.email || 'user@gmail.com',
            avatar: user.avatar || '',
            role: user.role || 'USER',
            status: 'Active'
          });
        }
      } catch (error) {
        console.error("Lỗi khi kéo dữ liệu hồ sơ:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChangeText = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Vui lòng chọn ảnh nhỏ hơn 2MB!");
      const reader = new FileReader();
      reader.onloadend = () => setProfileData({ ...profileData, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (profileData.id) await apiClient.put(`${USER_API_URL}/${profileData.id}`, profileData);
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(updatedUser);
      alert("Cập nhật thông tin tài khoản thành công!");
    } catch (error) {
      alert("Lỗi khi đồng bộ máy chủ!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) return alert("Mật khẩu mới và Xác nhận mật khẩu không trùng khớp!");
    
    setIsChangingPassword(true);
    try {
      const response = await apiClient.get(`${USER_API_URL}/${profileData.id}`);
      const currentServerUser = response.data;

      if (currentServerUser.password !== passwordData.currentPassword) {
        alert("Mật khẩu hiện tại không chính xác!");
        setIsChangingPassword(false);
        return;
      }

      await apiClient.put(`${USER_API_URL}/${profileData.id}`, { ...currentServerUser, password: passwordData.newPassword });
      alert("Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert("Lỗi hệ thống khi đổi mật khẩu!");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh', backgroundColor: '#f4f6f8' }}>
        <h2 style={{ color: '#888' }}>🔄 Đang tải hồ sơ...</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '30px 0' }}>
      <div className="container">
        
        {/* Nút quay lại */}
        <div className="mb-4">
          <Link to="/" style={{ color: '#ff469e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
            <FaArrowLeft /> Quay về Trang chủ
          </Link>
        </div>

        {/* Bố cục Responsive: Trên mobile Ảnh nằm trên Form nằm dưới, trên PC Form nằm trái Ảnh nằm phải */}
        <div className="row flex-column-reverse flex-lg-row">
          
          {/* CỘT 1: FORM THÔNG TIN & ĐỔI MẬT KHẨU */}
          <div className="col-12 col-lg-8 mt-4 mt-lg-0">
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              
              <h3 className="border-bottom pb-3 mb-4 text-dark">Hồ sơ tài khoản</h3>
              
              <form onSubmit={handleSaveProfile} className="d-flex flex-column gap-3">
                <div className="row align-items-center">
                  <div className="col-12 col-sm-4 col-md-3 fw-bold text-secondary mb-2 mb-sm-0 d-flex align-items-center gap-2"><FaUser/> Tên tài khoản</div>
                  <div className="col-12 col-sm-8 col-md-9 fw-bold text-dark fs-5">{profileData.username}</div>
                </div>

                <div className="row align-items-center">
                  <div className="col-12 col-sm-4 col-md-3 fw-bold text-secondary mb-2 mb-sm-0 d-flex align-items-center gap-2"><FaEnvelope/> Email *</div>
                  <div className="col-12 col-sm-8 col-md-9">
                    <input type="email" name="email" value={profileData.email} onChange={handleChange} required className="form-control" />
                  </div>
                </div>

                <div className="row align-items-center">
                  <div className="col-12 col-sm-4 col-md-3 fw-bold text-secondary mb-2 mb-sm-0 d-flex align-items-center gap-2"><FaPhone/> Số điện thoại *</div>
                  <div className="col-12 col-sm-8 col-md-9">
                    <input type="tel" name="phone" value={profileData.phone} onChange={handleChange} required pattern="[0-9]{10,11}" className="form-control" />
                  </div>
                </div>

                <div className="row align-items-center">
                  <div className="col-12 col-sm-4 col-md-3 fw-bold text-secondary mb-2 mb-sm-0 d-flex align-items-center gap-2"><FaCalendarAlt/> Ngày sinh *</div>
                  <div className="col-12 col-sm-8 col-md-9">
                    <input type="date" name="dob" value={profileData.dob} onChange={handleChange} required className="form-control" />
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-12 col-sm-4 col-md-3 d-none d-sm-block"></div>
                  <div className="col-12 col-sm-8 col-md-9">
                    <button type="submit" disabled={isSaving} className="btn w-100 w-sm-auto" style={{ backgroundColor: '#ff469e', color: 'white', fontWeight: 'bold', padding: '10px 30px' }}>
                      {isSaving ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>
              </form>

              {/* ĐỔI MẬT KHẨU */}
              <h3 className="border-bottom pb-3 mb-4 mt-5 text-dark">Đổi mật khẩu</h3>
              
              <form onSubmit={handleUpdatePassword} className="d-flex flex-column gap-3">
                <div className="row align-items-center">
                  <div className="col-12 col-sm-4 col-md-3 fw-bold text-secondary mb-2 mb-sm-0 d-flex align-items-center gap-2"><FaLock/> Mật khẩu cũ</div>
                  <div className="col-12 col-sm-8 col-md-9">
                    <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChangeText} required placeholder="Nhập mật khẩu hiện tại" className="form-control" />
                  </div>
                </div>

                <div className="row align-items-center">
                  <div className="col-12 col-sm-4 col-md-3 fw-bold text-secondary mb-2 mb-sm-0 d-flex align-items-center gap-2"><FaLock/> Mật khẩu mới</div>
                  <div className="col-12 col-sm-8 col-md-9">
                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChangeText} required placeholder="Nhập mật khẩu mới" className="form-control" />
                  </div>
                </div>

                <div className="row align-items-center">
                  <div className="col-12 col-sm-4 col-md-3 fw-bold text-secondary mb-2 mb-sm-0 d-flex align-items-center gap-2"><FaLock/> Xác nhận lại</div>
                  <div className="col-12 col-sm-8 col-md-9">
                    <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChangeText} required placeholder="Xác nhận lại mật khẩu mới" className="form-control" />
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-12 col-sm-4 col-md-3 d-none d-sm-block"></div>
                  <div className="col-12 col-sm-8 col-md-9">
                    <button type="submit" disabled={isChangingPassword} className="btn btn-dark w-100 w-sm-auto" style={{ fontWeight: 'bold', padding: '10px 30px' }}>
                      {isChangingPassword ? 'Đang thực hiện...' : 'Cập nhật mật khẩu'}
                    </button>
                  </div>
                </div>
              </form>

            </div>
          </div>

          {/* CỘT 2: ẢNH ĐẠI DIỆN AVATAR */}
          <div className="col-12 col-lg-4">
            <div className="d-flex flex-column align-items-center text-center" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              
              <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '2px dashed #ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: '20px' }}>
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FaUserCircle size={100} color="#ccc" />
                )}
              </div>
              
              <label className="btn btn-light border fw-bold text-secondary d-flex align-items-center gap-2 mb-3 cursor-pointer">
                <FaCamera /> Chọn ảnh mới
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
              
              <div className="text-muted small lh-base">
                Dung lượng tệp tối đa 2 MB<br />Định dạng: .JPEG, .PNG
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserUserProfilePage;