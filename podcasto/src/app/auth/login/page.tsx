import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Login | Podcasto",
  description: "Sign in to your Podcasto account",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Login"
      description="Sign in to your Podcasto account"
    >
      <LoginForm />
    </AuthLayout>
  );
}
