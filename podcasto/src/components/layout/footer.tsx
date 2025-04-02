'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show footer only when mouse is near the bottom of the viewport
      const viewportHeight = window.innerHeight;
      const mouseY = e.clientY;
      
      // If mouse is within 50px of the bottom of the viewport
      if (mouseY > viewportHeight - 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <div className="w-full fixed bottom-0 left-0 right-0 z-10">
      <footer className={`bg-white border-t border-gray-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} w-full`}>
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/podcasto-logo.webp"
                alt="podcasto Logo"
                width={80}
                height={32}
                className="h-6 w-auto -mt-1"
                priority
                quality={100}
              />
              <p className="text-xs text-gray-400 ml-3">
                &copy; {currentYear}
              </p>
            </div>
            
            <nav className="flex flex-wrap justify-end">
              <div className="px-2 py-1">
                <Link
                  href="/contact"
                  className="text-gray-500 hover:text-indigo-500 transition-colors"
                >
                  Contact
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
} 