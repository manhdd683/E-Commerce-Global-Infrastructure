import React, { createContext, useState, useEffect } from 'react';

// 1. Khởi tạo kho chứa
export const AuthContext = createContext();

// 2. Tạo Component cung cấp dữ liệu cho toàn app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Lấy dữ liệu user từ LocalStorage nếu đã từng đăng nhập trước đó
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Lỗi đọc dữ liệu user", error);
      }
    }
  }, []);

  // ĐÃ SỬA: Hàm login giờ đây chỉ làm nhiệm vụ cập nhật trạng thái UI
  // Dữ liệu đã được kiểm tra API và ép quyền chuẩn ở bên AuthPage rồi
  const login = (userData) => {
    // Đọc thẳng dữ liệu chuẩn từ LocalStorage (do AuthPage vừa lưu) để đồng bộ 100%
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (typeof userData === 'object' && userData !== null) {
      setUser(userData);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};