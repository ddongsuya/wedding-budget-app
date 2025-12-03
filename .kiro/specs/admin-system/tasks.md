# Implementation Plan

- [ ] 1. Database schema setup
  - Create migration file for admin system tables
  - Add is_admin column to users table
  - Create announcements table with indexes
  - Run migration to apply schema changes
  - _Requirements: 5.2, 6.1, 6.2, 7.1, 7.2, 8.1_

- [ ] 2. Backend - Admin middleware and authentication
  - Create admin permission check middleware
  - Implement checkAdminPermission function to verify is_admin flag
  - Add error handling for unauthorized access
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 2.1 Write property test for admin permission enforcement
  - **Property 1: Admin permission enforcement**
  - **Validates: Requirements 5.2, 5.3, 5.4**

- [ ] 3. Backend - Admin controller for dashboard statistics
  - Implement getDashboardStats function
  - Query total users, active users, new users counts
  - Query total couples and connected couples counts
  - Calculate weekly signup trends
  - Format and return statistics response
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 3.1 Write property test for statistics calculation consistency
  - **Property 6: Statistics calculation consistency**
  - **Validates: Requirements 9.1, 9.2, 9.4, 9.5**

- [ ] 4. Backend - User management endpoints
  - Implement getUsers function with pagination and search
  - Implement toggleUserAdmin function to change admin status
  - Add input validation for user management operations
  - _Requirements: 2.1, 2.2, 2.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 4.1 Write property test for user search filtering
  - **Property 4: User search filtering**
  - **Validates: Requirements 2.2**

- [ ] 4.2 Write property test for pagination calculation
  - **Property 5: Pagination calculation accuracy**
  - **Validates: Requirements 10.4**

- [ ] 4.3 Write property test for admin status toggle idempotence
  - **Property 8: Admin status toggle idempotence**
  - **Validates: Requirements 2.3**

- [ ] 5. Backend - Announcement management endpoints
  - Implement getAnnouncements function with filtering
  - Implement createAnnouncement function with validation
  - Implement updateAnnouncement function
  - Implement deleteAnnouncement function
  - Add default values for type and priority
  - Set created_by and timestamps automatically
  - _Requirements: 3.1, 3.3, 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 6.4, 7.3, 7.4, 8.1, 8.3, 8.4_

- [ ] 5.1 Write property test for announcement creation defaults
  - **Property 9: Default values on announcement creation**
  - **Validates: Requirements 6.3, 6.4**

- [ ] 5.2 Write property test for announcement creation timestamp
  - **Property 7: Announcement creation timestamp**
  - **Validates: Requirements 8.1, 8.3**

- [ ] 6. Backend - Active announcements endpoint
  - Implement getActiveAnnouncements function
  - Filter by is_active = true
  - Filter by date range (start_date and end_date)
  - Order by priority descending, then created_at descending
  - Limit results to 10 announcements
  - Make endpoint accessible to all authenticated users
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.5, 7.5_

- [ ] 6.1 Write property test for active announcement filtering
  - **Property 2: Active announcement filtering**
  - **Validates: Requirements 4.2, 4.3, 7.5**

- [ ] 6.2 Write property test for announcement ordering
  - **Property 3: Announcement ordering consistency**
  - **Validates: Requirements 4.4**

- [ ] 6.3 Write property test for active announcements limit
  - **Property 10: Active announcements limit**
  - **Validates: Requirements 4.5**

- [ ] 7. Backend - Admin routes setup
  - Create admin router file
  - Register all admin endpoints with proper HTTP methods
  - Apply authentication middleware to all routes
  - Apply admin permission middleware (except active announcements)
  - Register admin router in main app
  - _Requirements: 5.1, 5.5_

- [ ] 8. Backend - Type definitions update
  - Extend User interface to include is_admin field
  - Create Announcement interface
  - Extend AuthRequest to include isAdmin in user object
  - _Requirements: All_

- [ ] 9. Frontend - Admin API client
  - Create admin.ts API client file
  - Implement getDashboardStats API method
  - Implement getUsers API method with pagination params
  - Implement toggleUserAdmin API method
  - Implement announcement CRUD API methods
  - Implement getActiveAnnouncements API method
  - Add TypeScript interfaces for all request/response types
  - _Requirements: All_

- [ ] 10. Frontend - Admin dashboard page
  - Create AdminDashboard component
  - Add admin permission check on component mount
  - Display statistics cards (users, couples, etc.)
  - Display weekly signup trend chart
  - Add navigation menu to management pages
  - Show loading state while fetching data
  - Handle errors and display error messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 11. Frontend - User management page
  - Create AdminUsers component
  - Display paginated user list
  - Implement search functionality with debouncing
  - Add toggle admin button for each user
  - Display user details (name, email, admin status, couple info)
  - Implement pagination controls
  - Show loading and error states
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 12. Frontend - Announcement management page
  - Create AdminAnnouncements component
  - Display announcement list
  - Implement create announcement modal/form
  - Implement edit announcement functionality
  - Implement delete announcement with confirmation
  - Add toggle for active status
  - Show announcement details (type, priority, dates, creator)
  - Add filtering by type and status
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.5, 7.1, 7.2, 8.2_

- [ ] 13. Frontend - Admin route protection
  - Create AdminRoute guard component
  - Check user.is_admin before rendering admin pages
  - Redirect to home page if not admin
  - Show error toast when access denied
  - Handle loading state during auth check
  - _Requirements: 1.2, 5.3_

- [ ] 14. Frontend - Router configuration
  - Add admin routes to App router
  - Configure /admin path for dashboard
  - Configure /admin/users path for user management
  - Configure /admin/announcements path for announcement management
  - Wrap all admin routes with AdminRoute guard
  - _Requirements: 1.1, 1.5_

- [ ] 15. Frontend - Active announcements display
  - Create component to display active announcements
  - Fetch active announcements on app load
  - Display announcements with type badges
  - Show priority indicators
  - Format dates for display
  - Add dismiss/close functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 16. Integration and testing checkpoint
  - Ensure all tests pass, ask the user if questions arise
  - Verify admin permission checks work correctly
  - Test user management operations
  - Test announcement CRUD operations
  - Test active announcements filtering and display
  - Verify pagination and search functionality
  - Test error handling and edge cases
