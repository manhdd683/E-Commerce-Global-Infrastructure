import React, { useState } from 'react';
import { authApi } from '../../../api/authApi';

const LoginForm = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await authApi.login(email, password);
      console.log("Kết quả:", response);
      alert("Đăng nhập thành công!");
    } catch (error) {
      alert("Đăng nhập thất bại (Chưa có Backend không sao nhé!)");
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', width: '300px', backgroundColor: 'white' }}>
      <h2 style={{ textAlign: 'center' }}>Đăng nhập</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Đăng nhập
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
        Chưa có tài khoản? <span onClick={onSwitchToRegister} style={{ color: '#007BFF', cursor: 'pointer', fontWeight: 'bold' }}>Đăng ký ngay</span>
      </p>
    </div>
  );
};

export default LoginForm;