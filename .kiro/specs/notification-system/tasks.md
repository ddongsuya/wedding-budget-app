# Implementation Plan

## Phase 1: Database & Backend Foundation

- [x] 1. Create database migration for notification tables




  - [ ] 1.1 Create notifications table with indexes
    - Add id, user_id, type, title, message, data, link, is_read, created_at, read_at columns

    - Create indexes for user_id, created_at, and is_read
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 1.2 Create notification_preferences table

    - Add columns for each notification category toggle
    - Add preferred_time column for daily notifications




    - _Requirements: 5.1, 5.2, 5.3_
  - [ ] 1.3 Create push_subscriptions table
    - Store Web Push subscription data (endpoint, p256dh, auth)



    - _Requirements: 5.4_

- [ ] 2. Implement notification types and interfaces
  - [ ] 2.1 Create notification types in backend
    - Define NotificationType enum
    - Create Notification interface
    - Create NotificationPreference interface
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 3. Implement notification controller and routes
  - [x] 3.1 Create notificationController.ts

    - Implement getNotifications with pagination and sorting
    - Implement getUnreadCount
    - Implement markAsRead
    - Implement deleteNotification
    - Implement clearAllNotifications
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ] 3.2 Write property test for notification sorting
    - **Property 6: Notification Sorting**
    - **Validates: Requirements 6.1**
  - [ ] 3.3 Write property test for unread count accuracy
    - **Property 7: Unread Count Accuracy**
    - **Validates: Requirements 6.3**
  - [ ] 3.4 Create notification routes
    - Set up GET /api/notifications
    - Set up GET /api/notifications/unread-count
    - Set up PUT /api/notifications/:id/read
    - Set up DELETE /api/notifications/:id
    - Set up DELETE /api/notifications
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 4. Implement notification preferences controller
  - [ ] 4.1 Create preferencesController.ts
    - Implement getPreferences
    - Implement updatePreferences
    - Create default preferences on first access
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ] 4.2 Write property test for preference-respecting notifications
    - **Property 3: Preference-Respecting Notifications**
    - **Validates: Requirements 1.3, 5.2**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Notification Service & Triggers

- [ ] 6. Implement notification service
  - [ ] 6.1 Create notificationService.ts
    - Implement createNotification function
    - Implement createBulkNotifications for announcements
    - Implement notification filtering by preferences
    - _Requirements: 1.2, 4.1, 4.2, 7.1, 8.1_
  - [ ] 6.2 Write property test for read status update
    - **Property 8: Read Status Update**
    - **Validates: Requirements 6.2**

- [ ] 7. Implement D-day notification logic
  - [ ] 7.1 Create ddayService.ts
    - Implement D-day calculation function
    - Implement milestone detection (D-100, D-30, D-7, D-1, D-Day)
    - Implement daily D-day notification generation
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 7.2 Write property test for D-day calculation
    - **Property 1: D-day Calculation Accuracy**
    - **Validates: Requirements 1.1**
  - [ ] 7.3 Write property test for milestone triggering
    - **Property 2: Milestone Notification Triggering**
    - **Validates: Requirements 1.2**

- [ ] 8. Implement budget notification logic
  - [ ] 8.1 Create budgetNotificationService.ts
    - Implement threshold detection (80%, 100%)
    - Implement threshold crossing detection on expense add
    - Integrate with expense controller
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 8.2 Write property test for budget threshold detection
    - **Property 4: Budget Threshold Detection**
    - **Validates: Requirements 4.1, 4.2**
  - [ ] 8.3 Write property test for threshold crossing
    - **Property 5: Threshold Crossing Detection**
    - **Validates: Requirements 4.3**

- [ ] 9. Implement couple activity notifications
  - [ ] 9.1 Create coupleNotificationService.ts
    - Implement partner notification on venue change
    - Implement partner notification on expense change
    - Implement partner notification on checklist change
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ] 9.2 Write property test for couple activity notification
    - **Property 9: Couple Activity Notification**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Push Notifications

- [ ] 11. Set up Web Push infrastructure
  - [ ] 11.1 Install web-push package and configure VAPID keys
    - Generate VAPID keys
    - Add environment variables for keys
    - _Requirements: 5.4_
  - [ ] 11.2 Create pushService.ts
    - Implement subscription storage
    - Implement push notification sending
    - Implement subscription cleanup on failure
    - _Requirements: 1.2, 2.2, 4.1, 8.3_

- [ ] 12. Implement push subscription endpoints
  - [x] 12.1 Create push routes

    - Implement POST /api/push/subscribe


    - Implement DELETE /api/push/unsubscribe
    - _Requirements: 5.4_

- [ ] 13. Integrate push with notification service
  - [ ] 13.1 Update notificationService to send push
    - Send push notification when creating in-app notification
    - Respect user push preferences

    - Handle push failures gracefully
    - _Requirements: 1.2, 2.2, 4.1, 8.3_



## Phase 4: Frontend Implementation


- [ ] 14. Create notification API client
  - [x] 14.1 Create src/api/notifications.ts

    - Implement getNotifications
    - Implement getUnreadCount
    - Implement markAsRead


    - Implement deleteNotification

    - Implement clearAll
    - Implement getPreferences
    - Implement updatePreferences
    - _Requirements: 6.1, 6.2, 6.4, 5.1, 5.2_




- [ ] 15. Create notification context and hooks
  - [ ] 15.1 Create NotificationContext.tsx
    - Manage notification state
    - Provide unread count
    - Handle real-time updates




    - _Requirements: 6.3_
  - [ ] 15.2 Create useNotifications hook
    - Fetch and cache notifications
    - Handle pagination
    - _Requirements: 6.1_





- [x] 16. Create NotificationBadge component


  - [ ] 16.1 Implement NotificationBadge.tsx
    - Display unread count
    - Animate on new notifications
    - Integrate with header/navigation
    - _Requirements: 6.3_


- [ ] 17. Create NotificationCenter component
  - [ ] 17.1 Implement NotificationCenter.tsx
    - Display notification list
    - Handle click to mark as read and navigate
    - Implement clear all functionality
    - Show empty state when no notifications
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 18. Create NotificationPreferences component
  - [ ] 18.1 Implement NotificationPreferences.tsx
    - Display category toggles
    - Time picker for daily notifications
    - Push permission request button
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 19. Integrate notifications into app
  - [ ] 19.1 Add NotificationProvider to App.tsx
    - Wrap app with NotificationContext
    - _Requirements: 6.3_
  - [ ] 19.2 Add NotificationBadge to header/navigation
    - Show badge in Layout component
    - _Requirements: 6.3_
  - [ ] 19.3 Add notification settings to Settings page
    - Add link to notification preferences
    - _Requirements: 5.1_
  - [ ] 19.4 Create notification center page/modal
    - Add route for /notifications
    - _Requirements: 6.1_

- [ ] 20. Implement Service Worker push handling
  - [ ] 20.1 Update service worker for push notifications
    - Handle push events
    - Show native notifications
    - Handle notification click
    - _Requirements: 1.2, 2.2, 8.3_

- [ ] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Admin Announcements Integration

- [ ] 22. Integrate announcements with notification system
  - [ ] 22.1 Update admin announcement creation
    - Create notifications for all users on announcement
    - Send push for important announcements
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 22.2 Write property test for announcement broadcast
    - **Property 10: Announcement Broadcast**
    - **Validates: Requirements 8.1**

- [ ] 23. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
