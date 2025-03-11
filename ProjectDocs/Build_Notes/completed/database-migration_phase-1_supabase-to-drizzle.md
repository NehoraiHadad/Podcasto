# Database Migration: Supabase to Drizzle

## Task Objective
Migrate the application's database operations from Supabase to Drizzle ORM to improve type safety, query performance, and maintainability.

## Current State Assessment
The application currently uses Supabase for both authentication and database operations. Database queries are performed using Supabase's client-side API, which lacks strong typing and can lead to runtime errors.

## Future State Goal
The application will use Drizzle ORM for all database operations while keeping Supabase for authentication. This will provide better type safety, improved query performance, and a more maintainable codebase.

## Implementation Plan

1. **Setup Drizzle ORM**
   - [x] Install Drizzle ORM and related packages
   - [x] Create Drizzle schema definitions for all tables
   - [x] Set up database connection with Drizzle
   - [x] Configure Drizzle migrations

2. **Create Drizzle API Layer**
   - [x] Create utility functions for common database operations
   - [x] Implement table-specific API modules for each entity
   - [x] Ensure proper typing for all database operations
   - [x] Add relationship handling between tables

3. **Migrate Server Actions**
   - [x] Update podcast-actions.ts to use Drizzle instead of Supabase
   - [ ] Update subscription-actions.ts to use Drizzle
   - [ ] Update auth-events.ts to use Drizzle for database operations
   - [ ] Update admin-actions.ts to use Drizzle

4. **Migrate API Routes**
   - [x] Update podcasts.ts API to use Drizzle
   - [ ] Update episodes API to use Drizzle
   - [ ] Update user-related APIs to use Drizzle

5. **Update Authentication Utilities**
   - [x] Create auth-utils.ts to handle authentication with Supabase
   - [x] Implement role checking with Drizzle
   - [ ] Update middleware to work with both Supabase auth and Drizzle

6. **Testing and Validation**
   - [ ] Test all migrated functionality
   - [ ] Verify type safety across the application
   - [ ] Ensure all database operations work correctly
   - [ ] Check for any performance issues

7. **Cleanup**
   - [ ] Remove unused Supabase database code
   - [ ] Update documentation to reflect the new architecture
   - [ ] Refactor any remaining code using Supabase for database operations 