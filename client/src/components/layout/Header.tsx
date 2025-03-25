import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const [location] = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Initialize theme on component mount
  useState(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  });

  const navItems = [
    { href: '/', label: 'Dashboard', icon: 'dashboard' },
    { href: '/alerts', label: 'Alerts', icon: 'notifications' },
    { href: '/resources', label: 'Resources', icon: 'help_outline' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ];
  
  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link 
          key={item.href} 
          href={item.href}
          className={`${
            location === item.href 
              ? 'text-primary font-medium' 
              : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
          } transition flex items-center`}
        >
          <span className="material-icons mr-1 text-sm">{item.icon}</span> {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <span className="material-icons text-primary">public</span>
            <h1 className="text-xl font-semibold">DisasterTrack</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <NavLinks />
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              onClick={toggleTheme}
            >
              <span className={`material-icons ${isDarkMode ? 'hidden' : 'block'}`}>dark_mode</span>
              <span className={`material-icons ${isDarkMode ? 'block' : 'hidden'}`}>light_mode</span>
            </button>
            
            {/* User Menu */}
            <div className="relative">
              <button className="flex items-center space-x-1 focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                  <span className="material-icons text-gray-600">person</span>
                </div>
                <span className="hidden md:block text-sm">Account</span>
                <span className="material-icons text-xs">arrow_drop_down</span>
              </button>
            </div>
            
            {/* Mobile Menu */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <span className="material-icons">menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col gap-4 pt-10">
                    <NavLinks />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
