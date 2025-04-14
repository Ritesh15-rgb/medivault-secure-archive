
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, FileCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/App';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Handle login/signup submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      
      toast({
        title: "Login successful",
        description: "Welcome to MediVault!",
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            <Button variant="ghost" onClick={() => setActiveTab("signin")}>Sign In</Button>
            <Button onClick={() => setActiveTab("signup")}>Sign Up</Button>
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
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-0">
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange}
                        placeholder="your@email.com" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        value={formData.password} 
                        onChange={handleChange}
                        placeholder="••••••••" 
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" placeholder="your@email.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" placeholder="••••••••" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing Up..." : "Sign Up"}
                    </Button>
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
