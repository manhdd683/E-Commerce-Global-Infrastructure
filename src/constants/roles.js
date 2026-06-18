// --- SYSTEM ROLES ---
export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  USER: 'user',
  GUEST: 'guest'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.SELLER]: 'Đối tác bán hàng',
  [ROLES.USER]: 'Khách hàng',
  [ROLES.GUEST]: 'Khách vãng lai'
};

// --- PRODUCT MODERATION STATES ---
export const MODERATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  BANNED: 'Banned'
};

export const MODERATION_STATUS_LABELS = {
  [MODERATION_STATUS.PENDING]: 'Chờ kiểm duyệt',
  [MODERATION_STATUS.APPROVED]: 'Đang hiển thị bán',
  [MODERATION_STATUS.BANNED]: 'Đã bị khóa/Đình chỉ'
};