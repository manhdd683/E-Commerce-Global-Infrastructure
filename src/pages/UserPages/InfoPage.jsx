import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';

// 1. CỤC DỮ LIỆU BÀI VIẾT (Sếp lỡ dán đè mất phần dưới là do cục này đây)
const PAGE_DATA = {
  // --- CỘT 1: CHĂM SÓC KHÁCH HÀNG ---
  'trung-tam-tro-giup': {
    title: 'Trung tâm trợ giúp',
    content: `
      <h4>Trung tâm hỗ trợ khách hàng 24/7</h4>
      <p>Nếu bạn gặp bất kỳ sự cố nào trong quá trình sử dụng hệ thống, vui lòng liên hệ với chúng tôi qua các kênh sau:</p>
      <ul>
        <li><strong>Hotline:</strong> 1900 8888 (Miễn phí cước gọi)</li>
        <li><strong>Email:</strong> support@ecommerce.com</li>
        <li><strong>Chat trực tuyến:</strong> Sử dụng biểu tượng chat góc phải màn hình.</li>
      </ul>
      <p>Thời gian làm việc: Tất cả các ngày trong tuần, kể cả Lễ Tết.</p>
    `
  },
  'huong-dan-mua-hang': {
    title: 'Hướng dẫn mua hàng',
    content: `
      <h4>Các bước mua hàng đơn giản:</h4>
      <ol>
        <li>Tìm kiếm sản phẩm cần mua trên thanh tìm kiếm.</li>
        <li>Bấm "Thêm vào giỏ hàng" hoặc "Mua ngay".</li>
        <li>Kiểm tra giỏ hàng, áp dụng mã giảm giá (nếu có).</li>
        <li>Điền thông tin nhận hàng và chọn phương thức thanh toán.</li>
        <li>Xác nhận đặt hàng và theo dõi tiến độ giao hàng.</li>
      </ol>
    `
  },
  'chinh-sach-van-chuyen': {
    title: 'Chính sách vận chuyển',
    content: `
      <h4>Giao hàng nhanh chóng - Tiện lợi</h4>
      <p>Chúng tôi hợp tác với các đơn vị vận chuyển hàng đầu như Giao Hàng Nhanh, Viettel Post, J&T Express...</p>
      <ul>
        <li><strong>Giao Hỏa Tốc:</strong> Nhận hàng trong 2-4 tiếng (áp dụng nội thành HN & TP.HCM).</li>
        <li><strong>Giao Tiêu Chuẩn:</strong> Từ 2 - 4 ngày tùy khu vực.</li>
        <li><strong>Phí vận chuyển:</strong> Được tính tự động dựa trên khối lượng và khoảng cách. Luôn có mã Freeship Extra mỗi ngày!</li>
      </ul>
    `
  },
  'chinh-sach-tra-hang': {
    title: 'Chính sách trả hàng & hoàn tiền',
    content: `
      <h4>Mua sắm an tâm với chính sách hoàn trả 7 ngày</h4>
      <p>Bạn có thể yêu cầu Trả hàng/Hoàn tiền trong các trường hợp sau:</p>
      <ul>
        <li>Sản phẩm bị lỗi, móp méo do vận chuyển.</li>
        <li>Giao sai sản phẩm, sai màu, sai size.</li>
        <li>Sản phẩm hết hạn sử dụng hoặc là hàng giả/nhái.</li>
      </ul>
      <p><em>Lưu ý:</em> Sản phẩm cần được giữ nguyên vẹn tem mác và tình trạng ban đầu khi nhận. Tiền sẽ được hoàn về Ví hoặc Thẻ ngân hàng từ 3-5 ngày làm việc.</p>
    `
  },

  // --- CỘT 2: VỀ CỬA HÀNG ---
  'gioi-thieu': {
    title: 'Giới thiệu về E-Commerce',
    content: `
      <h4>Chào mừng bạn đến với E-Commerce!</h4>
      <p>Chúng tôi là nền tảng thương mại điện tử hàng đầu, kết nối hàng triệu người mua và người bán trên toàn quốc. Sứ mệnh của chúng tôi là mang đến trải nghiệm mua sắm trực tuyến an toàn, tiện lợi và tiết kiệm nhất.</p>
      <ul>
        <li>Hàng hóa đa dạng, kiểm duyệt nghiêm ngặt.</li>
        <li>Hệ thống thanh toán bảo mật tuyệt đối.</li>
        <li>Giao hàng hỏa tốc toàn quốc.</li>
      </ul>
    `
  },
  'tuyen-dung': {
    title: 'Tuyển dụng Nhân tài',
    content: `
      <h4>Gia nhập đội ngũ E-Commerce</h4>
      <p>Chúng tôi luôn tìm kiếm những ứng viên đam mê công nghệ và thương mại điện tử. Các vị trí đang mở:</p>
      <ul>
        <li><strong>Frontend Developer (ReactJS):</strong> 2 vị trí. Yêu cầu 1 năm kinh nghiệm.</li>
        <li><strong>Chuyên viên CSKH:</strong> 5 vị trí. Không yêu cầu kinh nghiệm.</li>
        <li><strong>Quản lý Vận hành (Operations):</strong> 1 vị trí. Yêu cầu am hiểu chuỗi cung ứng.</li>
      </ul>
      <p>Gửi CV của bạn về email: <strong>tuyendung@ecommerce.com</strong> với tiêu đề [Vị trí ứng tuyển] - [Họ Tên].</p>
    `
  },
  'dieu-khoan-su-dung': {
    title: 'Điều khoản sử dụng',
    content: `
      <h4>Quy định chung</h4>
      <p>Bằng việc sử dụng nền tảng E-Commerce, bạn đồng ý tuân thủ các quy định sau:</p>
      <ul>
        <li>Cung cấp thông tin chính xác khi đăng ký tài khoản.</li>
        <li>Không sử dụng nền tảng cho các mục đích lừa đảo, vi phạm pháp luật.</li>
        <li>Không spam đơn hàng, đánh giá ảo gây ảnh hưởng đến người bán.</li>
      </ul>
      <p>Chúng tôi có quyền khóa tài khoản vĩnh viễn nếu phát hiện vi phạm nghiêm trọng.</p>
    `
  },
  'chinh-sach-bao-mat': {
    title: 'Chính sách bảo mật',
    content: `
      <h4>Cam kết bảo mật thông tin</h4>
      <p>Chúng tôi hiểu rằng thông tin cá nhân của bạn là tài sản vô giá. Nền tảng cam kết:</p>
      <ul>
        <li>Không mua bán, trao đổi thông tin khách hàng cho bên thứ ba.</li>
        <li>Dữ liệu thanh toán được mã hóa chuẩn quốc tế.</li>
        <li>Chỉ sử dụng thông tin để hỗ trợ giao dịch và cải thiện dịch vụ.</li>
      </ul>
    `
  }
};

