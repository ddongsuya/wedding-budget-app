# Requirements Document

## Introduction

Needless Wedding 애플리케이션을 위한 관리자 시스템입니다. 관리자는 사용자 관리, 공지사항 관리, 통계 조회 등의 기능을 통해 서비스를 효과적으로 운영할 수 있습니다. 이 시스템은 권한 기반 접근 제어를 통해 관리자만 접근할 수 있으며, 일반 사용자는 활성화된 공지사항만 조회할 수 있습니다.

## Glossary

- **Admin System**: 관리자가 애플리케이션을 관리하기 위한 전체 시스템
- **Admin User**: is_admin 플래그가 true로 설정된 사용자
- **Regular User**: is_admin 플래그가 false인 일반 사용자
- **Dashboard**: 주요 통계와 지표를 시각적으로 표시하는 관리자 페이지
- **Announcement**: 사용자에게 표시되는 공지사항 메시지
- **Active Announcement**: is_active가 true이고 현재 날짜가 start_date와 end_date 범위 내에 있는 공지사항
- **User Statistics**: 전체 사용자 수, 활성 사용자 수, 신규 가입자 수 등의 집계 데이터
- **Couple Statistics**: 전체 커플 수, 연결된 커플 수 등의 집계 데이터
- **Permission Check**: 사용자의 관리자 권한을 확인하는 프로세스
- **Announcement Type**: 공지사항의 종류 (new, update, notice, maintenance)
- **Priority Level**: 공지사항의 우선순위 (0: 낮음, 1: 보통, 2: 높음, 3: 긴급)

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to access a dedicated admin dashboard, so that I can view key metrics and manage the application effectively.

#### Acceptance Criteria

1. WHEN an Admin User navigates to the admin dashboard URL THEN the Admin System SHALL display the dashboard page with statistics
2. WHEN a Regular User attempts to access the admin dashboard URL THEN the Admin System SHALL redirect to the home page and display an error message
3. WHEN the dashboard loads THEN the Admin System SHALL display total users, active users, new users, total couples, and connected couples statistics
4. WHEN the dashboard loads THEN the Admin System SHALL display a weekly signup trend chart showing user registrations for the past 7 days
5. WHEN the Admin User clicks on a management menu item THEN the Admin System SHALL navigate to the corresponding management page

### Requirement 2

**User Story:** As an administrator, I want to view and manage user accounts, so that I can monitor user activity and adjust permissions when needed.

#### Acceptance Criteria

1. WHEN an Admin User accesses the user management page THEN the Admin System SHALL display a paginated list of all users with their details
2. WHEN an Admin User enters text in the search field THEN the Admin System SHALL filter users by name or email matching the search term
3. WHEN an Admin User clicks the toggle admin button for a user THEN the Admin System SHALL update the user's is_admin status
4. WHEN a user's admin status is changed THEN the Admin System SHALL display a success message confirming the change
5. WHEN the user list is displayed THEN the Admin System SHALL show user name, email, admin status, couple connection status, and registration date

### Requirement 3

**User Story:** As an administrator, I want to create and manage announcements, so that I can communicate important information to users.

#### Acceptance Criteria

1. WHEN an Admin User accesses the announcement management page THEN the Admin System SHALL display a list of all announcements with their details
2. WHEN an Admin User clicks the create announcement button THEN the Admin System SHALL display a form to create a new announcement
3. WHEN an Admin User submits a valid announcement form THEN the Admin System SHALL create the announcement and display a success message
4. WHEN an Admin User clicks the edit button for an announcement THEN the Admin System SHALL display a form pre-filled with the announcement data
5. WHEN an Admin User updates an announcement THEN the Admin System SHALL save the changes and display a success message
6. WHEN an Admin User clicks the delete button for an announcement THEN the Admin System SHALL remove the announcement and display a success message
7. WHEN an Admin User toggles the active status of an announcement THEN the Admin System SHALL update the is_active field

### Requirement 4

**User Story:** As a regular user, I want to view active announcements, so that I can stay informed about important updates and news.

#### Acceptance Criteria

1. WHEN a Regular User accesses the application THEN the Admin System SHALL provide active announcements through the API
2. WHEN the active announcements are requested THEN the Admin System SHALL return only announcements where is_active is true
3. WHEN the active announcements are requested THEN the Admin System SHALL return only announcements where the current date is within the start_date and end_date range
4. WHEN multiple active announcements exist THEN the Admin System SHALL order them by priority descending and then by creation date descending
5. WHEN the active announcements are returned THEN the Admin System SHALL limit the results to a maximum of 10 announcements

