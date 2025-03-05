# Supabase Integration

This directory contains the Supabase client setup for both client-side and server-side usage, following the latest best practices for Next.js App Router.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to the `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## TypeScript Integration

The `types.ts` file contains TypeScript definitions for your Supabase database schema. This provides type safety for your database queries and responses.

You can generate these types directly from your Supabase project using:

```bash
npx supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts
```

## Next.js 15 Compatibility

In Next.js 15, the `cookies()` function is asynchronous and must be awaited. Our server client implementation handles this by:

1. Awaiting the `cookies()` function call
2. Using the returned cookie store for all cookie operations

```typescript
// Example of proper usage in Next.js 15
const { cookies } = await import('next/headers');
const cookieStore = await cookies();

// Now use cookieStore for all operations
const value = cookieStore.get('name')?.value;
```

When using the server client in your components, make sure to await it:

```typescript
const supabase = await createClient();
```

## Database Schema

The database has the following tables:

### Podcasts

```sql
create table podcasts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  language text,
  cover_image text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Episodes

```sql
create table episodes (
  id uuid default uuid_generate_v4() primary key,
  podcast_id uuid references podcasts(id) on delete cascade,
  title text not null,
  description text,
  language text,
  audio_url text not null,
  duration integer,
  created_at timestamp with time zone default now(),
  published_at timestamp with time zone default now()
);
```

### Subscriptions

```sql
create table subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  podcast_id uuid references podcasts(id) on delete cascade,
  created_at timestamp with time zone default now()
);
```

### Sent Episodes

```sql
create table sent_episodes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  episode_id uuid references episodes(id) on delete cascade,
  sent_at timestamp with time zone default now()
);
```

## Usage

### Server Components

For Server Components, use the server client:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function MyServerComponent() {
  // Note: createClient is async in Next.js 15
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('podcasts')
    .select('*');
    
  // ...
}
```

### Client Components

For Client Components, use the browser client:

```typescript
'use client';

import { supabase } from '@/lib/supabase/client';

export function MyClientComponent() {
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('podcasts')
      .select('*');
      
    // ...
  };
  
  // ...
}
```

### Route Handlers

For API routes, use the server client:

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  // Note: createClient is async in Next.js 15
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('podcasts')
    .select('*');
    
  return NextResponse.json({ data });
}
```

### Middleware

For middleware, use the client directly:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // ...
}
```

## API Functions

The following API functions are available in `@/lib/api/podcasts.ts`:

- `getPodcasts()`: Fetches all podcasts with episode counts
- `getPodcastById(id)`: Fetches a single podcast by ID with episode count
- `getEpisodesByPodcastId(id)`: Fetches all episodes for a podcast 