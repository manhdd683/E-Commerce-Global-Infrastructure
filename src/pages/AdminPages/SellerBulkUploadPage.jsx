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

    setFile(null);
    setPreviewData([]);
    const fileInput = document.getElementById('excel-upload');
    if (fileInput) fileInput.value = '';
    
    navigate('/seller/dashboard');
  };

  return (
    <div className="bg-light min-vh-100 py-4 py-md-5">
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* HEADER & NÚT QUAY LẠI */}
        <button onClick={() => navigate(-1)} className="btn btn-link text-danger text-decoration-none fw-bold p-0 d-flex align-items-center gap-2 mb-4">
          <FaArrowLeft /> Quay lại
        </button>

        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-4 gap-3">
            <div>
              <h2 className="fs-4 fw-bold text-dark m-0 mb-1">Thêm Sản Phẩm Hàng Loạt</h2>
              <p className="text-muted small m-0">Tải lên file Excel (.xlsx) để thêm nhanh hàng trăm sản phẩm vào kho của bạn.</p>
            </div>
            <button onClick={handleDownloadTemplate} className="btn btn-outline-success fw-bold d-flex align-items-center gap-2 text-nowrap">
              <FaDownload /> Tải file mẫu
            </button>
          </div>

          {/* KHU VỰC UPLOAD FILE */}
          <div className="position-relative border border-primary border-2 border-dashed rounded-4 p-4 p-md-5 text-center bg-light mb-4 transition-all" style={{ transition: '0.3s' }}>
            <input 
              id="excel-upload" 
              type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isUploading}
              className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
              style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
            />
            <FaFileExcel size={50} className="text-primary mb-3" />
            <h3 className="fs-5 text-dark fw-bold mb-2">Kéo thả hoặc nhấn vào đây để chọn file</h3>
            <p className="text-muted small m-0">Chỉ hỗ trợ file định dạng Excel (.xlsx)</p>
            {file && <div className="mt-3 text-success fw-bold">📁 Đã chọn file: {file.name}</div>}
          </div>

          {/* XEM TRƯỚC DỮ LIỆU */}
          {previewData.length > 0 && (
            <div>
              <h3 className="fs-6 text-dark mb-3 fw-bold">Xem trước dữ liệu ({previewData.length} sản phẩm)</h3>
              
              <div className="table-responsive border rounded-3 mb-4" style={{ maxHeight: '300px' }}>
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light position-sticky top-0 shadow-sm" style={{ zIndex: 1 }}>
                    <tr>
                      <th className="text-secondary fw-bold border-bottom-0">Tên sản phẩm</th>
                      <th className="text-secondary fw-bold border-bottom-0 text-nowrap">Giá bán</th>
                      <th className="text-secondary fw-bold border-bottom-0 text-nowrap">Tồn kho</th>
                      <th className="text-secondary fw-bold border-bottom-0 text-nowrap">Danh mục</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, index) => (
                      <tr key={index}>
                        <td className="text-dark fw-bold">{item.name}</td>
                        <td className="text-danger fw-bold text-nowrap">{item.price.toLocaleString('vi-VN')} ₫</td>
                        <td className="text-success fw-bold">{item.stock}</td>
                        <td className="text-muted small">{item.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TIẾN TRÌNH UPLOAD */}
              {isUploading ? (
                <div className="bg-danger bg-opacity-10 p-3 p-md-4 rounded-3 border border-danger">
                  <div className="d-flex justify-content-between align-items-center mb-2 text-danger fw-bold">
                    <span className="d-flex align-items-center gap-2"><FaSpinner className="fa-spin"/> Đang đẩy dữ liệu lên hệ thống...</span>
                    <span>{uploadProgress.success + uploadProgress.failed} / {uploadProgress.total}</span>
                  </div>
                  <div className="progress mt-2" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar bg-danger progress-bar-striped progress-bar-animated" 
                      role="progressbar" 
                      style={{ width: `${((uploadProgress.success + uploadProgress.failed) / uploadProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button onClick={handleBulkSubmit} className="btn btn-danger w-100 py-3 fw-bold fs-6 d-flex justify-content-center align-items-center gap-2 shadow-sm">
                  <FaUpload /> BẮT ĐẦU TẢI LÊN HỆ THỐNG
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SellerBulkUploadPage;