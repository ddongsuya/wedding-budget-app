# Design Document

## Overview

The Admin System provides a comprehensive management interface for Needless Wedding administrators. It consists of a backend API with role-based access control and a frontend dashboard interface. The system enables administrators to monitor application usage, manage users, and communicate with users through announcements.

The architecture follows the existing application patterns with Express.js controllers and routes on the backend, and React components with TypeScript on the frontend. All admin endpoints are protected by authentication and authorization middleware.

## Architecture

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Request                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Middleware                  │
│                  (verify JWT token)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Permission Check Middleware               │
│              (verify is_admin = true)                        │
│              (except for active announcements)               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Admin Controller                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - getDashboardStats()                               │  │
│  │  - getUsers()                                        │  │
│  │  - toggleUserAdmin()                                 │  │
│  │  - getAnnouncements()                                │  │
│  │  - createAnnouncement()                              │  │
│  │  - updateAnnouncement()                              │  │
│  │  - deleteAnnouncement()                              │  │
│  │  - getActiveAnnouncements()                          │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables:                                             │  │
│  │  - users (with is_admin column)                     │  │
│  │  - couples                                           │  │
│  │  - announcements                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App Router                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Protected Route Check                     │
│                  (verify user.is_admin)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│   Admin      │  │   User           │  │  Announcement   │
│   Dashboard  │  │   Management     │  │  Management     │
│              │  │                  │  │                 │
│  - Stats     │  │  - User List     │  │  - List         │
│  - Charts    │  │  - Search        │  │  - Create       │
│  - Menu      │  │  - Toggle Admin  │  │  - Edit         │
└──────────────┘  └──────────────────┘  └─────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Admin API Client                      │
│                    (src/api/admin.ts)                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. Admin Controller (`backend/src/controllers/adminController.ts`)

**Responsibilities:**
- Handle all admin-related HTTP requests
- Validate admin permissions
- Query database for statistics and data
- Format and return responses

**Key Functions:**

```typescript
// Middleware to check admin permission
export const checkAdminPermission = async (
  req: AuthRequest, 
  res: Response, 
  next: any
) => Promise<void>

// Get dashboard statistics
export const getDashboardStats = async (
  req: AuthRequest, 
  res: Response
) => Promise<void>

// Get paginated user list with optional search
export const getUsers = async (
  req: AuthRequest, 
  res: Response
) => Promise<void>

// Toggle user admin status
export const toggleUserAdmin = async (
  req: AuthRequest, 
  res: Response
) => Promise<void>

// Get announcements with filters
export const getAnnouncements = async (
  req: AuthRequest, 
  res: Response
) => Promise<void>

// Create new announcement
export const createAnnouncement = async (
  req: AuthRequest, 
  res: Response
) => Promise<void>

// Update existing announcement
export const updateAnnouncement = async (
  req: AuthRequest, 
  res: Response
) => Promise<void>

// Delete announcement
export const deleteAnnouncement = async (
  req: AuthRequest, 
  res: Response
) => Promise<void>

// Get active announcements (public endpoint)
export const getActiveAnnouncements = async (
  req: AuthRequest, 
  res: Response
) => Promise<void>
```

#### 2. Admin Routes (`backend/src/routes/admin.ts`)

**Route Definitions:**

```typescript
// Public route (authenticated users only)
GET /api/admin/announcements/active

// Admin-only routes (require is_admin = true)
GET /api/admin/dashboard/stats
GET /api/admin/users
PUT /api/admin/users/:userId/admin
GET /api/admin/announcements
POST /api/admin/announcements
PUT /api/admin/announcements/:id
DELETE /api/admin/announcements/:id
```

### Frontend Components

#### 1. Admin Dashboard (`src/pages/AdminDashboard.tsx`)

**Responsibilities:**
- Display key statistics and metrics
- Show weekly signup trends
- Provide navigation to management pages
- Verify admin access on mount

**Props:** None (uses AuthContext)

**State:**
```typescript
{
  stats: DashboardStats | null,
  isLoading: boolean
}
```

#### 2. User Management Page (`src/pages/AdminUsers.tsx`)

**Responsibilities:**
- Display paginated user list
- Provide search functionality
- Allow toggling admin permissions
- Show user details and couple connections

**State:**
```typescript
{
  users: User[],
  pagination: PaginationInfo,
  searchTerm: string,
  isLoading: boolean,
  currentPage: number
}
```

#### 3. Announcement Management Page (`src/pages/AdminAnnouncements.tsx`)

**Responsibilities:**
- Display announcement list
- Provide create/edit/delete functionality
- Allow filtering by type and status
- Show announcement details and metadata

**State:**
```typescript
{
  announcements: Announcement[],
  isLoading: boolean,
  editingAnnouncement: Announcement | null,
  showCreateModal: boolean,
  filters: { type: string, active: boolean }
}
```

#### 4. Admin API Client (`src/api/admin.ts`)

