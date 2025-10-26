/**
 * Notification Service for Campus Cupid
 * Handles in-app push notifications for matches and other events
 */

import { toast } from 'sonner'

export interface NotificationData {
  title: string
  description: string
  type: 'match' | 'message' | 'rating' | 'bookmark'
  userId?: string
  profileId?: string
  matchId?: string
}

/**
 * Show match notification
 */
export function showMatchNotification(matchedUsername: string, matchId?: string) {
  toast.success(`🎉 It's a Match!`, {
    description: `You and ${matchedUsername} both rated each other highly!`,
    duration: 5000,
    action: {
      label: 'View Chat',
      onClick: () => {
        if (matchId) {
          window.location.href = `/chat/${matchId}`
        }
      }
    }
  })
}

/**
 * Show rating notification
 */
export function showRatingNotification(username: string, rating: number) {
  toast.info(`Rating Submitted`, {
    description: `You rated ${username} a ${rating}/10`,
    duration: 3000
  })
}

/**
 * Show bookmark notification
 */
export function showBookmarkNotification(isBookmarked: boolean, username: string) {
  toast.success(isBookmarked ? 'Bookmarked' : 'Bookmark Removed', {
    description: isBookmarked 
      ? `${username} added to bookmarks` 
      : `${username} removed from bookmarks`,
    duration: 3000
  })
}

/**
 * Show message notification
 */
export function showMessageNotification(senderUsername: string, message: string) {
  toast.info(`New Message from ${senderUsername}`, {
    description: message.length > 50 ? `${message.substring(0, 50)}...` : message,
    duration: 4000,
    action: {
      label: 'Reply',
      onClick: () => {
        // Navigate to chats page
        window.location.href = '/chats'
      }
    }
  })
}

/**
 * Show generic notification
 */
export function showNotification(data: NotificationData) {
  const { title, description, type } = data

  switch (type) {
    case 'match':
      toast.success(title, {
        description,
        duration: 5000
      })
      break
    case 'message':
      toast.info(title, {
        description,
        duration: 4000
      })
      break
    case 'rating':
      toast.info(title, {
        description,
        duration: 3000
      })
      break
    case 'bookmark':
      toast.success(title, {
        description,
        duration: 3000
      })
      break
    default:
      toast(title, {
        description,
        duration: 3000
      })
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Show browser notification (if permission granted)
 */
export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })
  }
}

/**
 * Setup real-time notifications for matches
 */
export function setupMatchNotifications(userId: string) {
  // This would typically connect to a WebSocket or Supabase realtime
  // For now, we'll use the existing Supabase realtime setup in Feed component
  console.log('Setting up match notifications for user:', userId)
}

