import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { RoleGuard } from '../RoleGuard';
import { useAuth } from '../../lib/useAuth';

export const MenuDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { role } = useAuth();

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
    <div className="relative cf-mobile-menu" ref={menuRef}>
      {/* Hamburger Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="grid h-11 w-11 place-items-center rounded-lg border border-[#dbe5ee] bg-white text-[#28415e] transition hover:bg-[#edf4fb] hover:text-[#146fae] focus:outline-none focus:ring-2 focus:ring-[#60b0e8]"
        aria-label="Toggle navigation menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Slide-out Menu Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-60 rounded-xl border border-[#dbe5ee] bg-white py-2 shadow-lg z-50">
          <div className="border-b border-[#dbe5ee] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#758ba2]">
            Navigation Menu
          </div>
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#28415e] transition hover:bg-[#edf4fb] hover:text-[#146fae]"
          >
            Dashboard
          </Link>
          <Link
            to="/integration"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#28415e] transition hover:bg-[#edf4fb] hover:text-[#146fae]"
          >
            System Integration
          </Link>
          <Link
            to="/orders"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#28415e] transition hover:bg-[#edf4fb] hover:text-[#146fae]"
          >
            Orders
          </Link>
          {/* Supervisor & Admin Only Link */}
          <RoleGuard currentRole={role} allowedRoles={["supervisor", "admin"]}>
            <div className="my-1 border-t border-[#dbe5ee]" />
            <Link
              to="/profiles"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2.5 text-sm text-[#227cbd] font-medium transition hover:bg-[#e6f3ff] hover:text-[#166da8]"
            >
              Profiles Management
            </Link>
          </RoleGuard>
        </div>
      )}
    </div>
  );
};