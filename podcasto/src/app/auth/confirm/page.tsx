import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Page for confirming email verification
 * This is called when a user clicks the confirmation link in their email
 * 
 * @returns A redirect to the home page after processing the token
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Access searchParams after awaiting the promise
  const resolvedParams = await searchParams;
  const token_hash = resolvedParams.token_hash as string | undefined;
  const type = resolvedParams.type as string | undefined;

  if (!token_hash || !type) {
    return <div className="p-8">Invalid confirmation link.</div>;
  }

  const supabase = await createClient();
  
  if (type === 'email') {
    // Verify the email confirmation token
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    
    if (error) {
      return (
        <div className="p-8">
          <p className="text-red-500">Error verifying email: {error.message}</p>
          <p>Please try signing in again.</p>
        </div>
      );
    }
  }
  
  // Redirect to the home page after successful confirmation
  redirect('/');
} 