**Responsibilities:**
- Provide typed API methods for all admin endpoints
- Handle request/response formatting
- Use shared API client for authentication

**Exports:**
```typescript
export const adminAPI = {
  getDashboardStats: () => Promise<DashboardStats>,
  getUsers: (params) => Promise<UserListResponse>,
  toggleUserAdmin: (userId, isAdmin) => Promise<Response>,
  getAnnouncements: (params) => Promise<Announcement[]>,
  createAnnouncement: (data) => Promise<Announcement>,
  updateAnnouncement: (id, data) => Promise<Announcement>,
  deleteAnnouncement: (id) => Promise<Response>,
  getActiveAnnouncements: () => Promise<Announcement[]>
}
```

## Data Models

### Database Schema

#### Users Table Extension
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
```

**Fields:**
- `id`: SERIAL PRIMARY KEY
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `password`: VARCHAR(255) NOT NULL
- `name`: VARCHAR(100) NOT NULL
- `couple_id`: INTEGER (FK to couples)
- `role`: VARCHAR(50)
- `is_admin`: BOOLEAN DEFAULT FALSE (NEW)
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### Announcements Table
```sql
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'notice',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
```

### TypeScript Interfaces

#### Backend Types Extension
```typescript
// Extend existing User interface
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  couple_id?: number;
  role?: string;
  is_admin: boolean; // NEW
  created_at: Date;
  updated_at: Date;
}

// New Announcement interface
export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'new' | 'update' | 'notice' | 'maintenance';
  priority: number;
  is_active: boolean;
  start_date: Date;
  end_date: Date | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// Extend AuthRequest to include is_admin
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    coupleId?: number;
    isAdmin?: boolean; // NEW
  };
  file?: Express.Multer.File;
}
```

#### Frontend Types
```typescript
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalCouples: number;
  connectedCouples: number;
  weeklyStats: Array<{
    date: string;
    count: number;
  }>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  couple_id: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  invite_code?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'new' | 'update' | 'notice' | 'maintenance';
  priority: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Admin permission enforcement
*For any* authenticated user attempting to access an admin endpoint (except active announcements), the request should succeed if and only if the user's is_admin field is true.
**Validates: Requirements 5.2, 5.3, 5.4**

### Property 2: Active announcement filtering
*For any* request to get active announcements, all returned announcements should have is_active = true AND current_date >= start_date AND (end_date IS NULL OR current_date <= end_date).
**Validates: Requirements 4.2, 4.3, 7.5**

### Property 3: Announcement ordering consistency
*For any* list of active announcements returned, they should be ordered first by priority descending, then by created_at descending.
**Validates: Requirements 4.4**

### Property 4: User search filtering
*For any* search term provided to the user list endpoint, all returned users should have either their name or email containing the search term (case-insensitive).
**Validates: Requirements 2.2**

### Property 5: Pagination calculation accuracy
*For any* valid page and limit parameters, the returned pagination metadata should satisfy: totalPages = ceil(total / limit) AND the number of returned items should be <= limit.
**Validates: Requirements 10.4**

### Property 6: Statistics calculation consistency
*For any* dashboard stats request, activeUsers count should be <= totalUsers count, and connectedCouples count should be <= totalCouples count.
**Validates: Requirements 9.1, 9.2, 9.4, 9.5**

### Property 7: Announcement creation timestamp
*For any* newly created announcement, the created_at timestamp should be set to the current time and created_by should be set to the authenticated user's ID.
**Validates: Requirements 8.1, 8.3**

### Property 8: Admin status toggle idempotence
*For any* user, toggling admin status to the same value twice should result in the same final state as toggling once.
**Validates: Requirements 2.3**

### Property 9: Default values on announcement creation
*For any* announcement created without specifying type or priority, the type should default to 'notice' and priority should default to 0.
**Validates: Requirements 6.3, 6.4**

### Property 10: Active announcements limit
*For any* request to get active announcements, the number of returned announcements should be <= 10.
**Validates: Requirements 4.5**

## Error Handling

### Backend Error Responses

All error responses follow this format:
```typescript
{
  success: false,
  message: string
}
```

**Error Scenarios:**

1. **Unauthorized Access (401)**
   - User not authenticated
   - Invalid or expired JWT token

2. **Forbidden Access (403)**
   - User authenticated but not an admin
   - Attempting to access admin-only endpoints

3. **Not Found (404)**
   - Announcement or user not found
   - Invalid resource ID

4. **Bad Request (400)**
   - Missing required fields (title, content)
   - Invalid data format
   - Invalid pagination parameters

5. **Internal Server Error (500)**
   - Database connection failures
   - Unexpected server errors

### Frontend Error Handling

**Strategies:**

1. **API Error Handling**
   - Catch all API errors in try-catch blocks
   - Display user-friendly error messages via toast notifications
   - Log errors to console for debugging

2. **Permission Errors**
   - Redirect to home page if user is not admin
   - Show error toast explaining lack of permissions

