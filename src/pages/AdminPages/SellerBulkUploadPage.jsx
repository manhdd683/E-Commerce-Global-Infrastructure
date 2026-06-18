import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileExcel, FaDownload, FaUpload, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../context/AuthContext';

const SellerBulkUploadPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ total: 0, success: 0, failed: 0 });

  const currentSellerName = user?.username || user?.name || 'seller';

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Tên sản phẩm": "Bàn phím cơ FPT",
        "Giá bán": 500000,
        "Số lượng tồn": 50,
        "Danh mục": "electronics",
        "Mô tả": "Bàn phím cơ gõ cực êm",
        "Link ảnh": "https://via.placeholder.com/200"
      },
      {
        "Tên sản phẩm": "Áo thun nam",
        "Giá bán": 150000,
        "Số lượng tồn": 100,
        "Danh mục": "fashion",
        "Mô tả": "Áo thun cotton 100%",
        "Link ảnh": "https://via.placeholder.com/200"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sản Phẩm");
    XLSX.writeFile(wb, "Template_Nhap_SanPham.xlsx");
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      const formattedData = json.map(item => {
        const imageUrl = item["Link ảnh"] || "https://via.placeholder.com/200";
        return {
          name: item["Tên sản phẩm"] || "Sản phẩm chưa có tên",
          price: Number(item["Giá bán"]) || 0,
          stock: Number(item["Số lượng tồn"]) || 0,
          category: item["Danh mục"] || "all",
          description: item["Mô tả"] || "",
          image: imageUrl,
          images: [imageUrl],
          sellerId: currentSellerName 
        };
      });

      setPreviewData(formattedData);
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleBulkSubmit = async () => {
    if (previewData.length === 0) return alert("Chưa có dữ liệu hợp lệ để tải lên!");
    
    setIsUploading(true);
    setUploadProgress({ total: previewData.length, success: 0, failed: 0 });

    let successCount = 0;
    let failCount = 0;

    for (const product of previewData) {
      try {
        await apiClient.post('/products', product);
        successCount++;
      } catch (error) {
        console.error("Lỗi khi up sản phẩm: ", product.name, error);
        failCount++;
      }
      setUploadProgress({ total: previewData.length, success: successCount, failed: failCount });
    }

    setIsUploading(false);
    alert(`Hoàn tất! Đã thêm ${successCount} sản phẩm thành công.`);

    // ĐÃ FIX: LÀM SẠCH MÀN HÌNH SAU KHI UPLOAD XONG
    setFile(null);
    setPreviewData([]);
    const fileInput = document.getElementById('excel-upload');
    if (fileInput) fileInput.value = '';
    
    // Tự động đẩy người dùng quay về trang Quản lý sản phẩm cho tiện
    navigate('/seller/dashboard');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', minHeight: '80vh', backgroundColor: '#f4f6f8' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#ee4d2d', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '15px' }}>
        <FaArrowLeft /> Quay lại
      </button>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Thêm Sản Phẩm Hàng Loạt</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Tải lên file Excel (.xlsx) để thêm nhanh hàng trăm sản phẩm vào kho của bạn.</p>
          </div>
          <button onClick={handleDownloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#f0fdf4', color: '#28a745', border: '1px solid #28a745', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            <FaDownload /> Tải file mẫu
          </button>
        </div>

        <div style={{ border: '2px dashed #007bff', borderRadius: '8px', padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', marginBottom: '30px', position: 'relative' }}>
          <input 
            id="excel-upload" // Đã thêm ID để có thể reset thẻ input này
            type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isUploading}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: isUploading ? 'not-allowed' : 'pointer' }}
          />
          <FaFileExcel size={40} color="#007bff" style={{ marginBottom: '15px' }} />
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Kéo thả hoặc nhấn vào đây để chọn file</h3>
          <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Chỉ hỗ trợ file định dạng Excel (.xlsx)</p>
          {file && <div style={{ marginTop: '15px', color: '#28a745', fontWeight: 'bold' }}>📁 Đã chọn file: {file.name}</div>}
        </div>

        {previewData.length > 0 && (
          <div>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>Xem trước dữ liệu ({previewData.length} sản phẩm)</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Tên sản phẩm</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Giá bán</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Tồn kho</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Danh mục</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', color: '#333' }}>{item.name}</td>
                      <td style={{ padding: '12px', color: '#ee4d2d', fontWeight: 'bold' }}>{item.price.toLocaleString('vi-VN')} ₫</td>
                      <td style={{ padding: '12px', color: '#28a745' }}>{item.stock}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{item.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isUploading ? (
              <div style={{ backgroundColor: '#fff0f6', padding: '20px', borderRadius: '8px', border: '1px solid #ff469e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#ff469e', fontWeight: 'bold' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaSpinner className="fa-spin"/> Đang đẩy dữ liệu...</span>
                  <span>{uploadProgress.success + uploadProgress.failed} / {uploadProgress.total}</span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#ffd6e7', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#ff469e', width: `${((uploadProgress.success + uploadProgress.failed) / uploadProgress.total) * 100}%`, transition: 'width 0.3s' }}></div>
                </div>
              </div>
            ) : (
              <button onClick={handleBulkSubmit} style={{ width: '100%', padding: '15px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <FaUpload /> BẮT ĐẦU TẢI LÊN HỆ THỐNG
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerBulkUploadPage;