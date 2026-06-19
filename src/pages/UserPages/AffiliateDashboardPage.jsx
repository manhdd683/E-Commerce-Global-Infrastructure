import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaMoneyBillWave, FaMousePointer, FaShoppingCart, FaArrowLeft, FaHistory, FaWallet } from 'react-icons/fa';

const AffiliateDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ clicks: 0, orders: 0, totalCommission: 0, withdrawn: 0, history: [] });

  const currentUserKey = user?.username || user?.name || 'guest';
  const statsKey = `affiliate_stats_${currentUserKey}`;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const savedStats = localStorage.getItem(statsKey);
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, [user, navigate, statsKey]);

  const availableBalance = stats.totalCommission - (stats.withdrawn || 0);

  const handleWithdraw = () => {
    if (availableBalance <= 0) return alert("Số dư khả dụng của bạn không đủ để rút tiền!");

    const amountStr = window.prompt(`Số dư khả dụng: ${availableBalance.toLocaleString('vi-VN')} ₫\nNhập số tiền bạn muốn rút về ngân hàng:`);
    
    if (amountStr) {
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) return alert("Số tiền nhập không hợp lệ!");
      if (amount > availableBalance) return alert("Bạn không thể rút vượt quá số dư đang có!");

      const newHistoryItem = {
        date: new Date().toISOString(),
        type: 'WITHDRAW',
        amount: amount,
        note: 'Rút tiền hoa hồng về ngân hàng'
      };

      const updatedStats = {
        ...stats,
        withdrawn: (stats.withdrawn || 0) + amount,
        history: [...(stats.history || []), newHistoryItem]
      };

      setStats(updatedStats);
      localStorage.setItem(statsKey, JSON.stringify(updatedStats));
      alert(`🎉 Đã lên lệnh rút ${amount.toLocaleString('vi-VN')} ₫ thành công!`);
    }
  };

  return (
    <div className="bg-light" style={{ minHeight: '80vh' }}>
      <div className="container py-4 py-md-5">
        
        {/* HEADER & NÚT QUAY LẠI */}
        <button onClick={() => navigate(-1)} className="btn btn-link text-danger fw-bold text-decoration-none p-0 mb-4 d-flex align-items-center gap-2">
          <FaArrowLeft /> Quay lại
        </button>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <h2 className="fs-3 fw-bold text-dark mb-2">Bảng điều khiển Affiliate</h2>
            <p className="text-muted m-0">Xin chào, <strong className="text-warning">{user?.username || user?.name}</strong>! Đây là hiệu suất tiếp thị của bạn.</p>
          </div>
          
          <button 
            onClick={handleWithdraw}
            disabled={availableBalance <= 0}
            className={`btn px-4 py-2 fw-bold text-nowrap w-100 w-md-auto ${availableBalance > 0 ? 'btn-warning text-white shadow-sm' : 'btn-secondary'}`}
            style={{ transition: '0.3s' }}
          >
            RÚT TIỀN HOA HỒNG
          </button>
        </div>

        {/* CÁC THẺ CHỈ SỐ THỐNG KÊ (Responsive 1-2-4 cột) */}
        <div className="row g-3 mb-5">
          <div className="col-12 col-md-6 col-lg-3">
            <div className="bg-white p-3 rounded-3 shadow-sm d-flex align-items-center gap-3 border-start border-primary border-4 h-100">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                <FaMousePointer size={20}/>
              </div>
              <div>
                <div className="text-muted small fw-bold mb-1">TỔNG LƯỢT CLICK</div>
                <div className="fs-4 fw-bold text-dark lh-1">{stats.clicks}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="bg-white p-3 rounded-3 shadow-sm d-flex align-items-center gap-3 border-start border-success border-4 h-100">
              <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                <FaShoppingCart size={20}/>
              </div>
              <div>
                <div className="text-muted small fw-bold mb-1">ĐƠN HÀNG THÀNH CÔNG</div>
                <div className="fs-4 fw-bold text-dark lh-1">{stats.orders}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="bg-white p-3 rounded-3 shadow-sm d-flex align-items-center gap-3 border-start border-warning border-4 h-100">
              <div className="rounded-circle bg-warning bg-opacity-10 text-warning d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                <FaMoneyBillWave size={20}/>
              </div>
              <div>
                <div className="text-muted small fw-bold mb-1">TỔNG HOA HỒNG</div>
                <div className="fs-5 fw-bold text-warning lh-1">{stats.totalCommission.toLocaleString('vi-VN')} ₫</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="bg-white p-3 rounded-3 shadow-sm d-flex align-items-center gap-3 border-start border-danger border-4 h-100">
              <div className="rounded-circle bg-danger bg-opacity-10 text-danger d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                <FaWallet size={20}/>
              </div>
              <div>
                <div className="text-muted small fw-bold mb-1">SỐ DƯ KHẢ DỤNG</div>
                <div className="fs-5 fw-bold text-danger lh-1">{availableBalance.toLocaleString('vi-VN')} ₫</div>
              </div>
            </div>
          </div>
        </div>

        {/* LỊCH SỬ GIAO DỊCH (Responsive Table -> Cards) */}
        <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm">
          <h3 className="fs-5 text-dark d-flex align-items-center gap-2 mb-4 fw-bold border-bottom pb-3">
            <FaHistory className="text-warning" /> Lịch sử nhận/rút hoa hồng
          </h3>
          
          {(!stats.history || stats.history.length === 0) ? (
            <div className="text-center py-5 text-muted">Bạn chưa có giao dịch hoa hồng nào. Hãy chia sẻ link ngay nhé!</div>
          ) : (
            <>
              {/* Table cho màn hình MD trở lên */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-secondary fw-bold">Thời gian</th>
                      <th className="text-center text-secondary fw-bold">Loại giao dịch</th>
                      <th className="text-secondary fw-bold">Nội dung</th>
                      <th className="text-end text-secondary fw-bold">Biến động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.history.slice().reverse().map((item, index) => (
                      <tr key={index}>
                        <td className="text-dark py-3">{new Date(item.date).toLocaleString('vi-VN')}</td>
                        <td className="text-center py-3">
                          {item.type === 'WITHDRAW' ? (
                            <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1">RÚT TIỀN</span>
                          ) : (
                            <span className="badge bg-success bg-opacity-10 text-success px-2 py-1">NHẬN HOA HỒNG</span>
                          )}
                        </td>
                        <td className="text-muted py-3">
                          {item.type === 'WITHDRAW' ? item.note : `Từ đơn hàng ${item.orderTotal?.toLocaleString('vi-VN')} ₫`}
                        </td>
                        <td className={`text-end fw-bold py-3 ${item.type === 'WITHDRAW' ? 'text-danger' : 'text-success'}`}>
                          {item.type === 'WITHDRAW' ? '-' : '+'}{(item.amount || item.commission || 0).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards cho màn hình Mobile */}
              <div className="d-block d-md-none">
                {stats.history.slice().reverse().map((item, index) => (
                  <div key={index} className="border rounded p-3 mb-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                      <span className="small text-muted">{new Date(item.date).toLocaleString('vi-VN')}</span>
                      {item.type === 'WITHDRAW' ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1">RÚT TIỀN</span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success px-2 py-1">NHẬN HOA HỒNG</span>
                      )}
                    </div>
                    <div className="small text-dark mb-2">
                      {item.type === 'WITHDRAW' ? item.note : `Từ đơn hàng ${item.orderTotal?.toLocaleString('vi-VN')} ₫`}
                    </div>
                    <div className={`text-end fw-bold fs-6 ${item.type === 'WITHDRAW' ? 'text-danger' : 'text-success'}`}>
                      {item.type === 'WITHDRAW' ? '-' : '+'}{(item.amount || item.commission || 0).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboardPage;