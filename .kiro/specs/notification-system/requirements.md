# Requirements Document

## Introduction

웨딩 예산 관리 앱의 알림 시스템입니다. 사용자에게 중요한 일정, D-day 알림, 체크리스트 마감일, 예산 초과 경고 등을 푸시 알림과 인앱 알림으로 제공합니다. PWA 기반의 웹 푸시 알림과 앱 내 알림 센터를 통해 사용자가 중요한 정보를 놓치지 않도록 합니다.

## Glossary

- **Notification_System**: 사용자에게 알림을 생성, 저장, 전송하는 시스템
- **Push_Notification**: 브라우저/기기의 푸시 API를 통해 전송되는 외부 알림
- **In_App_Notification**: 앱 내부에서 표시되는 알림 (알림 센터)
- **Notification_Preference**: 사용자별 알림 수신 설정
- **D_Day**: 결혼식까지 남은 일수
- **Reminder**: 특정 시간에 발송되는 미리 알림

## Requirements

### Requirement 1

**User Story:** As a user, I want to receive D-day reminders, so that I can stay aware of how many days are left until my wedding.

#### Acceptance Criteria

1. WHEN the wedding date is set AND the current date changes, THE Notification_System SHALL calculate and display the D-day count on the dashboard
2. WHEN the D-day reaches milestone values (D-100, D-30, D-7, D-1, D-Day), THE Notification_System SHALL send a push notification to the user
3. WHERE the user has enabled D-day notifications, THE Notification_System SHALL send daily D-day reminders at the user-configured time

### Requirement 2

**User Story:** As a user, I want to receive schedule reminders, so that I can prepare for upcoming wedding-related appointments.

#### Acceptance Criteria

1. WHEN a schedule event is created with a reminder setting, THE Notification_System SHALL store the reminder configuration
2. WHEN the reminder time arrives for a scheduled event, THE Notification_System SHALL send a push notification with event details
3. WHERE the user has set multiple reminder times (1 day before, 1 hour before), THE Notification_System SHALL send notifications at each configured time

### Requirement 3

**User Story:** As a user, I want to receive checklist deadline reminders, so that I can complete tasks on time.

#### Acceptance Criteria

1. WHEN a checklist item has a due date AND the due date is approaching (1 day before), THE Notification_System SHALL send a reminder notification
2. WHEN a checklist item's due date has passed AND the item is not completed, THE Notification_System SHALL send an overdue notification
3. WHILE viewing the checklist, THE Notification_System SHALL visually highlight overdue items

### Requirement 4

**User Story:** As a user, I want to receive budget alerts, so that I can manage my wedding expenses effectively.

#### Acceptance Criteria

1. WHEN total expenses exceed 80% of the budget, THE Notification_System SHALL send a warning notification
2. WHEN total expenses exceed 100% of the budget, THE Notification_System SHALL send an over-budget alert notification
3. WHEN a new expense is added that causes budget threshold crossing, THE Notification_System SHALL immediately notify the user

### Requirement 5

**User Story:** As a user, I want to manage my notification preferences, so that I can control which notifications I receive.

#### Acceptance Criteria

1. WHEN a user accesses notification settings, THE Notification_System SHALL display all notification categories with toggle controls
2. WHEN a user toggles a notification category, THE Notification_System SHALL immediately update the preference and persist it
3. WHEN a user sets a preferred notification time, THE Notification_System SHALL use that time for daily notifications
4. WHERE push notifications are disabled at the browser level, THE Notification_System SHALL prompt the user to enable them

### Requirement 6

**User Story:** As a user, I want to view all my notifications in one place, so that I can review past alerts and updates.

#### Acceptance Criteria

1. WHEN a user opens the notification center, THE Notification_System SHALL display all notifications sorted by date (newest first)
2. WHEN a user clicks on a notification, THE Notification_System SHALL mark it as read and navigate to the relevant page
3. WHEN a user has unread notifications, THE Notification_System SHALL display a badge count on the notification icon
4. WHEN a user clears all notifications, THE Notification_System SHALL remove all notifications from the list

### Requirement 7

**User Story:** As a user, I want to receive couple activity notifications, so that I can stay updated on my partner's actions.

#### Acceptance Criteria

1. WHEN a coupled partner adds or modifies a venue, THE Notification_System SHALL notify the other partner
2. WHEN a coupled partner adds or modifies an expense, THE Notification_System SHALL notify the other partner
3. WHEN a coupled partner completes a checklist item, THE Notification_System SHALL notify the other partner
4. WHERE couple notifications are enabled, THE Notification_System SHALL include the partner's name in the notification

### Requirement 8

**User Story:** As a system administrator, I want to send announcements to all users, so that I can communicate important updates.

#### Acceptance Criteria

1. WHEN an admin creates an announcement, THE Notification_System SHALL deliver it to all active users
2. WHEN a user receives an announcement, THE Notification_System SHALL display it prominently in the notification center
3. WHEN an announcement is marked as important, THE Notification_System SHALL send a push notification to all users