// 2. COMPONENT VẼ GIAO DIỆN (Bắt buộc phải có để React chạy được)
const InfoPage = () => {
  const { slug } = useParams();
  const pageInfo = PAGE_DATA[slug];

  // Tự động cuộn lên đầu khi chuyển trang
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!pageInfo) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light">
        <h2 className="text-danger fw-bold">404 - Không tìm thấy nội dung</h2>
        <p className="text-muted">Nội dung bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
        <Link to="/" className="btn btn-primary rounded-pill mt-3">Về Trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 pb-5">
      <div className="container py-4">
        {/* Đường dẫn Breadcrumb */}
        <div className="d-flex align-items-center gap-2 text-muted small mb-4">
          <Link to="/" className="text-decoration-none text-muted hover-primary"><FaHome /> Trang chủ</Link>
          <FaChevronRight style={{ fontSize: '10px' }} />
          <span className="text-dark fw-bold">{pageInfo.title}</span>
        </div>

        {/* Khung nội dung */}
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
          <h1 className="fs-3 fw-black text-dark mb-4 border-bottom pb-3 border-danger border-3" style={{ display: 'inline-block' }}>
            {pageInfo.title}
          </h1>
          <div 
            className="lh-lg text-secondary" 
            dangerouslySetInnerHTML={{ __html: pageInfo.content }} 
          />
        </div>
      </div>
    </div>
  );
};


export default InfoPage;