# System Analysis and Design Documentation
## ICT Service Request Management System

---

## 1. Problem Statement

The university's ICT Office currently receives technical support requests through multiple uncoordinated channels including verbal requests, text messages, and social media messages. This fragmented approach results in lost or forgotten requests, duplicate entries, and lack of proper monitoring and tracking. The absence of a centralized system makes it difficult to prioritize issues, track resolution progress, and maintain accountability for service delivery.

---

## 2. Actors

### Primary Actor
- **System User / ICT Personnel**: Authorized users who can submit, view, update, and delete service requests

### Secondary Actor
- **Supabase Authentication System**: Handles user authentication and session management

---

## 3. Use Case Diagram

```
┌─────────────────────────────────────┐
│     Service Request System          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         Use Cases           │   │
│  ├─────────────────────────────┤   │
│  │                             │   │
│  User ─────────────────────► Login │
│  User ─────────────────────► View Dashboard │
│  User ─────────────────────► Create Request │
│  User ─────────────────────► View Requests │
│  User ─────────────────────► Search Request │
│  User ─────────────────────► Filter Requests │
│  User ─────────────────────► Update Request │
│  User ─────────────────────► Delete Request │
│  User ─────────────────────► Logout │
│  │                             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Use Case Descriptions

| Use Case | Description |
|----------|-------------|
| Login | User authenticates with email and password to access the system |
| View Dashboard | User sees summary statistics of all service requests |
| Create Request | User submits a new service request with required details |
| View Requests | User views all service requests in a tabular format |
| Search Request | User searches requests by requester name or description |
| Filter Requests | User filters requests by status and/or priority |
| Update Request | User modifies details of an existing request |
| Delete Request | User removes a request after confirmation |
| Logout | User ends their session and exits the system |

---

## 4. Entity Relationship Diagram (ERD)

```
┌─────────────────────────┐
│         USER            │
├─────────────────────────┤
│ user_id (PK)           │
│ email                  │
│ password (hashed)      │
│ created_at             │
└───────────┬─────────────┘
            │
            │ 1
            │ creates
            │
            │ M
