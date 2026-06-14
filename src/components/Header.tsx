import React from 'react';
import { Heart, Menu } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (view: string) => void;
  wishlistCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNavigate,
  wishlistCount,
}) => {
  return (
    <header id="mainHeader" className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/85 backdrop-blur-[30px] border-b border-zinc-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between relative">
        
        {/* Elegant Fluid Hamburger Button */}
        <button
          id="hamburgerTrigger"
          onClick={onToggleSidebar}
          className="p-2 hover:bg-neutral-100 transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-neutral-900" />
        </button>

        {/* Serif Logo Centered */}
        <div
          id="siteLogo"
          onClick={() => onNavigate('home')}
          className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-2xl font-serif font-bold text-neutral-900 tracking-[0.25em] sm:tracking-[0.35em] uppercase cursor-pointer select-none transition-opacity hover:opacity-75"
        >
          Diall.Due
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-4">
          <button
            id="wishlistToolbarBtn"
            onClick={() => onNavigate('wishlist')}
            className="relative p-2.5 hover:bg-neutral-100 transition-all duration-300 group cursor-pointer"
            title="View Wishlist"
          >
            <Heart className="w-[21px] h-[21px] text-neutral-955 stroke-[1.5]" />
            {wishlistCount > 0 && (
              <span id="headerWishlistBadge" className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[9px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center transition-all animate-none">
                {wishlistCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
