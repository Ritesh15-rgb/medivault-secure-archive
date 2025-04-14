
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, FileUp, Loader2 } from 'lucide-react';
import { UserProfile } from '@/types';

const OnboardingPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phoneNumber: '',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: ''
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested emergency contact fields
    if (name.startsWith('emergency')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: {
          ...formData.emergencyContact as any,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      let profilePictureUrl = '';
      
      // Upload profile picture if provided
      if (profilePictureFile) {
        const storageRef = ref(storage, `users/${user.id}/profile-picture`);
        const uploadResult = await uploadBytes(storageRef, profilePictureFile);
        profilePictureUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Create user profile document
      const userProfile: UserProfile = {
        id: user.id,
        fullName: formData.fullName || '',
        email: formData.email || '',
        phoneNumber: formData.phoneNumber || '',
        dateOfBirth: formData.dateOfBirth || '',
        emergencyContact: formData.emergencyContact as UserProfile['emergencyContact'],
        profilePicture: profilePictureUrl || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'users', user.id), userProfile);
      
      toast({
        title: 'Profile Created',
        description: 'Your profile has been successfully set up!'
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating user profile:', error);
      toast({
        title: 'Error',
        description: 'There was a problem creating your profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <FileCheck className="h-12 w-12 text-medivault-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to MediVault</h1>
          <p className="text-gray-600 mt-2">Let's set up your profile to get started</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              This information will help us personalize your experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Emergency Contact</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency.name">Name</Label>
                    <Input
                      id="emergency.name"
                      name="emergency.name"
                      value={formData.emergencyContact?.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergency.relationship">Relationship</Label>
                    <Input
                      id="emergency.relationship"
                      name="emergency.relationship"
                      value={formData.emergencyContact?.relationship}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergency.phoneNumber">Phone Number</Label>
                    <Input
                      id="emergency.phoneNumber"
                      name="emergency.phoneNumber"
                      value={formData.emergencyContact?.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Profile Picture */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Profile Picture</h3>
                
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="profilePicture" className="inline-flex items-center gap-2 bg-white px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
                      <FileUp className="h-4 w-4" />
                      <span>Choose file</span>
                      <Input
                        id="profilePicture"
                        name="profilePicture"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">Optional. Max 2MB.</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
