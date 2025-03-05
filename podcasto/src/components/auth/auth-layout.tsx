import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function AuthLayout({
  children,
  title,
  description,
  className,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center mb-6">
        <Link href="/" className="mb-4 transition-transform hover:scale-105">
          <Image
            src="/podcasto-logo.png"
            alt="podcasto Logo"
            width={240}
            height={80}
            className="h-auto w-auto"
            priority
            quality={100}
          />
        </Link>
      </div>

      <div
        className={cn(
          "w-full max-w-md p-6 space-y-5 bg-white rounded-xl shadow-lg border border-gray-100",
          className
        )}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">{description}</p>
        </div>

        {children}
      </div>

    </div>
  );
} 