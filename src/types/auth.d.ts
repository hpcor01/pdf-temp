export interface Branch {
  address: string;
  availableSpaces: number;
  id: string;
  name: string;
}

export interface User {
  branch: Branch;
  email: string;
  id: string;
  role: string;
  type: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginResponse {
  branch: {
    address: string;
    availableSpaces: number;
    id: string;
    name: string;
  };
  email: string;
  id: string;
  role: string;
  type: string;
  username: string;
}
