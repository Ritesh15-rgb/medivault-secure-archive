
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import RecordView from "./pages/RecordView";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layouts/MainLayout";

// Create a mock authentication context
import { createContext, useState, useEffect } from "react";

// Create auth context for the application
export const AuthContext = createContext<{
  isAuthenticated: boolean;
  userId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}>({
  isAuthenticated: false,
  userId: null,
  login: async () => {},
  logout: () => {},
});

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Check for existing authentication on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setIsAuthenticated(true);
      setUserId(authData.id);
    }
  }, []);
  
  // Mock login function
  const login = async (email: string, password: string) => {
    // In a real app, this would validate credentials with a server
    const mockUserId = 'mock-user-id';
    localStorage.setItem('auth', JSON.stringify({ id: mockUserId }));
    setIsAuthenticated(true);
    setUserId(mockUserId);
  };
  
  // Mock logout function
  const logout = () => {
    localStorage.removeItem('auth');
    setIsAuthenticated(false);
    setUserId(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ isAuthenticated, userId, login, logout }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              <Route path="/upload" element={<MainLayout><Upload /></MainLayout>} />
              <Route path="/records/:id" element={<MainLayout><RecordView /></MainLayout>} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
