import { api } from '@/lib/api/client';
import { API } from '@/lib/api/paths';
import type { Address, AddressInput, User } from '@/types';

export const userService = {
  profile: () => api.get<User & { marketingEmails?: boolean; marketingSms?: boolean }>(API.users.me),
  updateProfile: (input: { name?: string; marketingEmails?: boolean; marketingSms?: boolean }) =>
    api.patch<User>(API.users.me, input),
  addresses: () => api.get<Address[]>(API.users.addresses),
  createAddress: (input: AddressInput) => api.post<Address>(API.users.addresses, input),
  updateAddress: (id: string, input: Partial<AddressInput>) => api.patch<Address>(API.users.address(id), input),
  deleteAddress: (id: string) => api.del<void>(API.users.address(id)),
  setDefaultAddress: (id: string) => api.post<Address>(API.users.addressDefault(id)),
};
