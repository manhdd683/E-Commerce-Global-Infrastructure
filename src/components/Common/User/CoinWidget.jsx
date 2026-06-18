import React, { useState, useEffect, useContext, useCallback } from 'react';
import { FaCoins, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { AuthContext } from '../../../context/AuthContext'; 

const REWARDS = [100, 100, 100, 100, 100, 100, 500];

const CoinWidget = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0); 
  const [canCheckIn, setCanCheckIn] = useState(true);

  const userKey = user?.username || user?.name || 'guest';
  const COINS_KEY = `user_coins_${userKey}`;
  const CHECKIN_KEY = `last_coin_checkin_${userKey}`;
  const STREAK_KEY = `coin_streak_${userKey}`;

  const loadCoinsData = useCallback(() => {
    const savedCoins = parseInt(localStorage.getItem(COINS_KEY) || '0');
    setCoins(savedCoins);

    const lastCheckIn = localStorage.getItem(CHECKIN_KEY);
    const savedStreak = parseInt(localStorage.getItem(STREAK_KEY) || '0');
    
    const today = new Date().setHours(0,0,0,0);
    const lastDate = lastCheckIn ? new Date(lastCheckIn).setHours(0,0,0,0) : null;
    const oneDay = 86400000;

    if (lastDate === today) {
      setCanCheckIn(false);
      setStreak(savedStreak);
    } else if (lastDate === today - oneDay) {
      setCanCheckIn(true);
      setStreak(savedStreak >= 7 ? 0 : savedStreak); 
    } else {
      setCanCheckIn(true);
      setStreak(0);
    }
  }, [COINS_KEY, CHECKIN_KEY, STREAK_KEY]);

  useEffect(() => {
    loadCoinsData();
    window.addEventListener('storage', loadCoinsData);
    window.addEventListener('coinsUpdated', loadCoinsData);
    return () => {
      window.removeEventListener('storage', loadCoinsData);
      window.removeEventListener('coinsUpdated', loadCoinsData);
    };
  }, [loadCoinsData]); 
  const handleCheckIn = () => {
    if (!canCheckIn) return;
    
    const nextStreak = streak + 1;
    const reward = REWARDS[nextStreak - 1];
    const newCoins = coins + reward;
    
    setCoins(newCoins);
    setStreak(nextStreak);
    setCanCheckIn(false);

    localStorage.setItem(COINS_KEY, newCoins.toString());
    localStorage.setItem(STREAK_KEY, nextStreak.toString());
    localStorage.setItem(CHECKIN_KEY, new Date().toISOString());
    
    window.dispatchEvent(new Event('coinsUpdated'));
    alert(`Điểm danh ngày ${nextStreak} thành công! Nhận ngay ${reward} Xu.`);
  };

  const getRewardAmountForToday = () => {
    if (!canCheckIn) return 0;
    return REWARDS[streak] || 100;
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', left: '30px', zIndex: 9999 }}>
      <style>
        {`
          @keyframes shopeePulse {
            0% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 0 0 rgba(255, 146, 18, 0.7); }
            50% { transform: scale(1.12); filter: brightness(1.3); box-shadow: 0 0 0 15px rgba(255, 146, 18, 0); }
            100% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 0 0 rgba(255, 146, 18, 0); }
          }
          @keyframes coinRotate {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
        `}
      </style>

      {!isOpen && (
        <div 
          onClick={() => setIsOpen(true)} 
          style={{ 
            width: '65px', height: '65px', 
            backgroundColor: '#ff9212', color: 'white', 
            borderRadius: '50%', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', 
            cursor: 'pointer', 
            border: '2px solid white',
            animation: canCheckIn ? 'shopeePulse 1.2s infinite ease-in-out' : 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          <FaCoins size={30} style={{ animation: canCheckIn ? 'coinRotate 2s infinite linear' : 'none' }} />
        </div>
      )}

      {isOpen && (
        <div style={{ width: '380px', backgroundColor: '#ff9212', borderRadius: '12px', boxShadow: '0 5px 25px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Ưu đãi Shopee Xu</div>
            <FaTimes style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} size={18} />
          </div>

          <div style={{ textAlign: 'center', padding: '10px 0 20px 0', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <FaCoins color="#ffd700" size={24} />
            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{coins.toLocaleString('vi-VN')}</span>
            <span style={{ fontSize: '18px' }}>{'>'}</span>
          </div>

          <div style={{ backgroundColor: 'white', margin: '0 15px 15px 15px', borderRadius: '8px', padding: '20px 15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: '5px' }}>
              {REWARDS.map((amount, index) => {
                const dayNum = index + 1;
                const isPast = (dayNum <= streak && !canCheckIn) || (dayNum < streak && canCheckIn);
                const isToday = dayNum === streak + 1 && canCheckIn;
                
                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: isToday ? '#ee4d2d' : '#888', fontWeight: isToday ? 'bold' : 'normal', marginBottom: '5px', whiteSpace: 'nowrap' }}>
                      +{amount}
                    </div>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      backgroundColor: isPast ? '#f5f5f5' : (isToday ? '#fff0e5' : '#f9f9f9'),
                      border: isToday ? '1px solid #ee4d2d' : '1px solid #eee',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      position: 'relative'
                    }}>
                      <FaCoins color={isPast ? '#ccc' : '#ffc107'} size={16} />
                      {isPast && <FaCheckCircle color="#28a745" size={14} style={{position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: 'white', borderRadius: '50%'}}/>}
                    </div>
                    <div style={{ fontSize: '10px', color: isToday ? '#ee4d2d' : '#999', marginTop: '5px', fontWeight: isToday ? 'bold' : 'normal' }}>
                      {isToday ? 'Hôm nay' : `Ngày ${dayNum}`}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              style={{ width: '100%', padding: '14px', backgroundColor: canCheckIn ? '#ee4d2d' : '#e0e0e0', color: canCheckIn ? 'white' : '#888', border: 'none', borderRadius: '25px', fontWeight: 'bold', fontSize: '15px', cursor: canCheckIn ? 'pointer' : 'not-allowed', boxShadow: canCheckIn ? '0 4px 10px rgba(238, 77, 45, 0.3)' : 'none' }}
            >
              {canCheckIn ? `Nhận ngay ${getRewardAmountForToday()} xu` : 'Ngày mai quay lại nhận tiếp nhé'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinWidget;