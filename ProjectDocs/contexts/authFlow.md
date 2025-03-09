# Authentication Flow

## Overview
This document details the authentication mechanisms implemented in the system, including different authentication methods, user roles, access control considerations, and the technical implementation of the authentication flow.

## Authentication Methods

1. **Google OAuth**
   - Users can log in using their Google account.
   - Authentication handled via **Supabase Auth** with PKCE flow.
   - Upon successful authentication, the user is redirected to the **Home Page**.
   - OAuth state is managed securely through server-side cookies.

2. **Email & Password Authentication**
   - Users can register with an email and password.
   - Passwords are securely stored using **Supabase Auth**.
   - Email verification may be required before granting full access.
   - Password reset functionality is implemented with secure token handling.

3. **Guest Mode**
   - Users can browse and listen to podcasts without authentication.
   - No subscription or personalized recommendations are available in guest mode.
   - Guest users must sign up to enable subscriptions and notifications.

## User Roles & Access Control

1. **Regular User**
   - Can search, play, and subscribe to podcasts.
   - Receives email notifications based on subscription preferences.
   - Can update personal settings (e.g., preferred language, email notifications).

2. **Admin User**
   - Full access to the **Admin Dashboard**.
   - Can manage users and subscriptions.
   - Can manually trigger podcast creation and manage podcast sources.
   - Access to analytics and system logs.
   - Role-based access control implemented through database tables and middleware checks.

## Technical Implementation

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client         │     │  Next.js Server │     │  Supabase Auth  │
│  Components     │◄────┤  Components     │◄────┤  & Database     │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │                       ▲
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐     ┌─────────────────┐             │
│                 │     │                 │             │
│  useAuth Hook   │     │  Server Actions │─────────────┘
│  & Auth Context │────►│  (auth-actions) │
│                 │     │                 │
└────────┬────────┘     └─────────────────┘
         │
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Auth Events    │◄────┤  SSE API        │
│  (SSE Client)   │     │  Endpoint       │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

### Key Components

1. **Server-Side Authentication**
   - **Server Actions**: Secure server-side functions for authentication operations
   - **Middleware**: Route protection and session validation
   - **Supabase Client**: Unified client creation with flexible cookie handling

2. **Client-Side State Management**
   - **Auth Context**: React context for sharing auth state across components
   - **useAuth Hook**: Custom hook for authentication operations with immediate UI updates
   - **Server-Sent Events (SSE)**: Real-time auth state updates without client-side subscriptions

3. **Error Handling**
   - Graceful handling of common auth errors (e.g., `AuthSessionMissingError`)
   - Standardized error formats across all authentication functions
   - Immediate UI feedback for authentication operations

## Authentication Flow Details

### Sign In Process

1. User enters credentials or clicks OAuth provider button
2. Client calls server action via `useAuth` hook
3. Server action authenticates with Supabase
4. UI is immediately updated with loading and then success/error state
5. On success, user is redirected to home page
6. SSE connection provides real-time updates to auth state

### Sign Out Process

1. User clicks sign out button
2. Client immediately clears local auth state for better UX
3. Client calls server action to sign out
4. Server action signs out with Supabase, handling potential session errors
5. User is redirected to home page
6. SSE connection updates auth state across all tabs/windows

### Session Management

- **Cookie-Based**: Sessions stored in HTTP-only cookies for security
- **Auto-Refresh**: Middleware automatically refreshes expired tokens
- **Cross-Tab Sync**: SSE ensures consistent auth state across browser tabs
- **Error Recovery**: Graceful handling of session errors with automatic reconnection

## Session Management
- User sessions are managed via **Supabase Auth** with secure cookie handling.
- Sessions persist across visits unless manually logged out or expired.
- Secure JWT tokens ensure authorized API access.
- Real-time session state is maintained through Server-Sent Events with 3-second polling.
- Session errors are handled gracefully with automatic recovery mechanisms.

## Security Considerations
- **Rate limiting** is applied to prevent brute-force attacks.
- **Multi-factor authentication (MFA)** may be introduced for admins.
- **Session expiration** for inactive users ensures better security.
- **HTTP-only cookies** prevent client-side access to auth tokens.
- **Server-side validation** of all authentication operations.
- **Immediate UI feedback** prevents user confusion during auth operations.

This structured authentication flow ensures secure and seamless access to the platform while maintaining user privacy and data protection, with special attention to user experience through immediate UI updates and robust error handling.
