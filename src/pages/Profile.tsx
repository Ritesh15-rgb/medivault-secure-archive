
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileUp, Loader2, UserCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';

const Profile = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: ''
    }
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const userDoc = await getDoc(doc(db, 'users', user.id));
        
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setUserProfile(profileData);
          setFormData({
            fullName: profileData.fullName,
            phoneNumber: profileData.phoneNumber,
            dateOfBirth: profileData.dateOfBirth,
            emergencyContact: profileData.emergencyContact
          });
          
          if (profileData.profilePicture) {
            setProfilePicturePreview(profileData.profilePicture);
          }
        } else {
          toast({
            title: 'Profile Not Found',
            description: 'Your profile information could not be loaded.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile information.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleEditMode = () => {
    setEditMode(!editMode);
    
    if (!editMode) {
      // Reset form data to current profile when entering edit mode
      if (userProfile) {
        setFormData({
          fullName: userProfile.fullName,
          phoneNumber: userProfile.phoneNumber,
          dateOfBirth: userProfile.dateOfBirth,
          emergencyContact: userProfile.emergencyContact
        });
      }
    } else {
      // Reset file input when exiting edit mode without saving
      setProfilePictureFile(null);
      setProfilePicturePreview(userProfile?.profilePicture || null);
    }
  };

  const handleSave = async () => {
    if (!user || !userProfile) return;
    
    setIsSaving(true);
    
    try {
      let profilePictureUrl = userProfile.profilePicture || '';
      
      // Upload new profile picture if provided
      if (profilePictureFile) {
        const storageRef = ref(storage, `users/${user.id}/profile-picture`);
        const uploadResult = await uploadBytes(storageRef, profilePictureFile);
        profilePictureUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Update user profile document
      const updatedProfile = {
        ...userProfile,
        ...formData,
        profilePicture: profilePictureUrl,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'users', user.id), updatedProfile);
      
      setUserProfile(updatedProfile);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated!'
      });
      
      setEditMode(false);
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating your profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
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
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and emergency contacts
          </p>
        </div>
        
        <Button
          onClick={handleEditMode}
          variant={editMode ? "outline" : "default"}
        >
          {editMode ? 'Cancel' : (
            <>
              <Settings className="mr-2 h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profilePicturePreview || undefined} alt={userProfile?.fullName} />
                  <AvatarFallback className="text-2xl bg-medivault-100 text-medivault-500">
                    {userProfile?.fullName?.charAt(0) || <UserCircle className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                
                {editMode && (
                  <Label
                    htmlFor="profilePicture"
                    className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <FileUp className="h-4 w-4" />
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </Label>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">{userProfile?.fullName}</h2>
                <p className="text-muted-foreground">{userProfile?.email}</p>
                {userProfile?.createdAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Member since {format(userProfile.createdAt.toDate(), 'MMMM yyyy')}
                  </p>
                )}
              </div>
              
              {editMode && (
                <Button 
                  onClick={handleSave}
                  className="bg-medivault-500 hover:bg-medivault-600"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your basic personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                {editMode ? (
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 px-3 py-1.5 border rounded-md bg-gray-50">
                    {userProfile?.fullName}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <p className="mt-1 px-3 py-1.5 border rounded-md bg-gray-50">
                  {userProfile?.email}
                </p>
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                {editMode ? (
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 px-3 py-1.5 border rounded-md bg-gray-50">
                    {userProfile?.phoneNumber}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                {editMode ? (
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 px-3 py-1.5 border rounded-md bg-gray-50">
                    {userProfile?.dateOfBirth}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>
              Person to contact in case of emergency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency.name">Name</Label>
                {editMode ? (
                  <Input
                    id="emergency.name"
                    name="emergency.name"
                    value={formData.emergencyContact?.name}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 px-3 py-1.5 border rounded-md bg-gray-50">
                    {userProfile?.emergencyContact?.name}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="emergency.relationship">Relationship</Label>
                {editMode ? (
                  <Input
                    id="emergency.relationship"
                    name="emergency.relationship"
                    value={formData.emergencyContact?.relationship}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 px-3 py-1.5 border rounded-md bg-gray-50">
                    {userProfile?.emergencyContact?.relationship}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="emergency.phoneNumber">Phone Number</Label>
                {editMode ? (
                  <Input
                    id="emergency.phoneNumber"
                    name="emergency.phoneNumber"
                    value={formData.emergencyContact?.phoneNumber}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 px-3 py-1.5 border rounded-md bg-gray-50">
                    {userProfile?.emergencyContact?.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
