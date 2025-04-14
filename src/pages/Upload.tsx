
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useUser } from '@clerk/clerk-react';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Upload as UploadIcon, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// For testing without Clerk
const mockUser = {
  id: 'mock-user-id',
  fullName: 'Mock User',
  primaryEmailAddress: {
    emailAddress: 'mock@example.com'
  }
};

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Use mock user data for now
  const user = mockUser;
  
  const [formData, setFormData] = useState({
    doctorName: '',
    purpose: '',
    category: '',
    notes: '',
    location: '',
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = [
    { value: 'prescription', label: 'Prescription' },
    { value: 'lab_report', label: 'Lab Report' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'insurance', label: 'Insurance Document' },
    { value: 'other', label: 'Other' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Clear file error if it exists
      if (errors.file) {
        setErrors({
          ...errors,
          file: '',
        });
      }

      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // For non-image files, show a generic preview
        setFilePreview(null);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.doctorName.trim()) {
      newErrors.doctorName = 'Doctor/Provider name is required';
    }
    
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose of visit is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!file) {
      newErrors.file = 'Please upload a document or image';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Form validation error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }
    
    if (!file || !user) return;
    
    try {
      setUploading(true);
      
      // Create a reference to the storage location
      const storageRef = ref(storage, `records/${user.id}/${Date.now()}_${file.name}`);
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Monitor upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          setUploading(false);
          toast({
            title: "Upload failed",
            description: error.message,
            variant: "destructive",
          });
        },
        async () => {
          // Upload complete, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save record to Firestore
          await addDoc(collection(db, 'records'), {
            userId: user.id,
            doctorName: formData.doctorName,
            purpose: formData.purpose,
            category: formData.category,
            notes: formData.notes,
            location: formData.location,
            fileUrl: downloadURL,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            createdAt: serverTimestamp(),
            uploadedAt: new Date().toISOString(),
            userName: user.fullName || '',
            userEmail: user.primaryEmailAddress?.emailAddress || '',
          });
          
          setUploading(false);
          toast({
            title: "Record uploaded successfully",
            description: "Your medical record has been saved.",
          });
          
          // Navigate to dashboard
          navigate('/dashboard');
        }
      );
    } catch (error: any) {
      setUploading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to upload record",
        variant: "destructive",
      });
    }
  };
  
  const getFileIcon = () => {
    if (!file) return <UploadIcon className="h-20 w-20 text-gray-400" />;
    
    if (file.type.startsWith('image/')) {
      return filePreview ? (
        <img 
          src={filePreview} 
          alt="Preview" 
          className="w-full h-48 object-cover rounded-md" 
        />
      ) : <UploadIcon className="h-20 w-20 text-gray-400" />;
    }
    
    return <FileText className="h-20 w-20 text-gray-400" />;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Upload Medical Record</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="doctorName" className="text-sm font-medium">
                  Doctor/Provider Name *
                </Label>
                <Input
                  id="doctorName"
                  name="doctorName"
                  placeholder="Enter doctor or provider name"
                  value={formData.doctorName}
                  onChange={handleInputChange}
                  className={errors.doctorName ? "border-red-500" : ""}
                />
                {errors.doctorName && (
                  <p className="text-sm text-red-500 mt-1">{errors.doctorName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="purpose" className="text-sm font-medium">
                  Purpose of Visit/Receipt *
                </Label>
                <Input
                  id="purpose"
                  name="purpose"
                  placeholder="E.g., Annual checkup, prescription pickup"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className={errors.purpose ? "border-red-500" : ""}
                />
                {errors.purpose && (
                  <p className="text-sm text-red-500 mt-1">{errors.purpose}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger
                    id="category"
                    className={errors.category ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Add any additional information"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="location" className="text-sm font-medium">
                  Location (Optional)
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Clinic or hospital location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="file" className="text-sm font-medium">
              Upload Document/Image *
            </Label>
            
            <div className="mt-2 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-10">
              <div className="text-center">
                {getFileIcon()}
                
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500"
                  >
                    <span>Upload a file</span>
                    <Input
                      id="file"
                      name="file"
                      type="file"
                      className="sr-only"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">
                  PNG, JPG, JPEG, PDF up to 10MB
                </p>
                
                {file && (
                  <p className="mt-2 text-sm text-gray-500">{file.name}</p>
                )}
                
                {errors.file && (
                  <p className="text-sm text-red-500 mt-1">{errors.file}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
        
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            All uploaded documents are encrypted and securely stored.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={() => navigate('/dashboard')} disabled={uploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Record'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Upload;
