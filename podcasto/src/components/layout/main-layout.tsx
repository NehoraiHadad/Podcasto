import { ReactNode } from 'react';
import { Header } from './header';
import { Footer } from './footer';

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white relative">
      <Header />
      <main className="flex-grow overflow-auto">{children}</main>
      <Footer />
    </div>
  );
} 