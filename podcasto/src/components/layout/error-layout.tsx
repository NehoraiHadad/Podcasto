'use client';

import { ReactNode } from 'react';
import { Footer } from './footer';

type ErrorLayoutProps = {
  children: ReactNode;
};

export function ErrorLayout({ children }: ErrorLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
