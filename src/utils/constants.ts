export const APP_NAME = process.env.REACT_APP_APP_NAME || 'Pallet Management System';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const ROLES = {
  ADMIN: 'ADMIN',
  COMPANY_STAFF: 'COMPANY_STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;

export const ASSET_TYPES = {
  PALLET: 'PALLET',
  SEPARATOR: 'SEPARATOR',
} as const;

export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const PLAN_STATUS = {
  GENERATED: 'GENERATED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  GENERATED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
};

export const STORAGE_KEYS = {
  JWT_TOKEN: 'jwt_token',
  USER_INFO: 'user_info',
};
