// --- ORDER STATUS LIFE CYCLE ---
export const ORDER_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPING: 'Shipping',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Chờ xác nhận',
  [ORDER_STATUS.PROCESSING]: 'Đang chuẩn bị hàng',
  [ORDER_STATUS.SHIPPING]: 'Đang giao hàng',
  [ORDER_STATUS.COMPLETED]: 'Đã giao thành công',
  [ORDER_STATUS.CANCELLED]: 'Đã hủy đơn'
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: '#ffc107',
  [ORDER_STATUS.PROCESSING]: '#007bff',
  [ORDER_STATUS.SHIPPING]: '#17a2b8',
  [ORDER_STATUS.COMPLETED]: '#28a745',
  [ORDER_STATUS.CANCELLED]: '#dc3545'
};

// --- PAYMENT METHODS ---
export const PAYMENT_METHODS = {
  COD: 'COD',
  E_WALLET: 'E_Wallet'
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.COD]: 'Thanh toán khi nhận hàng (COD)',
  [PAYMENT_METHODS.E_WALLET]: 'Ví điện tử nội bộ'
};