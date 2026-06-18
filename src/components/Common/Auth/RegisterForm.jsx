import React, { useState } from 'react';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Logic đăng ký cơ bản (sau này kết nối API ở đây)
      alert("Đăng ký thành công!");
      if (onSwitchToLogin) onSwitchToLogin();
    } catch (error) {
      alert("Đăng ký thất bại!");
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', width: '300px', backgroundColor: 'white' }}>
      <h2 style={{ textAlign: 'center' }}>Đăng ký</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" placeholder="Nhập email" value={email} 
          onChange={(e) => setEmail(e.target.value)} required 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          type="password" placeholder="Nhập mật khẩu" value={password} 
          onChange={(e) => setPassword(e.target.value)} required 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Đăng ký
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
        Đã có tài khoản? <span onClick={onSwitchToLogin} style={{ color: '#007BFF', cursor: 'pointer', fontWeight: 'bold' }}>Đăng nhập ngay</span>
      </p>
    </div>
  );
};

export default RegisterForm;