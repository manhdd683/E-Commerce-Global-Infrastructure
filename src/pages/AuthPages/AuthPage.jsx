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
  const [regData, setRegData] = useState({
    username: '',
    password: '',
    role: 'USER',
    phone: '',
    dob: ''
  });

  // ==================== LOGIC ĐĂNG NHẬP (ĐÃ FIX ÉP KIỂU ROLE ĐỂ QUA CỬA BẢO VỆ) ====================
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Gọi trực tiếp lên MockAPI để lấy danh sách user thực tế
      const response = await apiClient.get(NEW_USER_API_URL);
      const allUsers = response.data;

      // 2. Tìm xem có tài khoản nào khớp Username và Password không
      const validUser = allUsers.find(u => u.username === loginUsername && u.password === loginPassword);

      if (validUser) {
        // Nếu tài khoản đang bị Admin khóa
        if (validUser.status === "Suspended") {
          alert("⛔ Tài khoản của bạn đang bị đình chỉ. Vui lòng liên hệ Quản trị viên!");
          return;
        }

        // --- ĐOẠN QUAN TRỌNG: CHUẨN HÓA QUYỀN TRƯỚC KHI LƯU VÀO TRÌNH DUYỆT ---
        // Đảm bảo dù MockAPI lưu tiếng Việt thì hệ thống bảo vệ (Route Guard) vẫn đọc được chuẩn tiếng Anh
        const rawRole = String(validUser.role || "USER").toUpperCase().trim();
        let standardizedRole = "USER";

        if (rawRole === 'ADMIN' || rawRole === 'QUẢN TRỊ VIÊN' || rawRole === 'QUAN TRI VIEN') {
          standardizedRole = "ADMIN";
        } 
        else if (rawRole === 'SELLER' || rawRole === 'NGƯỜI BÁN' || rawRole === 'NGƯỜI BÁN HÀNG' || rawRole === 'NGUOI BAN') {
          standardizedRole = "SELLER";
        }

        // Tạo một bản sao của user, nhưng ghi đè cái quyền chuẩn tiếng Anh vào
        const userToSave = { ...validUser, role: standardizedRole };

        // 3. Đăng nhập thành công -> Lưu user (đã chuẩn hóa quyền) vào LocalStorage
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        // (Tùy chọn) Gọi hàm login của Context để nó cập nhật UI Header
        try { login(userToSave.username, userToSave.password); } catch(err) {}

        // 4. Điều hướng CHUẨN XÁC
        if (standardizedRole === "ADMIN") {
          navigate('/admin/dashboard'); 
        } 
        else if (standardizedRole === "SELLER") {
          navigate('/seller/dashboard'); 
        } 
        else {
          navigate('/'); // Mặc định là khách hàng
        }

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
    if (resetEmail) {
      alert(`✅ Hệ thống đã tiếp nhận yêu cầu. Hướng dẫn khôi phục mật khẩu sẽ được gửi đến: ${resetEmail}`);
    }
  };

  // ==================== LOGIC ĐĂNG KÝ ====================
  const handleRegChange = (e) => {
    setRegData({ ...regData, [e.target.name]: e.target.value });
  };

  const calculateAge = (dobString) => {
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra SĐT trong danh sách đen
    const blacklistedPhones = JSON.parse(localStorage.getItem('blacklistedPhones') || '[]');
    if (blacklistedPhones.includes(regData.phone)) {
      alert("❌ TỪ CHỐI: Số điện thoại này đã bị hệ thống khóa vĩnh viễn do cố tình vi phạm chính sách độ tuổi!");
      return;
    }

    // 2. Kiểm tra độ tuổi (Phải >= 18)
    const age = calculateAge(regData.dob);
    if (age < 18) {
      // Đẩy SĐT vào danh sách đen
      blacklistedPhones.push(regData.phone);
      localStorage.setItem('blacklistedPhones', JSON.stringify(blacklistedPhones));
      alert(`⛔ CẢNH BÁO: Bạn mới ${age} tuổi. Yêu cầu trên 18 tuổi để tạo tài khoản!\nSố điện thoại ${regData.phone} đã bị khóa đăng ký trên hệ thống.`);
      return;
    }

    // 3. Tiến hành đăng ký lưu lên MockAPI
    try {
      await apiClient.post(NEW_USER_API_URL, { 
        username: regData.username,
        password: regData.password,
        role: regData.role,
        phone: regData.phone,
        status: "Active"
      });
      alert("🎉 Đăng ký tài khoản thành công! Xin mời đăng nhập.");
      // Tự động lật về trang Đăng nhập
      setIsLoginMode(true);
      setRegData({ username: '', password: '', role: 'USER', phone: '', dob: '' });
    } catch (error) {
      alert("Đăng ký thất bại, vui lòng thử lại!");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
      
      {/* ================= GIAO DIỆN ĐĂNG NHẬP ================= */}
      {isLoginMode ? (
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Đăng nhập hệ thống</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tên đăng nhập</label>
            <input 
              type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} 
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '5px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Mật khẩu</label>
            <input 
              type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} 
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          {/* Nút Quên mật khẩu */}
          <div style={{ textAlign: 'right', marginBottom: '25px' }}>
            <span onClick={handleForgotPassword} style={{ fontSize: '13px', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>
              Quên mật khẩu?
            </span>
          </div>

          <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Đăng nhập
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            <span style={{ color: '#555' }}>Bạn chưa có tài khoản? </span>
            <span onClick={() => setIsLoginMode(false)} style={{ color: '#007bff', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
              Đăng ký ngay
            </span>
          </div>
        </form>

      ) : (

        /* ================= GIAO DIỆN ĐĂNG KÝ ================= */
        <form onSubmit={handleRegister} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#007bff' }}>Đăng ký Tài khoản</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Bạn là:</label>
            <select name="role" value={regData.role} onChange={handleRegChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}>
              <option value="USER">Khách mua hàng</option>
              <option value="SELLER">Người bán hàng</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Tên đăng nhập / Email</label>
            <input type="text" name="username" required value={regData.username} onChange={handleRegChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Mật khẩu</label>
            <input type="password" name="password" required value={regData.password} onChange={handleRegChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Số điện thoại</label>
            <input type="tel" name="phone" required pattern="[0-9]{10,11}" title="Gồm 10-11 số" value={regData.phone} onChange={handleRegChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Ngày tháng năm sinh</label>
            <input type="date" name="dob" required value={regData.dob} onChange={handleRegChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Tạo tài khoản
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            <span style={{ color: '#555' }}>Đã có tài khoản? </span>
            <span onClick={() => setIsLoginMode(true)} style={{ color: '#28a745', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
              Đăng nhập
            </span>
          </div>
        </form>
      )}
    </div>
  );
};

export default AuthPage;