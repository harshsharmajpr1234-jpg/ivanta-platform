import { api } from '@/lib/api/client';
import { API } from '@/lib/api/paths';
import type { AdminLoginResult, AdminProfile, OtpRequestResult, User } from '@/types';

export const authService = {
  register: (input: { name: string; email?: string; phone?: string; password: string }) =>
    api.post<User>(API.auth.register, input),
  login: (identifier: string, password: string) =>
    api.post<User>(API.auth.login, { identifier, password }),
  requestOtp: (identifier: string, name?: string) =>
    api.post<OtpRequestResult>(API.auth.requestOtp, { identifier, name }),
  verifyOtp: (identifier: string, code: string, name?: string) =>
    api.post<User>(API.auth.verifyOtp, { identifier, code, name }),
  me: () => api.get<User>(API.auth.me),
  logout: () => api.post<void>(API.auth.logout),
};

export const adminAuthService = {
  login: (email: string, password: string) =>
    api.post<AdminLoginResult>(API.admin.login, { email, password }),
  login2fa: (email: string, code: string) =>
    api.post<AdminLoginResult>(API.admin.login2fa, { email, code }),
  me: () => api.get<AdminProfile>(API.admin.me),
  refresh: () => api.post<AdminProfile>(API.admin.refresh),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<void>(API.admin.changePassword, { currentPassword, newPassword }),
  logout: () => api.post<void>(API.admin.logout),
};
