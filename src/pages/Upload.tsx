
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, Upload, Loader2, FileImage, X } from 'lucide-react';
import { MedicalRecord, RecordCategory } from '@/types';

const Upload = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  
  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    doctorName: '',
    purpose: '',
    category: 'consultation',
    description: '',
    visitDate: new Date().toISOString().split('T')[0],
  });

  const categories: { value: RecordCategory; label: string }[] = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'lab_report', label: 'Lab Report' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileType(selectedFile.type);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) {
      toast({
        title: 'Error',
        description: file ? 'User not authenticated' : 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format visit date
      const visitDate = new Date(formData.visitDate as string);
      
      // Upload document to Storage
      const storageRef = ref(storage, `users/${user.id}/records/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const documentUrl = await getDownloadURL(uploadResult.ref);
      
      // Generate thumbnail for images
      let thumbnailUrl = '';
      if (fileType.startsWith('image/')) {
        thumbnailUrl = documentUrl;
      }
      
      // Create record document
      const recordData: Partial<MedicalRecord> = {
        userId: user.id,
        doctorName: formData.doctorName,
        purpose: formData.purpose,
        category: formData.category as RecordCategory,
        description: formData.description,
        documentUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        visitDate,
        uploadedAt: new Date(),
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'records'), recordData);
      
      toast({
        title: 'Record Uploaded',
        description: 'Your medical record has been successfully uploaded!'
      });
      
      // Redirect to the record page
      navigate(`/records/${docRef.id}`);
    } catch (error) {
      console.error('Error uploading record:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was a problem uploading your record. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Upload Medical Record</h1>
        <p className="text-muted-foreground">
          Add a new medical record to your secure vault
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Record Information</CardTitle>
          <CardDescription>
            Fill in the details about your medical record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor/Provider Name *</Label>
                  <Input
                    id="doctorName"
                    name="doctorName"
                    placeholder="Dr. Smith"
                    value={formData.doctorName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="visitDate">Visit Date *</Label>
                  <Input
                    id="visitDate"
                    name="visitDate"
                    type="date"
                    value={formData.visitDate as string}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose/Reason for Visit *</Label>
                <Input
                  id="purpose"
                  name="purpose"
                  placeholder="Annual checkup, prescription refill, etc."
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category as string}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Notes/Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Additional details about this record..."
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Upload Document/Image *</Label>
                
                {!file ? (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <Label htmlFor="file" className="cursor-pointer flex flex-col items-center">
                      <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="font-medium">Click to upload or drag and drop</span>
                      <span className="text-sm text-muted-foreground mt-1">
                        PDF, JPG, PNG (max. 10MB)
                      </span>
                      <Input
                        id="file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        required
                      />
                    </Label>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {filePreview ? (
                          <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden">
                            <img 
                              src={filePreview} 
                              alt="Preview" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                            <FileImage className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={clearFile}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-medivault-500 hover:bg-medivault-600"
                disabled={isLoading || !file}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Record
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;
