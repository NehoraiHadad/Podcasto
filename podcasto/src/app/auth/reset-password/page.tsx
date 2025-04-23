import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Reset Password | Podcasto",
  description: "Reset your Podcasto account password",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset Password"
      description="Reset your Podcasto account password"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
