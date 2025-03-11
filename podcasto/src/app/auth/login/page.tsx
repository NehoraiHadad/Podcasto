import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Login | podcasto",
  description: "Sign in to your podcasto account",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Login"
      description="Sign in to your podcasto account"
    >
      <LoginForm />
    </AuthLayout>
  );
}