### Requirement 5

**User Story:** As an administrator, I want the system to verify my admin permissions before allowing access to admin features, so that unauthorized users cannot access sensitive functionality.

#### Acceptance Criteria

1. WHEN a user attempts to access any admin endpoint THEN the Admin System SHALL verify the user is authenticated
2. WHEN an authenticated user attempts to access an admin endpoint THEN the Admin System SHALL check if the user's is_admin field is true
3. WHEN a user without admin permissions attempts to access an admin endpoint THEN the Admin System SHALL return a 403 Forbidden status with an error message
4. WHEN a user with admin permissions accesses an admin endpoint THEN the Admin System SHALL allow the request to proceed
5. WHEN the active announcements endpoint is accessed THEN the Admin System SHALL allow both Admin Users and Regular Users to access it

### Requirement 6

**User Story:** As an administrator, I want announcement data to include type and priority information, so that I can categorize and prioritize communications effectively.

#### Acceptance Criteria

1. WHEN an Admin User creates an announcement THEN the Admin System SHALL allow setting the Announcement Type to one of: new, update, notice, or maintenance
2. WHEN an Admin User creates an announcement THEN the Admin System SHALL allow setting the Priority Level to 0, 1, 2, or 3
3. WHEN an announcement is created without specifying a type THEN the Admin System SHALL default the type to notice
4. WHEN an announcement is created without specifying a priority THEN the Admin System SHALL default the priority to 0
5. WHEN announcements are displayed THEN the Admin System SHALL show the type and priority for each announcement

### Requirement 7

**User Story:** As an administrator, I want to set date ranges for announcements, so that I can schedule announcements to appear and disappear automatically.

#### Acceptance Criteria

1. WHEN an Admin User creates an announcement THEN the Admin System SHALL allow setting a start_date for when the announcement becomes visible
2. WHEN an Admin User creates an announcement THEN the Admin System SHALL allow setting an optional end_date for when the announcement stops being visible
3. WHEN an announcement is created without a start_date THEN the Admin System SHALL default the start_date to the current timestamp
4. WHEN an announcement is created without an end_date THEN the Admin System SHALL set end_date to null indicating no expiration
5. WHEN determining Active Announcements THEN the Admin System SHALL include only announcements where the current date is greater than or equal to start_date and less than or equal to end_date (or end_date is null)

### Requirement 8

**User Story:** As an administrator, I want to see who created each announcement, so that I can track content authorship and accountability.

#### Acceptance Criteria

1. WHEN an Admin User creates an announcement THEN the Admin System SHALL record the creating user's ID in the created_by field
2. WHEN announcements are displayed in the management interface THEN the Admin System SHALL show the creator's name alongside each announcement
3. WHEN an announcement is created THEN the Admin System SHALL automatically set the created_at timestamp to the current time
4. WHEN an announcement is updated THEN the Admin System SHALL automatically update the updated_at timestamp to the current time

### Requirement 9

**User Story:** As an administrator, I want to view statistics about user activity, so that I can understand usage patterns and growth trends.

#### Acceptance Criteria

1. WHEN the dashboard statistics are requested THEN the Admin System SHALL calculate the total count of all users in the database
2. WHEN the dashboard statistics are requested THEN the Admin System SHALL calculate the count of users who have logged in within the past 7 days as active users
3. WHEN the dashboard statistics are requested THEN the Admin System SHALL calculate the count of users created on the current date as new users
4. WHEN the dashboard statistics are requested THEN the Admin System SHALL calculate the total count of all couples in the database
5. WHEN the dashboard statistics are requested THEN the Admin System SHALL calculate the count of couples that have exactly 2 connected users as connected couples
6. WHEN the dashboard statistics are requested THEN the Admin System SHALL provide daily user registration counts for the past 7 days

### Requirement 10

**User Story:** As an administrator, I want the user management interface to support pagination, so that I can efficiently browse through large numbers of users.

#### Acceptance Criteria

1. WHEN the user list is requested THEN the Admin System SHALL accept a page parameter to specify which page to retrieve
2. WHEN the user list is requested THEN the Admin System SHALL accept a limit parameter to specify how many users per page
3. WHEN the user list is requested without pagination parameters THEN the Admin System SHALL default to page 1 with 20 users per limit
4. WHEN the user list is returned THEN the Admin System SHALL include pagination metadata with current page, limit, total count, and total pages
5. WHEN the user list is requested THEN the Admin System SHALL order users by creation date descending (newest first)
