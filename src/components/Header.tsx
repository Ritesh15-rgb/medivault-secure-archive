
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Header = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Will implement search functionality later
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="md:w-96">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="Search records..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </form>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
        
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{user.fullName || user.primaryEmailAddress?.emailAddress}</p>
            </div>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
};

export default Header;
