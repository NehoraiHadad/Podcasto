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
      <footer className={`bg-background/80 backdrop-blur-sm border-t border-border/40 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} w-full`}>
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/podcasto-logo.webp"
                alt="Podcasto Logo"
                width={150}
                height={40}
                style={{
                  width: 'auto',
                  height: '24px',
                }}
                priority
                quality={100}
              />
              <p className="text-xs text-muted-foreground ml-3">
                &copy; {currentYear}
              </p>
            </div>
            
            <nav className="flex flex-wrap justify-end">
              <div className="px-2 py-1">
                <Link
                  href="/contact"
                  className="text-foreground/70 hover:text-primary transition-colors text-sm"
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