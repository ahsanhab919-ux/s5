import { cookies } from 'next/headers';
import AuthService, { AuthResponse } from '@/services/auth.service';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const authService = new AuthService();
    const response = await authService.getUser(token);

    // Check if response is successful and has data
    if (response.data && response.data.data) {
        return response.data.data as User;
    }
    return null;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