┌───────────▼─────────────┐
│    SERVICE_REQUEST      │
├─────────────────────────┤
│ id (PK)                │
│ requester_name         │
│ department             │
│ category               │
│ description            │
│ priority               │
│ status                 │
│ created_at             │
│ user_id (FK)           │
└─────────────────────────┘
```

### Relationships

- **USER to SERVICE_REQUEST**: One-to-Many (1:M)
  - One user can create multiple service requests
  - Each service request is created by exactly one user
  - **Data Isolation**: Users can only view and manage their own requests (enforced via RLS)

---

## 5. Data Dictionary

### Service Request Entity

| Field Name | Data Type | Description | Constraints |
|------------|-----------|-------------|-------------|
| id | BIGINT | Unique identifier for each request | Primary Key, Auto-generated |
| requester_name | TEXT | Name of the person requesting assistance | NOT NULL |
| department | TEXT | Department of the requester | NOT NULL |
| category | TEXT | Type of ICT concern | NOT NULL, Enum: Computer Repair, Software Installation, Internet/Network Problem, Printer Problem, Account/Access Concern, Other |
| description | TEXT | Detailed description of the problem | NOT NULL, Minimum 10 characters |
| priority | TEXT | Urgency level of the request | NOT NULL, Enum: Low, Medium, High |
| status | TEXT | Current state of the request | Default: Pending, Enum: Pending, In Progress, Completed |
| created_at | TIMESTAMPTZ | Timestamp when request was created | Default: NOW() |
| user_id | UUID | Foreign key to the user who created the request | References auth.users(id) |

---

## 6. Business Rules

| Rule ID | Requirement | Implementation |
|---------|-------------|----------------|
| BR-01 | Requester name cannot be empty | Frontend validation in app.js |
| BR-02 | Department must be provided | Frontend validation in app.js |
| BR-03 | Category must be selected | Frontend validation in app.js |
| BR-04 | Description must contain sufficient information | Frontend validation (minimum 10 characters) |
| BR-05 | Priority must be Low, Medium, or High | Frontend validation with enum check |
| BR-06 | New requests automatically receive Pending status | Default value in database and app.js |
| BR-07 | Users must log in before managing requests | Authentication check in auth.js |
| BR-08 | A confirmation must appear before deleting a record | Modal confirmation in app.js |
| BR-09 | Date requested must automatically be recorded | Database default: NOW() |
| BR-10 | Unauthorized database modification should be prevented | Row Level Security (RLS) policies in Supabase |

---

## 7. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   GitHub Pages                           │
│              (Static Web Hosting)                        │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│   HTML/CSS   │         │  JavaScript  │
│              │         │              │
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │  Supabase JS     │
                     │   Client Library │
                     └────────┬─────────┘
                              │
                              │ HTTPS/API
                              ▼
┌─────────────────────────────────────────────────────────┐
│                      SUPABASE                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │ Authentication  │         │   PostgreSQL    │        │
│  │                 │         │                 │        │
│  │  - User Auth    │         │  - service_     │        │
│  │  - Session Mgmt │         │    requests    │        │
│  │                 │         │  - RLS Policies │        │
│  └─────────────────┘         └─────────────────┘        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Architecture Description

1. **Presentation Layer**: HTML, CSS, and JavaScript hosted on GitHub Pages
2. **Client Layer**: Supabase JavaScript client library handles API communication
3. **Backend Layer**: Supabase provides authentication and PostgreSQL database
4. **Security Layer**: Row Level Security (RLS) policies protect data integrity

---

## 8. Requirements Traceability Matrix

| Req. ID | Requirement | System Feature | Test Case |
|---------|-------------|----------------|-----------|
| FR-01 | User can log in | Login Page (login.html) | TC-01 |
| FR-02 | User can create request | Request Form (index.html modal) | TC-02 |
| FR-03 | User can view requests | Request Table (index.html) | TC-03 |
| FR-04 | User can update request | Edit Function (app.js) | TC-04 |
| FR-05 | User can delete request | Delete Function (app.js) | TC-05 |
| FR-06 | User can search | Search Function (app.js) | TC-06 |
| FR-07 | User can filter | Filter Function (app.js) | TC-07 |
| FR-08 | System displays summaries | Dashboard (index.html) | TC-08 |

---

## 9. Functional Requirements

### Authentication Module (FR-01)
- The system shall provide a login interface
- The system shall authenticate users using email and password
- The system shall maintain user sessions
- The system shall provide logout functionality
- The system shall redirect unauthenticated users to the login page
- **Signup is disabled** - users must be created manually by admin in Supabase
- Users are created with "Auto Confirm User" enabled to skip email confirmation

### Dashboard Module (FR-08)
- The system shall display total number of requests
- The system shall display number of pending requests
- The system shall display number of in-progress requests
- The system shall display number of completed requests
- Statistics shall update in real-time

### Service Request Module (FR-02, FR-03, FR-04, FR-05)
- The system shall allow users to create new service requests
- The system shall display service requests in a table (users only see their own requests)
- The system shall allow users to edit existing requests
- The system shall allow users to delete requests with confirmation
- The system shall validate all required fields before submission
- **Status field is hidden for new requests** (defaults to Pending)
- **Status field is visible only when editing** requests

### Search Module (FR-06)
- The system shall allow users to search by requester name
- The system shall allow users to search by description
- Search shall be case-insensitive
- Search results shall update in real-time

### Filter Module (FR-07)
- The system shall allow filtering by status (All, Pending, In Progress, Completed)
- The system shall allow filtering by priority (All, Low, Medium, High)
- Filters shall be combinable with search
- Filters shall update the displayed results immediately

---

## 10. Non-Functional Requirements

### Performance
- The system shall load the dashboard within 3 seconds
- The system shall complete CRUD operations within 2 seconds
- The system shall handle at least 1000 concurrent requests

### Security
- The system shall authenticate all users before granting access
- The system shall prevent unauthorized database modifications via RLS
- The system shall enforce data isolation - users can only view and modify their own requests
- The system shall never expose service_role keys in client-side code
- The system shall use HTTPS for all communications
- Signup is disabled - users must be created manually by admin

### Usability
- The system shall provide clear error messages
- The system shall have a responsive design for mobile devices
- The system shall use intuitive navigation
- The system shall provide confirmation dialogs for destructive actions

### Reliability
- The system shall maintain data consistency
- The system shall prevent duplicate request IDs
- The system shall automatically record creation timestamps
- The system shall handle database connection errors gracefully

---

## 11. Implementation Notes

### Database Schema

```sql
CREATE TABLE service_requests (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    requester_name TEXT NOT NULL,
    department TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
ON service_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert requests"
ON service_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update requests"
ON service_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete requests"
ON service_requests FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

### Key Design Decisions

1. **Supabase for Backend**: Chosen for its built-in authentication and PostgreSQL database
2. **GitHub Pages for Hosting**: Free, reliable static hosting suitable for the exercise
3. **Vanilla JavaScript**: No framework dependencies for simplicity and educational value
4. **Row Level Security**: Ensures users can only view and modify their own requests (data isolation)
5. **Manual User Creation**: Signup disabled - users created manually by admin for better control
6. **Status Field Management**: Status hidden for new requests (defaults to Pending), visible only when editing
7. **Client-side Validation**: Provides immediate feedback to users
8. **Responsive Design**: Ensures accessibility on various devices

---

## 12. Testing Strategy

### Unit Testing
- Test individual JavaScript functions
- Validate business rule enforcement
- Test form validation logic

### Integration Testing
- Test Supabase API integration
- Test authentication flow
- Test CRUD operations end-to-end

### Functional Testing
- Verify all use cases work as specified
- Test search and filter combinations
- Validate business rules

### User Acceptance Testing
- Test with real users
- Verify usability
- Confirm requirements are met

---

## 13. Future Enhancements

### Potential Improvements
- Add email notifications for status changes
- Implement file attachment support
- Add reporting and analytics features
- Create admin dashboard for overall oversight
- Add assignment of requests to specific technicians
- Implement SLA tracking and escalation
- Add comments/notes history for each request
- Create mobile app version
- Add export to PDF/Excel functionality
- Implement advanced filtering and sorting options

---

## 14. Conclusion

This Service Request Management System successfully addresses the ICT Office's need for a centralized, trackable request management solution. The system implements all required features including authentication, CRUD operations, search, filtering, and dashboard statistics. The design follows Systems Analysis and Design principles with clear documentation of requirements, actors, use cases, data models, and business rules. The implementation uses modern web technologies with Supabase providing a secure and scalable backend infrastructure.

---

**Document Version**: 1.0  
**Last Updated**: September 2026  
**Author**: Phrence Kyle M. Boston  
**Course**: BSIT-3A  
**Subject**: Systems Analysis and Design (SAD)
