import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

// Link API lưu tài khoản mới
const NEW_USER_API_URL = "https://6a2e651ac9776ca6c0c48fe5.mockapi.io/users";

const AuthPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Biến chuyển đổi giữa màn hình Đăng Nhập và Đăng Ký
  const [isLoginMode, setIsLoginMode] = useState(true);

  // --- STATE CHO ĐĂNG NHẬP ---
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- STATE CHO ĐĂNG KÝ ---
  const [regData, setRegData] = useState({ username: '', password: '', role: 'USER', phone: '', dob: '' });

  // ==================== LOGIC ĐĂNG NHẬP ====================
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.get(NEW_USER_API_URL);
      const allUsers = response.data;
      const validUser = allUsers.find(u => u.username === loginUsername && u.password === loginPassword);

      if (validUser) {
        if (validUser.status === "Suspended") {
          return alert("⛔ Tài khoản của bạn đang bị đình chỉ. Vui lòng liên hệ Quản trị viên!");
        }

        const rawRole = String(validUser.role || "USER").toUpperCase().trim();
        let standardizedRole = "USER";

        if (rawRole === 'ADMIN' || rawRole === 'QUẢN TRỊ VIÊN' || rawRole === 'QUAN TRI VIEN') standardizedRole = "ADMIN";
        else if (rawRole === 'SELLER' || rawRole === 'NGƯỜI BÁN' || rawRole === 'NGƯỜI BÁN HÀNG' || rawRole === 'NGUOI BAN') standardizedRole = "SELLER";

        const userToSave = { ...validUser, role: standardizedRole };
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        try { login(userToSave.username, userToSave.password); } catch(err) {}

        if (standardizedRole === "ADMIN") navigate('/admin/dashboard'); 
        else if (standardizedRole === "SELLER") navigate('/seller/dashboard'); 
        else navigate('/'); 
      } else {
        alert("❌ Sai tên đăng nhập hoặc mật khẩu!");
      }
    } catch (error) {
      alert("⚠️ Lỗi kết nối máy chủ khi kiểm tra đăng nhập!");
      console.error(error);
    }
  };

  const handleForgotPassword = () => {
    const resetEmail = window.prompt("Vui lòng nhập Tên đăng nhập hoặc Số điện thoại để khôi phục mật khẩu:");
    if (resetEmail) alert(`✅ Hệ thống đã tiếp nhận yêu cầu. Hướng dẫn khôi phục mật khẩu sẽ được gửi đến: ${resetEmail}`);
  };

  // ==================== LOGIC ĐĂNG KÝ ====================
  const handleRegChange = (e) => setRegData({ ...regData, [e.target.name]: e.target.value });

  const calculateAge = (dobString) => {
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const blacklistedPhones = JSON.parse(localStorage.getItem('blacklistedPhones') || '[]');
    if (blacklistedPhones.includes(regData.phone)) {
      return alert("❌ TỪ CHỐI: Số điện thoại này đã bị hệ thống khóa vĩnh viễn do cố tình vi phạm chính sách độ tuổi!");
    }

    const age = calculateAge(regData.dob);
    if (age < 18) {
      blacklistedPhones.push(regData.phone);
      localStorage.setItem('blacklistedPhones', JSON.stringify(blacklistedPhones));
      return alert(`⛔ CẢNH BÁO: Bạn mới ${age} tuổi. Yêu cầu trên 18 tuổi để tạo tài khoản!\nSố điện thoại ${regData.phone} đã bị khóa đăng ký trên hệ thống.`);
    }

    try {
      await apiClient.post(NEW_USER_API_URL, { 
        username: regData.username, password: regData.password, role: regData.role, phone: regData.phone, status: "Active"
      });
      alert("🎉 Đăng ký tài khoản thành công! Xin mời đăng nhập.");
      setIsLoginMode(true);
      setRegData({ username: '', password: '', role: 'USER', phone: '', dob: '' });
    } catch (error) {
      alert("Đăng ký thất bại, vui lòng thử lại!");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light px-3 py-4">
      {/* Khung form tự động co giãn 100% trên mobile và khóa ở 420px trên PC */}
      <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm w-100" style={{ maxWidth: '420px' }}>
        
        {isLoginMode ? (
          /* ================= GIAO DIỆN ĐĂNG NHẬP ================= */
          <form onSubmit={handleLogin}>
            <h2 className="text-center mb-4 text-dark fw-bold">Đăng nhập</h2>
            
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">Tên đăng nhập</label>
              <input type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="form-control py-2" />
            </div>

            <div className="mb-2">
              <label className="form-label fw-bold text-secondary small">Mật khẩu</label>
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="form-control py-2" />
            </div>

            <div className="text-end mb-4">
              <span onClick={handleForgotPassword} className="text-primary small text-decoration-underline" style={{ cursor: 'pointer' }}>
                Quên mật khẩu?
              </span>
            </div>

            <button type="submit" className="btn btn-success w-100 py-2 fw-bold fs-6 mb-3">
              Đăng nhập
            </button>

            <div className="text-center small">
              <span className="text-muted">Bạn chưa có tài khoản? </span>
              <span onClick={() => setIsLoginMode(false)} className="text-primary fw-bold text-decoration-underline" style={{ cursor: 'pointer' }}>
                Đăng ký ngay
              </span>
            </div>
          </form>

        ) : (
          /* ================= GIAO DIỆN ĐĂNG KÝ ================= */
          <form onSubmit={handleRegister}>
            <h2 className="text-center mb-4 text-primary fw-bold">Đăng ký</h2>

            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">Bạn là:</label>
              <select name="role" value={regData.role} onChange={handleRegChange} className="form-select py-2">
                <option value="USER">Khách mua hàng</option>
                <option value="SELLER">Người bán hàng</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">Tên đăng nhập / Email</label>
              <input type="text" name="username" required value={regData.username} onChange={handleRegChange} className="form-control py-2" />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">Mật khẩu</label>
              <input type="password" name="password" required value={regData.password} onChange={handleRegChange} className="form-control py-2" />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">Số điện thoại</label>
              <input type="tel" name="phone" required pattern="[0-9]{10,11}" title="Gồm 10-11 số" value={regData.phone} onChange={handleRegChange} className="form-control py-2" />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small">Ngày tháng năm sinh</label>
              <input type="date" name="dob" required value={regData.dob} onChange={handleRegChange} className="form-control py-2" />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold fs-6 mb-3">
              Tạo tài khoản
            </button>

            <div className="text-center small">
              <span className="text-muted">Đã có tài khoản? </span>
              <span onClick={() => setIsLoginMode(true)} className="text-success fw-bold text-decoration-underline" style={{ cursor: 'pointer' }}>
                Đăng nhập
              </span>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthPage;