'use client';
import { notificationService } from '@/services';
import type { AppNotification } from '@/types';
import { useAsync } from './use-async';

export function useNotifications(enabled = true) {
  const state = useAsync<{ notifications: AppNotification[]; unreadCount: number }>(
    () => notificationService.list(), [enabled], { skip: !enabled });
  const markRead = async (id: string) => { await notificationService.markRead(id); void state.refresh(); };
  const markAllRead = async () => { await notificationService.markAllRead(); void state.refresh(); };
  return {
    ...state,
    items: state.data?.notifications ?? [],
    markRead,
    markAllRead,
    unread: state.data?.unreadCount ?? 0,
  };
}
