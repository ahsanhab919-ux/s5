import axios, { AxiosResponse } from "axios";
import { ENV } from "@/config/env";

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export class AuthService {
  private apiUrl: string = `${ENV.api_url}/api`;

  async login(
    email: string,
    password: string,
    authtype: string,
  ): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/auth/login`, { email, password, authtype });
  }

  async oneTapLogin(
    email: string,
    oneTapUser: boolean,
  ): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/auth/login`, { email, oneTapUser });
  }

  async loginV2(
    email: string,
    password: string,
    code: string,
  ): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/v2/login`, { email, password, code });
  }

  async register(
    name: string,
    email: string,
    password: string,
    country: string,
    authtype: string,
  ): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/auth/register`, {
      name,
      email,
      password,
      country,
      auth_type: authtype,
    });
  }

  async googleLogin(
    code: string,
    country: string,
  ): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/auth/google-login`, { code, country });
  }

  getGoogleOAuthUrl(): string {
    return `${this.apiUrl}/v2/google`;
  }

  async forgotPassword(email: string): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  async resetPassword(
    key: string,
    password: string,
  ): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/auth/reset-password/${key}`, { password });
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/auth/send-verify-email`, { email });
  }

  async verifyEmail(key: string): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(`${this.apiUrl}/auth/verify-email/${key}`);
  }

  async regenerateToken(token: string): Promise<AxiosResponse<AuthResponse>> {
    return axios.get(`${this.apiUrl}/auth/token-generate`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getUser(token: string): Promise<AxiosResponse<AuthResponse>> {
    return axios.get(`${this.apiUrl}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async addUserPermission(
    token: string,
    code: string,
    type: string,
  ): Promise<AxiosResponse<AuthResponse>> {
    return axios.post(
      `${this.apiUrl}/user-permission`,
      { code, type },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  }

  async checkPermissions(token: string): Promise<AxiosResponse<AuthResponse>> {
    return axios.get(`${this.apiUrl}/check-permission`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async validateToken(token: string): Promise<any> {
    try {
      const response = await this.getUser(token);
      if (response.data) {
        return (response.data as any).data || response.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export default AuthService;
