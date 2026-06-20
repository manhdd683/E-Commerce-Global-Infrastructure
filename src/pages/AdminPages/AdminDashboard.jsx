import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartPie, FaBox, FaClipboardList, FaSignOutAlt, FaUsers, FaUserMinus, FaUserLock, FaUserCheck, FaBan, FaExclamationTriangle, FaCheckCircle, FaMoneyCheckAlt, FaTicketAlt, FaPlus, FaTrash, FaUserShield, FaCog, FaLock, FaFileExcel, FaBullhorn, FaMoneyBillWave
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import apiClient from "../../api/apiClient";
import { AuthContext } from "../../context/AuthContext";

const NEW_USER_API_URL = "https://6a2e651ac9776ca6c0c48fe5.mockapi.io/users";

const MOCK_FALLBACK_ORDERS = [
  { id: "DH01", orderDate: "2026-06-10T10:00:00", customerInfo: { fullName: "Nguyễn Văn A" }, totalPrice: 1500000, status: "Completed", isSuspicious: false },
  { id: "DH02", orderDate: "2026-06-11T14:30:00", customerInfo: { fullName: "Trần Thị B" }, totalPrice: 35030000, status: "Completed", isSuspicious: false },
  { id: "DH03", orderDate: "2026-06-12T09:15:00", customerInfo: { fullName: "Lê Văn C" }, totalPrice: 500000, status: "Completed", isSuspicious: false },
  { id: "DH04", orderDate: "2026-06-13T16:45:00", customerInfo: { fullName: "Phạm Thị D" }, totalPrice: 12000000, status: "Processing", isSuspicious: true },
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

  const [packages, setPackages] = useState([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [newPackage, setNewPackage] = useState({ id: '', name: '', price: '', description: '', type: 'FREESHIP' });

  const [passwords, setPasswords] = useState({ currentPass: '', newPass: '', confirmPass: '' });

  // TẢI DỮ LIỆU
  const loadVouchersAndPackages = () => {
    const savedVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
    setVouchers(savedVouchers);

    const defaultPackages = [
      { id: 'PKG1', name: 'Gói Freeship Extra', price: 500000, description: 'Hỗ trợ phí vận chuyển cho khách hàng. Giúp Shop tăng tỷ lệ chuyển đổi đơn hàng lên tới 30%.', type: 'FREESHIP' },
      { id: 'PKG2', name: 'Quảng cáo Khám phá', price: 100000, description: 'Đẩy sản phẩm lên trang chủ và các vị trí nổi bật nhất. Tính phí theo mỗi lượt click (CPC).', type: 'ADS' }
    ];
    const savedPackages = JSON.parse(localStorage.getItem('system_packages')) || defaultPackages;
    setPackages(savedPackages);
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
      loadVouchersAndPackages(); 
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // XỬ LÝ TÀI KHOẢN
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

  // XỬ LÝ SẢN PHẨM & DỊCH VỤ
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
    alert("Tạo mã Voucher thành công!"); setShowVoucherModal(false); setNewVoucher({ code: '', name: '', type: 'FIXED', value: '', minSpend: '', expiryDate: '', systemLimit: '', description: '' }); loadVouchersAndPackages();
  };

  const handleDeleteVoucher = (code) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã ${code} không?`)) {
      const currentVouchers = JSON.parse(localStorage.getItem('system_vouchers')) || [];
      const updatedVouchers = currentVouchers.filter(v => v.code !== code);
      localStorage.setItem('system_vouchers', JSON.stringify(updatedVouchers)); loadVouchersAndPackages();
    }
  };

  const handleSavePackage = (e) => {
    e.preventDefault();
    let updatedPackages;
    if (newPackage.id) {
      updatedPackages = packages.map(p => p.id === newPackage.id ? { ...newPackage, price: Number(newPackage.price) } : p);
    } else {
      updatedPackages = [...packages, { ...newPackage, id: 'PKG' + new Date().getTime(), price: Number(newPackage.price) }];
    }
    localStorage.setItem('system_packages', JSON.stringify(updatedPackages));
    setPackages(updatedPackages); setShowPackageModal(false);
    setNewPackage({ id: '', name: '', price: '', description: '', type: 'FREESHIP' });
    alert("Lưu gói dịch vụ thành công!");
  };

  const handleDeletePackage = (id) => {
    if (window.confirm("Bạn có chắc muốn ngừng bán gói dịch vụ này?")) {
      const updatedPackages = packages.filter(p => p.id !== id);
      localStorage.setItem('system_packages', JSON.stringify(updatedPackages));
      setPackages(updatedPackages);
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

  const handleExportFinanceToExcel = () => {
    const completedProductOrders = orders.filter(o => o.status === 'Completed' && !(o.note && o.note.includes("MARKETING")));
    if (completedProductOrders.length === 0) return alert("Không có dữ liệu đơn hàng thành công để xuất!");
    const headers = ["Ma_Don_Hang", "Khach_Hang", "Tong_Tien(VND)", "Loi_Nhuan_San(5%)", "Ngay_Giao_Dich"];
    const rows = completedProductOrders.map(order => [
      `#${order.id}`,
      order.customerInfo?.fullName || order.username || 'Khách ẩn danh',
      order.totalPrice || 0,
      (order.totalPrice || 0) * 0.05,
      new Date(order.orderDate).toLocaleDateString('vi-VN')
    ].join(","));
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BaoCao_LoiNhuan_San_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CÁC BIẾN TÍNH TOÁN HIỂN THỊ
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
    <div className="d-flex flex-column flex-md-row vh-100 w-100 bg-light" style={{ overflowX: 'hidden' }}>
      <style>{`
        #admin-sidebar { width: 100%; overflow-x: auto; border-bottom: 1px solid #ddd; }
        @media (min-width: 768px) {
          #admin-sidebar { width: 260px; min-width: 260px; height: 100vh; position: sticky; top: 0; overflow-y: auto; overflow-x: hidden; border-bottom: none; }
        }
        #admin-sidebar::-webkit-scrollbar { width: 4px; height: 4px; }
        #admin-sidebar::-webkit-scrollbar-thumb { background-color: #ddd; border-radius: 4px; }
        
        .dashboard-content { padding: 20px; width: 100%; height: 100vh; overflow-y: auto; overflow-x: hidden; }
        @media (min-width: 768px) { .dashboard-content { padding: 30px 40px; } }
        
        .content-card { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f0f0f0; padding: 24px; }

        .modern-table th { background-color: #f8f9fa !important; border-bottom: 2px solid #eaeaea !important; padding: 16px !important;}
        .modern-table td { border-bottom: 1px solid #f2f2f2; vertical-align: middle; padding: 16px !important;}
        .modern-table tbody tr:hover { background-color: #fcfcfc; }
      `}</style>

      {/* SIDEBAR */}
      <div id="admin-sidebar" className="bg-white shadow-sm d-flex flex-md-column flex-shrink-0">
        <div className="p-4 border-bottom d-flex flex-row flex-md-column justify-content-between align-items-center align-items-md-center text-md-center">
          <div>
            <h2 className="fs-5 text-danger fw-black mb-1 text-uppercase">Quản trị hệ thống</h2>
            <div className="small text-muted fw-bold text-uppercase d-none d-md-block" style={{ letterSpacing: '1px' }}>Root Admin</div>
          </div>
        </div>
        
        <ul className="list-unstyled p-3 m-0 d-flex flex-row flex-md-column flex-nowrap flex-grow-1 gap-1">
          {[
            { id: 'overview', icon: <FaChartPie />, label: 'Báo cáo Doanh thu' },
            { id: 'approvals', icon: <FaMoneyCheckAlt />, label: 'Duyệt Giao Dịch', badge: pendingServiceRequests.length },
            { id: 'packages', icon: <FaBullhorn />, label: 'Gói Dịch Vụ' },
            { id: 'users', icon: <FaUsers />, label: 'Phân quyền & Tài khoản' },
            { id: 'products', icon: <FaBox />, label: 'Kiểm duyệt Hàng hóa' },
            { id: 'orders', icon: <FaClipboardList />, label: 'Giám sát Đơn hàng' },
            { id: 'vouchers', icon: <FaTicketAlt />, label: 'Quản lý Voucher' },
            { id: 'profile', icon: <FaCog />, label: 'Hồ sơ Admin' }
          ].map(tab => (
            <li 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); setCurrentProductPage(1); }} 
              className={`p-3 rounded-3 cursor-pointer d-flex align-items-center gap-3 transition-all position-relative ${activeTab === tab.id ? 'bg-danger text-white fw-bold shadow-sm' : 'text-secondary hover-bg-light'}`}
              style={{ whiteSpace: 'nowrap', fontSize: '15px' }}
            >
              <div style={{ fontSize: '18px' }}>{tab.icon}</div>
              <span className="d-none d-sm-inline">{tab.label}</span>
              {tab.badge > 0 && <span className="position-absolute top-50 end-0 translate-middle-y me-3 badge rounded-pill bg-white text-danger shadow-sm">{tab.badge}</span>}
            </li>
          ))}
        </ul>

        <div className="p-4 border-top mt-auto d-none d-md-block">
          <button onClick={handleLogout} className="btn btn-light border w-100 fw-bold d-flex align-items-center justify-content-center gap-2 text-secondary rounded-pill">
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="dashboard-content flex-grow-1">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {isLoading ? (
            <div className="text-center mt-5 fs-5 text-muted">
              <div className="spinner-border text-danger mb-3" role="status"></div>
              <div>Đang đồng bộ hệ thống...</div>
            </div>
          ) : (
            <>
              {/* TAB 0: HỒ SƠ ADMIN */}
              {activeTab === "profile" && (
                <div>
                  <h1 className="fs-3 text-dark mb-4 fw-black">Hồ sơ Quản trị viên</h1>
                  <div className="row g-4">
                    <div className="col-12 col-lg-5">
                      <div className="content-card p-5 h-100">
                        <div className="d-flex flex-column align-items-center text-center gap-3 border-bottom pb-4 mb-4">
                          <div className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex justify-content-center align-items-center" style={{ width: '100px', height: '100px', fontSize: '40px' }}>
                            <FaUserShield />
                          </div>
                          <div>
                            <h2 className="fs-4 text-dark m-0 fw-bold mb-2">{user?.username || 'Admin'}</h2>
                            <span className="badge bg-success px-3 py-2 rounded-pill shadow-sm">ROOT ADMIN</span>
                          </div>
                        </div>
                        <div className="text-muted small lh-lg">
                          <p className="mb-2 d-flex justify-content-between"><strong>Vai trò:</strong> <span>Quyền kiểm soát cao nhất</span></p>
                          <p className="mb-2 d-flex justify-content-between"><strong>Trạng thái:</strong> <span className="text-success fw-bold">Hoạt động</span></p>
                          <p className="mb-0 text-danger text-center mt-4 bg-danger bg-opacity-10 p-2 rounded-3">Cảnh báo: Không chia sẻ mật khẩu!</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-lg-7">
                      <div className="content-card p-5 h-100">
                        <h3 className="fs-5 text-dark mb-4 d-flex align-items-center gap-2 fw-bold"><FaLock className="text-danger"/> Đổi mật khẩu bảo mật</h3>
                        <form onSubmit={handleUpdatePassword} className="d-flex flex-column gap-4">
                          <div>
                            <label className="form-label small fw-bold text-secondary text-uppercase" style={{ letterSpacing: '1px' }}>Mật khẩu hiện tại</label>
                            <input type="password" required value={passwords.currentPass} onChange={(e) => setPasswords({...passwords, currentPass: e.target.value})} className="form-control form-control-lg bg-light border-0" />
                          </div>
                          <div className="row g-4">
                            <div className="col-12 col-sm-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase" style={{ letterSpacing: '1px' }}>Mật khẩu mới</label>
                              <input type="password" required value={passwords.newPass} onChange={(e) => setPasswords({...passwords, newPass: e.target.value})} className="form-control form-control-lg bg-light border-0" placeholder="Ít nhất 6 ký tự" />
                            </div>
                            <div className="col-12 col-sm-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase" style={{ letterSpacing: '1px' }}>Xác nhận mật khẩu</label>
                              <input type="password" required value={passwords.confirmPass} onChange={(e) => setPasswords({...passwords, confirmPass: e.target.value})} className="form-control form-control-lg bg-light border-0" />
                            </div>
                          </div>
                          <button type="submit" className="btn btn-danger btn-lg fw-bold mt-3 rounded-pill shadow-sm">CẬP NHẬT MẬT KHẨU</button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: BÁO CÁO DOANH THU */}
              {activeTab === "overview" && (
                <div>
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                    <h1 className="fs-3 text-dark m-0 fw-black">Báo cáo tài chính</h1>
                    <button onClick={handleExportFinanceToExcel} className="btn btn-outline-success fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2">
                      <FaFileExcel /> Xuất Excel Lợi Nhuận
                    </button>
                  </div>
                  
                  <div className="row g-4 mb-4">
                    <div className="col-12 col-md-4">
                      <div className="content-card h-100 d-flex align-items-center gap-4 border-0 shadow-sm">
                        <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0" style={{width: '64px', height: '64px'}}>
                          <FaMoneyBillWave size={28} />
                        </div>
                        <div>
                          <div className="text-secondary small fw-bold mb-1 text-uppercase" style={{ letterSpacing: '1px' }}>Tổng GMV (Tiền hàng)</div>
                          <div className="fs-3 text-dark fw-black">{totalGMV.toLocaleString("vi-VN")} ₫</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="content-card h-100 d-flex align-items-center gap-4 border-0 shadow-sm">
                        <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0" style={{width: '64px', height: '64px'}}>
                          <FaChartPie size={28} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-secondary small fw-bold mb-1 text-uppercase" style={{ letterSpacing: '1px' }}>Lợi nhuận Sàn</div>
                          <div className="fs-3 text-dark fw-black mb-1">{totalPlatformRevenue.toLocaleString("vi-VN")} ₫</div>
                          <div className="small text-muted">Gồm hoa hồng & Dịch vụ</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="content-card h-100 d-flex align-items-center gap-4 border-0 shadow-sm">
                        <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0" style={{width: '64px', height: '64px'}}>
                          <FaBox size={28} />
                        </div>
                        <div>
                          <div className="text-secondary small fw-bold mb-1 text-uppercase" style={{ letterSpacing: '1px' }}>Tổng đơn hoàn thành</div>
                          <div className="fs-3 text-dark fw-black">{productOrders.length} <span className="fs-6 text-muted fw-normal">đơn</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="content-card p-4 p-md-5">
                    <h3 className="fs-5 text-dark mb-4 fw-bold">Biểu đồ Lợi nhuận Sàn (4 ngày gần nhất)</h3>
                    <div style={{ height: "350px", width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 13, fontWeight: 500}} dy={10} />
                          <YAxis tickFormatter={(val) => `${val / 1000000}Tr`} width={85} axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 13}} dx={-10} />
                          <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`} cursor={{fill: '#f8f9fa'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="revenue" fill="#0d6efd" radius={[8, 8, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DUYỆT GIAO DỊCH MARKETING */}
              {activeTab === "approvals" && (
                <div>
                  <h1 className="fs-3 text-dark mb-4 fw-black">Duyệt yêu cầu dịch vụ</h1>
                  {pendingServiceRequests.length === 0 ? (
                    <div className="bg-white p-5 rounded-4 shadow-sm text-center border-0 py-5">
                      <FaCheckCircle size={60} className="text-success mb-3 opacity-50" />
                      <h2 className="fs-4 text-dark fw-bold mb-2">Mọi thứ đã được xử lý xong!</h2>
                      <p className="text-muted m-0">Không có yêu cầu nạp tiền hay kích hoạt gói dịch vụ nào đang chờ.</p>
                    </div>
                  ) : (
                    <div className="content-card border-top border-warning border-5 p-0 overflow-hidden">
                      <div className="p-4 bg-white border-bottom">
                        <h2 className="fs-5 text-warning fw-bold d-flex align-items-center gap-2 mb-2">
                          <FaExclamationTriangle /> Cần xử lý: {pendingServiceRequests.length} yêu cầu
                        </h2>
                        <p className="text-secondary small m-0">Vui lòng kiểm tra sao kê ngân hàng trước khi bấm "Đã nhận tiền" để kích hoạt gói cho Seller.</p>
                      </div>
                      
                      <div className="table-responsive">
                        <table className="table modern-table mb-0 w-100">
                          <thead className="text-uppercase small text-secondary fw-bold">
                            <tr>
                              <th>Seller Yêu cầu</th>
                              <th>Nội dung gói</th>
                              <th className="text-nowrap">Số tiền chuyển</th>
                              <th className="text-end">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingServiceRequests.map(req => (
                              <tr key={req.id}>
                                <td className="fw-bold text-dark py-3">{req.username}</td>
                                <td className="fw-bold text-primary py-3">{req.items?.[0]?.name}</td>
                                <td className="fw-bold text-danger fs-6 text-nowrap py-3">{Number(req.totalPrice).toLocaleString("vi-VN")} ₫</td>
                                <td className="text-end text-nowrap py-3">
                                  <button onClick={() => handleApproveService(req.id)} className="btn btn-success btn-sm fw-bold me-2 rounded-pill px-3 shadow-sm">Đã nhận tiền</button>
                                  <button onClick={() => handleRejectService(req.id)} className="btn btn-outline-danger btn-sm fw-bold rounded-pill px-3">Từ chối</button>
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

              {/* TAB GÓI DỊCH VỤ MARKETING */}
              {activeTab === "packages" && (
                <div>
                  {showPackageModal && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050, backdropFilter: 'blur(3px)' }}>
                      <div className="bg-white p-5 rounded-4 shadow-lg" style={{ width: "90%", maxWidth: "500px" }}>
                        <h2 className="fs-4 fw-black text-dark text-center mb-4">{newPackage.id ? 'Sửa Gói Dịch Vụ' : 'Tạo Gói Dịch Vụ Mới'}</h2>
                        <form onSubmit={handleSavePackage} className="d-flex flex-column gap-3">
                          <div>
                            <label className="form-label small fw-bold text-secondary text-uppercase">Tên gói</label>
                            <input type="text" required value={newPackage.name} onChange={(e) => setNewPackage({...newPackage, name: e.target.value})} className="form-control bg-light border-0" placeholder="VD: Gói Freeship Extra" />
                          </div>
                          <div className="row g-3">
                            <div className="col-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase">Phân loại</label>
                              <select value={newPackage.type} onChange={(e) => setNewPackage({...newPackage, type: e.target.value})} className="form-select bg-light border-0 fw-bold">
                                <option value="FREESHIP">Freeship Extra</option>
                                <option value="ADS">Quảng Cáo</option>
                                <option value="FLASH_SALE">Flash Sale</option>
                                <option value="OTHER">Dịch vụ khác</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase">Giá bán (VNĐ)</label>
                              <input type="number" required min="0" value={newPackage.price} onChange={(e) => setNewPackage({...newPackage, price: e.target.value})} className="form-control bg-light border-0 fw-bold text-danger" />
                            </div>
                          </div>
                          <div>
                            <label className="form-label small fw-bold text-secondary text-uppercase">Mô tả lợi ích</label>
                            <textarea rows="3" required value={newPackage.description} onChange={(e) => setNewPackage({...newPackage, description: e.target.value})} className="form-control bg-light border-0" placeholder="Chi tiết lợi ích của gói..."></textarea>
                          </div>
                          <div className="d-flex justify-content-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowPackageModal(false)} className="btn btn-light fw-bold px-4 rounded-pill">Hủy</button>
                            <button type="submit" className="btn btn-danger fw-bold px-4 rounded-pill shadow-sm">Lưu Gói</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                    <h1 className="fs-3 fw-black text-dark m-0">Quản lý Gói Marketing</h1>
                    <button onClick={() => { setNewPackage({ id: '', name: '', price: '', description: '', type: 'FREESHIP' }); setShowPackageModal(true); }} className="btn btn-danger fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2">
                      <FaPlus /> Thêm Gói Mới
                    </button>
                  </div>

                  <div className="row g-4">
                    {packages.length === 0 ? (
                      <div className="col-12 text-center text-muted py-5">Hệ thống chưa có gói dịch vụ nào.</div>
                    ) : (
                      packages.map(pkg => (
                        <div key={pkg.id} className="col-12 col-md-6 col-lg-4">
                          <div className="content-card p-4 h-100 d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <h3 className={`fs-5 fw-black ${pkg.type === 'FREESHIP' ? 'text-danger' : 'text-primary'}`}>{pkg.name}</h3>
                              <span className={`badge ${pkg.type === 'FREESHIP' ? 'bg-danger' : 'bg-primary'} bg-opacity-10 ${pkg.type === 'FREESHIP' ? 'text-danger' : 'text-primary'}`}>{pkg.type}</span>
                            </div>
                            <p className="text-secondary small lh-lg flex-grow-1">{pkg.description}</p>
                            <div className="fw-black text-dark fs-4 mb-3">{Number(pkg.price).toLocaleString('vi-VN')} ₫</div>
                            <div className="d-flex gap-2">
                              <button onClick={() => { setNewPackage(pkg); setShowPackageModal(true); }} className="btn btn-light border fw-bold flex-grow-1 rounded-pill">Sửa</button>
                              <button onClick={() => handleDeletePackage(pkg.id)} className="btn btn-outline-danger fw-bold flex-grow-1 rounded-pill">Xóa</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: QUẢN LÝ TÀI KHOẢN */}
              {activeTab === "users" && (
                <div>
                  {showAddModal && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050, backdropFilter: 'blur(3px)' }}>
                      <div className="bg-white p-5 rounded-4 shadow-lg" style={{ width: "90%", maxWidth: "450px" }}>
                        <h2 className="fs-4 fw-black text-dark text-center mb-4">Cấp Tài Khoản Mới</h2>
                        <form onSubmit={handleCreateUserSubmit}>
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-secondary text-uppercase">Tên đăng nhập</label>
                            <input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="form-control form-control-lg bg-light border-0" required />
                          </div>
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-secondary text-uppercase">Mật khẩu cấp</label>
                            <input type="text" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="form-control form-control-lg bg-light border-0" required />
                          </div>
                          <div className="mb-4">
                            <label className="form-label small fw-bold text-secondary text-uppercase">Phân quyền</label>
                            <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="form-select form-select-lg bg-light border-0 fw-bold text-dark">
                              <option value="USER">Khách mua (USER)</option>
                              <option value="SELLER">Người bán (SELLER)</option>
                              <option value="ADMIN">Quản trị viên (ADMIN)</option>
                            </select>
                          </div>
                          <div className="d-flex justify-content-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-light fw-bold px-4 rounded-pill">Hủy</button>
                            <button type="submit" className="btn btn-primary fw-bold px-4 rounded-pill shadow-sm">Khởi tạo</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                    <h1 className="fs-3 fw-black text-dark m-0">Quản lý Tài khoản</h1>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2">
                      <FaPlus/> Cấp tài khoản
                    </button>
                  </div>
                  
                  <div className="content-card p-0 overflow-hidden">
                    <div className="table-responsive">
                      <table className="table modern-table align-middle w-100 mb-0">
                        <thead className="text-uppercase small text-secondary fw-bold">
                          <tr>
                            <th>Tên người dùng</th>
                            <th>Mật khẩu</th>
                            <th>Phân quyền</th>
                            <th className="text-center">Trạng thái</th>
                            <th className="text-end">Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có dữ liệu người dùng</td></tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u.id} className={u.status === "Suspended" ? "opacity-50" : ""}>
                                <td className="fw-bold text-dark">{u.username}</td>
                                <td className="text-primary font-monospace fw-bold">{u.password || "N/A"}</td>
                                <td>
                                  <select
                                    value={u.role ? u.role.toUpperCase() : "USER"}
                                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                    disabled={u.status === "Suspended"}
                                    className="form-select form-select-sm fw-bold bg-light border-0 shadow-none w-auto cursor-pointer rounded-pill px-3"
                                  >
                                    <option value="USER">Khách mua</option>
                                    <option value="SELLER">Người bán</option>
                                    <option value="ADMIN">Quản trị viên</option>
                                  </select>
                                </td>
                                <td className="text-center">
                                  {u.status === "Suspended" ? (
                                    <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">Đình chỉ</span>
                                  ) : (
                                    <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">Hoạt động</span>
                                  )}
                                </td>
                                <td className="text-end text-nowrap">
                                  <button onClick={() => handleToggleSuspendUser(u.id, u.status)} className={`btn btn-sm rounded-circle me-2 ${u.status === "Suspended" ? "btn-success" : "btn-warning"}`} style={{ width: '32px', height: '32px' }} title={u.status === "Suspended" ? "Mở khóa" : "Đình chỉ"}>
                                    {u.status === "Suspended" ? <FaUserCheck /> : <FaUserLock className="text-white" />}
                                  </button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="btn btn-sm btn-danger rounded-circle shadow-sm" style={{ width: '32px', height: '32px' }} title="Xóa vĩnh viễn">
                                    <FaUserMinus />
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
                  <h1 className="fs-3 fw-black text-dark mb-4">Kiểm duyệt Hàng hóa</h1>
                  <div className="content-card p-0 overflow-hidden">
                    <div className="table-responsive">
                      <table className="table modern-table align-middle w-100 mb-0">
                        <thead className="text-uppercase small text-secondary fw-bold">
                          <tr>
                            <th className="text-center" style={{ width: "60px" }}>STT</th>
                            <th className="text-center" style={{ width: "80px" }}>Ảnh</th>
                            <th style={{ minWidth: "250px" }}>Tên sản phẩm</th>
                            <th className="text-center">Tình trạng</th>
                            <th className="text-end text-nowrap">Thao tác xử lý</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentProducts.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có sản phẩm trên hệ thống</td></tr>
                          ) : (
                            currentProducts.map((item, index) => (
                              <tr key={item.id} className={item.moderationStatus === "Banned" ? "bg-danger bg-opacity-10" : ""}>
                                <td className="text-center fw-bold text-muted">{indexOfFirstProduct + index + 1}</td>
                                <td className="text-center">
                                  <img src={item.image || item.images?.[0] || "https://via.placeholder.com/50"} alt="sp" className="rounded-3 shadow-sm object-fit-cover bg-white" style={{ width: "48px", height: "48px" }} />
                                </td>
                                <td>
                                  <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '350px' }}>{item.name}</div>
                                  {item.banReason && <div className="small text-danger mt-1 fw-bold"><FaExclamationTriangle/> Lý do cấm: {item.banReason}</div>}
                                </td>
                                <td className="text-center text-nowrap">
                                  {item.moderationStatus === "Banned" ? <span className="badge bg-danger px-3 py-2 rounded-pill shadow-sm">Đã vi phạm</span> : <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">Đang lưu hành</span>}
                                </td>
                                <td className="text-end text-nowrap">
                                  {item.moderationStatus === "Banned" ? (
                                    <button onClick={() => handleModerateProduct(item.id, "Approved")} className="btn btn-outline-success btn-sm fw-bold me-2 rounded-pill px-3">Gỡ thẻ phạt</button>
                                  ) : (
                                    <button onClick={() => handleModerateProduct(item.id, "Banned")} className="btn btn-warning btn-sm text-white fw-bold me-2 rounded-pill px-3 shadow-sm"><FaBan /> Cấm bán</button>
                                  )}
                                  <button onClick={() => handleDeleteProductAdmin(item.id)} className="btn btn-danger btn-sm fw-bold rounded-pill shadow-sm px-3"><FaTrash /> Xóa</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalProductPages > 1 && (
                      <div className="d-flex justify-content-center gap-2 p-4 bg-white border-top">
                        <button disabled={currentProductPage === 1} onClick={() => setCurrentProductPage((prev) => prev - 1)} className="btn btn-light rounded-circle fw-bold" style={{ width: '40px', height: '40px' }}>&lt;</button>
                        {Array.from({ length: totalProductPages }, (_, i) => (
                          <button key={i} onClick={() => setCurrentProductPage(i + 1)} className={`btn fw-bold rounded-circle shadow-sm ${currentProductPage === i + 1 ? 'btn-danger' : 'btn-light'}`} style={{ width: '40px', height: '40px' }}>{i + 1}</button>
                        ))}
                        <button disabled={currentProductPage === totalProductPages} onClick={() => setCurrentProductPage((prev) => prev + 1)} className="btn btn-light rounded-circle fw-bold" style={{ width: '40px', height: '40px' }}>&gt;</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: GIÁM SÁT ĐƠN HÀNG - CẬP NHẬT LOGIC FIX LỖI BIG TICKET */}
              {activeTab === "orders" && (
                <div>
                  <h1 className="fs-3 fw-black text-dark mb-4">Giám sát Vận hành & Phân tích Giao dịch</h1>
                  <div className="content-card p-0 overflow-hidden">
                    <div className="table-responsive">
                      <table className="table modern-table align-middle w-100 mb-0">
                        <thead className="text-uppercase small text-secondary fw-bold">
                          <tr>
                            <th className="text-nowrap">Mã Lệnh</th>
                            <th className="text-nowrap">Người mua</th>
                            <th className="text-nowrap">Tổng giá trị</th>
                            <th className="text-nowrap">Tiến độ</th>
                            <th className="text-center text-nowrap">Hệ thống phân tích</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentOrders.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có giao dịch nào</td></tr>
                          ) : (
                            currentOrders.map((order) => {
                              const isHighValue = order.totalPrice > 10000000;
                              const isCompleted = order.status === "Completed";
                              // Lỗi cũ nằm ở đây: Đã hoàn thành thì không đánh dấu là Warning (Cảnh báo đỏ) nữa
                              const isWarning = (order.isSuspicious || isHighValue) && !isCompleted;
                              
                              return (
                                <tr key={order.id} className={isWarning ? "bg-warning bg-opacity-10" : ""}>
                                  <td className="fw-black text-primary px-4">#{order.id}</td>
                                  <td className="fw-bold text-dark">{order.customerInfo?.fullName || order.username || "Khách ẩn danh"}</td>
                                  <td className="fw-bold text-danger text-nowrap fs-6">{Number(order.totalPrice || 0).toLocaleString("vi-VN")} ₫</td>
                                  <td>
                                    {isCompleted ? (
                                      <span className="badge bg-success px-3 py-2 rounded-pill shadow-sm">Đã hoàn tất</span>
                                    ) : (
                                      <span className="badge bg-info text-dark px-3 py-2 rounded-pill shadow-sm">Đang luân chuyển</span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {isWarning ? (
                                      <span className="badge bg-danger px-3 py-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-2">
                                        <FaExclamationTriangle /> {isHighValue ? "Big Ticket (Cần duyệt)" : "Flagged: Đơn ảo"}
                                      </span>
                                    ) : isHighValue && isCompleted ? (
                                      <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold">
                                        <FaCheckCircle className="me-1"/> Đơn Lớn (Đã xác thực)
                                      </span>
                                    ) : (
                                      <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold">Giao dịch An toàn</span>
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
                      <div className="d-flex justify-content-center gap-2 p-4 bg-white border-top">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className="btn btn-light rounded-circle fw-bold" style={{ width: '40px', height: '40px' }}>&lt;</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button key={i} onClick={() => setCurrentPage(i + 1)} className={`btn fw-bold rounded-circle shadow-sm ${currentPage === i + 1 ? 'btn-danger' : 'btn-light'}`} style={{ width: '40px', height: '40px' }}>{i + 1}</button>
                        ))}
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)} className="btn btn-light rounded-circle fw-bold" style={{ width: '40px', height: '40px' }}>&gt;</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: QUẢN LÝ VOUCHER TOÀN SÀN */}
              {activeTab === "vouchers" && (
                <div>
                  {showVoucherModal && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050, backdropFilter: 'blur(3px)' }}>
                      <div className="bg-white p-5 rounded-4 shadow-lg" style={{ width: "90%", maxWidth: "550px" }}>
                        <h2 className="fs-4 fw-black text-dark text-center mb-4">Phát Hành Voucher Hệ Thống</h2>
                        <form onSubmit={handleCreateVoucherSubmit} className="d-flex flex-column gap-3">
                          <div className="row g-3">
                            <div className="col-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase">Mã Code</label>
                              <input type="text" required value={newVoucher.code} onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} className="form-control bg-light border-0 fw-bold text-danger" placeholder="VD: TET2026" />
                            </div>
                            <div className="col-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase">Tên / Mục đích</label>
                              <input type="text" required value={newVoucher.name} onChange={(e) => setNewVoucher({...newVoucher, name: e.target.value})} className="form-control bg-light border-0" placeholder="VD: Khuyến mãi Tết" />
                            </div>
                          </div>
                          <div className="row g-3">
                            <div className="col-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase">Hình thức</label>
                              <select value={newVoucher.type} onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})} className="form-select bg-light border-0 fw-bold">
                                <option value="PERCENT">Chiết khấu %</option>
                                <option value="FIXED">Trừ tiền mặt</option>
                                <option value="SHIPPING">Freeship</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase">Mức giảm</label>
                              <input type="number" required min="1" value={newVoucher.value} onChange={(e) => setNewVoucher({...newVoucher, value: e.target.value})} className="form-control bg-light border-0 fw-bold text-primary" placeholder={newVoucher.type === 'PERCENT' ? '10' : '50000'} />
                            </div>
                          </div>
                          <div className="row g-3">
                            <div className="col-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase">Đơn tối thiểu</label>
                              <input type="number" required min="0" value={newVoucher.minSpend} onChange={(e) => setNewVoucher({...newVoucher, minSpend: e.target.value})} className="form-control bg-light border-0" />
                            </div>
                            <div className="col-6">
                              <label className="form-label small fw-bold text-secondary text-uppercase">Hạn mức thả</label>
                              <input type="number" min="1" value={newVoucher.systemLimit} onChange={(e) => setNewVoucher({...newVoucher, systemLimit: e.target.value})} className="form-control bg-light border-0" placeholder="Để trống = Vô hạn" />
                            </div>
                          </div>
                          <div>
                            <label className="form-label small fw-bold text-secondary text-uppercase">Thời hạn kích hoạt</label>
                            <input type="datetime-local" required value={newVoucher.expiryDate} onChange={(e) => setNewVoucher({...newVoucher, expiryDate: e.target.value})} className="form-control bg-light border-0" />
                          </div>
                          <div className="d-flex justify-content-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowVoucherModal(false)} className="btn btn-light fw-bold px-4 rounded-pill">Hủy</button>
                            <button type="submit" className="btn btn-danger fw-bold px-4 rounded-pill shadow-sm">Phát hành ngay</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
                    <h1 className="fs-3 fw-black text-dark m-0">Quản lý Voucher Toàn Sàn</h1>
                    <button onClick={() => setShowVoucherModal(true)} className="btn btn-danger fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2">
                      <FaPlus /> Phát Hành Mã Mới
                    </button>
                  </div>
                  
                  <div className="content-card p-0 overflow-hidden">
                    <div className="table-responsive">
                      <table className="table modern-table align-middle w-100 mb-0">
                        <thead className="text-uppercase small text-secondary fw-bold">
                          <tr>
                            <th className="text-nowrap">Danh tính Code</th>
                            <th className="text-nowrap">Giá trị thả</th>
                            <th className="text-nowrap">Điều kiện đơn</th>
                            <th className="text-center text-nowrap">Hạn ngạch</th>
                            <th className="text-center text-nowrap">Đếm ngược hạn</th>
                            <th className="text-end text-nowrap">Can thiệp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vouchers.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-5 text-muted">Hệ thống hiện không có chiến dịch khuyến mãi nào.</td></tr>
                          ) : (
                            vouchers.map((v, index) => {
                              const isExpired = new Date(v.expiryDate) < new Date();
                              return (
                                <tr key={index} className={isExpired ? "opacity-50" : ""}>
                                  <td>
                                    <div className="fw-black text-danger fs-5">{v.code}</div>
                                    <div className="small text-muted">{v.name}</div>
                                  </td>
                                  <td className="fw-bold text-dark text-nowrap fs-6">{v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')} ₫`}</td>
                                  <td className="text-dark text-nowrap fw-bold">{v.minSpend.toLocaleString('vi-VN')} ₫</td>
                                  <td className="text-dark text-center text-nowrap fw-bold">
                                    <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">{v.systemUsed} / {v.systemLimit === 9999 ? '∞' : v.systemLimit}</span>
                                  </td>
                                  <td className={`text-center fw-bold text-nowrap ${isExpired ? 'text-danger' : 'text-success'}`}>{isExpired ? 'Đã hết hạn' : new Date(v.expiryDate).toLocaleDateString('vi-VN')}</td>
                                  <td className="text-end">
                                    <button onClick={() => handleDeleteVoucher(v.code)} className="btn btn-outline-danger btn-sm fw-bold rounded-pill px-3 shadow-sm d-inline-flex align-items-center gap-2" title="Thu hồi mã về kho">
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
    </div>
  );
};

export default AdminDashboard;