import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Register | Podcasto",
  description: "Create a new Podcasto account",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Register"
      description="Create a new Podcasto account"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
