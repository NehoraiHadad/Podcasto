'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, signOut, isLoading } = useAuthContext();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="block">
              <Image
                  src="/podcasto-logo.png"
                  alt="podcasto Logo"
                  width={80}
                  height={32}
                  className="h-8 w-auto -mt-1"
                  priority
                  quality={100}
                />
              </Link>
            </div>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-6 rtl:space-x-reverse">
              <Link
                href="/"
                className="border-transparent text-gray-600 hover:text-indigo-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/podcasts"
                className="border-transparent text-gray-600 hover:text-indigo-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
              >
                Podcasts
              </Link>
            </nav>
          </div>
          <div className="hidden sm:flex sm:items-center">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse"></div>
            ) : user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center focus:outline-none"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <span className="text-sm font-medium text-gray-600 mx-2">
                      {user.email}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors">
                      <span className="text-sm font-medium text-indigo-600">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                </button>
                
                {/* Profile dropdown menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <Link 
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-gray-600 hover:text-indigo-600 p-2 h-auto">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-700 py-1.5 px-4 h-auto text-sm rounded-md">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-100 shadow-sm">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-indigo-600 hover:bg-gray-50 block px-3 py-2.5 text-base font-medium rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/podcasts"
              className="text-gray-600 hover:text-indigo-600 hover:bg-gray-50 block px-3 py-2.5 text-base font-medium rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Podcasts
            </Link>
            {user && (
              <Link
                href="/profile"
                className="text-gray-600 hover:text-indigo-600 hover:bg-gray-50 block px-3 py-2.5 text-base font-medium rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Profile
              </Link>
            )}
          </div>
          <div className="pt-4 pb-5 border-t border-gray-200 px-4">
            {isLoading ? (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse"></div>
                </div>
              </div>
            ) : user ? (
              <>
                <div className="flex items-center">
                  <div className="flex-shrink-0 order-last mr-0 ml-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                      <span className="text-base font-medium text-indigo-600">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-medium text-gray-700">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-center text-gray-600 hover:text-indigo-600 py-2 text-base font-medium rounded-md"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-3 space-y-3">
                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center text-gray-600 hover:text-indigo-600 py-2 text-base font-medium">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center bg-indigo-600 text-white hover:bg-indigo-700 py-2 text-base font-medium">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 