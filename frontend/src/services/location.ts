import { api } from '@/lib/api/client';
import { API } from '@/lib/api/paths';
import type { LocationSuggestion, PincodeInfo, PincodeLookupResponse, Serviceability } from '@/types';

export const locationService = {
  search: (q: string) => api.get<{ query: string; suggestions: LocationSuggestion[] }>(API.location.search, { query: { q } }),
  pincode: (code: string) => api.get<PincodeInfo>(API.location.pincode(code)),
  pincodeLookup: (pincode: string) => api.get<PincodeLookupResponse>(API.location.pincodeLookup(pincode)),
  cities: () => api.get<{ id: string; name: string; state: string; popular: boolean }[]>(API.location.cities),
  localities: (cityId?: string) =>
    api.get<{ id: string; name: string; cityId: string; popular: boolean }[]>(API.location.localities, { query: { cityId } }),
  serviceability: (pin: string) => api.get<Serviceability>(API.location.serviceability, { query: { pin } }),
  reverseGeocode: (latitude: number, longitude: number) =>
    api.post<{ latitude: number; longitude: number; locality?: string | null; city?: string | null; state?: string | null; pincode?: string | null; provider: string }>(API.location.reverse, { latitude, longitude }),
};
