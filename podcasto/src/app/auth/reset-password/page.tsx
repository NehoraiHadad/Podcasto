import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Reset Password | podcasto",
  description: "Reset your podcasto account password",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset Password"
      description="Reset your podcasto account password"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
