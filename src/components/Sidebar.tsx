import React from 'react';
import { ShoppingBag, Heart, Shield, LogOut, LogIn, X } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  currentView: string;
  onShowAuth: (type: 'login' | 'signup') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigate,
  onLogout,
  currentView,
  onShowAuth,
}) => {
  return (
    <>
      {/* Drawer Overlay */}
      <div
        id="sidebarBackdrop"
        onClick={onClose}
        className={`fixed inset-0 bg-neutral-900/15 backdrop-blur-sm z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <nav
        id="navigationDrawer"
        className={`fixed top-0 left-0 bottom-0 w-[290px] sm:w-[320px] bg-white border-r border-zinc-2s0 z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0 shadow-[40px_0_80px_rgba(0,0,0,0.04)]' : '-translate-x-full'
        }`}
      >
        {/* Header inside Sidebar */}
        <div className="p-8 pb-6 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <div className="font-serif text-2xl font-bold tracking-[4px] text-neutral-900">DIALL.DUE</div>
            <div id="sidebarUserSub" className="text-[10px] text-neutral-400 font-sans tracking-[2px] uppercase mt-1 font-semibold leading-none">
              {currentUser ? `Signed in as: ${currentUser.name}` : 'Guest Prospect'}
            </div>
          </div>
          <button id="closeSidebarBtn" onClick={onClose} className="p-1 hover:bg-neutral-50 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-neutral-800" />
          </button>
        </div>

        {/* Menu Items */}
        <ul id="sidebarMenuList" className="flex-1 px-4 py-8 space-y-1">
          <li>
            <button
              id="sidebarNavHome"
              onClick={() => { onNavigate('home'); onClose(); }}
              className={`w-full flex items-center gap-3 px-6 py-3.5 text-xs font-semibold tracking-[2px] uppercase transition-all duration-300 border-l-[3px] cursor-pointer ${
                currentView === 'home'
                  ? 'bg-neutral-50 border-neutral-900 text-neutral-900 font-bold'
                  : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 hover:pl-8'
              }`}
            >
              <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
              The Boutique
            </button>
          </li>
          <li>
            <button
              id="sidebarNavWishlist"
              onClick={() => { onNavigate('wishlist'); onClose(); }}
              className={`w-full flex items-center gap-3 px-6 py-3.5 text-xs font-semibold tracking-[2px] uppercase transition-all duration-300 border-l-[3px] cursor-pointer ${
                currentView === 'wishlist'
                  ? 'bg-neutral-50 border-neutral-900 text-neutral-900 font-bold'
                  : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 hover:pl-8'
              }`}
            >
              <Heart className="w-4 h-4 stroke-[1.5]" />
              My Wishlist
            </button>
          </li>

          {currentUser?.isAdmin && (
            <li>
              <button
                id="sidebarNavAdmin"
                onClick={() => { onNavigate('admin'); onClose(); }}
                className={`w-full flex items-center gap-3 px-6 py-3.5 text-xs font-semibold tracking-[2px] uppercase transition-all duration-300 border-l-[3px] cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-neutral-50 border-neutral-900 text-neutral-900 font-bold'
                    : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 hover:pl-8'
                }`}
              >
                <Shield className="w-4 h-4 stroke-[1.5]" />
                Administrative Panel
              </button>
            </li>
          )}
        </ul>

        {/* Footer controls inside Sidebar */}
        <div className="p-6 border-t border-zinc-100">
          {currentUser ? (
            <button
              id="sidebarLogoutBtn"
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 border border-red-200 text-red-650 hover:bg-red-50 hover:text-red-700 font-semibold text-xs tracking-[2px] uppercase transition-all duration-300 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Session
            </button>
          ) : (
            <button
              id="sidebarLoginDirectBtn"
              onClick={() => { onShowAuth('login'); onClose(); }}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs tracking-[2px] uppercase transition-all duration-300 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Customer Login
            </button>
          )}
          <p className="text-center text-[10px] text-zinc-400 mt-6 tracking-[1px] font-sans">
            © 2026 Diall.Due Enterprise
          </p>
        </div>
      </nav>
    </>
  );
};
