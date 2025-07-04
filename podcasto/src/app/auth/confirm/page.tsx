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
  params?: Promise<Record<string, string>>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const token_hash = resolvedSearchParams.token_hash as string | undefined;
  const type = resolvedSearchParams.type as string | undefined;
  const next = (resolvedSearchParams.next as string) || '/';

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
    
    // Redirect to the specified page or home page after successful confirmation
    redirect(next);
  }
  
  // Redirect to the specified page or home page after successful confirmation
  redirect(next);
} 