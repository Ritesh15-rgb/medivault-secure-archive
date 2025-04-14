
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, FileUp, User, Files, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const sidebarItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Upload Records', icon: FileUp, path: '/upload' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // On mobile, sidebar is a drawer that can be toggled
  if (isMobile) {
    return (
      <>
        <button 
          onClick={toggleSidebar}
          className="fixed z-20 bottom-4 right-4 p-3 rounded-full bg-medivault-500 text-white shadow-lg"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>

        {/* Mobile Sidebar Overlay */}
        {!isCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={toggleSidebar}
          />
        )}

        {/* Mobile Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 transform",
            isCollapsed ? "-translate-x-full" : "translate-x-0"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Files className="h-6 w-6 text-medivault-500" />
              <span className="text-xl font-bold text-gray-900">MediVault</span>
            </div>
            <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <nav className="mt-6 px-4 space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.name}
                variant={location.pathname === item.path ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-left",
                  location.pathname === item.path 
                    ? "bg-medivault-500 text-white" 
                    : "text-gray-600 hover:text-medivault-500"
                )}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setIsCollapsed(true);
                }}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.name}
              </Button>
            ))}
          </nav>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className={cn(
      "h-screen sticky top-0 border-r transition-all duration-300 bg-white",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Files className="h-6 w-6 text-medivault-500" />
            <span className="text-xl font-bold text-gray-900">MediVault</span>
          </div>
        )}
        <Button 
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "hover:bg-gray-100", 
            isCollapsed ? "mx-auto" : ""
          )}
        >
          <Menu size={20} />
        </Button>
      </div>

      <nav className="mt-6 px-2 space-y-2">
        {sidebarItems.map((item) => (
          <Button
            key={item.name}
            variant={location.pathname === item.path ? "default" : "ghost"}
            className={cn(
              "w-full justify-start", 
              location.pathname === item.path 
                ? "bg-medivault-500 text-white" 
                : "text-gray-600 hover:text-medivault-500",
              isCollapsed ? "px-2" : ""
            )}
            onClick={() => navigate(item.path)}
          >
            <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-2")} />
            {!isCollapsed && item.name}
          </Button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
