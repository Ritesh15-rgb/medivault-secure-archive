import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/App';
import { FileCheck } from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  
  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <div className="flex flex-col items-center space-y-4">
        <div className="rounded-full bg-primary p-4">
          <FileCheck className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Welcome to MediVault</h1>
        <p className="text-muted-foreground">Complete your profile to get started</p>
        
        {/* Onboarding content will go here */}
        <button
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
