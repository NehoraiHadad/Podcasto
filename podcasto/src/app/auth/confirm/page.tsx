import { createServerClient } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserCredits } from '@/lib/db/api/credits';
import { creditService } from '@/lib/services/credits';

/**
 * Page for confirming email verification
 * This is called when a user clicks the confirmation link in their email
 * Automatically initializes credits for new users after email confirmation
 *
 * @returns A redirect to the welcome page (new users) or specified page after processing the token
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
  const next = (resolvedSearchParams.next as string) || '/podcasts';

  if (!token_hash || !type) {
    return <div className="p-8">Invalid confirmation link.</div>;
  }

  const supabase = await createServerClient();

  if (type === 'email') {
    // Verify the email confirmation token
    const { data: { user }, error } = await supabase.auth.verifyOtp({
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

    // If email confirmation succeeded and we have a user, check for credits
    if (user) {
      const existingCredits = await getUserCredits(user.id);

      if (!existingCredits) {
        console.log(`[EMAIL_CONFIRM] New user detected: ${user.id}, initializing credits`);

        // Initialize credits for new user
        const result = await creditService.initializeUserCredits(user.id);

        if (result.success) {
          console.log(`[EMAIL_CONFIRM] Credits initialized for user ${user.id}: ${result.newBalance} credits`);

          // Redirect to welcome page with credits notification
          redirect('/welcome?credits=true');
        } else {
          console.error(`[EMAIL_CONFIRM] Failed to initialize credits:`, result.error);
          // Continue anyway - credits can be initialized later via getUserCreditsAction
        }
      }
    }

    // Redirect to the specified page or home page after successful confirmation
    redirect(next);
  }

  // Redirect to the specified page or home page after successful confirmation
  redirect(next);
} 