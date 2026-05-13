/**
 * SmartHeader — PinchPad©™
 *
 * Header that rolls up (hides) when it hits the "How Keys Work" button
 * while scrolling down, and rolls back down (shows) when scrolling up past
 * that same collision point.
 *
 * Uses IntersectionObserver with rootMargin to detect when the fixed header's
 * bottom edge collides with the trigger button, plus scroll direction tracking
 * for hide/show logic.
 *
 * Maintained by CrustAgent©™
 */

import { useState, useEffect } from 'react';
import { LandingNavBar } from './LandingNavBar';

interface SmartHeaderProps {
  onLogin: () => void;
  onCreateAccount: () => void;
  onOpenSidebar: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export function SmartHeader({ onLogin, onCreateAccount, onOpenSidebar, triggerRef }: SmartHeaderProps) {
  const [isAtTrigger, setIsAtTrigger] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Track when header hits "How Keys Work" button
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    // Observer triggers when header bottom edge (64px) hits button position
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Button entering the 64px offset zone = header has reached it
        setIsAtTrigger(entry.isIntersecting);
      },
      { rootMargin: '-64px 0px 0px 0px' } // Offset by header height
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [triggerRef]);

  // Track scroll direction for hide/show logic
  useEffect(() => {
    if (!isAtTrigger) return; // Only handle when at collision point

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;

      // Hide when scrolling down past trigger, show when scrolling up
      setIsVisible(!scrollingDown);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAtTrigger, lastScrollY]);

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50
      transition-transform duration-300 ease-in-out
      ${isVisible ? 'translate-y-0' : '-translate-y-full'}
    `}>
      <LandingNavBar
        onLogin={onLogin}
        onCreateAccount={onCreateAccount}
        onOpenSidebar={onOpenSidebar}
      />
    </div>
  );
}
