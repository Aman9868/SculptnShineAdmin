'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, ShoppingBag, CreditCard, Sparkles, ExternalLink, X, BellRing } from 'lucide-react';
import { notificationAPI, AdminNotification } from '@/lib/api/notification';

const VAPID_PUBLIC_KEY = 'BGhbVRqimzy3ooUqlfuZQUCYJVNDxfiabJ17vi4_EwOjR74mDLLzhKXEXxQEQlVVwdnwgNgv4DYdIOvhrM0RbFw';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isInitialLoadRef = useRef(true);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMyNotifications(30);
      if (res.success && Array.isArray(res.data)) {
        const newNotifications: AdminNotification[] = res.data;
        
        // On first load, record all existing IDs so we don't spam popups for old unread notifications
        if (isInitialLoadRef.current) {
          newNotifications.forEach((n) => knownNotificationIdsRef.current.add(n.id));
          isInitialLoadRef.current = false;
        } else {
          // Detect truly new incoming notifications
          const brandNewNotifications = newNotifications.filter(
            (n) => !knownNotificationIdsRef.current.has(n.id)
          );

          if (
            brandNewNotifications.length > 0 &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            brandNewNotifications.forEach((latest) => {
              knownNotificationIdsRef.current.add(latest.id);
              new Notification(`🛍️ ${latest.title}`, {
                body: latest.message,
                icon: '/assets/logo.png',
                tag: latest.id, // Deduplicate in browser
              });
            });
          }
        }

        setNotifications(newNotifications);
      }
    } catch (err) {
      // Silently ignore in polling
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Fast polling every 5 seconds for instant order notifications
    const interval = setInterval(fetchNotifications, 5000);

    // Register Service Worker for Admin Push Notifications
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          if ('PushManager' in window) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              setIsPushSubscribed(true);
            }
          }
        })
        .catch((err) => console.warn('Admin ServiceWorker registration failed:', err));
    }

    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const enablePushNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Push notifications are not supported on this browser.');
      return;
    }

    setIsSubscribing(true);
    try {
      // 1. Request Chrome browser notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission was denied in your browser settings. Please allow notifications for this site in Chrome.');
        setIsSubscribing(false);
        return;
      }

      // 2. Register Service Worker & subscribe
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        if ('PushManager' in window) {
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
          }

          if (subscription) {
            await notificationAPI.subscribe(subscription).catch((err) => {
              console.warn('Admin push subscribe sync warning:', err);
            });
          }
        }
      }

      setIsPushSubscribed(true);

      // 3. Trigger immediate native confirmation push notification
      new Notification('👑 Sculpt & Shine Admin Push Active!', {
        body: 'You will receive instant native alerts for new orders, payments, and low stock notices.',
        icon: '/assets/logo.png',
      });
    } catch (err: any) {
      console.error('Failed to subscribe admin push:', err);
      alert('Could not enable push: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleMarkAsRead = (notification: AdminNotification) => {
    try {
      // Optimistically update read status
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setIsOpen(false);

      // Async backend mark-as-read
      notificationAPI.markAsRead(notification.id).catch(() => {});

      // Determine destination URL
      let targetUrl = notification.link;

      if (!targetUrl || targetUrl === '/orders') {
        // Check if there is an order number in message or title (e.g., ORD-1786792297680-5044)
        const match = (notification.title + ' ' + notification.message).match(/ORD-[\w-]+/);
        if (match) {
          targetUrl = `/orders?search=${match[0]}`;
        } else {
          targetUrl = '/orders';
        }
      }

      // Smoothly navigate to destination
      router.push(targetUrl);
    } catch (err) {
      console.error('Failed to navigate:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative -m-2.5 p-2.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-all cursor-pointer shadow-2xs"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-red-500 rounded-full ring-2 ring-white animate-in zoom-in duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[11px] font-black">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check size={13} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Enable Push Alerts Banner if not subscribed */}
          {!isPushSubscribed && (
            <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-amber-900">
                <BellRing size={15} className="text-amber-700 shrink-0" />
                <span className="font-semibold text-[11px]">Get desktop push notifications for new orders</span>
              </div>
              <button
                type="button"
                onClick={enablePushNotifications}
                disabled={isSubscribing}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shrink-0 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isSubscribing ? 'Enabling...' : 'Enable'}
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="font-bold text-gray-700 text-sm">No notifications yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  New orders and customer payments will appear here in real-time.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isOrder = n.title?.toLowerCase().includes('order');
                const isPayment = n.title?.toLowerCase().includes('payment');

                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n)}
                    className={`p-4 flex gap-3 transition-colors cursor-pointer text-left ${
                      n.isRead
                        ? 'bg-white hover:bg-gray-50/80 opacity-75'
                        : 'bg-amber-50/30 hover:bg-amber-50/70 border-l-3 border-amber-600'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isPayment
                          ? 'bg-emerald-100 text-emerald-700'
                          : isOrder
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isPayment ? (
                        <CreditCard size={17} />
                      ) : isOrder ? (
                        <ShoppingBag size={17} />
                      ) : (
                        <Sparkles size={17} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-gray-900 text-xs truncate">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-snug break-words">
                        {n.message}
                      </p>
                      {n.link && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 mt-2 hover:underline">
                          View details <ExternalLink size={10} />
                        </span>
                      )}
                    </div>

                    {/* Unread Dot */}
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
