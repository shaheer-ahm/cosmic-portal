import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export const MenuDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Hamburger Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="grid h-12 w-12 place-items-center rounded-xl border border-[#383b44] bg-[#23252b] text-[#d3d4db] transition hover:bg-[#2e323f] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6675ff]"
        aria-label="Toggle navigation menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Slide-out Menu Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl border border-[#383b44] bg-[#23252b] py-2 shadow-xl z-50">
          <div className="border-b border-[#383b44] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#747b98]">
            Navigation Menu
          </div>
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#d3d4db] transition hover:bg-[#2e323f] hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            to="/integration"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#d3d4db] transition hover:bg-[#2e323f] hover:text-white"
          >
            System Integration
          </Link>
          <Link
            to="/orders"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#d3d4db] transition hover:bg-[#2e323f] hover:text-white"
          >
            Orders
          </Link>
        </div>
      )}
    </div>
  );
};