3. **Loading States**
   - Show loading spinners during API calls
   - Disable buttons during operations to prevent duplicate requests

4. **Form Validation**
   - Validate required fields before submission
   - Show inline validation errors
   - Prevent submission of invalid data

## Testing Strategy

### Unit Testing

**Backend Unit Tests:**

1. **Admin Controller Tests**
   - Test each controller function with valid inputs
   - Test error cases (missing data, invalid IDs)
   - Mock database queries
   - Verify response formats

2. **Permission Middleware Tests**
   - Test with admin user (should pass)
   - Test with regular user (should fail)
   - Test with unauthenticated user (should fail)

3. **Database Query Tests**
   - Test statistics calculations
   - Test pagination logic
   - Test search filtering
   - Test date range filtering for announcements

**Frontend Unit Tests:**

1. **Component Tests**
   - Test rendering with different props/state
   - Test user interactions (clicks, form submissions)
   - Test conditional rendering based on permissions

2. **API Client Tests**
   - Test request formatting
   - Test response parsing
   - Mock API responses

### Property-Based Testing

We will use **fast-check** for JavaScript/TypeScript property-based testing. Each property test should run a minimum of 100 iterations.

**Property Test Implementation:**

1. **Property 1: Admin permission enforcement**
   - Generate random users with varying is_admin values
   - Attempt admin endpoint access
   - Verify access granted only when is_admin = true

2. **Property 2: Active announcement filtering**
   - Generate random announcements with various dates and active states
   - Request active announcements
   - Verify all returned items meet active criteria

3. **Property 3: Announcement ordering consistency**
   - Generate random announcement lists
   - Request active announcements
   - Verify ordering by priority then date

4. **Property 4: User search filtering**
   - Generate random user lists and search terms
   - Perform search
   - Verify all results contain search term

5. **Property 5: Pagination calculation accuracy**
   - Generate random page/limit combinations
   - Request paginated data
   - Verify pagination metadata calculations

6. **Property 6: Statistics calculation consistency**
   - Generate random user/couple data
   - Calculate statistics
   - Verify logical constraints (active <= total, etc.)

7. **Property 7: Announcement creation timestamp**
   - Create announcements at various times
   - Verify created_at is within acceptable range of current time
   - Verify created_by matches authenticated user

8. **Property 8: Admin status toggle idempotence**
   - Generate random users
   - Toggle admin status multiple times to same value
   - Verify final state matches expected

9. **Property 9: Default values on announcement creation**
   - Create announcements with missing optional fields
   - Verify defaults are applied correctly

10. **Property 10: Active announcements limit**
    - Generate large sets of active announcements
    - Request active announcements
    - Verify result count <= 10

Each property-based test must be tagged with:
```typescript
// Feature: admin-system, Property X: [property description]
```

### Integration Testing

1. **End-to-End Admin Workflow**
   - Login as admin
   - Access dashboard
   - View statistics
   - Manage users
   - Create/edit/delete announcements

2. **Permission Flow**
   - Login as regular user
   - Attempt admin access (should fail)
   - Verify redirection and error messages

3. **Announcement Lifecycle**
   - Create announcement
   - Verify it appears in list
   - Update announcement
   - Verify changes persist
   - Delete announcement
   - Verify removal

## Security Considerations

1. **Authentication Required**
   - All admin endpoints require valid JWT token
   - Token verification happens before permission check

2. **Authorization Enforcement**
   - Admin permission checked on every admin endpoint
   - Database query verifies is_admin flag
   - No client-side permission checks relied upon

3. **Input Validation**
   - Sanitize all user inputs
   - Validate data types and formats
   - Prevent SQL injection through parameterized queries

4. **Rate Limiting**
   - Consider implementing rate limiting on admin endpoints
   - Prevent abuse of statistics endpoints

5. **Audit Logging**
   - Track who creates/modifies announcements via created_by
   - Maintain created_at and updated_at timestamps

## Performance Considerations

1. **Database Indexes**
   - Index on users.is_admin for fast permission checks
   - Index on announcements.is_active for filtering
   - Composite index on (start_date, end_date) for date range queries

2. **Query Optimization**
   - Use pagination to limit result sets
   - Avoid N+1 queries by using JOINs
   - Cache dashboard statistics (consider implementing caching layer)

3. **Frontend Optimization**
   - Lazy load admin pages (code splitting)
   - Debounce search inputs
   - Implement virtual scrolling for large user lists

## Future Enhancements

1. **Advanced Analytics**
   - User engagement metrics
   - Feature usage tracking
   - Retention analysis

2. **Bulk Operations**
   - Bulk user management
   - Bulk announcement operations

3. **Notification System**
   - Push notifications for announcements
   - Email notifications for important updates

4. **Audit Trail**
   - Detailed logging of all admin actions
   - Audit log viewer in admin interface

5. **Role-Based Access Control**
   - Multiple admin roles (super admin, moderator, etc.)
   - Granular permissions per role
