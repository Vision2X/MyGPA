
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { LogIn, LogOut, LayoutDashboard, GraduationCap, UserCircle as UserIconLucide, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md sticky top-0 z-50 py-3 px-4 sm:px-6 lg:px-8"
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">MyGPA</span>
        </Link>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-primary" />}
          </Button>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard" className="flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Link to="/profile" className="flex items-center space-x-2 hover:text-primary transition-colors">
                <Avatar className="h-7 w-7 border-2 border-primary/50">
                  <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIconLucide size={14}/>}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name || user?.email}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" /> Login / Sign Up
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
