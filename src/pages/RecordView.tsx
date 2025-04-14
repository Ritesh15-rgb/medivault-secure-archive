
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MedicalRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Calendar,
  ChevronLeft, 
  Download,
  FileText,
  Printer,
  Share2,
  Trash2, 
  MapPin,
  FileImage,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const RecordView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || !user) return;

      try {
        setIsLoading(true);
        const docRef = doc(db, 'records', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().userId === user.id) {
          const data = docSnap.data();
          setRecord({
            ...data,
            id: docSnap.id,
            visitDate: data.visitDate.toDate(),
            uploadedAt: data.uploadedAt.toDate(),
            updatedAt: data.updatedAt?.toDate() || null,
          } as MedicalRecord);
        } else {
          // Record doesn't exist or user doesn't have permission
          toast({
            title: 'Error',
            description: 'Record not found or you do not have permission to view it.',
            variant: 'destructive',
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching record:', error);
        toast({
          title: 'Error',
          description: 'Failed to load record details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
  }, [id, user, navigate, toast]);

  const handleDeleteRecord = async () => {
    if (!id || !user) return;
    
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'records', id));
      
      toast({
        title: 'Record Deleted',
        description: 'The medical record has been permanently deleted.',
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Delete Failed',
        description: 'There was a problem deleting this record.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDownload = () => {
    if (record?.documentUrl) {
      window.open(record.documentUrl, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-medivault-500" />
        <span className="ml-2 text-lg">Loading record...</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg">Record not found</h3>
        <p className="text-muted-foreground mb-6">
          The medical record you're looking for doesn't exist or has been removed.
        </p>
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isImage = record.documentUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/);

  return (
    <>
      {/* Regular View */}
      <div className={`max-w-4xl mx-auto ${isFullscreen ? 'hidden' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            
            <Button
              variant="outline"
              size="sm"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Document Preview */}
          <div className="md:col-span-2 space-y-4">
            <div className="border rounded-lg overflow-hidden bg-white">
              {isImage ? (
                <div className="relative">
                  <img
                    src={record.documentUrl}
                    alt="Medical record"
                    className="w-full object-contain"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={toggleFullscreen}
                  >
                    View Fullscreen
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <FileImage className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="mb-6">This document can't be previewed.</p>
                  <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Document
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-xl font-semibold">{record.purpose}</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Doctor/Provider</p>
                  <p>{record.doctorName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="capitalize">{record.category.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Visit Date</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <p>{format(record.visitDate, 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                
                {record.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <p>{record.location.address || 'Map location available'}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">Uploaded</p>
                  <p>{format(record.uploadedAt, 'MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>

            {record.description && (
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{record.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {isFullscreen && isImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 text-white">
            <h2 className="text-xl font-semibold">{record.purpose}</h2>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              Close Fullscreen
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={record.documentUrl}
              alt="Medical record fullscreen"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medical Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medical record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecord}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RecordView;
