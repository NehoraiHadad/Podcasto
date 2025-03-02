# Authentication Flow

## Overview
This document details the authentication mechanisms implemented in the system, including different authentication methods, user roles, and access control considerations.

## Authentication Methods

1. **Google OAuth**
   - Users can log in using their Google account.
   - Authentication handled via **Supabase Auth**.
   - Upon successful authentication, the user is redirected to the **Home Page**.

2. **Email & Password Authentication**
   - Users can register with an email and password.
   - Passwords are securely stored using **Supabase Auth**.
   - Email verification may be required before granting full access.

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

## Session Management
- User sessions are managed via **Supabase Auth**.
- Sessions persist across visits unless manually logged out or expired.
- Secure JWT tokens ensure authorized API access.

## Security Considerations
- **Rate limiting** is applied to prevent brute-force attacks.
- **Multi-factor authentication (MFA)** may be introduced for admins.
- **Session expiration** for inactive users ensures better security.

This structured authentication flow ensures secure and seamless access to the platform while maintaining user privacy and data protection.
