
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X, List, ChevronDown, Archive, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getWordPressUser, logout as wpLogout } from '@/components/utils/wordpressAuth';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    const devMode = localStorage.getItem('developer_mode') === 'true';
    setDeveloperMode(devMode);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        const newMode = !developerMode;
        setDeveloperMode(newMode);
        localStorage.setItem('developer_mode', newMode.toString());
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [developerMode]);

  const loadUser = () => {
    try {
      const userData = getWordPressUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    wpLogout();
  };

  const getNavLinks = () => {
    if (!user) return [];

    // Role-based navigation from WordPress roles
    if (user.role === 'admin') {
      return [
        { name: 'Admin Dashboard', url: createPageUrl('AdminDashboard'), icon: LayoutDashboard },
        { name: 'Analytics', url: createPageUrl('Analytics'), icon: BarChart },
        { name: 'Settings', url: createPageUrl('AdminSettings'), icon: Settings },
        { name: 'Archived Jobs', url: createPageUrl('ArchivedJobs'), icon: Archive }
      ];
    }
    
    if (user.role === 'manager') {
      return [
        { name: 'Manager Dashboard', url: createPageUrl('ManagerDashboard'), icon: LayoutDashboard },
        { name: 'Analytics', url: createPageUrl('Analytics'), icon: BarChart },
        { name: 'Survey Results', url: createPageUrl('SurveyResults'), icon: List },
        { name: 'Archived Jobs', url: createPageUrl('ArchivedJobs'), icon: Archive }
      ];
    }
    
    if (user.role === 'designer') {
      return [
        { name: 'My Jobs', url: createPageUrl('DesignerDashboard'), icon: LayoutDashboard }
      ];
    }

    // Default: client role
    return [
      { name: 'My Jobs', url: createPageUrl('ClientDashboard'), icon: LayoutDashboard },
      { name: 'Create Design Studio Order', url: createPageUrl('JobIntake'), icon: FileText }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="glass-strong rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4791FF]"></div>
        </div>
      </div>
    );
  }

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen gradient-bg">
      
      {/* Top Header with Logo and Navigation */}
      <header className="bg-[#4791FF] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link to={createPageUrl('Home')}>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b56b689c37c23de922f3d/42c539754_irdssitelogo.png" 
                  alt="inventRight Design Studio" 
                  className="h-12 cursor-pointer"
                />
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Desktop Navigation */}
              {user && (
                <div className="hidden md:flex items-center space-x-2">
                  {navLinks.map((link, index) => {
                    const Icon = link.icon;
                    
                    if (link.dropdown) {
                      return (
                        <DropdownMenu key={index}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="text-white hover:bg-white/10">
                              <Icon className="w-4 h-4 mr-2" />
                              {link.name}
                              <ChevronDown className="w-4 h-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {link.dropdown.map((subLink) => {
                              const SubIcon = subLink.icon;
                              return (
                                <DropdownMenuItem 
                                  key={subLink.url} 
                                  onClick={() => navigate(subLink.url)}
                                >
                                  <SubIcon className="w-4 h-4 mr-2" />
                                  {subLink.name}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }
                    
                    const isActive = location.pathname === link.url;
                    return (
                      <Link
                        key={link.url}
                        to={link.url}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'text-white hover:bg-white/10'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    );
                  })}


                </div>
              )}
              

              
              {user && (
                <>
                  <Link 
                    to={createPageUrl(
                      user.role === 'admin' ? 'AdminDashboard' : 
                      user.role === 'manager' ? 'ManagerDashboard' : 
                      user.role === 'designer' ? 'DesignerDashboard' : 
                      'ClientDashboard'
                    )}
                    className="hidden md:block text-right hover:opacity-80 transition-opacity"
                  >
                    <p className="text-sm font-medium text-white">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-white/70">{!user.role || user.role === 'client' ? 'Dashboard' : `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`}</p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="hidden md:flex text-white hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              {!user && (
                <Link to={createPageUrl('WordPressLogin')}>
                  <Button className="bg-white text-[#4791FF] hover:bg-white/90">
                    Sign In
                  </Button>
                </Link>
              )}
              
              {/* Mobile menu button */}
              {user && (
                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="text-white"
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </Button>
                </div>
                )}

                {developerMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      <List className="w-4 h-4 mr-2" />
                      Dev: All Pages
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('AdminDashboard'))}>
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('Analytics'))}>
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('AdminSettings'))}>
                      Admin Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('ClientDashboard'))}>
                      Client Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('DesignerDashboard'))}>
                      Designer Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('JobIntake'))}>
                      Job Intake Form
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('ManagerDashboard'))}>
                      Manager Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('DesignPackageOrder'))}>
                      Design Package Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('SurveyResults'))}>
                      Survey Results
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('ArchivedJobs'))}>
                      Archived Jobs
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
                </div>
                </div>
                </div>
        
        {/* Mobile Navigation */}
        {user && mobileMenuOpen && (
          <div className="md:hidden bg-[#3680ee] border-t border-white/10">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                
                if (link.dropdown) {
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-2 px-4 py-2 text-white font-medium">
                        <Icon className="w-4 h-4" />
                        {link.name}
                      </div>
                      {link.dropdown.map((subLink) => {
                        const SubIcon = subLink.icon;
                        return (
                          <Link
                            key={subLink.url}
                            to={subLink.url}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-3 pl-8 rounded-lg text-white hover:bg-white/10 transition-all"
                          >
                            <SubIcon className="w-4 h-4" />
                            {subLink.name}
                          </Link>
                        );
                      })}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={link.url}
                    to={link.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm font-medium text-white px-4">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-white/70 px-4 mb-2">{user.email}</p>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-white/70 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="min-h-[calc(100vh-5rem)]">
        {children}
      </main>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
