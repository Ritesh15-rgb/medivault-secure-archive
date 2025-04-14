import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MedicalRecord, RecordCategory } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  FileText, 
  Pill, 
  Stethoscope, 
  Syringe, 
  Receipt, 
  FileImage, 
  Shield, 
  MoreVertical,
  Filter,
  ChevronDown,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

// Mock user ID for now
const MOCK_USER_ID = 'mock-user-id';

// Category icons mapping
const categoryIcons: Record<RecordCategory, React.ReactNode> = {
  prescription: <Pill className="h-5 w-5" />,
  lab_report: <FileText className="h-5 w-5" />,
  consultation: <Stethoscope className="h-5 w-5" />,
  imaging: <FileImage className="h-5 w-5" />,
  vaccination: <Syringe className="h-5 w-5" />,
  receipt: <Receipt className="h-5 w-5" />,
  insurance: <Shield className="h-5 w-5" />,
  other: <FileText className="h-5 w-5" />
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);
        const recordsRef = collection(db, 'records');
        const q = query(
          recordsRef, 
          where('userId', '==', MOCK_USER_ID),
          orderBy('visitDate', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedRecords: MedicalRecord[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedRecords.push({
            ...data,
            id: doc.id,
            visitDate: data.visitDate.toDate(),
            uploadedAt: data.uploadedAt.toDate(),
            updatedAt: data.updatedAt?.toDate() || null,
          } as MedicalRecord);
        });

        setRecords(fetchedRecords);
        setFilteredRecords(fetchedRecords);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let result = [...records];

    // Apply category filter
    if (activeCategory !== 'all') {
      result = result.filter(record => record.category === activeCategory);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(record => 
        record.doctorName.toLowerCase().includes(query) ||
        record.purpose.toLowerCase().includes(query) ||
        record.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime());
        break;
      case 'oldest':
        result.sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
        break;
      case 'doctor-asc':
        result.sort((a, b) => a.doctorName.localeCompare(b.doctorName));
        break;
      case 'doctor-desc':
        result.sort((a, b) => b.doctorName.localeCompare(a.doctorName));
        break;
      default:
        break;
    }

    setFilteredRecords(result);
  }, [records, searchQuery, activeCategory, sortOption]);

  // Get record category counts
  const getCategoryCounts = () => {
    const counts: Record<string, number> = { all: records.length };
    
    records.forEach(record => {
      counts[record.category] = (counts[record.category] || 0) + 1;
    });
    
    return counts;
  };
  
  const categoryCounts = getCategoryCounts();

  const handleViewRecord = (id: string) => {
    navigate(`/records/${id}`);
  };

  // Categories for tabs
  const categories: Array<{id: string, label: string, icon: React.ReactNode}> = [
    { id: 'all', label: 'All Records', icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'prescription', label: 'Prescriptions', icon: categoryIcons.prescription },
    { id: 'consultation', label: 'Consultations', icon: categoryIcons.consultation },
    { id: 'lab_report', label: 'Lab Reports', icon: categoryIcons.lab_report },
    { id: 'imaging', label: 'Imaging', icon: categoryIcons.imaging },
    { id: 'vaccination', label: 'Vaccinations', icon: categoryIcons.vaccination },
    { id: 'receipt', label: 'Receipts', icon: categoryIcons.receipt },
    { id: 'insurance', label: 'Insurance', icon: categoryIcons.insurance },
    { id: 'other', label: 'Other', icon: categoryIcons.other }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">
            Manage and access your medical documents
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/upload')}
            className="bg-medivault-500 hover:bg-medivault-600"
          >
            Upload New Record
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative grow">
          <Input
            placeholder="Search records by doctor, purpose, or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Sort by
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortOption('newest')}>
              Newest First
              {sortOption === 'newest' && (
                <CheckSquare className="ml-2 h-4 w-4" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('oldest')}>
              Oldest First
              {sortOption === 'oldest' && (
                <CheckSquare className="ml-2 h-4 w-4" />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortOption('doctor-asc')}>
              Doctor (A-Z)
              {sortOption === 'doctor-asc' && (
                <CheckSquare className="ml-2 h-4 w-4" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('doctor-desc')}>
              Doctor (Z-A)
              {sortOption === 'doctor-desc' && (
                <CheckSquare className="ml-2 h-4 w-4" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="overflow-x-auto">
          {categories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-1.5"
            >
              {category.icon}
              {category.label}
              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                {categoryCounts[category.id] || 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Records Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="h-40 bg-gray-200"></div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start p-4 space-y-3">
                    <div className="w-2/3 h-5 bg-gray-200 rounded"></div>
                    <div className="w-full h-4 bg-gray-100 rounded"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredRecords.map((record) => (
                <Card 
                  key={record.id}
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewRecord(record.id)}
                >
                  <CardContent className="p-0">
                    <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {record.thumbnailUrl ? (
                        <img
                          src={record.thumbnailUrl}
                          alt={record.purpose}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="bg-medivault-100 h-full w-full flex items-center justify-center">
                          {categoryIcons[record.category] || <FileText className="h-12 w-12 text-medivault-300" />}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col items-start p-4">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        {categoryIcons[record.category]}
                        <span className="capitalize">{record.category.replace('_', ' ')}</span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/records/${record.id}`);
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // Implement download functionality
                            window.open(record.documentUrl, '_blank');
                          }}>
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // Implement delete functionality
                            }}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <h3 className="font-semibold mt-2">{record.purpose}</h3>
                    <p className="text-sm text-muted-foreground">Dr. {record.doctorName}</p>
                    
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{format(record.visitDate, 'MMM dd, yyyy')}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg">No records found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || activeCategory !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "You haven't uploaded any medical records yet"}
              </p>
              <Button 
                onClick={() => navigate('/upload')}
                className="bg-medivault-500 hover:bg-medivault-600"
              >
                Upload Your First Record
              </Button>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default Dashboard;
