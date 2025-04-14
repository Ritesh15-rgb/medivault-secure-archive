
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileUp, Upload as UploadIcon, Calendar, Pin, Loader2 } from 'lucide-react';
import { MedicalRecord, RecordCategory } from '@/types';

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [uploadedRecord, setUploadedRecord] = useState<MedicalRecord | null>(null);

  const [formData, setFormData] = useState({
    doctorName: '',
    purpose: '',
    category: 'consultation' as RecordCategory,
    description: '',
    visitDate: new Date().toISOString().split('T')[0],
    documentFile: null as File | null,
    thumbnailFile: null as File | null,
    location: {
      address: '',
      latitude: null as number | null,
      longitude: null as number | null
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      category: value as RecordCategory
    });

    // Clear error when field is edited
    if (errors.category) {
      setErrors({
        ...errors,
        category: ''
      });
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        address: e.target.value
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        documentFile: file
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error when field is edited
      if (errors.documentFile) {
        setErrors({
          ...errors,
          documentFile: ''
        });
      }
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Call reverse geocoding API to get address from coordinates
          // For now, just storing the coordinates
          setFormData({
            ...formData,
            location: {
              ...formData.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
          });
          
          toast({
            title: "Location detected",
            description: "Your current location has been added to the record.",
          });
        },
        (error) => {
          toast({
            title: "Location detection failed",
            description: "Please check your browser permissions or enter location manually.",
            variant: "destructive",
          });
          console.error("Error getting location:", error);
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation. Please enter location manually.",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctorName.trim()) {
      newErrors.doctorName = 'Doctor/Provider name is required';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.visitDate) {
      newErrors.visitDate = 'Visit date is required';
    }

    if (!formData.documentFile) {
      newErrors.documentFile = 'Please upload a document or image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload the document to Firebase Storage
      const documentFileName = `${Date.now()}-${formData.documentFile!.name}`;
      const documentStorageRef = ref(storage, `records/${user.id}/${documentFileName}`);
      
      const uploadResult = await uploadBytes(documentStorageRef, formData.documentFile!);
      const documentUrl = await getDownloadURL(uploadResult.ref);
      
      // 2. Create thumbnail if none was provided (could be enhanced with actual thumbnail generation)
      let thumbnailUrl = '';
      if (formData.thumbnailFile) {
        const thumbnailStorageRef = ref(storage, `thumbnails/${user.id}/${Date.now()}-${formData.thumbnailFile.name}`);
        const thumbnailUploadResult = await uploadBytes(thumbnailStorageRef, formData.thumbnailFile);
        thumbnailUrl = await getDownloadURL(thumbnailUploadResult.ref);
      } else if (formData.documentFile.type.startsWith('image/')) {
        // If the uploaded file is an image, use it as the thumbnail
        thumbnailUrl = documentUrl;
      }
      
      // 3. Prepare record data for Firestore
      const visitDateObj = new Date(formData.visitDate);
      
      const recordData: Omit<MedicalRecord, 'id'> = {
        userId: user.id,
        doctorName: formData.doctorName,
        purpose: formData.purpose,
        category: formData.category,
        description: formData.description || undefined,
        visitDate: Timestamp.fromDate(visitDateObj),
        uploadedAt: Timestamp.fromDate(new Date()),
        documentUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        location: formData.location.address 
          ? {
              address: formData.location.address,
              latitude: formData.location.latitude || undefined,
              longitude: formData.location.longitude || undefined
            }
          : undefined
      };
      
      // 4. Save record to Firestore
      const docRef = await addDoc(collection(db, 'records'), recordData);
      
      // 5. Set the uploaded record for success dialog
      setUploadedRecord({
        ...recordData,
        id: docRef.id,
        visitDate: visitDateObj,
        uploadedAt: new Date()
      } as MedicalRecord);
      
      setShowSuccessDialog(true);
      
      // Reset form
      setFormData({
        doctorName: '',
        purpose: '',
        category: 'consultation' as RecordCategory,
        description: '',
        visitDate: new Date().toISOString().split('T')[0],
        documentFile: null,
        thumbnailFile: null,
        location: {
          address: '',
          latitude: null,
          longitude: null
        }
      });
      
      setFilePreview(null);
      
    } catch (error) {
      console.error('Error uploading record:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was a problem uploading your medical record. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewRecord = () => {
    if (uploadedRecord) {
      navigate(`/records/${uploadedRecord.id}`);
    }
    setShowSuccessDialog(false);
  };

  const handleUploadAnother = () => {
    setShowSuccessDialog(false);
  };

  const recordCategories = [
    { value: 'prescription', label: 'Prescription' },
    { value: 'lab_report', label: 'Lab Report' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'imaging', label: 'Imaging/Scan' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'insurance', label: 'Insurance Document' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Upload Medical Record</h1>
        <p className="text-muted-foreground">
          Add a new medical document to your secure vault
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Record Details</CardTitle>
          <CardDescription>
            Fill in the information about this medical record
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor/Provider Name *</Label>
                <Input
                  id="doctorName"
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={handleInputChange}
                  placeholder="Dr. Smith"
                  className={errors.doctorName ? "border-destructive" : ""}
                />
                {errors.doctorName && (
                  <p className="text-sm text-destructive">{errors.doctorName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visitDate">Visit Date *</Label>
                <div className="relative">
                  <Input
                    id="visitDate"
                    name="visitDate"
                    type="date"
                    value={formData.visitDate}
                    onChange={handleInputChange}
                    className={errors.visitDate ? "border-destructive" : ""}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.visitDate && (
                  <p className="text-sm text-destructive">{errors.visitDate}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose/Reason for Visit *</Label>
                <Input
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Annual checkup"
                  className={errors.purpose ? "border-destructive" : ""}
                />
                {errors.purpose && (
                  <p className="text-sm text-destructive">{errors.purpose}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
                  <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {recordCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Notes (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any additional information or notes about this record"
                rows={3}
              />
            </div>
            
            {/* Location */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="location">Location (Optional)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={detectLocation}
                  className="text-xs flex items-center gap-1"
                >
                  <Pin className="h-3 w-3" />
                  Detect Current Location
                </Button>
              </div>
              <Input
                id="location"
                name="location"
                value={formData.location.address}
                onChange={handleAddressChange}
                placeholder="Hospital or clinic address"
              />
            </div>
            
            {/* Document Upload */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentFile">Upload Document/Image *</Label>
                <div className="mt-1 flex items-center gap-4">
                  <Label htmlFor="documentFile" className="flex-1">
                    <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors hover:border-primary/50 ${errors.documentFile ? "border-destructive" : "border-muted-foreground/25"}`}>
                      {filePreview ? (
                        <div className="w-full aspect-video flex justify-center">
                          <img src={filePreview} alt="Preview" className="max-h-40 max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-full py-4 flex flex-col items-center text-muted-foreground">
                          <FileUp className="h-8 w-8 mb-2" />
                          <p className="text-sm">Drag and drop or click to upload</p>
                          <p className="text-xs mt-1">Supports images, PDFs, and other document formats</p>
                        </div>
                      )}
                    </div>
                  </Label>
                  <Input
                    id="documentFile"
                    name="documentFile"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                  />
                </div>
                {errors.documentFile && (
                  <p className="text-sm text-destructive mt-1">{errors.documentFile}</p>
                )}
                {filePreview && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.documentFile?.name} ({(formData.documentFile?.size! / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t px-6 py-4 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isUploading}
              className="bg-medivault-500 hover:bg-medivault-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload Record
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Record Uploaded Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Your medical record has been securely saved to your MediVault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center py-4">
            <div className="bg-medivault-50 rounded-full p-4">
              <UploadIcon className="h-12 w-12 text-medivault-500" />
            </div>
          </div>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={handleUploadAnother}
              className="mt-0 sm:mt-0"
            >
              Upload Another
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleViewRecord}
              className="bg-medivault-500 hover:bg-medivault-600"
            >
              View Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UploadPage;
