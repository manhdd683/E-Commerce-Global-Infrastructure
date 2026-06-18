import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaMoneyBillWave, FaMousePointer, FaShoppingCart, FaArrowLeft, FaHistory, FaWallet } from 'react-icons/fa';

const AffiliateDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // ĐÃ FIX: Thêm trường withdrawn (tiền đã rút) vào state mặc định
  const [stats, setStats] = useState({ clicks: 0, orders: 0, totalCommission: 0, withdrawn: 0, history: [] });

  const currentUserKey = user?.username || user?.name || 'guest';
  const statsKey = `affiliate_stats_${currentUserKey}`;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Lấy dữ liệu Affiliate của user hiện tại từ LocalStorage
    const savedStats = localStorage.getItem(statsKey);
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, [user, navigate, statsKey]);

  // TÍNH TOÁN SỐ DƯ THỰC TẾ
  const availableBalance = stats.totalCommission - (stats.withdrawn || 0);

  // HÀM XỬ LÝ RÚT TIỀN
  const handleWithdraw = () => {
    if (availableBalance <= 0) {
      return alert("Số dư khả dụng của bạn không đủ để rút tiền!");
    }

    const amountStr = window.prompt(`Số dư khả dụng: ${availableBalance.toLocaleString('vi-VN')} ₫\nNhập số tiền bạn muốn rút về ngân hàng:`);
    
    if (amountStr) {
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return alert("Số tiền nhập không hợp lệ!");
      }
      if (amount > availableBalance) {
        return alert("Bạn không thể rút vượt quá số dư đang có!");
      }

      // Cập nhật lại lịch sử và số tiền đã rút
      const newHistoryItem = {
        date: new Date().toISOString(),
        type: 'WITHDRAW',
        amount: amount,
        note: 'Rút tiền hoa hồng về ngân hàng'
      };

      const updatedStats = {
        ...stats,
        withdrawn: (stats.withdrawn || 0) + amount,
        history: [...(stats.history || []), newHistoryItem] // Đẩy vào cuối mảng
      };

      setStats(updatedStats);
      localStorage.setItem(statsKey, JSON.stringify(updatedStats));
      alert(`🎉 Đã lên lệnh rút ${amount.toLocaleString('vi-VN')} ₫ thành công!`);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f4f6f8', minHeight: '80vh' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#ee4d2d', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '15px' }}>
        <FaArrowLeft /> Quay lại
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>Bảng điều khiển Affiliate</h2>
          <p style={{ color: '#666', marginTop: '8px' }}>Xin chào, <strong style={{color: '#fd7e14'}}>{user?.username || user?.name}</strong>! Đây là hiệu suất tiếp thị của bạn.</p>
        </div>
        
        {/* NÚT RÚT TIỀN TỰ ĐỘNG KHÓA NẾU KHÔNG CÓ TIỀN */}
        <button 
          onClick={handleWithdraw}
          disabled={availableBalance <= 0}
          style={{ 
            padding: '12px 25px', 
            backgroundColor: availableBalance > 0 ? '#fd7e14' : '#ccc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: availableBalance > 0 ? 'pointer' : 'not-allowed', 
            boxShadow: availableBalance > 0 ? '0 4px 10px rgba(253, 126, 20, 0.3)' : 'none',
            transition: '0.3s'
          }}
        >
          RÚT TIỀN HOA HỒNG
        </button>
      </div>

      {/* ĐÃ FIX: CHUYỂN THÀNH 4 THẺ CHỈ SỐ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid #007bff' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e6f2ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#007bff' }}><FaMousePointer size={24}/></div>
          <div>
            <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>TỔNG LƯỢT CLICK</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginTop: '5px' }}>{stats.clicks}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid #28a745' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e6f9ed', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#28a745' }}><FaShoppingCart size={24}/></div>
          <div>
            <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>ĐƠN HÀNG THÀNH CÔNG</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginTop: '5px' }}>{stats.orders}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid #fd7e14' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fff5e6', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fd7e14' }}><FaMoneyBillWave size={24}/></div>
          <div>
            <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>TỔNG HOA HỒNG</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fd7e14', marginTop: '5px' }}>{stats.totalCommission.toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>

        {/* THẺ MỚI: SỐ DƯ KHẢ DỤNG */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid #ee4d2d' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ffe6e6', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ee4d2d' }}><FaWallet size={24}/></div>
          <div>
            <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>SỐ DƯ KHẢ DỤNG</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ee4d2d', marginTop: '5px' }}>{availableBalance.toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>
      </div>

      {/* LỊCH SỬ GIAO DỊCH */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaHistory color="#fd7e14" /> Lịch sử nhận/rút hoa hồng
        </h3>
        
        {(!stats.history || stats.history.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Bạn chưa có giao dịch hoa hồng nào. Hãy chia sẻ link ngay nhé!</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Thời gian</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Loại giao dịch</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Nội dung</th>
                <th style={{ padding: '15px', textAlign: 'right', color: '#555' }}>Biến động</th>
              </tr>
            </thead>
            <tbody>
              {/* Đảo ngược mảng để cái mới nhất lên đầu */}
              {stats.history.slice().reverse().map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', color: '#333' }}>{new Date(item.date).toLocaleString('vi-VN')}</td>
                  
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {item.type === 'WITHDRAW' ? (
                      <span style={{ color: '#dc3545', backgroundColor: '#f8d7da', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>RÚT TIỀN</span>
                    ) : (
                      <span style={{ color: '#28a745', backgroundColor: '#d4edda', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>NHẬN HOA HỒNG</span>
                    )}
                  </td>

                  <td style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
                    {item.type === 'WITHDRAW' ? item.note : `Từ đơn hàng ${item.orderTotal?.toLocaleString('vi-VN')} ₫`}
                  </td>

                  <td style={{ padding: '15px', textAlign: 'right', color: item.type === 'WITHDRAW' ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                    {item.type === 'WITHDRAW' ? '-' : '+'}{(item.amount || item.commission || 0).toLocaleString('vi-VN')} ₫
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AffiliateDashboardPage;