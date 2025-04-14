
// Fix the toDate() issue in Profile.tsx
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FileUp, Save, Loader2, User as UserIcon } from 'lucide-react';

const Profile = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: ''
    }
  });
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const docRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          
          // Format dates if they exist
          if (data.createdAt) {
            // Check if it's a Firestore Timestamp (has toDate method) or a regular Date
            if ('toDate' in data.createdAt) {
              data.createdAt = data.createdAt.toDate();
            }
          }
          
          if (data.updatedAt) {
            // Check if it's a Firestore Timestamp (has toDate method) or a regular Date
            if ('toDate' in data.updatedAt) {
              data.updatedAt = data.updatedAt.toDate();
            }
          }
          
          setProfileData(data);
          if (data.profilePicture) {
            setProfilePicturePreview(data.profilePicture);
          }
        } else {
          // If profile doesn't exist, initialize with Clerk data
          setProfileData({
            fullName: user.fullName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            phoneNumber: '',
            dateOfBirth: '',
            emergencyContact: {
              name: '',
              relationship: '',
              phoneNumber: ''
            }
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile information.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle nested emergency contact fields
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setProfileData({
        ...profileData,
        emergencyContact: {
          ...profileData.emergencyContact as any,
          [field]: value
        }
      });
    } else {
      setProfileData({
        ...profileData,
        [name]: value
      });
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      
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
    
    setIsSaving(true);
    
    try {
      let profilePictureUrl = profileData.profilePicture || '';
      
      // Upload new profile picture if one was selected
      if (profilePicture) {
        const storageRef = ref(storage, `users/${user.id}/profile-picture`);
        const uploadResult = await uploadBytes(storageRef, profilePicture);
        profilePictureUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Prepare profile data for saving
      const updatedProfile: UserProfile = {
        id: user.id,
        fullName: profileData.fullName || '',
        email: profileData.email || '',
        phoneNumber: profileData.phoneNumber || '',
        dateOfBirth: profileData.dateOfBirth || '',
        emergencyContact: profileData.emergencyContact as UserProfile['emergencyContact'],
        profilePicture: profilePictureUrl || undefined,
        createdAt: profileData.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'users', user.id), updatedProfile);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'There was a problem saving your profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-medivault-500" />
        <span className="ml-2 text-lg">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="w-32 h-32">
              {profilePicturePreview ? (
                <AvatarImage src={profilePicturePreview} alt={profileData.fullName} />
              ) : (
                <AvatarFallback className="text-4xl bg-medivault-100 text-medivault-500">
                  {profileData.fullName ? getInitials(profileData.fullName) : <UserIcon />}
                </AvatarFallback>
              )}
            </Avatar>
            
            <Label 
              htmlFor="profilePicture" 
              className="mt-4 cursor-pointer inline-flex items-center gap-2 text-sm bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              <FileUp className="h-4 w-4" />
              Change Picture
            </Label>
            <Input
              id="profilePicture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureChange}
            />
            
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: Square image, at least 300x300 pixels
            </p>
          </CardContent>
        </Card>
        
        {/* Profile Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} id="profile-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <Separator className="my-6" />
              
              <div>
                <h3 className="font-medium mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency.name">Contact Name</Label>
                    <Input
                      id="emergency.name"
                      name="emergency.name"
                      value={profileData.emergencyContact?.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergency.relationship">Relationship</Label>
                    <Input
                      id="emergency.relationship"
                      name="emergency.relationship"
                      value={profileData.emergencyContact?.relationship}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergency.phoneNumber">Phone Number</Label>
                    <Input
                      id="emergency.phoneNumber"
                      name="emergency.phoneNumber"
                      value={profileData.emergencyContact?.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
          
          <div className="border-t p-4 flex justify-end">
            <Button
              type="submit"
              form="profile-form"
              className="bg-medivault-500 hover:bg-medivault-600"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
