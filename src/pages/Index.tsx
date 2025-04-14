
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, FileCheck } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("signin");
  
  // Mock login functionality
  const handleLogin = () => {
    navigate('/dashboard');
  };

  const features = [
    {
      icon: <Shield className="h-10 w-10 text-medivault-500" />,
      title: 'Secure Storage',
      description: 'End-to-end encryption keeps your medical records safe and private.'
    },
    {
      icon: <FileCheck className="h-10 w-10 text-medivault-500" />,
      title: 'Easy Organization',
      description: 'Categorize and find your medical documents quickly when you need them most.'
    },
    {
      icon: <Lock className="h-10 w-10 text-medivault-500" />,
      title: 'Controlled Access',
      description: 'Share specific records with healthcare providers or family members securely.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white py-4 px-6 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-8 w-8 text-medivault-500" />
            <span className="text-2xl font-bold text-gray-900">MediVault</span>
          </div>
          <div className="space-x-2">
            <Button 
              variant="ghost"
              onClick={() => setActiveTab("signin")}
            >
              Sign In
            </Button>
            <Button
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col-reverse md:flex-row">
        <div className="bg-gray-50 w-full md:w-1/2 p-6 md:p-12 flex items-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your Medical Records, Organized and Secure
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              MediVault helps you securely store and manage all your medical records and receipts in one place,
              accessible whenever you need them.
            </p>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="shrink-0 p-2 bg-white rounded-lg shadow-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 p-6 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-0">
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" 
                        placeholder="you@example.com" 
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                      <input 
                        type="password" 
                        id="password" 
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" 
                        placeholder="••••••••" 
                      />
                    </div>
                    <Button type="submit" className="w-full">Sign In</Button>
                  </form>
                </div>
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <form onSubmit={(e) => { e.preventDefault(); navigate('/onboarding'); }} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input 
                        type="email" 
                        id="signup-email" 
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" 
                        placeholder="you@example.com" 
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">Password</label>
                      <input 
                        type="password" 
                        id="signup-password" 
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" 
                        placeholder="••••••••" 
                      />
                    </div>
                    <Button type="submit" className="w-full">Sign Up</Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
