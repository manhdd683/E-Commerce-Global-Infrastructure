import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartPie, FaBox, FaClipboardList, FaSignOutAlt, FaUsers, FaUserMinus, FaUserLock, FaUserCheck, FaBan, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaMoneyCheckAlt, FaTicketAlt, FaPlus, FaTrash, FaUserShield, FaCog, FaLock
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
  const { user } = useContext(AuthContext); 
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

  const [vouchers, setVouchers] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [newVoucher, setNewVoucher] = useState({ code: '', name: '', type: 'FIXED', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: '' });

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

      setOrders(ordersRes.data && ordersRes.data.length > 0 ? ordersRes.data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)) : MOCK_FALLBACK_ORDERS);
      setUsers(usersRes.data || []);
      loadVouchers(); 
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => { localStorage.removeItem("user"); navigate("/login"); };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirmPass) return alert("Mật khẩu xác nhận không khớp!");
    if (passwords.newPass.length < 6) return alert("Mật khẩu mới phải có ít nhất 6 ký tự!");

    try {
      const res = await apiClient.get(`${NEW_USER_API_URL}/${user.id}`);
      const currentUserData = res.data;
      await apiClient.put(`${NEW_USER_API_URL}/${user.id}`, { ...currentUserData, password: passwords.newPass });
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại để bảo mật.");
      handleLogout();
    } catch (error) { alert("Lỗi hệ thống khi cập nhật mật khẩu!"); }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return alert("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!");
    
    try {
      await apiClient.post(NEW_USER_API_URL, { ...newUser, status: "Active" });
      alert("Tạo tài khoản và cấp mật khẩu thành công!");
      setShowAddModal(false); setNewUser({ username: "", password: "", role: "USER" }); fetchData(); 
    } catch (error) { alert("Lỗi kết nối API khi tạo tài khoản!"); }
  };

  const handleChangeRole = async (userId, newRole) => {
    const targetUser = users.find((u) => u.id === userId);
    try {
      await apiClient.put(`${NEW_USER_API_URL}/${userId}`, { ...targetUser, role: newRole });
      alert("Cập nhật quyền thành công!"); fetchData(); 
    } catch (error) { alert("Không thể cập nhật quyền!"); }
  };

  const handleToggleSuspendUser = async (userId, currentStatus) => {
    const targetUser = users.find((u) => u.id === userId);
    const nextStatus = currentStatus === "Suspended" ? "Active" : "Suspended";
    const actionText = nextStatus === "Suspended" ? "Đình chỉ" : "Mở khóa";

    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`)) {
      try { await apiClient.put(`${NEW_USER_API_URL}/${userId}`, { ...targetUser, status: nextStatus }); fetchData(); } 
      catch (error) { alert("Thao tác thất bại!"); }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn dữ liệu người dùng. Tiếp tục?")) {
      try { await apiClient.delete(`${NEW_USER_API_URL}/${userId}`); fetchData(); } 
      catch (error) { alert("Xóa thất bại! Bạn cần kiểm tra lại quyền API."); }
    }
  };

  const handleModerateProduct = async (productId, status) => {
    const targetProduct = products.find((p) => p.id === productId);
    const reason = status === "Banned" ? prompt("Nhập lý do cấm bán (VD: Hàng giả, cấm bán...):") : "";
    if (status === "Banned" && !reason) return;

    try { await apiClient.put(`/products/${productId}`, { ...targetProduct, moderationStatus: status, banReason: reason }); fetchData(); } 
    catch (error) { alert("Cập nhật trạng thái kiểm duyệt thất bại!"); }
  };

  const handleDeleteProductAdmin = async (productId) => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi hệ thống. Tiếp tục?")) {
      try { await apiClient.delete(`/products/${productId}`); alert("Đã xóa sản phẩm thành công!"); fetchData(); } 
      catch (error) { alert("Xóa thất bại!"); }
    }
  };

  const handleCreateVoucherSubmit = (e) => {
    e.preventDefault();
    if (!newVoucher.code || !newVoucher.value || !newVoucher.minSpend || !newVoucher.expiryDate) return alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
    
    const currentVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
    if (currentVouchers.some(v => v.code === newVoucher.code)) return alert("Mã Code này đã tồn tại!");

    const voucherToSave = { ...newVoucher, value: Number(newVoucher.value), minSpend: Number(newVoucher.minSpend), systemLimit: Number(newVoucher.systemLimit) || 9999, systemUsed: 0, expiryDate: new Date(newVoucher.expiryDate).toISOString() };
    currentVouchers.push(voucherToSave); localStorage.setItem('system_vouchers', JSON.stringify(currentVouchers));
    alert("Tạo mã Voucher thành công!"); setShowVoucherModal(false); setNewVoucher({ code: '', name: '', type: 'FIXED', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: '' }); loadVouchers();
  };

  const handleDeleteVoucher = (code) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã ${code} không?`)) {
      const currentVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
      const updatedVouchers = currentVouchers.filter(v => v.code !== code);
      localStorage.setItem('system_vouchers', JSON.stringify(updatedVouchers)); loadVouchers();
    }
  };

  const handleApproveService = async (orderId) => {
    if (window.confirm("Xác nhận đã nhận tiền và muốn DUYỆT gói này?")) {
      try { await apiClient.put(`/orders/${orderId}`, { status: 'Completed', note: 'MARKETING - ĐÃ KÍCH HOẠT' }); alert("Duyệt thành công! Gói dịch vụ đã được kích hoạt."); fetchData(); } 
      catch (error) { alert("Lỗi khi duyệt yêu cầu!"); }
    }
  };

  const handleRejectService = async (orderId) => {
    if (window.confirm("Bạn có chắc muốn TỪ CHỐI yêu cầu này?")) {
      try { await apiClient.put(`/orders/${orderId}`, { status: 'Canceled', note: 'MARKETING - BỊ TỪ CHỐI' }); alert("Đã từ chối yêu cầu."); fetchData(); } 
      catch (error) { alert("Lỗi thao tác!"); }
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
    <div className="d-flex flex-column flex-md-row min-vh-100 bg-light">
      
      {/* STYLE ÉP KHUÔN SIDEBAR TRÊN BẢN PC CHO ADMIN */}
      <style>{`
        #admin-sidebar { width: 100%; overflow-x: auto; border-bottom: 1px solid #ddd; }
        @media (min-width: 768px) {
          #admin-sidebar { width: 260px; min-width: 260px; height: 100vh; position: sticky; top: 0; overflow-y: auto; overflow-x: hidden; border-bottom: none; }
        }
        #admin-sidebar::-webkit-scrollbar { width: 4px; height: 4px; }
        #admin-sidebar::-webkit-scrollbar-thumb { background-color: #ddd; border-radius: 4px; }
      `}</style>

      {/* ================= SIDEBAR TỰ ĐỘNG CO GIÃN ================= */}
      <div id="admin-sidebar" className="bg-white shadow-sm d-flex flex-md-column flex-shrink-0">
        <div className="p-3 border-bottom d-flex flex-row flex-md-column justify-content-between align-items-center align-items-md-center text-md-center">
          <div>
            <h2 className="fs-5 text-danger fw-black mb-1 text-uppercase">Quản trị hệ thống</h2>
            <div className="small text-muted fw-bold text-uppercase d-none d-md-block" style={{ letterSpacing: '2px' }}>Root Admin</div>
          </div>
        </div>
        
        <ul className="list-unstyled p-2 m-0 d-flex flex-row flex-md-column flex-nowrap flex-grow-1">
          {[
            { id: 'overview', icon: <FaChartPie />, label: 'Báo cáo Doanh thu' },
            { id: 'approvals', icon: <FaMoneyCheckAlt />, label: 'Duyệt Giao Dịch', badge: pendingServiceRequests.length },
            { id: 'users', icon: <FaUsers />, label: 'Phân quyền & Tài khoản' },
            { id: 'products', icon: <FaBox />, label: 'Kiểm duyệt Hàng hóa' },
            { id: 'orders', icon: <FaClipboardList />, label: 'Giám sát Đơn hàng' },
            { id: 'vouchers', icon: <FaTicketAlt />, label: 'Quản lý Voucher' },
            { id: 'profile', icon: <FaCog />, label: 'Hồ sơ Admin' }
          ].map(tab => (
            <li 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); setCurrentProductPage(1); }} 
              className={`p-2 p-md-3 mb-md-2 rounded cursor-pointer d-flex align-items-center gap-2 transition-all position-relative ${activeTab === tab.id ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-secondary'}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {tab.icon} <span className="d-none d-sm-inline">{tab.label}</span>
              {tab.badge > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ transform: 'translate(-50%, 20%)!important' }}>{tab.badge}</span>}
            </li>
          ))}
        </ul>

        <div className="p-3 border-top mt-auto d-none d-md-block">
          <button onClick={handleLogout} className="btn btn-light border w-100 fw-bold d-flex align-items-center justify-content-center gap-2 text-secondary">
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </div>

      {/* ================= NỘI DUNG CHÍNH ================= */}
      <div className="flex-grow-1 p-3 p-md-4 overflow-auto" style={{ width: '100%' }}>
        {isLoading ? (
          <div className="text-center mt-5 fs-5 text-muted">🔄 Đang đồng bộ hệ thống...</div>
        ) : (
          <>
            {/* TAB 0: HỒ SƠ ADMIN */}
            {activeTab === "profile" && (
              <div>
                <h1 className="fs-4 text-dark mb-4 fw-bold">Hồ sơ Quản trị viên</h1>
                <div className="row g-4">
                  <div className="col-12 col-lg-5">
                    <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                      <div className="d-flex align-items-center gap-3 border-bottom pb-4 mb-4">
                        <div className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex justify-content-center align-items-center" style={{ width: '80px', height: '80px', fontSize: '30px' }}>
                          <FaUserShield />
                        </div>
                        <div>
                          <h2 className="fs-5 text-dark m-0 fw-bold mb-1">{user?.username || 'Admin'}</h2>
                          <span className="badge bg-success">ROOT ADMIN</span>
                        </div>
                      </div>
                      <div className="text-muted small lh-lg">
                        <p className="mb-2"><strong>Vai trò:</strong> Quyền kiểm soát cao nhất hệ thống.</p>
                        <p className="mb-2"><strong>Trạng thái:</strong> Hoạt động bình thường.</p>
                        <p className="mb-0"><strong>Cảnh báo bảo mật:</strong> Không chia sẻ mật khẩu cho bất kỳ ai.</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-7">
                    <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
                      <h3 className="fs-5 text-dark mb-4 d-flex align-items-center gap-2 fw-bold"><FaLock className="text-danger"/> Thay đổi mật khẩu</h3>
                      <form onSubmit={handleUpdatePassword} className="d-flex flex-column gap-3">
                        <div>
                          <label className="form-label small fw-bold text-secondary">Mật khẩu hiện tại</label>
                          <input type="password" required value={passwords.currentPass} onChange={(e) => setPasswords({...passwords, currentPass: e.target.value})} className="form-control" />
                        </div>
                        <div className="row g-3">
                          <div className="col-12 col-sm-6">
                            <label className="form-label small fw-bold text-secondary">Mật khẩu mới</label>
                            <input type="password" required value={passwords.newPass} onChange={(e) => setPasswords({...passwords, newPass: e.target.value})} className="form-control" placeholder="Ít nhất 6 ký tự" />
                          </div>
                          <div className="col-12 col-sm-6">
                            <label className="form-label small fw-bold text-secondary">Xác nhận mật khẩu</label>
                            <input type="password" required value={passwords.confirmPass} onChange={(e) => setPasswords({...passwords, confirmPass: e.target.value})} className="form-control" />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-danger fw-bold mt-2 py-2">CẬP NHẬT MẬT KHẨU</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: BÁO CÁO DOANH THU */}
            {activeTab === "overview" && (
              <div>
                <h1 className="fs-4 text-dark mb-4 fw-bold">Báo cáo tài chính</h1>
                <div className="row g-4 mb-4">
                  <div className="col-12 col-md-4">
                    <div className="bg-white p-4 rounded-4 shadow-sm border-start border-success border-5 h-100">
                      <div className="text-secondary small fw-bold mb-2">TỔNG GMV SÀN (Tiền hàng)</div>
                      <div className="fs-3 text-dark fw-bold">{totalGMV.toLocaleString("vi-VN")} ₫</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="bg-white p-4 rounded-4 shadow-sm border-start border-primary border-5 h-100" style={{ borderColor: '#6f42c1!important' }}>
                      <div className="text-secondary small fw-bold mb-2">LỢI NHUẬN THỰC THU (Túi Sàn)</div>
                      <div className="fs-3 fw-bold" style={{ color: '#6f42c1' }}>{totalPlatformRevenue.toLocaleString("vi-VN")} ₫</div>
                      <div className="small text-muted mt-1">5% Hoa hồng + Gói Dịch vụ</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="bg-white p-4 rounded-4 shadow-sm border-start border-info border-5 h-100">
                      <div className="text-secondary small fw-bold mb-2">TỔNG LƯỢNG GIAO DỊCH</div>
                      <div className="fs-3 text-dark fw-bold">{productOrders.length} đơn</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-4 shadow-sm border">
                  <h3 className="fs-5 text-dark mb-4 fw-bold">Biểu đồ Lợi nhuận Sàn (4 ngày gần nhất)</h3>
                  <div style={{ height: "300px", width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 13}} dy={10} />
                        <YAxis tickFormatter={(val) => `${val / 1000000}Tr`} axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 13}} dx={-10} />
                        <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`} cursor={{fill: 'transparent'}} />
                        <Bar dataKey="revenue" fill="#6f42c1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DUYỆT GIAO DỊCH MARKETING */}
            {activeTab === "approvals" && (
              <div>
                <h1 className="fs-4 text-dark mb-4 fw-bold">Hệ thống Duyệt Yêu cầu Kích hoạt</h1>
                {pendingServiceRequests.length === 0 ? (
                  <div className="bg-white p-5 rounded-4 shadow-sm text-center border">
                    <FaCheckCircle size={50} className="text-success mb-3 opacity-50" />
                    <h2 className="fs-5 text-secondary fw-bold mb-2">Mọi thứ đã được xử lý xong!</h2>
                    <p className="text-muted small m-0">Không có yêu cầu nạp tiền hay kích hoạt gói dịch vụ nào đang chờ.</p>
                  </div>
                ) : (
                  <div className="bg-warning bg-opacity-10 border border-warning rounded-4 p-4 shadow-sm">
                    <h2 className="fs-5 text-danger fw-bold d-flex align-items-center gap-2 mb-3">
                      <FaExclamationTriangle /> {pendingServiceRequests.length} Yêu cầu đang chờ duyệt!
                    </h2>
                    <p className="text-secondary small mb-4">Admin vui lòng mở app ngân hàng để kiểm tra sao kê. Nhấn "Đã nhận tiền" để hệ thống tự động kích hoạt dịch vụ cho Người bán.</p>
                    
                    <div className="table-responsive bg-white rounded-3 shadow-sm border">
                      <table className="table align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-secondary fw-bold">Seller Yêu cầu</th>
                            <th className="text-secondary fw-bold">Nội dung gói</th>
                            <th className="text-secondary fw-bold text-nowrap">Số tiền chuyển</th>
                            <th className="text-secondary fw-bold text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingServiceRequests.map(req => (
                            <tr key={req.id}>
                              <td className="fw-bold text-dark">{req.username}</td>
                              <td className="fw-bold text-primary">{req.items?.[0]?.name}</td>
                              <td className="fw-bold text-danger fs-6 text-nowrap">{Number(req.totalPrice).toLocaleString("vi-VN")} ₫</td>
                              <td className="text-center text-nowrap">
                                <button onClick={() => handleApproveService(req.id)} className="btn btn-success btn-sm fw-bold me-2"><FaCheckCircle /> <span className="d-none d-sm-inline">Đã nhận tiền</span></button>
                                <button onClick={() => handleRejectService(req.id)} className="btn btn-danger btn-sm fw-bold"><FaTimesCircle /> <span className="d-none d-sm-inline">Hủy bỏ</span></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUẢN LÝ TÀI KHOẢN */}
            {activeTab === "users" && (
              <div>
                {/* Modal Tạo Account */}
                {showAddModal && (
                  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1050 }}>
                    <div className="bg-white p-4 rounded-4 shadow" style={{ width: "90%", maxWidth: "400px" }}>
                      <h2 className="fs-5 fw-bold text-dark text-center mb-4">Cấp Tài Khoản Mới</h2>
                      <form onSubmit={handleCreateUserSubmit}>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-secondary">Tên đăng nhập</label>
                          <input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="form-control" required />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-secondary">Mật khẩu cấp</label>
                          <input type="text" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="form-control" required />
                        </div>
                        <div className="mb-4">
                          <label className="form-label small fw-bold text-secondary">Phân quyền</label>
                          <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="form-select">
                            <option value="USER">Khách mua</option>
                            <option value="SELLER">Người bán</option>
                            <option value="ADMIN">Quản trị viên</option>
                          </select>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                          <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-light border fw-bold">Hủy bỏ</button>
                          <button type="submit" className="btn btn-primary fw-bold">Lưu tài khoản</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                  <h1 className="fs-4 fw-bold text-dark m-0">Quản lý Tài khoản</h1>
                  <button onClick={() => setShowAddModal(true)} className="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                    <FaPlus/> Cấp tài khoản
                  </button>
                </div>
                
                <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-secondary fw-bold">Username</th>
                          <th className="text-secondary fw-bold">Mật khẩu</th>
                          <th className="text-secondary fw-bold">Phân quyền</th>
                          <th className="text-secondary fw-bold text-nowrap">Trạng thái</th>
                          <th className="text-secondary fw-bold text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-4 text-muted">Chưa có dữ liệu User</td></tr>
                        ) : (
                          users.map((u) => (
                            <tr key={u.id} className={u.status === "Suspended" ? "opacity-50" : ""}>
                              <td className="fw-bold text-dark py-3">{u.username}</td>
                              <td className="text-primary font-monospace py-3">{u.password || "******"}</td>
                              <td className="py-3">
                                <select
                                  value={u.role ? u.role.toUpperCase() : "USER"}
                                  onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                  disabled={u.status === "Suspended"}
                                  className="form-select form-select-sm fw-bold cursor-pointer"
                                >
                                  <option value="USER">Khách mua</option>
                                  <option value="SELLER">Người bán</option>
                                  <option value="ADMIN">Quản trị viên</option>
                                </select>
                              </td>
                              <td className="py-3">
                                {u.status === "Suspended" ? (
                                  <span className="badge bg-danger bg-opacity-10 text-danger">Đình chỉ</span>
                                ) : (
                                  <span className="badge bg-success bg-opacity-10 text-success">Hoạt động</span>
                                )}
                              </td>
                              <td className="py-3 text-center text-nowrap">
                                <button onClick={() => handleToggleSuspendUser(u.id, u.status)} className={`btn btn-link p-0 me-3 ${u.status === "Suspended" ? "text-success" : "text-warning"}`} title={u.status === "Suspended" ? "Mở khóa" : "Đình chỉ"}>
                                  {u.status === "Suspended" ? <FaUserCheck size={20} /> : <FaUserLock size={20} />}
                                </button>
                                <button onClick={() => handleDeleteUser(u.id)} className="btn btn-link text-danger p-0" title="Xóa vĩnh viễn">
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
              </div>
            )}
            
            {/* TAB 4: KIỂM DUYỆT SẢN PHẨM */}
            {activeTab === "products" && (
              <div>
                <h1 className="fs-4 fw-bold text-dark mb-4">Hệ thống Kiểm duyệt Hàng hóa</h1>
                <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-secondary fw-bold text-center" style={{ width: "50px" }}>STT</th>
                          <th className="text-secondary fw-bold text-center" style={{ width: "60px" }}>Ảnh</th>
                          <th className="text-secondary fw-bold" style={{ minWidth: "200px" }}>Tên sản phẩm</th>
                          <th className="text-secondary fw-bold text-nowrap">Trạng thái</th>
                          <th className="text-secondary fw-bold text-center text-nowrap">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProducts.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-4 text-muted">Chưa có sản phẩm</td></tr>
                        ) : (
                          currentProducts.map((item, index) => (
                            <tr key={item.id} className={item.moderationStatus === "Banned" ? "bg-danger bg-opacity-10" : ""}>
                              <td className="text-center fw-bold text-muted py-3">{indexOfFirstProduct + index + 1}</td>
                              <td className="text-center py-3"><img src={item.image || item.images?.[0] || "https://via.placeholder.com/50"} alt="sp" className="rounded border object-fit-contain bg-white" style={{ width: "40px", height: "40px" }} /></td>
                              <td className="py-3">
                                <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '250px' }}>{item.name}</div>
                                {item.banReason && <div className="small text-danger mt-1">Lý do cấm: {item.banReason}</div>}
                              </td>
                              <td className="py-3 text-nowrap">
                                {item.moderationStatus === "Banned" ? <span className="fw-bold text-danger small">Vi phạm</span> : <span className="fw-bold text-success small">Hợp lệ</span>}
                              </td>
                              <td className="py-3 text-center text-nowrap">
                                {item.moderationStatus === "Banned" ? (
                                  <button onClick={() => handleModerateProduct(item.id, "Approved")} className="btn btn-success btn-sm fw-bold me-2">Cho phép bán</button>
                                ) : (
                                  <button onClick={() => handleModerateProduct(item.id, "Banned")} className="btn btn-warning btn-sm fw-bold me-2"><FaBan /> Cấm bán</button>
                                )}
                                <button onClick={() => handleDeleteProductAdmin(item.id)} className="btn btn-danger btn-sm fw-bold"><FaTrash /> Xóa</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalProductPages > 1 && (
                    <div className="d-flex justify-content-center gap-2 p-3 border-top bg-white">
                      <button disabled={currentProductPage === 1} onClick={() => setCurrentProductPage((prev) => prev - 1)} className="btn btn-light border fw-bold">Trước</button>
                      {Array.from({ length: totalProductPages }, (_, i) => (
                        <button key={i} onClick={() => setCurrentProductPage(i + 1)} className={`btn border fw-bold ${currentProductPage === i + 1 ? 'btn-info text-white' : 'btn-light'}`}>{i + 1}</button>
                      ))}
                      <button disabled={currentProductPage === totalProductPages} onClick={() => setCurrentProductPage((prev) => prev + 1)} className="btn btn-light border fw-bold">Sau</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: GIÁM SÁT ĐƠN HÀNG */}
            {activeTab === "orders" && (
              <div>
                <h1 className="fs-4 fw-bold text-dark mb-4">Giám sát Vận hành & Phát hiện Đơn ảo</h1>
                <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-secondary fw-bold text-nowrap">Mã ĐH</th>
                          <th className="text-secondary fw-bold text-nowrap">Khách hàng</th>
                          <th className="text-secondary fw-bold text-nowrap">Giá trị đơn</th>
                          <th className="text-secondary fw-bold text-nowrap">Quy trình</th>
                          <th className="text-secondary fw-bold text-nowrap">Cảnh báo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrders.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-4 text-muted">Chưa có đơn hàng nào</td></tr>
                        ) : (
                          currentOrders.map((order) => {
                            const isHighValue = order.totalPrice > 10000000;
                            return (
                              <tr key={order.id} className={order.isSuspicious || isHighValue ? "bg-warning bg-opacity-10" : ""}>
                                <td className="fw-bold text-primary py-3">#{order.id}</td>
                                <td className="fw-bold text-dark py-3">{order.customerInfo?.fullName || order.username || "Khách ẩn danh"}</td>
                                <td className="fw-bold text-danger py-3 text-nowrap">{Number(order.totalPrice || 0).toLocaleString("vi-VN")} ₫</td>
                                <td className="py-3">
                                  {order.status === "Completed" ? (
                                    <span className="fw-bold text-success small">Đã giao thành công</span>
                                  ) : (
                                    <span className="fw-bold text-warning small">Đang trung chuyển</span>
                                  )}
                                </td>
                                <td className="py-3">
                                  {order.isSuspicious || isHighValue ? (
                                    <span className="badge bg-danger bg-opacity-10 text-danger fw-bold d-inline-flex align-items-center gap-1">
                                      <FaExclamationTriangle /> {isHighValue ? "Giá trị lớn bất thường" : "Nghi ngờ gian lận"}
                                    </span>
                                  ) : (
                                    <span className="badge bg-success bg-opacity-10 text-success fw-bold">An toàn</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center gap-2 p-3 border-top bg-white">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className="btn btn-light border fw-bold">Trước</button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setCurrentPage(i + 1)} className={`btn border fw-bold ${currentPage === i + 1 ? 'btn-info text-white' : 'btn-light'}`}>{i + 1}</button>
                      ))}
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)} className="btn btn-light border fw-bold">Sau</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: QUẢN LÝ VOUCHER TOÀN SÀN */}
            {activeTab === "vouchers" && (
              <div>
                {showVoucherModal && (
                  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1050 }}>
                    <div className="bg-white p-4 rounded-4 shadow" style={{ width: "90%", maxWidth: "500px" }}>
                      <h2 className="fs-5 fw-bold text-dark text-center mb-4">Tạo Mã Giảm Giá Mới</h2>
                      <form onSubmit={handleCreateVoucherSubmit} className="d-flex flex-column gap-3">
                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label small fw-bold text-secondary mb-1">Mã Code</label>
                            <input type="text" required value={newVoucher.code} onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} className="form-control" placeholder="VD: TET2026" />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-bold text-secondary mb-1">Mô tả ngắn</label>
                            <input type="text" required value={newVoucher.name} onChange={(e) => setNewVoucher({...newVoucher, name: e.target.value})} className="form-control" placeholder="VD: Khuyến mãi Tết" />
                          </div>
                        </div>
                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label small fw-bold text-secondary mb-1">Loại giảm giá</label>
                            <select value={newVoucher.type} onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})} className="form-select">
                              <option value="PERCENT">Theo % (VD: 10%)</option>
                              <option value="FIXED">Trừ tiền mặt</option>
                              <option value="SHIPPING">Miễn phí Vận chuyển</option>
                            </select>
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-bold text-secondary mb-1">Mức giảm</label>
                            <input type="number" required min="1" value={newVoucher.value} onChange={(e) => setNewVoucher({...newVoucher, value: e.target.value})} className="form-control" placeholder={newVoucher.type === 'PERCENT' ? '10' : '50000'} />
                          </div>
                        </div>
                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label small fw-bold text-secondary mb-1">Đơn tối thiểu</label>
                            <input type="number" required min="0" value={newVoucher.minSpend} onChange={(e) => setNewVoucher({...newVoucher, minSpend: e.target.value})} className="form-control" />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-bold text-secondary mb-1">Số lượt dùng</label>
                            <input type="number" min="1" value={newVoucher.systemLimit} onChange={(e) => setNewVoucher({...newVoucher, systemLimit: e.target.value})} className="form-control" placeholder="Trống = Vô hạn" />
                          </div>
                        </div>
                        <div>
                          <label className="form-label small fw-bold text-secondary mb-1">Ngày hết hạn</label>
                          <input type="datetime-local" required value={newVoucher.expiryDate} onChange={(e) => setNewVoucher({...newVoucher, expiryDate: e.target.value})} className="form-control" />
                        </div>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <button type="button" onClick={() => setShowVoucherModal(false)} className="btn btn-light border fw-bold">Hủy bỏ</button>
                          <button type="submit" className="btn btn-danger fw-bold">Phát hành</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                  <h1 className="fs-4 fw-bold text-dark m-0">Quản lý Voucher Hệ Thống</h1>
                  <button onClick={() => setShowVoucherModal(true)} className="btn btn-danger fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                    <FaPlus /> Tạo Mã Mới
                  </button>
                </div>
                
                <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-secondary fw-bold text-nowrap">Mã Code</th>
                          <th className="text-secondary fw-bold text-nowrap">Mức giảm</th>
                          <th className="text-secondary fw-bold text-nowrap">Đơn tối thiểu</th>
                          <th className="text-secondary fw-bold text-nowrap text-center">Lượt dùng</th>
                          <th className="text-secondary fw-bold text-nowrap text-center">Hết hạn</th>
                          <th className="text-secondary fw-bold text-nowrap text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vouchers.length === 0 ? (
                          <tr><td colSpan="6" className="text-center py-4 text-muted">Chưa có mã Voucher nào được phát hành.</td></tr>
                        ) : (
                          vouchers.map((v, index) => {
                            const isExpired = new Date(v.expiryDate) < new Date();
                            return (
                              <tr key={index} className={isExpired ? "opacity-50" : ""}>
                                <td className="py-3">
                                  <div className="fw-bold text-danger fs-6">{v.code}</div>
                                  <div className="small text-muted">{v.name}</div>
                                </td>
                                <td className="fw-bold text-dark py-3 text-nowrap">{v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')} ₫`}</td>
                                <td className="text-dark py-3 text-nowrap">{v.minSpend.toLocaleString('vi-VN')} ₫</td>
                                <td className="text-dark py-3 text-center text-nowrap">{v.systemUsed} / {v.systemLimit === 9999 ? '∞' : v.systemLimit}</td>
                                <td className={`fw-bold py-3 text-center text-nowrap ${isExpired ? 'text-danger' : 'text-success'}`}>{isExpired ? 'Đã hết hạn' : new Date(v.expiryDate).toLocaleDateString('vi-VN')}</td>
                                <td className="text-center py-3">
                                  <button onClick={() => handleDeleteVoucher(v.code)} className="btn btn-sm btn-outline-danger fw-bold m-auto d-flex align-items-center gap-1" title="Thu hồi mã">
                                    <FaTrash /> Thu hồi
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
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;