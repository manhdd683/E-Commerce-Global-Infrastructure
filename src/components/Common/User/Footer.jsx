import React, { useState, useEffect } from 'react';
import { FaFacebook, FaGithub, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';

// BỘ TỪ ĐIỂN DỊCH THUẬT FOOTER
const TRANSLATIONS = {
  vi: {
    col1Title: "CHĂM SÓC KHÁCH HÀNG",
    helpCenter: "Trung tâm trợ giúp",
    buyingGuide: "Hướng dẫn mua hàng",
    shippingPolicy: "Chính sách vận chuyển",
    returnPolicy: "Chính sách trả hàng & hoàn tiền",
    col2Title: "VỀ CỬA HÀNG",
    aboutUs: "Giới thiệu",
    careers: "Tuyển dụng",
    terms: "Điều khoản sử dụng",
    privacy: "Chính sách bảo mật",
    col3Title: "THÔNG TIN PHÁT TRIỂN",
    hanoi: "Hà Nội",
    copyright: "© 2026 Bản quyền thuộc về dự án E-commerce.",
    developedBy: "Developed with by Dương Đức Mạnh"
  },
  en: {
    col1Title: "CUSTOMER CARE",
    helpCenter: "Help Center",
    buyingGuide: "Buying Guide",
    shippingPolicy: "Shipping Policy",
    returnPolicy: "Return & Refund Policy",
    col2Title: "ABOUT STORE",
    aboutUs: "About Us",
    careers: "Careers",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    col3Title: "DEVELOPER INFO",
    hanoi: "Hanoi",
    copyright: "© 2026 Copyright belongs to E-commerce project.",
    developedBy: "Developed with by Dương Đức Mạnh"
  },
  ja: {
    col1Title: "カスタマーケア",
    helpCenter: "ヘルプセンター",
    buyingGuide: "購入ガイド",
    shippingPolicy: "配送ポリシー",
    returnPolicy: "返品・返金ポリシー",
    col2Title: "店舗について",
    aboutUs: "会社概要",
    careers: "採用情報",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    col3Title: "開発者情報",
    hanoi: "ハノイ",
    copyright: "© 2026 著作権はEコマースプロジェクトに帰属します。",
    developedBy: "Developed with by Dương Đức Mạnh"
  }
};

const Footer = () => {
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'vi');
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

  useEffect(() => {
    const handleLangChange = () => {
      setLanguage(localStorage.getItem('app_lang') || 'vi');
    };
    window.addEventListener('languageChanged', handleLangChange);
    return () => window.removeEventListener('languageChanged', handleLangChange);
  }, []);

  return (
    <footer style={{ backgroundColor: 'white', borderTop: '1px solid #eaeaea', paddingTop: '40px', paddingBottom: '20px', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '0 20px', flexWrap: 'wrap', gap: '30px' }}>
        
        {/* CỘT 1: CHĂM SÓC KHÁCH HÀNG */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h4 style={{ color: '#333', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>{t.col1Title}</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}>{t.helpCenter}</li>
            <li style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}>{t.buyingGuide}</li>
            <li style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}>{t.shippingPolicy}</li>
            <li style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}>{t.returnPolicy}</li>
          </ul>
        </div>

        {/* CỘT 2: VỀ CỬA HÀNG */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h4 style={{ color: '#333', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>{t.col2Title}</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}>{t.aboutUs}</li>
            <li style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}>{t.careers}</li>
            <li style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}>{t.terms}</li>
            <li style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }}>{t.privacy}</li>
          </ul>
        </div>

        {/* CỘT 3: THÔNG TIN PHÁT TRIỂN */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h4 style={{ color: '#333', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>{t.col3Title}</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaMapMarkerAlt color="#ee4d2d"/> {t.hanoi}</li>
            <li style={{ color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaEnvelope color="#ee4d2d"/> manhdd683@gmail.com</li>
            <li style={{ color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaPhoneAlt color="#ee4d2d"/> 03376030**</li>
          </ul>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <FaFacebook size={20} color="#1877F2" style={{ cursor: 'pointer' }}/>
            <FaGithub size={20} color="#333" style={{ cursor: 'pointer' }}/>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', color: '#999', fontSize: '12px', lineHeight: '1.8' }}>
        <div>{t.copyright}</div>
        <div>{t.developedBy}</div>
      </div>
    </footer>
  );
};

export default Footer;