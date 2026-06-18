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
  
  // State quản lý thông tin tài khoản
  const [profileData, setProfileData] = useState({
    id: '', username: '', phone: '', dob: '', email: '', avatar: '', role: '', status: ''
  });

  // State quản lý đổi mật khẩu
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

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
        
        // Chỉ lấy thông tin của tài khoản đang đăng nhập hiện tại
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

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChangeText = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Vui lòng chọn ảnh nhỏ hơn 2MB!");
      const reader = new FileReader();
      reader.onloadend = () => setProfileData({ ...profileData, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // --- HÀM LƯU THÔNG TIN HỒ SƠ ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (profileData.id) {
         // Đẩy dữ liệu cập nhật lên API MockAPI để lưu trữ vĩnh viễn
         await apiClient.put(`${USER_API_URL}/${profileData.id}`, profileData);
      }
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(updatedUser);
      alert(" Cập nhật thông tin tài khoản thành công!");
    } catch (error) {
      alert("Lỗi khi đồng bộ máy chủ!");
    } finally {
      setIsSaving(false);
    }
  };

  // --- HÀM ĐỔI MẬT KHẨU BẢO MẬT ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(" Mật khẩu mới và Xác nhận mật khẩu không trùng khớp!");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await apiClient.get(`${USER_API_URL}/${profileData.id}`);
      const currentServerUser = response.data;

      if (currentServerUser.password !== passwordData.currentPassword) {
        alert(" Mật khẩu hiện tại không chính xác!");
        setIsChangingPassword(false);
        return;
      }

      // Tiến hành cập nhật mật khẩu mới lên API
      await apiClient.put(`${USER_API_URL}/${profileData.id}`, {
        ...currentServerUser,
        password: passwordData.newPassword
      });

      alert(" Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert("Lỗi hệ thống khi đổi mật khẩu!");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', minHeight: '60vh', backgroundColor: '#f4f6f8' }}>
        <h2 style={{ color: '#888' }}>🔄 Đang tải hồ sơ bảo mật...</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        <div>
          <Link to="/" style={{ color: '#ff469e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
            <FaArrowLeft /> Quay về Trang chủ
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* KHU VỰC 1: SỬA THÔNG TIN CHI TIẾT */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>Hồ sơ tài khoản</h2>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUser/> Tên tài khoản</span>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px' }}>{profileData.username}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}><FaEnvelope/> Email / Mail *</span>
                <input type="email" name="email" value={profileData.email} onChange={handleChange} required style={{ flex: 1, padding: '10px 15px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}><FaPhone/> Số điện thoại *</span>
                <input type="tel" name="phone" value={profileData.phone} onChange={handleChange} required pattern="[0-9]{10,11}" style={{ flex: 1, padding: '10px 15px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarAlt/> Ngày sinh *</span>
                <input type="date" name="dob" value={profileData.dob} onChange={handleChange} required style={{ flex: 1, padding: '10px 15px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>

              <div style={{ paddingLeft: '150px', marginTop: '10px' }}>
                <button type="submit" disabled={isSaving} style={{ padding: '12px 30px', backgroundColor: '#ff469e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                  {isSaving ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                </button>
              </div>
            </form>

            {/* KHU VỰC ĐỔI MẬT KHẨU ĐƯỢC TÍCH HỢP THÊM */}
            <h2 style={{ marginTop: '40px', color: '#333', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>Đổi mật khẩu bảo mật</h2>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}><FaLock/> Mật khẩu cũ</span>
                <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChangeText} required placeholder="Nhập mật khẩu hiện tại" style={{ flex: 1, padding: '10px 15px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}><FaLock/> Mật khẩu mới</span>
                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChangeText} required placeholder="Nhập mật khẩu mới" style={{ flex: 1, padding: '10px 15px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '150px', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}><FaLock/> Xác nhận lại</span>
                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChangeText} required placeholder="Xác nhận lại mật khẩu mới" style={{ flex: 1, padding: '10px 15px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>

              <div style={{ paddingLeft: '150px', marginTop: '10px' }}>
                <button type="submit" disabled={isChangingPassword} style={{ padding: '12px 30px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                  {isChangingPassword ? 'Đang thực hiện...' : 'Thay đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>

          {/* KHU VỰC 2: ẢNH ĐẠI DIỆN AVATAR */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '130px', height: '120px', borderRadius: '50%', border: '2px dashed #ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: '20px' }}>
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FaUserCircle size={90} color="#ccc" />
              )}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#555' }}>
              <FaCamera /> Tải ảnh lên
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '15px', textAlign: 'center', lineHeight: '1.5' }}>
              Dung lượng tệp tối đa 2 MB<br />Định dạng: .JPEG, .PNG
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserUserProfilePage;