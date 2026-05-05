export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: 'ADMIN' | 'COMPANY_STAFF' | 'CUSTOMER';
  fullName: string;
  fillerId?: number;
}

export interface User {
  username: string;
  role: 'ADMIN' | 'COMPANY_STAFF' | 'CUSTOMER';
  fullName: string;
  fillerId?: number;
}
