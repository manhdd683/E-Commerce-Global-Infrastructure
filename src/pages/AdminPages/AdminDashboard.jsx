import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaBox,
  FaClipboardList,
  FaSignOutAlt,
  FaUsers,
  FaUserMinus,
  FaUserLock,
  FaUserCheck,
  FaBan,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyCheckAlt,
  FaTicketAlt,
  FaPlus,
  FaTrash,
  FaUserShield,
  FaCog,
  FaLock
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import apiClient from "../../api/apiClient";
import { AuthContext } from "../../context/AuthContext";

const NEW_USER_API_URL = "https://6a2e651ac9776ca6c0c48fe5.mockapi.io/users";

const MOCK_FALLBACK_ORDERS = [
  { id: "DH01", orderDate: "2026-06-10T10:00:00", customerInfo: { fullName: "Nguyễn Văn A" }, totalPrice: 1500000, status: "Completed", isSuspicious: false },
  { id: "DH02", orderDate: "2026-06-11T14:30:00", customerInfo: { fullName: "Trần Thị B" }, totalPrice: 25000000, status: "Processing", isSuspicious: true },
  { id: "DH03", orderDate: "2026-06-12T09:15:00", customerInfo: { fullName: "Lê Văn C" }, totalPrice: 500000, status: "Completed", isSuspicious: false },
  { id: "DH04", orderDate: "2026-06-13T16:45:00", customerInfo: { fullName: "Phạm Thị D" }, totalPrice: 3200000, status: "Processing", isSuspicious: false },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Lấy thông tin user hiện tại
  const [activeTab, setActiveTab] = useState("overview");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "USER" });

  const [currentPage, setCurrentPage] = useState(1); 
  const ordersPerPage = 5;

  const [currentProductPage, setCurrentProductPage] = useState(1); 
  const productsPerPage = 5;

  // --- QUẢN LÝ VOUCHER ---
  const [vouchers, setVouchers] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: '', name: '', type: 'FIXED', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: ''
  });

  // --- ĐỔI MẬT KHẨU ADMIN ---
  const [passwords, setPasswords] = useState({ currentPass: '', newPass: '', confirmPass: '' });

  const loadVouchers = () => {
    const savedVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
    setVouchers(savedVouchers);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        apiClient.get("/products").catch(() => ({ data: [] })),
        apiClient.get("/orders").catch(() => ({ data: [] })),
        apiClient.get(NEW_USER_API_URL).catch(() => ({ data: [] })),
      ]);

      const sortedProducts = productsRes.data ? [...productsRes.data].reverse() : [];
      setProducts(sortedProducts);

      setOrders(
        ordersRes.data && ordersRes.data.length > 0
          ? ordersRes.data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
          : MOCK_FALLBACK_ORDERS,
      );
      setUsers(usersRes.data || []);
      loadVouchers(); 
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --- HÀM ĐỔI MẬT KHẨU ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirmPass) {
      return alert("Mật khẩu xác nhận không khớp!");
    }
    if (passwords.newPass.length < 6) {
      return alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
    }

    try {
      // Vì là MockAPI, chúng ta lấy user hiện tại để update đè lên
      const res = await apiClient.get(`${NEW_USER_API_URL}/${user.id}`);
      const currentUserData = res.data;
      
      await apiClient.put(`${NEW_USER_API_URL}/${user.id}`, { 
        ...currentUserData, 
        password: passwords.newPass 
      });
      
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại để bảo mật.");
      handleLogout();
    } catch (error) {
      alert("Lỗi hệ thống khi cập nhật mật khẩu!");
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      alert("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!");
      return;
    }
    const payload = { ...newUser, status: "Active" };
    try {
      await apiClient.post(NEW_USER_API_URL, payload);
      alert("Tạo tài khoản và cấp mật khẩu thành công!");
      setShowAddModal(false); 
      setNewUser({ username: "", password: "", role: "USER" }); 
      fetchData(); 
    } catch (error) {
      alert("Lỗi kết nối API khi tạo tài khoản!");
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    const targetUser = users.find((u) => u.id === userId);
    try {
      await apiClient.put(`${NEW_USER_API_URL}/${userId}`, { ...targetUser, role: newRole });
      alert("Cập nhật quyền thành công!");
      fetchData(); 
    } catch (error) {
      alert("Không thể cập nhật quyền!");
    }
  };

  const handleToggleSuspendUser = async (userId, currentStatus) => {
    const targetUser = users.find((u) => u.id === userId);
    const nextStatus = currentStatus === "Suspended" ? "Active" : "Suspended";
    const actionText = nextStatus === "Suspended" ? "Đình chỉ" : "Mở khóa";

    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`)) {
      try {
        await apiClient.put(`${NEW_USER_API_URL}/${userId}`, { ...targetUser, status: nextStatus });
        fetchData();
      } catch (error) {
        alert("Thao tác thất bại!");
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn dữ liệu người dùng. Tiếp tục?")) {
      try {
        await apiClient.delete(`${NEW_USER_API_URL}/${userId}`);
        fetchData();
      } catch (error) {
        alert("Xóa thất bại! Bạn cần kiểm tra lại quyền API.");
      }
    }
  };

  const handleModerateProduct = async (productId, status) => {
    const targetProduct = products.find((p) => p.id === productId);
    const reason = status === "Banned" ? prompt("Nhập lý do cấm bán (VD: Hàng giả, cấm bán...):") : "";
    if (status === "Banned" && !reason) return;

    try {
      await apiClient.put(`/products/${productId}`, {
        ...targetProduct,
        moderationStatus: status,
        banReason: reason,
      });
      fetchData();
    } catch (error) {
      alert("Cập nhật trạng thái kiểm duyệt thất bại!");
    }
  };

  const handleDeleteProductAdmin = async (productId) => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi hệ thống. Tiếp tục?")) {
      try {
        await apiClient.delete(`/products/${productId}`);
        alert("Đã xóa sản phẩm thành công!");
        fetchData(); 
      } catch (error) {
        alert("Xóa thất bại!");
      }
    }
  };

  const handleCreateVoucherSubmit = (e) => {
    e.preventDefault();
    if (!newVoucher.code || !newVoucher.value || !newVoucher.minSpend || !newVoucher.expiryDate) {
      return alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
    }

    const currentVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
    if (currentVouchers.some(v => v.code === newVoucher.code)) {
      return alert("Mã Code này đã tồn tại!");
    }

    const voucherToSave = {
      ...newVoucher,
      value: Number(newVoucher.value),
      minSpend: Number(newVoucher.minSpend),
      systemLimit: Number(newVoucher.systemLimit) || 9999, 
      systemUsed: 0,
      expiryDate: new Date(newVoucher.expiryDate).toISOString()
    };

    currentVouchers.push(voucherToSave);
    localStorage.setItem('system_vouchers', JSON.stringify(currentVouchers));
    
    alert("Tạo mã Voucher thành công!");
    setShowVoucherModal(false);
    setNewVoucher({ code: '', name: '', type: 'FIXED', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: '' });
    loadVouchers();
  };

  const handleDeleteVoucher = (code) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã ${code} không?`)) {
      const currentVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
      const updatedVouchers = currentVouchers.filter(v => v.code !== code);
      localStorage.setItem('system_vouchers', JSON.stringify(updatedVouchers));
      loadVouchers();
    }
  };

  const handleApproveService = async (orderId) => {
    if (window.confirm("Xác nhận đã nhận tiền và muốn DUYỆT gói này?")) {
      try {
        await apiClient.put(`/orders/${orderId}`, { status: 'Completed', note: 'MARKETING - ĐÃ KÍCH HOẠT' });
        alert("Duyệt thành công! Gói dịch vụ đã được kích hoạt.");
        fetchData(); 
      } catch (error) {
        alert("Lỗi khi duyệt yêu cầu!");
      }
    }
  };

  const handleRejectService = async (orderId) => {
    if (window.confirm("Bạn có chắc muốn TỪ CHỐI yêu cầu này?")) {
      try {
        await apiClient.put(`/orders/${orderId}`, { status: 'Canceled', note: 'MARKETING - BỊ TỪ CHỐI' });
        alert("Đã từ chối yêu cầu.");
        fetchData();
      } catch (error) {
        alert("Lỗi thao tác!");
      }
    }
  };

  const pendingServiceRequests = orders.filter(o => o.status === 'Pending Approval');
  const productOrders = orders.filter(o => o.status === "Completed" && !(o.note && o.note.includes("MARKETING")));
  const totalGMV = productOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
  const commissionRevenue = totalGMV * 0.05; 

  const serviceOrders = orders.filter(o => o.status === "Completed" && o.note && o.note.includes("MARKETING"));
  const marketingRevenue = serviceOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
  const totalPlatformRevenue = commissionRevenue + marketingRevenue;

  const regularOrders = orders.filter(o => !(o.note && o.note.includes("MARKETING")));
  const totalPages = Math.ceil(regularOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = regularOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const totalProductPages = Math.ceil(products.length / productsPerPage);
  const indexOfLastProduct = currentProductPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  const chartData = [
    { day: "10/06", revenue: 1500000 },
    { day: "11/06", revenue: 2500000 },
    { day: "12/06", revenue: 500000 },
    { day: "Hôm nay", revenue: totalPlatformRevenue > 0 ? totalPlatformRevenue : 4200000 },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      
      {/* ================= SIDEBAR (ĐÃ ĐỔI SANG MÀU TRẮNG - CAM CHUẨN SHOPEE) ================= */}
      <div style={{ width: "260px", backgroundColor: "#fff", borderRight: "1px solid #e0e0e0", padding: "25px 20px", display: "flex", flexDirection: "column", height: '100vh', position: 'sticky', top: 0, boxShadow: '2px 0 10px rgba(0,0,0,0.05)', zIndex: 10 }}>
        
        <div style={{ textAlign: "center", marginBottom: "30px", paddingBottom: "15px", borderBottom: "1px solid #f0f0f0" }}>
          <h2 style={{ color: "#ee4d2d", margin: "0 0 5px 0", fontSize: "20px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "900" }}>
            Quản trị hệ thống
          </h2>
          <div style={{ color: "#888", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "bold" }}>
            Root Admin
          </div>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, overflowY: 'auto' }}>
          {[
            { id: 'overview', icon: <FaChartPie size={18} />, label: 'Báo cáo Doanh thu' },
            { id: 'approvals', icon: <FaMoneyCheckAlt size={18} />, label: 'Duyệt Giao Dịch', badge: pendingServiceRequests.length },
            { id: 'users', icon: <FaUsers size={18} />, label: 'Phân quyền & Tài khoản' },
            { id: 'products', icon: <FaBox size={18} />, label: 'Kiểm duyệt Hàng hóa' },
            { id: 'orders', icon: <FaClipboardList size={18} />, label: 'Giám sát Đơn hàng' },
            { id: 'vouchers', icon: <FaTicketAlt size={18} />, label: 'Quản lý Voucher' },
            { id: 'profile', icon: <FaCog size={18} />, label: 'Hồ sơ Admin' } // Nút Hồ sơ mới
          ].map(tab => (
            <li 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); setCurrentProductPage(1); }} 
              style={{ 
                marginBottom: "8px", padding: "12px 15px", fontSize: "15px", 
                display: "flex", alignItems: "center", gap: "12px", 
                color: activeTab === tab.id ? "#ee4d2d" : "#555", 
                backgroundColor: activeTab === tab.id ? "#fff0e5" : "transparent", 
                borderRadius: "6px", cursor: "pointer", 
                fontWeight: activeTab === tab.id ? "bold" : "normal", 
                transition: "0.2s", position: "relative" 
              }}
            >
              {tab.icon} {tab.label}
              {tab.badge > 0 && (
                <span style={{ position: "absolute", right: "10px", backgroundColor: "#dc3545", color: "white", padding: "2px 6px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold", animation: "pulse 1.5s infinite" }}>
                  {tab.badge}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div style={{ padding: '20px 0 0 0' }}>
          <button onClick={handleLogout} style={{ width: '100%', backgroundColor: '#f8f9fa', color: '#555', border: '1px solid #ddd', padding: '12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', transition: '0.2s' }}>
            <FaSignOutAlt size={18} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* ================= NỘI DUNG CHÍNH ================= */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto", maxHeight: "100vh" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", marginTop: "100px", fontSize: "20px", color: "#555" }}>🔄 Đang đồng bộ hệ thống...</div>
        ) : (
          <>
            {/* TAB 0: HỒ SƠ ADMIN (ĐỔI MẬT KHẨU) */}
            {activeTab === "profile" && (
              <div>
                <h1 style={{ marginBottom: "30px", color: "#333" }}>Hồ sơ Quản trị viên</h1>
                <div style={{ display: 'flex', gap: '30px' }}>
                  
                  {/* Thông tin tài khoản */}
                  <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', alignSelf: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fff0e5', color: '#ee4d2d', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px' }}>
                        <FaUserShield />
                      </div>
                      <div>
                        <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>{user?.username || 'Admin'}</h2>
                        <span style={{ backgroundColor: '#28a745', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>ROOT ADMIN</span>
                      </div>
                    </div>
                    <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.8' }}>
                      <p><strong>Vai trò:</strong> Quyền kiểm soát cao nhất hệ thống.</p>
                      <p><strong>Trạng thái:</strong> Hoạt động bình thường.</p>
                      <p><strong>Cảnh báo bảo mật:</strong> Không chia sẻ mật khẩu cho bất kỳ ai.</p>
                    </div>
                  </div>

                  {/* Form Đổi Mật Khẩu */}
                  <div style={{ flex: 2, backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}><FaLock color="#ee4d2d" /> Thay đổi mật khẩu</h3>
                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Mật khẩu hiện tại</label>
                        <input type="password" required value={passwords.currentPass} onChange={(e) => setPasswords({...passwords, currentPass: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="Nhập mật khẩu hiện tại" />
                      </div>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Mật khẩu mới</label>
                          <input type="password" required value={passwords.newPass} onChange={(e) => setPasswords({...passwords, newPass: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="Ít nhất 6 ký tự" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Xác nhận mật khẩu mới</label>
                          <input type="password" required value={passwords.confirmPass} onChange={(e) => setPasswords({...passwords, confirmPass: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="Nhập lại mật khẩu mới" />
                        </div>
                      </div>
                      <button type="submit" style={{ marginTop: '10px', padding: '15px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                        CẬP NHẬT MẬT KHẨU
                      </button>
                    </form>
                  </div>
                  
                </div>
              </div>
            )}

            {/* TAB 1: BÁO CÁO DOANH THU */}
            {activeTab === "overview" && (
              <div>
                <h1 style={{ marginBottom: "30px", color: "#333" }}>Báo cáo tài chính</h1>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px", marginBottom: "40px" }}>
                  <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #28a745" }}>
                    <div style={{ color: "#888", fontSize: "13px", marginBottom: "10px", fontWeight: "bold" }}>TỔNG GMV SÀN (Tiền hàng hóa)</div>
                    <div style={{ color: "#333", fontSize: "26px", fontWeight: "bold" }}>{totalGMV.toLocaleString("vi-VN")} ₫</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #6f42c1" }}>
                    <div style={{ color: "#888", fontSize: "13px", marginBottom: "5px", fontWeight: "bold" }}>LỢI NHUẬN THỰC THU (Túi Sàn)</div>
                    <div style={{ color: "#6f42c1", fontSize: "26px", fontWeight: "bold" }}>{totalPlatformRevenue.toLocaleString("vi-VN")} ₫</div>
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "5px" }}>Công thức: 5% Hoa hồng + Gói Dịch vụ</div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #007bff" }}>
                    <div style={{ color: "#888", fontSize: "13px", marginBottom: "10px", fontWeight: "bold" }}>TỔNG LƯỢNG GIAO DỊCH</div>
                    <div style={{ color: "#333", fontSize: "26px", fontWeight: "bold" }}>{productOrders.length} đơn</div>
                  </div>
                </div>

                <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "30px", color: "#333" }}>Biểu đồ Lợi nhuận Sàn (4 ngày gần nhất)</h3>
                  <div style={{ height: "300px", width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 13}} dy={10} />
                        <YAxis tickFormatter={(val) => `${val / 1000000}Tr`} axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 13}} dx={-10} />
                        <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`} cursor={{fill: 'transparent'}} />
                        <Bar dataKey="revenue" fill="#6f42c1" radius={[6, 6, 0, 0]} barSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DUYỆT GIAO DỊCH MARKETING */}
            {activeTab === "approvals" && (
              <div>
                <h1 style={{ marginBottom: "30px", color: "#333" }}>Hệ thống Duyệt Yêu cầu Kích hoạt</h1>
                
                {pendingServiceRequests.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                    <FaCheckCircle size={50} color="#28a745" style={{ marginBottom: "20px", opacity: 0.5 }} />
                    <h2 style={{ color: "#666", margin: 0 }}>Mọi thứ đã được xử lý xong!</h2>
                    <p style={{ color: "#999" }}>Không có yêu cầu nạp tiền hay kích hoạt gói dịch vụ nào đang chờ.</p>
                  </div>
                ) : (
                  <div style={{ backgroundColor: "#fff8e1", border: "1px solid #ffc107", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                    <h2 style={{ color: "#d32f2f", marginTop: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaExclamationTriangle /> {pendingServiceRequests.length} Yêu cầu đang chờ duyệt!
                    </h2>
                    <p style={{ color: "#555", fontSize: "14px" }}>Admin vui lòng mở app ngân hàng để kiểm tra sao kê. Nhấn "Đã nhận tiền" để hệ thống tự động kích hoạt dịch vụ cho Người bán.</p>
                    
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", marginTop: "15px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #ffe082" }}>
                          <th style={{ padding: "12px", color: "#555" }}>Seller Yêu cầu</th>
                          <th style={{ padding: "12px", color: "#555" }}>Nội dung gói</th>
                          <th style={{ padding: "12px", color: "#555" }}>Số tiền chuyển</th>
                          <th style={{ padding: "12px", textAlign: "center", color: "#555" }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingServiceRequests.map(req => (
                          <tr key={req.id} style={{ borderBottom: "1px solid #ffe082", backgroundColor: "white" }}>
                            <td style={{ padding: "15px", fontWeight: "bold" }}>{req.username}</td>
                            <td style={{ padding: "15px", color: "#007bff", fontWeight: "bold" }}>{req.items?.[0]?.name}</td>
                            <td style={{ padding: "15px", color: "#d70018", fontWeight: "bold", fontSize: "18px" }}>{Number(req.totalPrice).toLocaleString("vi-VN")} ₫</td>
                            <td style={{ padding: "15px", textAlign: "center", display: "flex", justifyContent: "center", gap: "10px" }}>
                              <button onClick={() => handleApproveService(req.id)} style={{ backgroundColor: "#28a745", color: "white", border: "none", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}><FaCheckCircle /> Đã nhận tiền</button>
                              <button onClick={() => handleRejectService(req.id)} style={{ backgroundColor: "#dc3545", color: "white", border: "none", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}><FaTimesCircle /> Hủy bỏ</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUẢN LÝ TÀI KHOẢN */}
            {activeTab === "users" && (
              <div>
                {showAddModal && (
                  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", width: "400px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                      <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#333", textAlign: "center" }}>Cấp Tài Khoản Mới</h2>
                      <form onSubmit={handleCreateUserSubmit}>
                        <div style={{ marginBottom: "15px" }}>
                          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Tên đăng nhập</label>
                          <input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder="Nhập tên đăng nhập..." />
                        </div>
                        <div style={{ marginBottom: "15px" }}>
                          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Mật khẩu cấp</label>
                          <input type="text" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder="Nhập mật khẩu..." />
                        </div>
                        <div style={{ marginBottom: "25px" }}>
                          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Phân quyền</label>
                          <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}>
                            <option value="USER">Khách mua</option>
                            <option value="SELLER">Người bán</option>
                            <option value="ADMIN">Quản trị viên</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                          <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 15px", backgroundColor: "#f8f9fa", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Hủy bỏ</button>
                          <button type="submit" style={{ padding: "10px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Lưu tài khoản</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                  <h1 style={{ margin: 0, color: "#333" }}>Quản lý Tài khoản</h1>
                  <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: "#007bff", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,123,255,0.3)" }}>+ Cấp tài khoản mới</button>
                </div>
                
                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #eee" }}>
                        <th style={{ padding: "15px", color: "#555" }}>Username</th>
                        <th style={{ padding: "15px", color: "#555" }}>Mật khẩu</th>
                        <th style={{ padding: "15px", color: "#555" }}>Phân quyền</th>
                        <th style={{ padding: "15px", color: "#555" }}>Trạng thái</th>
                        <th style={{ padding: "15px", textAlign: "center", color: "#555" }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Chưa có dữ liệu User</td></tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} style={{ borderBottom: "1px solid #eee", opacity: u.status === "Suspended" ? 0.6 : 1 }}>
                            <td style={{ padding: "15px", fontWeight: "bold", color: "#333" }}>{u.username}</td>
                            <td style={{ padding: "15px", color: "#007bff", fontFamily: "monospace", fontSize: "16px" }}>{u.password || "******"}</td>
                            <td style={{ padding: "15px" }}>
                              <select
                                value={u.role ? u.role.toUpperCase() : "USER"}
                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                disabled={u.status === "Suspended"}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer" }}
                              >
                                <option value="USER">Khách mua</option>
                                <option value="SELLER">Người bán</option>
                                <option value="ADMIN">Quản trị viên</option>
                              </select>
                            </td>
                            <td style={{ padding: "15px" }}>
                              {u.status === "Suspended" ? (
                                <span style={{ color: "#dc3545", backgroundColor: "#f8d7da", padding: "5px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "bold" }}>Đang bị đình chỉ</span>
                              ) : (
                                <span style={{ color: "#28a745", backgroundColor: "#d4edda", padding: "5px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "bold" }}>Hoạt động</span>
                              )}
                            </td>
                            <td style={{ padding: "15px", textAlign: "center", display: "flex", justifyContent: "center", gap: "15px" }}>
                              <button onClick={() => handleToggleSuspendUser(u.id, u.status)} style={{ background: "none", border: "none", color: u.status === "Suspended" ? "#28a745" : "#ffc107", cursor: "pointer" }} title={u.status === "Suspended" ? "Mở khóa" : "Đình chỉ"}>
                                {u.status === "Suspended" ? <FaUserCheck size={20} /> : <FaUserLock size={20} />}
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer" }} title="Xóa vĩnh viễn">
                                <FaUserMinus size={20} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* TAB 4: KIỂM DUYỆT SẢN PHẨM */}
            {activeTab === "products" && (
              <div>
                <h1 style={{ marginBottom: "30px", color: "#333" }}>Hệ thống Kiểm duyệt Hàng hóa</h1>
                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #eee", backgroundColor: "#f8f9fa" }}>
                        <th style={{ padding: "15px", color: "#555", width: "50px", textAlign: "center" }}>STT</th>
                        <th style={{ padding: "15px", color: "#555", width: "60px" }}>Ảnh</th>
                        <th style={{ padding: "15px", color: "#555" }}>Tên sản phẩm</th>
                        <th style={{ padding: "15px", color: "#555" }}>Trạng thái</th>
                        <th style={{ padding: "15px", textAlign: "center", color: "#555" }}>Kiểm duyệt & Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Chưa có sản phẩm</td></tr>
                      ) : (
                        currentProducts.map((item, index) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid #eee", backgroundColor: item.moderationStatus === "Banned" ? "#fff3f3" : "white" }}>
                            
                            <td style={{ padding: "15px", textAlign: "center", fontWeight: "bold", color: "#888" }}>
                              {indexOfFirstProduct + index + 1}
                            </td>

                            <td style={{ padding: "10px 15px" }}><img src={item.image || item.images?.[0] || "https://via.placeholder.com/50"} alt="sp" style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", border: "1px solid #ddd" }} /></td>
                            <td style={{ padding: "15px" }}>
                              <div style={{ fontWeight: "bold", color: "#333" }}>{item.name}</div>
                              {item.banReason && <div style={{ fontSize: "12px", color: "#dc3545", marginTop: "5px" }}>Lý do cấm: {item.banReason}</div>}
                            </td>
                            <td style={{ padding: "15px" }}>
                              {item.moderationStatus === "Banned" ? <span style={{ color: "red", fontWeight: "bold", fontSize: "13px" }}>Vi phạm / Cấm bán</span> : <span style={{ color: "green", fontWeight: "bold", fontSize: "13px" }}>Hợp lệ</span>}
                            </td>
                            <td style={{ padding: "15px", textAlign: "center", display: "flex", justifyContent: "center", gap: "10px" }}>
                              {item.moderationStatus === "Banned" ? (
                                <button onClick={() => handleModerateProduct(item.id, "Approved")} style={{ backgroundColor: "#28a745", border: "none", color: "white", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Cho phép bán</button>
                              ) : (
                                <button onClick={() => handleModerateProduct(item.id, "Banned")} style={{ backgroundColor: "#ffc107", border: "none", color: "#333", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "5px" }}><FaBan size={12} /> Cấm bán</button>
                              )}
                              
                              <button onClick={() => handleDeleteProductAdmin(item.id)} style={{ backgroundColor: "#dc3545", border: "none", color: "white", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <FaTrash size={12} /> Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {totalProductPages > 1 && (
                    <div style={{ marginTop: "25px", display: "flex", justifyContent: "center", gap: "5px" }}>
                      <button disabled={currentProductPage === 1} onClick={() => setCurrentProductPage((prev) => prev - 1)} style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: currentProductPage === 1 ? "#f5f5f5" : "#fff", cursor: currentProductPage === 1 ? "not-allowed" : "pointer" }}>Trước</button>
                      {Array.from({ length: totalProductPages }, (_, i) => (
                        <button key={i} onClick={() => setCurrentProductPage(i + 1)} style={{ padding: "6px 12px", backgroundColor: currentProductPage === i + 1 ? "#00d2ff" : "#fff", color: currentProductPage === i + 1 ? "#fff" : "#333", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>{i + 1}</button>
                      ))}
                      <button disabled={currentProductPage === totalProductPages} onClick={() => setCurrentProductPage((prev) => prev + 1)} style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: currentProductPage === totalProductPages ? "#f5f5f5" : "#fff", cursor: currentProductPage === totalProductPages ? "not-allowed" : "pointer" }}>Sau</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: GIÁM SÁT ĐƠN HÀNG */}
            {activeTab === "orders" && (
              <div>
                <h1 style={{ marginBottom: "30px", color: "#333" }}>Giám sát Vận hành & Phát hiện Đơn ảo</h1>
                
                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #eee" }}>
                        <th style={{ padding: "15px", color: "#555" }}>Mã ĐH</th>
                        <th style={{ padding: "15px", color: "#555" }}>Khách hàng</th>
                        <th style={{ padding: "15px", color: "#555" }}>Giá trị đơn</th>
                        <th style={{ padding: "15px", color: "#555" }}>Quy trình</th>
                        <th style={{ padding: "15px", color: "#555" }}>Cảnh báo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Chưa có đơn hàng nào</td></tr>
                      ) : (
                        currentOrders.map((order) => {
                          const isHighValue = order.totalPrice > 10000000;
                          return (
                            <tr key={order.id} style={{ borderBottom: "1px solid #eee", backgroundColor: order.isSuspicious || isHighValue ? "#fff8e1" : "white" }}>
                              <td style={{ padding: "15px", fontWeight: "bold", color: "#007bff" }}>#{order.id}</td>
                              <td style={{ padding: "15px", fontWeight: "bold" }}>{order.customerInfo?.fullName || order.username || "Khách ẩn danh"}</td>
                              <td style={{ padding: "15px", fontWeight: "bold", color: "#d70018" }}>{Number(order.totalPrice || 0).toLocaleString("vi-VN")} ₫</td>
                              <td style={{ padding: "15px" }}>
                                {order.status === "Completed" ? (
                                  <div style={{ color: "green", fontSize: "13px", fontWeight: "bold" }}>Đã giao thành công</div>
                                ) : (
                                  <div style={{ color: "orange", fontSize: "13px", fontWeight: "bold" }}>Đang trung chuyển</div>
                                )}
                              </td>
                              <td style={{ padding: "15px" }}>
                                {order.isSuspicious || isHighValue ? (
                                  <span style={{ color: "#d32f2f", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}>
                                    <FaExclamationTriangle /> {isHighValue ? "Giá trị lớn bất thường" : "Nghi ngờ gian lận"}
                                  </span>
                                ) : (
                                  <span style={{ color: "#28a745", fontSize: "12px" }}>An toàn</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <div style={{ marginTop: "25px", display: "flex", justifyContent: "center", gap: "5px" }}>
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>Trước</button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ padding: "6px 12px", backgroundColor: currentPage === i + 1 ? "#00d2ff" : "#fff", color: currentPage === i + 1 ? "#fff" : "#333", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>{i + 1}</button>
                      ))}
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)} style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: currentPage === totalPages ? "#f5f5f5" : "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>Sau</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: QUẢN LÝ VOUCHER KHUYẾN MÃI CHO TOÀN SÀN */}
            {activeTab === "vouchers" && (
              <div>
                {/* Modal Thêm Voucher Mới */}
                {showVoucherModal && (
                  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", width: "500px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                      <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#333", textAlign: "center" }}>Tạo Mã Giảm Giá Mới</h2>
                      <form onSubmit={handleCreateVoucherSubmit}>
                        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Mã Code (VD: TET2026)</label>
                            <input type="text" required value={newVoucher.code} onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Tên/Mô tả ngắn</label>
                            <input type="text" required value={newVoucher.name} onChange={(e) => setNewVoucher({...newVoucher, name: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder="VD: Khuyến mãi Tết" />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Loại giảm giá</label>
                            <select value={newVoucher.type} onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}>
                              <option value="PERCENT">Theo % (VD: 10%)</option>
                              <option value="FIXED">Trừ tiền mặt (VD: 50.000đ)</option>
                              <option value="SHIPPING">Miễn phí Vận chuyển</option>
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Mức giảm</label>
                            <input type="number" required min="1" value={newVoucher.value} onChange={(e) => setNewVoucher({...newVoucher, value: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder={newVoucher.type === 'PERCENT' ? '10' : '50000'} />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Đơn tối thiểu (VNĐ)</label>
                            <input type="number" required min="0" value={newVoucher.minSpend} onChange={(e) => setNewVoucher({...newVoucher, minSpend: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Giới hạn số lượt dùng</label>
                            <input type="number" min="1" value={newVoucher.systemLimit} onChange={(e) => setNewVoucher({...newVoucher, systemLimit: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder="Bỏ trống = Không giới hạn" />
                          </div>
                        </div>

                        <div style={{ marginBottom: "25px" }}>
                          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>Ngày hết hạn</label>
                          <input type="datetime-local" required value={newVoucher.expiryDate} onChange={(e) => setNewVoucher({...newVoucher, expiryDate: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                          <button type="button" onClick={() => setShowVoucherModal(false)} style={{ padding: "10px 15px", backgroundColor: "#f8f9fa", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Hủy bỏ</button>
                          <button type="submit" style={{ padding: "10px 15px", backgroundColor: "#ee4d2d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Phát hành Voucher</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                  <h1 style={{ margin: 0, color: "#333" }}>Quản lý Voucher Khuyến Mãi</h1>
                  <button onClick={() => setShowVoucherModal(true)} style={{ backgroundColor: "#ee4d2d", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(238, 77, 45, 0.3)", display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPlus /> Tạo Mã Mới
                  </button>
                </div>
                
                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #eee", backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: "15px", color: "#555" }}>Mã Code</th>
                        <th style={{ padding: "15px", color: "#555" }}>Mức giảm</th>
                        <th style={{ padding: "15px", color: "#555" }}>Đơn tối thiểu</th>
                        <th style={{ padding: "15px", color: "#555" }}>Lượt dùng</th>
                        <th style={{ padding: "15px", color: "#555" }}>Ngày hết hạn</th>
                        <th style={{ padding: "15px", textAlign: "center", color: "#555" }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px", color: '#888' }}>Chưa có mã Voucher nào được phát hành.</td></tr>
                      ) : (
                        vouchers.map((v, index) => {
                          const isExpired = new Date(v.expiryDate) < new Date();
                          return (
                            <tr key={index} style={{ borderBottom: "1px solid #eee", opacity: isExpired ? 0.5 : 1 }}>
                              <td style={{ padding: "15px" }}>
                                <div style={{ fontWeight: "bold", color: "#ee4d2d", fontSize: '16px' }}>{v.code}</div>
                                <div style={{ fontSize: "12px", color: "#666" }}>{v.name}</div>
                              </td>
                              <td style={{ padding: "15px", fontWeight: "bold" }}>
                                {v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')} ₫`}
                              </td>
                              <td style={{ padding: "15px", color: "#333" }}>{v.minSpend.toLocaleString('vi-VN')} ₫</td>
                              <td style={{ padding: "15px", color: "#333" }}>
                                {v.systemUsed} / {v.systemLimit === 9999 ? '∞' : v.systemLimit}
                              </td>
                              <td style={{ padding: "15px", color: isExpired ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                                {isExpired ? 'Đã hết hạn' : new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                              </td>
                              <td style={{ padding: "15px", textAlign: "center" }}>
                                <button onClick={() => handleDeleteVoucher(v.code)} style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", padding: '8px', borderRadius: '4px', backgroundColor: '#fff5f5' }} title="Thu hồi mã">
                                  <FaTrash size={16} /> Thu hồi
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;