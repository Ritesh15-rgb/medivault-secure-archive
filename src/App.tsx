
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import RecordView from "./pages/RecordView";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layouts/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          
          <Route
            path="/profile"
            element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          
          <Route
            path="/upload"
            element={
              <>
                <SignedIn>
                  <MainLayout>
                    <Upload />
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          
          <Route
            path="/records/:id"
            element={
              <>
                <SignedIn>
                  <MainLayout>
                    <RecordView />
                  </MainLayout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          
          <Route
            path="/onboarding"
            element={
              <>
                <SignedIn>
                  <OnboardingPage />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
