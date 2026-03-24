import { useState, useEffect, useMemo } from 'react';
import logoDark from '@/assets/logo-dark.png';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterButtonGroup } from '@/components/ui/filter-button-group';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  User,
  FileText,
  Settings,
  LogOut,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Star,
  Package,
  Trash2,
  Edit,
  MapPin,
  ArrowLeft,
  UserPlus,
  Send,
  MoreVertical,
  ClipboardPlus,
  RefreshCw,
  UserMinus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Archive,
  CircleCheck,
  Play,
  CreditCard,
  Coins,
  Calendar,
  Receipt,
  Mail,
  Shield,
  UserCog,
  UserX,
  RotateCcw,
  LayoutGrid,
  X,
  Video,
  ShieldCheck,
  ChevronRight as ChevronRightIcon,
  GraduationCap,
  Fingerprint,
  Monitor,
  Target,
  BarChart3,
  Palette,
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { assessments } from '@/data/assessments';
import { bundles as standardBundles, getBundleAssessments } from '@/data/bundles';
import { roles as initialRoles, getRoleCandidateStats } from '@/data/roles';
import { Assessment, CustomBundle, Role, RoleCandidate, CandidateAssessmentResult, RoleCandidateStatus, RoleStatus } from '@/types/assessment';
import { apiClient } from '@/lib/api';
import { AddCandidateDialog } from '@/components/dashboard/AddCandidateDialog';
import { RoleResultsView } from '@/components/dashboard/RoleResultsView';
import { CandidateAssessmentsList } from '@/components/dashboard/CandidateAssessmentsList';
import { AssignAssessmentDialog } from '@/components/dashboard/AssignAssessmentDialog';
import { AssignAddOnDialog } from '@/components/dashboard/AssignAddOnDialog';
import { CompanySettings } from '@/components/dashboard/CompanySettings';
import { UserProfile } from '@/components/dashboard/UserProfile';
import { PipelineView, PipelineCandidate, PipelineStage } from '@/components/dashboard/PipelineView';
import { CandidateInfoDrawer } from '@/components/dashboard/CandidateInfoDrawer';
import { AssessmentReviewDrawer } from '@/components/dashboard/AssessmentReviewDrawer';
import { ProfileSubTab } from '@/types/assessment';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { addOnServices, CandidateAddOnResult } from '@/data/addons';

import { categoryColors, statusColors, roleStatusColors, userRoleColors, userStatusColors, countryCodes } from '@/lib/constants';

// Sort types
type SortField = 'name' | 'role' | 'status' | 'assigned' | 'done' | 'date' | 'amount' | null;
type SortDirection = 'asc' | 'desc';
type BillingSortField = 'date' | 'amount' | 'status' | null;
type AddonCheckSortField = 'candidate' | 'checkType' | 'role' | 'requested' | 'status' | null;

// Status priority for sorting
const statusPriority: Record<string, number> = {
  completed: 1,
  in_progress: 2,
  invited: 3,
  expired: 4,
};

// Invoice types
interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  items: InvoiceItem[];
}

// Mock invoice data
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: new Date('2024-01-15'),
    dueDate: new Date('2024-01-30'),
    amount: 499.00,
    status: 'paid',
    description: 'Software Engineer Assessment Bundle',
    items: [
      { name: 'Cognitive Ability Test', quantity: 5, price: 45 },
      { name: 'Technical Assessment', quantity: 5, price: 55 }
    ]
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    date: new Date('2024-02-10'),
    dueDate: new Date('2024-02-25'),
    amount: 275.00,
    status: 'paid',
    description: 'Customer Service Role Pack',
    items: [
      { name: 'Personality Assessment', quantity: 3, price: 50 },
      { name: 'Communication Skills Test', quantity: 3, price: 42 }
    ]
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    date: new Date('2024-03-05'),
    dueDate: new Date('2024-03-20'),
    amount: 650.00,
    status: 'paid',
    description: 'Leadership Assessment Suite',
    items: [
      { name: 'Leadership Aptitude Test', quantity: 4, price: 75 },
      { name: 'Strategic Thinking Assessment', quantity: 4, price: 88 }
    ]
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    date: subDays(new Date(), 15),
    dueDate: subDays(new Date(), 1),
    amount: 320.00,
    status: 'pending',
    description: 'Sales Team Evaluation',
    items: [
      { name: 'Sales Aptitude Test', quantity: 4, price: 55 },
      { name: 'Negotiation Skills Assessment', quantity: 4, price: 25 }
    ]
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-005',
    date: subDays(new Date(), 45),
    dueDate: subDays(new Date(), 30),
    amount: 180.00,
    status: 'overdue',
    description: 'Marketing Analyst Bundle',
    items: [
      { name: 'Analytical Reasoning Test', quantity: 2, price: 60 },
      { name: 'Creative Thinking Assessment', quantity: 2, price: 30 }
    ]
  },
];

// Invoice status colors
const invoiceStatusColors: Record<Invoice['status'], string> = {
  paid: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

// Team member types
type UserRole = 'admin' | 'manager' | 'recruiter' | 'viewer';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneCountryCode?: string;
  positionTitle?: string;
  role: UserRole;
  status: 'active' | 'pending' | 'deactivated';
  invitedAt?: Date;
  joinedAt?: Date;
  lastActiveAt?: Date;
}

// Mock team members data
const mockTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '2 9876 5432',
    phoneCountryCode: '+61',
    positionTitle: 'Head of HR',
    role: 'admin',
    status: 'active',
    joinedAt: new Date('2023-06-15'),
    lastActiveAt: new Date()
  },
  {
    id: 'user-2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@company.com',
    phone: '2 1234 5678',
    phoneCountryCode: '+61',
    positionTitle: 'Hiring Manager',
    role: 'manager',
    status: 'active',
    joinedAt: new Date('2023-08-20'),
    lastActiveAt: subDays(new Date(), 1)
  },
  {
    id: 'user-3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@company.com',
    phone: '4 0000 1111',
    phoneCountryCode: '+61',
    positionTitle: 'Senior Recruiter',
    role: 'recruiter',
    status: 'active',
    joinedAt: new Date('2024-01-10'),
    lastActiveAt: subDays(new Date(), 3)
  },
  {
    id: 'user-4',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@company.com',
    phone: '555 123 4567',
    phoneCountryCode: '+1',
    positionTitle: 'HR Coordinator',
    role: 'viewer',
    status: 'pending',
    invitedAt: subDays(new Date(), 2)
  },
  {
    id: 'user-5',
    firstName: 'Jessica',
    lastName: 'Patel',
    email: 'jessica.patel@company.com',
    phone: '20 7946 0958',
    phoneCountryCode: '+44',
    positionTitle: 'Talent Acquisition Specialist',
    role: 'recruiter',
    status: 'deactivated',
    joinedAt: new Date('2023-05-01'),
    lastActiveAt: subMonths(new Date(), 2)
  },
  {
    id: 'user-6',
    firstName: '',
    lastName: '',
    email: 'new.hire@company.com',
    role: 'recruiter',
    status: 'pending',
    invitedAt: subDays(new Date(), 5)
  },
];

// Helper functions for date extraction
const getEarliestAssignedDate = (results?: CandidateAssessmentResult[]) => {
  if (!results?.length) return null;
  const dates = results.map(r => r.assignedAt).filter(Boolean);
  return dates.length ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : null;
};

const getLatestCompletedDate = (results?: CandidateAssessmentResult[]) => {
  if (!results?.length) return null;
  const dates = results.map(r => r.completedAt).filter(Boolean) as Date[];
  return dates.length ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null;
};

// Sortable Header Component
const SortableHeader = ({ 
  field, 
  label, 
  currentField, 
  currentDirection, 
  onSort,
  className = ''
}: {
  field: SortField;
  label: string;
  currentField: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}) => {
  const isActive = currentField === field;
  
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${className}`}
    >
      {label}
      {isActive ? (
        currentDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dashboardPeriod, setDashboardPeriod] = useState('30d');

  const [settingsSubTab, setSettingsSubTab] = useState<'company' | 'credits'>('company');
  const { logout } = useAuth();
  const [isUpgradingToAts, setIsUpgradingToAts] = useState(false);

  const handleUpgradeToAts = async () => {
    try {
      setIsUpgradingToAts(true);
      const response = await apiClient.initiateUpgrade();
      if (!response.success) {
        toast.error(response.error || 'Failed to start ATS upgrade');
        return;
      }
      await apiClient.completeUpgrade();
      const redirectUrl = response.data?.redirectUrl || 'https://hrm8.com/login?upgrade=1';
      window.location.href = redirectUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start ATS upgrade');
    } finally {
      setIsUpgradingToAts(false);
    }
  };
  
  // Credit balance state
  const [creditBalance, setCreditBalance] = useState(0);
  
  // Sort state for candidates
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Bulk selection state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  
  // Card filter state
  const [selectedAssessmentRole, setSelectedAssessmentRole] = useState<string | null>(null);
  const [selectedAddonType, setSelectedAddonType] = useState<string | null>(null);
  
  // Pagination state
  const ROWS_PER_PAGE = 9;
  const [assessmentPage, setAssessmentPage] = useState(1);
  const [addonPage, setAddonPage] = useState(1);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Roles state (unified data source)
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleDetailTab, setRoleDetailTab] = useState<'candidates' | 'pipeline' | 'assessments' | 'services' | 'results'>('candidates');
  const [addCandidateDialogOpen, setAddCandidateDialogOpen] = useState(false);
  
  // Candidate info drawer state
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);
  const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState<RoleCandidate | null>(null);

  // Assessment review drawer state
  const [assessmentReviewDrawerOpen, setAssessmentReviewDrawerOpen] = useState(false);
  const [selectedAssessmentForReview, setSelectedAssessmentForReview] = useState<{ id: string; name: string } | null>(null);

  // Fetch real jobs and credits on mount
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await apiClient.getCompanyBalance();
        if (response.success && response.data) {
          setCreditBalance(response.data.balance);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };
    
    fetchCredits();

    const fetchJobs = async () => {
      try {
        const response = await apiClient.getMyJobs();
        if (response.success && response.data) {
          // Transform API data to Role format
          const apiRoles: Role[] = response.data.map((job) => ({
            id: job.id,
            position: {
              id: job.position?.id || job.id,
              title: job.position?.title || 'Untitled Position',
              location: job.position?.location || '',
              employmentType: (job.position?.employmentType || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'casual',
              seniority: (job.position?.seniority || 'mid') as 'entry' | 'mid' | 'senior' | 'manager' | 'executive',
              skills: job.position?.skills || [],
              responsibilities: job.position?.responsibilities || '',
            },
            assessments: job.assessments as Assessment[] || [],
            candidates: (job.candidates || []).map((c) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              email: c.email,
              status: (c.status?.toLowerCase() || 'invited') as RoleCandidateStatus,
              stage: c.stage || 'NEW_APPLICATION',
              resumeUrl: c.resumeUrl,
              assessmentResults: c.assessmentResults?.map((r) => ({
                assessmentId: r.assessmentId,
                assessmentName: r.assessmentName,
                category: 'aptitude' as const,
                status: r.status as 'pending' | 'in_progress' | 'completed',
                assignedAt: r.assignedAt ? new Date(r.assignedAt) : new Date(),
                updatedAt: r.completedAt ? new Date(r.completedAt) : undefined,
                completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
              })),
            })),
            status: (job.status?.toLowerCase() || 'active') as RoleStatus,
            createdAt: new Date(job.createdAt),
            orderId: job.orderId,
          }));
          
          setRoles(apiRoles);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        toast.error('Failed to load roles');
      } finally {
        setRolesLoading(false);
      }
    };

    fetchJobs();
  }, []);
  
  // Assign assessment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCandidateForAssign, setSelectedCandidateForAssign] = useState<{
    candidate: RoleCandidate;
    roleId: string;
    roleName: string;
  } | null>(null);

  // Assign add-on dialog state
  const [assignAddOnDialogOpen, setAssignAddOnDialogOpen] = useState(false);
  const [selectedCandidateForAddOn, setSelectedCandidateForAddOn] = useState<{
    candidate: RoleCandidate;
    roleId: string;
    roleName: string;
  } | null>(null);
  
  // Bulk selection state for role detail candidates
  const [selectedRoleCandidateIds, setSelectedRoleCandidateIds] = useState<Set<string>>(new Set());

  // Billing state
  const [billingSearchQuery, setBillingSearchQuery] = useState('');
  const [billingStatusFilter, setBillingStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [billingSortField, setBillingSortField] = useState<BillingSortField>('date');
  const [billingSortDirection, setBillingSortDirection] = useState<SortDirection>('desc');
  const [billingDateRange, setBillingDateRange] = useState<'all' | '30days' | '90days' | '12months'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [usersSearchQuery, setUsersSearchQuery] = useState('');
  const [usersStatusFilter, setUsersStatusFilter] = useState<'all' | 'active' | 'pending' | 'deactivated'>('all');
  const [addonCheckSearch, setAddonCheckSearch] = useState('');
  const [addonCheckSortField, setAddonCheckSortField] = useState<AddonCheckSortField>('requested');
  const [addonCheckSortDirection, setAddonCheckSortDirection] = useState<SortDirection>('desc');
  const [addonCheckPage, setAddonCheckPage] = useState(1);
  const [addonCheckPageSize, setAddonCheckPageSize] = useState(5);
  const [usersRoleFilter, setUsersRoleFilter] = useState<'all' | UserRole>('all');
  const [usersSortField, setUsersSortField] = useState<'name' | 'role' | 'status' | 'lastActive' | null>('name');
  const [usersSortDirection, setUsersSortDirection] = useState<SortDirection>('asc');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [invitePhoneCountryCode, setInvitePhoneCountryCode] = useState('+61');
  const [invitePositionTitle, setInvitePositionTitle] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('recruiter');

  // Profile state
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('personal');
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneCountryCode?: string;
    phone?: string;
    positionTitle?: string;
    role: 'admin' | 'manager' | 'recruiter' | 'viewer';
    avatarUrl?: string;
    joinedAt?: Date;
    lastActiveAt?: Date;
  }>({
    id: 'user-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phoneCountryCode: '+61',
    phone: '2 9876 5432',
    positionTitle: 'Head of HR',
    role: 'admin',
    joinedAt: new Date('2023-06-15'),
    lastActiveAt: new Date()
  });

  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [favourites, setFavourites] = useState<string[]>(() => {
    const saved = localStorage.getItem('hrm8_favourites');
    return saved ? JSON.parse(saved) : [];
  });
  const [customBundles, setCustomBundles] = useState<CustomBundle[]>(() => {
    const saved = localStorage.getItem('hrm8_custom_bundles');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Bundle creation state
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<CustomBundle | null>(null);
  const [newBundleName, setNewBundleName] = useState('');
  const [selectedForBundle, setSelectedForBundle] = useState<string[]>([]);
  
  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('hrm8_favourites', JSON.stringify(favourites));
  }, [favourites]);
  
  useEffect(() => {
    localStorage.setItem('hrm8_custom_bundles', JSON.stringify(customBundles));
  }, [customBundles]);

  // Derive all candidates from roles (unified data source)
  const allCandidatesWithRole = useMemo(() => {
    return roles.flatMap(role => 
      role.candidates.map(candidate => ({
        ...candidate,
        roleName: role.position.title,
        roleId: role.id,
      }))
    );
  }, [roles]);

  const filteredCandidates = useMemo(() => {
    let candidates = allCandidatesWithRole.filter(candidate => {
      const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                           candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    if (sortField) {
      candidates = [...candidates].sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case 'name':
            comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
            break;
          case 'role':
            comparison = (a.roleName || '').localeCompare(b.roleName || '');
            break;
          case 'status':
            comparison = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
            break;
          case 'assigned':
            const aAssigned = getEarliestAssignedDate(a.assessmentResults);
            const bAssigned = getEarliestAssignedDate(b.assessmentResults);
            comparison = (aAssigned?.getTime() || 0) - (bAssigned?.getTime() || 0);
            break;
          case 'done':
            const aDone = getLatestCompletedDate(a.assessmentResults);
            const bDone = getLatestCompletedDate(b.assessmentResults);
            comparison = (aDone?.getTime() || 0) - (bDone?.getTime() || 0);
            break;
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return candidates;
  }, [allCandidatesWithRole, searchQuery, statusFilter, sortField, sortDirection]);

  // Bulk selection helpers
  const allVisibleSelected = filteredCandidates.length > 0 && 
    filteredCandidates.every(c => selectedCandidateIds.has(c.id));

  const selectedCandidatesWithCompletedAssessments = filteredCandidates.filter(
    c => selectedCandidateIds.has(c.id) && 
         c.assessmentResults?.some(r => r.status === 'completed')
  );

  const totalCompletedReportsInSelection = selectedCandidatesWithCompletedAssessments.reduce(
    (acc, c) => acc + (c.assessmentResults?.filter(r => r.status === 'completed').length || 0), 0
  );

  // Toggle single candidate selection
  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  };

  // Toggle all visible candidates
  const toggleAllCandidates = () => {
    if (allVisibleSelected) {
      setSelectedCandidateIds(new Set());
    } else {
      setSelectedCandidateIds(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedCandidateIds(new Set());
  };

  // Bulk download handler
  const handleBulkDownload = () => {
    const completedResults: Array<{candidate: string; assessment: string}> = [];
    
    filteredCandidates
      .filter(c => selectedCandidateIds.has(c.id))
      .forEach(candidate => {
        candidate.assessmentResults
          ?.filter(r => r.status === 'completed')
          .forEach(result => {
            completedResults.push({
              candidate: `${candidate.firstName} ${candidate.lastName}`,
              assessment: result.assessmentName
            });
          });
      });

    if (completedResults.length === 0) {
      toast.error('No completed assessments to download');
      return;
    }

    toast.success(`Downloading ${completedResults.length} report(s) for ${selectedCandidateIds.size} candidate(s)`);
    clearSelection();
  };

  // Clear selection when filters change
  useEffect(() => {
    setSelectedCandidateIds(new Set());
  }, [searchQuery, statusFilter]);

  // Clear role candidate selection when selected role changes
  useEffect(() => {
    setSelectedRoleCandidateIds(new Set());
  }, [selectedRole?.id]);

  // Role detail bulk selection helpers
  const allRoleCandidatesSelected = selectedRole && 
    selectedRole.candidates.length > 0 && 
    selectedRole.candidates.every(c => selectedRoleCandidateIds.has(c.id));

  const selectedRoleCandidatesWithCompletedAssessments = selectedRole?.candidates.filter(
    c => selectedRoleCandidateIds.has(c.id) && 
         c.assessmentResults?.some(r => r.status === 'completed')
  ) || [];

  const totalCompletedReportsInRoleSelection = selectedRoleCandidatesWithCompletedAssessments.reduce(
    (acc, c) => acc + (c.assessmentResults?.filter(r => r.status === 'completed').length || 0), 0
  );

  // Toggle single candidate selection within role detail
  const toggleRoleCandidateSelection = (candidateId: string) => {
    setSelectedRoleCandidateIds(prev => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  };

  // Toggle all candidates in role detail
  const toggleAllRoleCandidates = () => {
    if (!selectedRole) return;
    if (allRoleCandidatesSelected) {
      setSelectedRoleCandidateIds(new Set());
    } else {
      setSelectedRoleCandidateIds(new Set(selectedRole.candidates.map(c => c.id)));
    }
  };

  // Clear role candidate selection
  const clearRoleCandidateSelection = () => {
    setSelectedRoleCandidateIds(new Set());
  };

  // Bulk download handler for role candidates
  const handleBulkDownloadRoleCandidates = () => {
    if (!selectedRole) return;
    
    const completedResults: Array<{candidate: string; assessment: string}> = [];
    
    selectedRole.candidates
      .filter(c => selectedRoleCandidateIds.has(c.id))
      .forEach(candidate => {
        candidate.assessmentResults
          ?.filter(r => r.status === 'completed')
          .forEach(result => {
            completedResults.push({
              candidate: `${candidate.firstName} ${candidate.lastName}`,
              assessment: result.assessmentName
            });
          });
      });

    if (completedResults.length === 0) {
      toast.error('No completed assessments to download');
      return;
    }

    toast.success(`Downloading ${completedResults.length} report(s) for ${selectedRoleCandidateIds.size} candidate(s)`);
    clearRoleCandidateSelection();
  };

  // Unified stats derived from roles
  const stats = useMemo(() => {
    const allCandidates = roles.flatMap(r => r.candidates);
    return {
      totalCandidates: allCandidates.length,
      completed: allCandidates.filter(c => c.status === 'completed').length,
      inProgress: allCandidates.filter(c => c.status === 'in_progress').length,
      invited: allCandidates.filter(c => c.status === 'invited').length,
      activeRoles: roles.filter(r => r.status === 'active').length,
    };
  }, [roles]);

  // Mock recent assessment orders (per-candidate rows)
  const recentOrders = [
    { id: 'ORD-001', role: 'Software Engineer', candidateName: 'John Doe', date: '2025-01-17', status: 'in_progress' },
    { id: 'ORD-002', role: 'Software Engineer', candidateName: 'Jane Smith', date: '2025-01-17', status: 'in_progress' },
    { id: 'ORD-003', role: 'Software Engineer', candidateName: 'Alex Chen', date: '2025-01-16', status: 'invited' },
    { id: 'ORD-004', role: 'Product Manager', candidateName: 'Mike Johnson', date: '2025-01-15', status: 'completed' },
    { id: 'ORD-005', role: 'Product Manager', candidateName: 'Emma Williams', date: '2025-01-15', status: 'completed' },
    { id: 'ORD-006', role: 'Sales Representative', candidateName: 'Sarah Wilson', date: '2025-01-14', status: 'completed' },
    { id: 'ORD-007', role: 'Sales Representative', candidateName: 'David Brown', date: '2025-01-14', status: 'completed' },
    { id: 'ORD-008', role: 'Data Analyst', candidateName: 'Olivia Garcia', date: '2025-01-12', status: 'in_progress' },
    { id: 'ORD-009', role: 'UX Designer', candidateName: 'Noah Lee', date: '2025-01-10', status: 'invited' },
    { id: 'ORD-010', role: 'Sales Representative', candidateName: 'Rachel Martinez', date: '2025-01-13', status: 'in_progress' },
    { id: 'ORD-011', role: 'Data Analyst', candidateName: 'Tom Harris', date: '2025-01-11', status: 'completed' },
    { id: 'ORD-012', role: 'Data Analyst', candidateName: 'Amy Zhang', date: '2025-01-10', status: 'invited' },
    { id: 'ORD-013', role: 'UX Designer', candidateName: 'Chris Palmer', date: '2025-01-09', status: 'completed' },
    { id: 'ORD-014', role: 'Software Engineer', candidateName: 'Diana Ross', date: '2025-01-08', status: 'completed' },
    { id: 'ORD-015', role: 'Sales Representative', candidateName: 'Kevin Nguyen', date: '2025-01-07', status: 'completed' },
  ];
  
  const filteredAssessments = useMemo(() => {
    return assessments.filter(assessment => {
      const matchesSearch = assessmentSearch === '' || 
        assessment.name.toLowerCase().includes(assessmentSearch.toLowerCase()) ||
        assessment.description.toLowerCase().includes(assessmentSearch.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || assessment.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [assessmentSearch, categoryFilter]);

  // Filtered invoices with sorting
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    return mockInvoices
      .filter(invoice => {
        // Status filter
        if (billingStatusFilter !== 'all' && invoice.status !== billingStatusFilter) return false;
        
        // Search filter
        if (billingSearchQuery) {
          const query = billingSearchQuery.toLowerCase();
          if (!invoice.invoiceNumber.toLowerCase().includes(query) &&
              !invoice.description.toLowerCase().includes(query)) return false;
        }
        
        // Date range filter
        if (billingDateRange === '30days') {
          const thirtyDaysAgo = subDays(now, 30);
          if (invoice.date < thirtyDaysAgo) return false;
        } else if (billingDateRange === '90days') {
          const ninetyDaysAgo = subDays(now, 90);
          if (invoice.date < ninetyDaysAgo) return false;
        } else if (billingDateRange === '12months') {
          const twelveMonthsAgo = subMonths(now, 12);
          if (invoice.date < twelveMonthsAgo) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        if (!billingSortField) return 0;
        
        let comparison = 0;
        switch (billingSortField) {
          case 'date':
            comparison = a.date.getTime() - b.date.getTime();
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'status':
            const statusOrder = { paid: 1, pending: 2, overdue: 3 };
            comparison = statusOrder[a.status] - statusOrder[b.status];
            break;
        }
        
        return billingSortDirection === 'desc' ? -comparison : comparison;
      });
  }, [billingSearchQuery, billingStatusFilter, billingDateRange, billingSortField, billingSortDirection]);

  // Billing stats
  const billingStats = useMemo(() => {
    const totalSpent = mockInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = mockInvoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
    return { totalSpent, pendingAmount };
  }, []);

  // Billing handlers
  const handleBillingSortChange = (field: BillingSortField) => {
    if (billingSortField === field) {
      if (billingSortDirection === 'asc') {
        setBillingSortDirection('desc');
      } else {
        setBillingSortField(null);
        setBillingSortDirection('asc');
      }
    } else {
      setBillingSortField(field);
      setBillingSortDirection('desc');
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast.success(`Downloading invoice ${invoice.invoiceNumber}`);
  };

  // Team filtered members
  const filteredTeamMembers = useMemo(() => {
    return teamMembers
      .filter(member => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase().trim();
        const matchesSearch = usersSearchQuery === '' ||
          fullName.includes(usersSearchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(usersSearchQuery.toLowerCase());
        const matchesStatus = usersStatusFilter === 'all' || member.status === usersStatusFilter;
        const matchesRole = usersRoleFilter === 'all' || member.role === usersRoleFilter;
        return matchesSearch && matchesStatus && matchesRole;
      })
      .sort((a, b) => {
        if (!usersSortField) return 0;
        let comparison = 0;
        switch (usersSortField) {
          case 'name':
            const aName = `${a.firstName} ${a.lastName}`.trim() || a.email;
            const bName = `${b.firstName} ${b.lastName}`.trim() || b.email;
            comparison = aName.localeCompare(bName);
            break;
          case 'role':
            const roleOrder = { admin: 1, manager: 2, recruiter: 3, viewer: 4 };
            comparison = roleOrder[a.role] - roleOrder[b.role];
            break;
          case 'status':
            const statusOrder = { active: 1, pending: 2, deactivated: 3 };
            comparison = statusOrder[a.status] - statusOrder[b.status];
            break;
          case 'lastActive':
            const aDate = a.lastActiveAt?.getTime() || a.invitedAt?.getTime() || 0;
            const bDate = b.lastActiveAt?.getTime() || b.invitedAt?.getTime() || 0;
            comparison = aDate - bDate;
            break;
        }
        return usersSortDirection === 'desc' ? -comparison : comparison;
      });
  }, [teamMembers, usersSearchQuery, usersStatusFilter, usersRoleFilter, usersSortField, usersSortDirection]);

  // Team stats
  const usersStats = useMemo(() => ({
    total: teamMembers.length,
    active: teamMembers.filter(m => m.status === 'active').length,
    pending: teamMembers.filter(m => m.status === 'pending').length,
    admins: teamMembers.filter(m => m.role === 'admin').length
  }), [teamMembers]);

  // Team handlers
  const handleUsersSortChange = (field: 'name' | 'role' | 'status' | 'lastActive') => {
    if (usersSortField === field) {
      if (usersSortDirection === 'asc') {
        setUsersSortDirection('desc');
      } else {
        setUsersSortField(null);
        setUsersSortDirection('asc');
      }
    } else {
      setUsersSortField(field);
      setUsersSortDirection('asc');
    }
  };

  const handleInviteUser = () => {
    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) return;
    
    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      firstName: inviteFirstName.trim(),
      lastName: inviteLastName.trim(),
      email: inviteEmail.trim(),
      phone: invitePhone.trim() || undefined,
      phoneCountryCode: invitePhone.trim() ? invitePhoneCountryCode : undefined,
      positionTitle: invitePositionTitle.trim() || undefined,
      role: inviteRole,
      status: 'pending',
      invitedAt: new Date()
    };
    
    setTeamMembers(prev => [...prev, newMember]);
    toast.success(`Invitation sent to ${inviteFirstName} ${inviteLastName} (${inviteEmail})`);
    setInviteDialogOpen(false);
    // Reset all fields
    setInviteFirstName('');
    setInviteLastName('');
    setInviteEmail('');
    setInvitePhone('');
    setInvitePhoneCountryCode('+61');
    setInvitePositionTitle('');
    setInviteRole('recruiter');
  };

  const handleResendInvite = (member: TeamMember) => {
    toast.success(`Invitation resent to ${member.email}`);
  };

  const handleCancelInvite = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    toast.success('Invitation cancelled');
  };

  const handleUpdateUserRole = (memberId: string, newRole: UserRole) => {
    setTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
    toast.success('User role updated');
    setEditUserDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeactivateUser = (memberId: string) => {
    setTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, status: 'deactivated' } : m
    ));
    toast.success('User deactivated');
  };

  const handleReactivateUser = (memberId: string) => {
    setTeamMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, status: 'active' } : m
    ));
    toast.success('User reactivated');
  };

  const handleRemoveUser = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    toast.success('User removed from team');
  };

  const getUserRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Full access - manage team, billing, settings';
      case 'manager': return 'Manage roles, candidates, and view all results';
      case 'recruiter': return 'Add candidates, assign assessments, view results';
      case 'viewer': return 'Read-only access to dashboards and results';
    }
  };

  const handleAddCandidates = (newCandidates: RoleCandidate[]) => {
    if (!selectedRole) return;
    
    setRoles(prev => prev.map(role => 
      role.id === selectedRole.id 
        ? { ...role, candidates: [...role.candidates, ...newCandidates] }
        : role
    ));
    
    // Update selectedRole to reflect changes
    setSelectedRole(prev => 
      prev ? { ...prev, candidates: [...prev.candidates, ...newCandidates] } : null
    );
  };

  // Assign assessments to existing candidate
  const handleAssignAssessments = async (candidateId: string, roleId: string, assessmentIds: string[]) => {
    if (assessmentIds.length === 0) return;
    const packageId = assessmentIds[0];
    const assignRes = await apiClient.assignPackageToCandidate(roleId, candidateId, { packageId });
    if (!assignRes.success) {
      toast.error(assignRes.error || 'Failed to assign package to candidate');
      return;
    }

    const inviteRes = await apiClient.sendCandidateInvite(roleId, candidateId);
    if (!inviteRes.success) {
      toast.error(inviteRes.error || 'Package assigned but invite failed');
      return;
    }

    const statusRes = await apiClient.getCandidateAssessmentStatus(roleId, candidateId);
    const hasOpened = Boolean(statusRes.data?.timeline?.some((item: any) => item.linkOpenedAt));
    const hasSubmitted = Boolean(statusRes.data?.timeline?.some((item: any) => item.submittedAt));

    const newResults: CandidateAssessmentResult[] = assessmentIds.map(id => {
      const assessment = assessments.find(a => a.id === id)!;
      return {
        assessmentId: id,
        assessmentName: assessment.name,
        category: assessment.category,
        status: hasSubmitted ? 'completed' as const : hasOpened ? 'in_progress' as const : 'invited' as const,
        assignedAt: new Date(),
      };
    });

    setRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role;
      return {
        ...role,
        candidates: role.candidates.map(candidate => {
          if (candidate.id !== candidateId) return candidate;
          return {
            ...candidate,
            assessmentResults: [
              ...(candidate.assessmentResults || []),
              ...newResults,
            ],
          };
        }),
      };
    }));

    // Update selectedRole if viewing that role
    if (selectedRole?.id === roleId) {
      setSelectedRole(prev => {
        if (!prev) return null;
        return {
          ...prev,
          candidates: prev.candidates.map(candidate => {
            if (candidate.id !== candidateId) return candidate;
            return {
              ...candidate,
              assessmentResults: [
                ...(candidate.assessmentResults || []),
                ...newResults,
              ],
            };
          }),
        };
      });
    }

    toast.success(`Package assigned and invite sent successfully`);
  };

  // Open assign dialog for a candidate
  const openAssignDialog = (candidate: RoleCandidate, roleId: string, roleName: string) => {
    setSelectedCandidateForAssign({ candidate, roleId, roleName });
    setAssignDialogOpen(true);
  };

  // Open assign add-on dialog for a candidate
  const openAssignAddOnDialog = (candidate: RoleCandidate, roleId: string, roleName: string) => {
    setSelectedCandidateForAddOn({ candidate, roleId, roleName });
    setAssignAddOnDialogOpen(true);
  };

  // Handle add-on assignment
  const handleAssignAddOns = (candidateId: string, roleId: string, addOnIds: string[]) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role;
      return {
        ...role,
        addOnIds: [...new Set([...(role.addOnIds || []), ...addOnIds])],
        candidates: role.candidates.map(c => {
          if (c.id !== candidateId) return c;
          const existingResults = c.addOnResults || [];
          const newResults: CandidateAddOnResult[] = addOnIds
            .filter(id => !existingResults.some(r => r.addOnId === id))
            .map(id => {
              const addon = addOnServices.find(a => a.id === id);
              return {
                addOnId: id,
                addOnName: addon?.name || '',
                status: 'pending' as const,
                requestedAt: new Date(),
              };
            });
          return { ...c, addOnResults: [...existingResults, ...newResults] };
        }),
      };
    }));
    
    // Update selectedRole if viewing
    if (selectedRole?.id === roleId) {
      setSelectedRole(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          addOnIds: [...new Set([...(prev.addOnIds || []), ...addOnIds])],
          candidates: prev.candidates.map(c => {
            if (c.id !== candidateId) return c;
            const existingResults = c.addOnResults || [];
            const newResults: CandidateAddOnResult[] = addOnIds
              .filter(id => !existingResults.some(r => r.addOnId === id))
              .map(id => {
                const addon = addOnServices.find(a => a.id === id);
                return {
                  addOnId: id,
                  addOnName: addon?.name || '',
                  status: 'pending' as const,
                  requestedAt: new Date(),
                };
              });
            return { ...c, addOnResults: [...existingResults, ...newResults] };
          }),
        };
      });
    }
    
    toast.success(`${addOnIds.length} service(s) assigned successfully`);
  };

  // Candidate action handlers
  const handleResendInvitation = async (candidate: RoleCandidate, roleId?: string) => {
    if (!roleId) {
      toast.success(`Invitation resent to ${candidate.email}`);
      return;
    }
    const res = await apiClient.sendCandidateInvite(roleId, candidate.id);
    if (!res.success) {
      toast.error(res.error || 'Failed to resend invitation');
      return;
    }
    toast.success(`Invitation resent to ${candidate.email}`);
  };

  const handleSendReminder = (candidate: RoleCandidate) => {
    toast.success(`Reminder sent to ${candidate.email}`);
  };

  const handleDownloadAllReports = (candidate: RoleCandidate) => {
    const completedCount = candidate.assessmentResults?.filter(r => r.status === 'completed').length || 0;
    toast.success(`Downloading ${completedCount} report${completedCount !== 1 ? 's' : ''} for ${candidate.firstName} ${candidate.lastName}`);
  };

  const handleRemoveFromRole = (candidateId: string, roleId: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role;
      return {
        ...role,
        candidates: role.candidates.filter(c => c.id !== candidateId),
      };
    }));

    // Update selectedRole if viewing that role
    if (selectedRole?.id === roleId) {
      setSelectedRole(prev => {
        if (!prev) return null;
        return {
          ...prev,
          candidates: prev.candidates.filter(c => c.id !== candidateId),
        };
      });
    }

    toast.success('Candidate removed from role');
  };

  const handleRoleStatusChange = (roleId: string, newStatus: Role['status']) => {
    setRoles(prev => prev.map(role => 
      role.id === roleId 
        ? { ...role, status: newStatus }
        : role
    ));
    
    // Update selected role if viewing details
    if (selectedRole?.id === roleId) {
      setSelectedRole(prev => prev ? { ...prev, status: newStatus } : null);
    }
    
    const statusLabels = { active: 'Active', completed: 'Completed', archived: 'Archived' };
    toast.success(`Role marked as ${statusLabels[newStatus]}`);
  };

  const toggleFavourite = (assessmentId: string) => {
    setFavourites(prev => 
      prev.includes(assessmentId) 
        ? prev.filter(id => id !== assessmentId)
        : [...prev, assessmentId]
    );
  };
  
  const openCreateBundleDialog = (preselectedIds: string[] = []) => {
    setEditingBundle(null);
    setNewBundleName('');
    setSelectedForBundle(preselectedIds);
    setBundleDialogOpen(true);
  };
  
  const openEditBundleDialog = (bundle: CustomBundle) => {
    setEditingBundle(bundle);
    setNewBundleName(bundle.name);
    setSelectedForBundle(bundle.assessmentIds);
    setBundleDialogOpen(true);
  };
  
  const saveBundle = () => {
    if (!newBundleName.trim() || selectedForBundle.length === 0) return;
    
    if (editingBundle) {
      setCustomBundles(prev => prev.map(b => 
        b.id === editingBundle.id 
          ? { ...b, name: newBundleName.trim(), assessmentIds: selectedForBundle }
          : b
      ));
    } else {
      const newBundle: CustomBundle = {
        id: `custom-${Date.now()}`,
        name: newBundleName.trim(),
        assessmentIds: selectedForBundle,
        createdAt: new Date(),
      };
      setCustomBundles(prev => [...prev, newBundle]);
    }
    
    setBundleDialogOpen(false);
    setNewBundleName('');
    setSelectedForBundle([]);
    setEditingBundle(null);
  };
  
  const deleteBundle = (bundleId: string) => {
    setCustomBundles(prev => prev.filter(b => b.id !== bundleId));
  };
  
  const toggleAssessmentForBundle = (assessmentId: string) => {
    setSelectedForBundle(prev =>
      prev.includes(assessmentId)
        ? prev.filter(id => id !== assessmentId)
        : [...prev, assessmentId]
    );
  };
  
  const getBundleTotal = (assessmentIds: string[]) => {
    return assessmentIds.reduce((sum, id) => {
      const assessment = assessments.find(a => a.id === id);
      return sum + (assessment?.price || 0);
    }, 0);
  };
  
  // Filtered roles
  const filteredRoles = roles.filter(role => {
    const matchesSearch = roleSearchQuery === '' || 
      role.position.title.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      role.position.location.toLowerCase().includes(roleSearchQuery.toLowerCase());
    const matchesFilter = roleFilter === 'all' || role.status === roleFilter;
    return matchesSearch && matchesFilter;
  });
  
  const formatCandidateStatus = (status: string) => {
    switch(status) {
      case 'in_progress': return 'In Progress';
      case 'invited': return 'Invited';
      case 'completed': return 'Completed';
      case 'expired': return 'Expired';
      default: return status;
    }
  };
  
  const formatRoleStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 h-screen sticky top-0 bg-card border-r border-border p-6 hidden lg:flex flex-col relative">
          <Link to="/" className="flex items-center mb-8 px-4">
            <img src={logoDark} alt="HRM8" className="h-10" />
          </Link>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'roles'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Roles
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'assessments'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Assessments
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'addons'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Package className="h-4 w-4" />
              Services
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'candidates'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              Candidates
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4" />
              Reports
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'billing'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'team'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <UserCog className="h-4 w-4" />
              Team
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
          </nav>

          <div className="absolute bottom-6 left-6 right-6 space-y-1">
            <button
              onClick={() => {
                setActiveTab('settings');
                setSettingsSubTab('credits');
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                creditBalance === 0
                  ? 'bg-gradient-to-r from-primary/15 to-primary/10 border-primary/30 text-primary hover:from-primary/20 hover:to-primary/15'
                  : creditBalance < 10
                  ? 'bg-gradient-to-r from-warning/15 to-warning/10 border-warning/30 text-warning hover:from-warning/20 hover:to-warning/15'
                  : 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-foreground hover:from-primary/15 hover:to-primary/10 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${
                  creditBalance === 0 || creditBalance >= 10 ? 'bg-primary/20' : 'bg-warning/20'
                }`}>
                  <Coins className={`h-4 w-4 ${
                    creditBalance === 0 || creditBalance >= 10 ? 'text-primary' : 'text-warning'
                  }`} />
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      creditBalance < 10 && creditBalance > 0
                        ? 'bg-warning text-white' 
                        : 'bg-primary text-white'
                    }`}>
                      {creditBalance}
                    </span>
                    <span>Credits</span>
                  </div>
              </div>
              {creditBalance > 0 && creditBalance < 10 && (
                <AlertCircle className="h-4 w-4" />
              )}
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>
            <button
                onClick={async (e) => {
                    e.stopPropagation();
                    try {
                        const res = await apiClient.addTestCredits();
                        if (res.success && res.data) {
                            setCreditBalance((prev: number) => prev + 10);
                            toast.success('Added 10 test credits');
                        } else {
                             toast.error('Failed to add credits');
                        }
                    } catch (err) {
                        toast.error('Failed to add credits');
                    }
                }}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors justify-center border border-dashed border-muted-foreground/20"
            >
                <Plus className="h-3 w-3" />
                Add Test Credits
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setSettingsSubTab('company');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'roles' && 'Roles'}
                {activeTab === 'assessments' && 'Assessments'}
                {activeTab === 'candidates' && 'Candidates'}
                {activeTab === 'reports' && 'Reports'}
                {activeTab === 'billing' && 'Billing'}
                {activeTab === 'team' && 'Team Management'}
                {activeTab === 'addons' && 'Services'}
                {activeTab === 'settings' && 'Account Settings'}
                {activeTab === 'profile' && 'My Profile'}
              </h1>
              <p className="text-muted-foreground">
                {activeTab === 'assessments' 
                  ? 'Browse assessments, mark favourites, and create custom bundles.'
                  : activeTab === 'billing'
                  ? 'View your billing history, invoices, and payment details.'
                  : activeTab === 'team'
                  ? 'Manage team members, roles, and permissions.'
                  : activeTab === 'addons'
                  ? 'Extend your hiring toolkit with upcoming services.'
                  : activeTab === 'profile'
                  ? 'Manage your personal information and account settings.'
                  : 'Welcome back! Here\'s what\'s happening with your assessments.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleUpgradeToAts} disabled={isUpgradingToAts}>
                {isUpgradingToAts ? 'Starting Upgrade...' : 'Upgrade to Full ATS'}
              </Button>
              {activeTab === 'assessments' ? (
                <Button variant="hero" onClick={() => openCreateBundleDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bundle
                </Button>
              ) : activeTab === 'profile' || activeTab === 'addons' ? null : (
                <Link to="/wizard">
                  <Button variant="hero">
                    <Plus className="h-4 w-4 mr-2" />
                    New Assessment
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <>
              {/* Period Filter */}
              <div className="mb-6">
                <FilterButtonGroup
                  options={[
                    { value: '7d', label: '7 days' },
                    { value: '30d', label: '30 days' },
                    { value: '90d', label: '90 days' },
                    { value: '12m', label: '12 months' },
                    { value: 'all', label: 'All time' },
                  ]}
                  value={dashboardPeriod}
                  onValueChange={setDashboardPeriod}
                />
              </div>

              {/* Assessments Overview */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Assessments Overview</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('roles')} className="gap-1">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Role Progress Cards */}
                  <div className="lg:col-span-1 flex flex-col gap-3 h-full">
                    {(() => {
                      const assessmentRoles = [
                        { icon: Monitor, title: 'Software Engineer', ordered: 20, inProgress: 5, completed: 12 },
                        { icon: Target, title: 'Product Manager', ordered: 10, inProgress: 2, completed: 6 },
                        { icon: BarChart3, title: 'Data Analyst', ordered: 15, inProgress: 4, completed: 9 },
                        { icon: Palette, title: 'UX Designer', ordered: 8, inProgress: 1, completed: 5 },
                        { icon: Users, title: 'Sales Representative', ordered: 12, inProgress: 3, completed: 8 },
                      ];
                      return (
                        <>
                          {assessmentRoles.map((item) => {
                      const pct = Math.round((item.completed / item.ordered) * 100);
                      const isSelected = selectedAssessmentRole === item.title;
                      return (
                        <div
                          key={item.title}
                          onClick={() => { setSelectedAssessmentRole(prev => prev === item.title ? null : item.title); setAssessmentPage(1); }}
                          className={`flex-1 bg-card rounded-xl border p-4 cursor-pointer transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs mb-3">
                            <span className="text-muted-foreground">{item.ordered} Ordered</span>
                            <span className="text-amber-500">{item.inProgress} In Progress</span>
                            <span className="text-emerald-500">{item.completed} Completed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground shrink-0">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                        </>
                      );
                    })()}
                  </div>

                  {/* Right Column - Recent Assessment Orders */}
                  <div className="lg:col-span-2">
                    <div className="bg-card rounded-xl border border-border p-6 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-foreground">Recent Assessment Orders</h2>
                          {selectedAssessmentRole && (
                            <Badge
                              variant="secondary"
                              className="cursor-pointer gap-1"
                              onClick={() => { setSelectedAssessmentRole(null); setAssessmentPage(1); }}
                            >
                              {selectedAssessmentRole}
                              <X className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        {selectedAssessmentRole && (
                          <button
                            onClick={() => { setSelectedAssessmentRole(null); setAssessmentPage(1); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Show all roles"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto flex-1">
                        {(() => {
                          const filtered = recentOrders.filter(o => !selectedAssessmentRole || o.role === selectedAssessmentRole);
                          const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
                          const safePage = Math.min(assessmentPage, totalPages);
                          const start = (safePage - 1) * ROWS_PER_PAGE;
                          const paginated = filtered.slice(start, start + ROWS_PER_PAGE);
                          return (
                            <>
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Role</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Candidate</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Date</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paginated.map((order) => (
                                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                      <td className="py-2 px-4 text-sm text-foreground">{order.role}</td>
                                      <td className="py-2 px-4 text-sm text-muted-foreground">{order.candidateName}</td>
                                      <td className="py-2 px-4 text-sm text-muted-foreground">{order.date}</td>
                                      <td className="py-2 px-4">
                                        <Badge className={statusColors[order.status]}>{order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                                      </td>
                                      <td className="py-2 px-4 text-right">
                                        <Button variant="ghost" size="sm">
                                          View
                                          <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                <span className="text-sm text-muted-foreground">
                                  Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + ROWS_PER_PAGE, filtered.length)} of {filtered.length}
                                </span>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setAssessmentPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" /> Previous
                                  </Button>
                                  <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setAssessmentPage(p => p + 1)}>
                                    Next <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add-ons Activity */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Services Activity</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('addons')} className="gap-1">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Activity Cards */}
                  <div className="lg:col-span-1 flex flex-col gap-3 h-full">
                    {(() => {
                      const addonServices = [
                        { icon: Video, title: 'AI Video Interviews', ordered: 12, inProgress: 4, completed: 8 },
                        { icon: UserCog, title: 'Reference Checks', ordered: 8, inProgress: 2, completed: 6 },
                        { icon: ShieldCheck, title: 'Identity Verification', ordered: 15, inProgress: 3, completed: 12 },
                        { icon: GraduationCap, title: 'Qualification Verification', ordered: 6, inProgress: 1, completed: 5 },
                        { icon: Fingerprint, title: 'Criminal Record Check', ordered: 10, inProgress: 3, completed: 7 },
                      ];
                      return (
                        <>
                          {addonServices.map((item) => {
                      const pct = Math.round((item.completed / item.ordered) * 100);
                      const isSelected = selectedAddonType === item.title;
                      return (
                        <div
                          key={item.title}
                          onClick={() => { setSelectedAddonType(prev => prev === item.title ? null : item.title); setAddonPage(1); }}
                          className={`flex-1 bg-card rounded-xl border p-4 cursor-pointer transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs mb-3">
                            <span className="text-muted-foreground">{item.ordered} Ordered</span>
                            <span className="text-amber-500">{item.inProgress} In Progress</span>
                            <span className="text-emerald-500">{item.completed} Completed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground shrink-0">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                        </>
                      );
                    })()}
                  </div>

                  {/* Right Column - Recent Add-on Orders */}
                  <div className="lg:col-span-2">
                    <div className="bg-card rounded-xl border border-border p-6 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-foreground">Recent Add-on Orders</h2>
                          {selectedAddonType && (
                            <Badge
                              variant="secondary"
                              className="cursor-pointer gap-1"
                              onClick={() => { setSelectedAddonType(null); setAddonPage(1); }}
                            >
                              {selectedAddonType}
                              <X className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        {selectedAddonType && (
                          <button
                            onClick={() => { setSelectedAddonType(null); setAddonPage(1); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Show all services"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto flex-1">
                        {(() => {
                          const addonOrders = [
                            { id: 'AO-001', service: 'AI Video Interviews', candidate: 'Sarah Chen', date: '2024-01-15', status: 'completed' },
                            { id: 'AO-002', service: 'Reference Checks', candidate: 'Mike Johnson', date: '2024-01-14', status: 'in_progress' },
                            { id: 'AO-003', service: 'Identity Verification', candidate: 'Emma Wilson', date: '2024-01-14', status: 'completed' },
                            { id: 'AO-004', service: 'Criminal Record Check', candidate: 'James Brown', date: '2024-01-13', status: 'pending' },
                            { id: 'AO-005', service: 'Qualification Verification', candidate: 'Lisa Park', date: '2024-01-12', status: 'completed' },
                            { id: 'AO-006', service: 'AI Video Interviews', candidate: 'Tom Harris', date: '2024-01-11', status: 'completed' },
                            { id: 'AO-007', service: 'Reference Checks', candidate: 'Amy Zhang', date: '2024-01-10', status: 'completed' },
                            { id: 'AO-008', service: 'Identity Verification', candidate: 'Chris Palmer', date: '2024-01-09', status: 'in_progress' },
                            { id: 'AO-009', service: 'Criminal Record Check', candidate: 'Diana Ross', date: '2024-01-08', status: 'completed' },
                            { id: 'AO-010', service: 'AI Video Interviews', candidate: 'Kevin Nguyen', date: '2024-01-07', status: 'pending' },
                            { id: 'AO-011', service: 'Qualification Verification', candidate: 'Rachel Martinez', date: '2024-01-06', status: 'completed' },
                            { id: 'AO-012', service: 'Identity Verification', candidate: 'David Brown', date: '2024-01-05', status: 'completed' },
                          ];
                          const filtered = addonOrders.filter(o => !selectedAddonType || o.service === selectedAddonType);
                          const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
                          const safePage = Math.min(addonPage, totalPages);
                          const start = (safePage - 1) * ROWS_PER_PAGE;
                          const paginated = filtered.slice(start, start + ROWS_PER_PAGE);
                          return (
                            <>
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Service</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Candidate</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Date</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paginated.map((order) => (
                                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                      <td className="py-2 px-4 text-sm text-foreground">{order.service}</td>
                                      <td className="py-2 px-4 text-sm text-muted-foreground">{order.candidate}</td>
                                      <td className="py-2 px-4 text-sm text-muted-foreground">{order.date}</td>
                                      <td className="py-2 px-4">
                                        <Badge className={statusColors[order.status]}>{order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                                      </td>
                                      <td className="py-2 px-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('addons')}>
                                          View
                                          <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                <span className="text-sm text-muted-foreground">
                                  Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + ROWS_PER_PAGE, filtered.length)} of {filtered.length}
                                </span>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setAddonPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" /> Previous
                                  </Button>
                                  <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setAddonPage(p => p + 1)}>
                                    Next <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'roles' && (
            <>
              {selectedRole ? (
                // Role Detail View
                <div className="space-y-6">
                  {/* Back button and header */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRole(null)}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Roles
                    </Button>
                  </div>
                  
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-bold text-foreground">
                            {selectedRole.position.title}
                          </h2>
                          <Badge className={roleStatusColors[selectedRole.status]}>
                            {formatRoleStatus(selectedRole.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {selectedRole.position.location}
                          </span>
                          <span className="capitalize">{selectedRole.position.employmentType}</span>
                          <span className="capitalize">{selectedRole.position.seniority} Level</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="hero" size="sm" onClick={() => setAddCandidateDialogOpen(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Candidates
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.location.href = `/wizard?existingJobId=${selectedRole.id}&step=4`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Assessment
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover">
                            {selectedRole.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleRoleStatusChange(selectedRole.id, 'active')}>
                                <Play className="h-4 w-4 mr-2" />
                                Mark as Active
                              </DropdownMenuItem>
                            )}
                            {selectedRole.status !== 'completed' && (
                              <DropdownMenuItem onClick={() => handleRoleStatusChange(selectedRole.id, 'completed')}>
                                <CircleCheck className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            {selectedRole.status !== 'archived' && (
                              <DropdownMenuItem onClick={() => handleRoleStatusChange(selectedRole.id, 'archived')}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive Role
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {/* Sub-tabs */}
                    <Tabs value={roleDetailTab} onValueChange={(v) => setRoleDetailTab(v as any)} className="mt-6">
                      <TabsList>
                        <TabsTrigger value="candidates">
                          Candidates
                          <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                            {selectedRole.candidates.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pipeline">
                          Pipeline
                        </TabsTrigger>
                        <TabsTrigger value="assessments">
                          Assessments
                          <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                            {selectedRole.assessments.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="services">Services</TabsTrigger>
                        <TabsTrigger value="results">Results</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="candidates" className="mt-4">
                        {/* Bulk Actions Bar */}
                        {selectedRoleCandidateIds.size > 0 && (
                          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">
                                {selectedRoleCandidateIds.size} candidate{selectedRoleCandidateIds.size > 1 ? 's' : ''} selected
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearRoleCandidateSelection}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Clear selection
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleBulkDownloadRoleCandidates}
                                disabled={selectedRoleCandidatesWithCompletedAssessments.length === 0}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Reports ({totalCompletedReportsInRoleSelection})
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="py-3 px-4 w-10">
                                  <Checkbox
                                    checked={!!allRoleCandidatesSelected}
                                    onCheckedChange={toggleAllRoleCandidates}
                                    aria-label="Select all candidates"
                                  />
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                  <SortableHeader 
                                    field="name" 
                                    label="Candidate" 
                                    currentField={sortField}
                                    currentDirection={sortDirection}
                                    onSort={handleSort}
                                  />
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                  <SortableHeader 
                                    field="status" 
                                    label="Status" 
                                    currentField={sortField}
                                    currentDirection={sortDirection}
                                    onSort={handleSort}
                                  />
                                </th>
                                {/* Assessments column header - spans the grid content */}
                                <th colSpan={7} className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                  <div className="grid items-center gap-2" style={{ gridTemplateColumns: '20px auto 1fr 72px 72px 28px 28px' }}>
                                    <span></span>
                                    <span>Type</span>
                                    <span>Assessment</span>
                                    <span className="text-center">
                                      <SortableHeader 
                                        field="assigned" 
                                        label="Assigned" 
                                        currentField={sortField}
                                        currentDirection={sortDirection}
                                        onSort={handleSort}
                                        className="justify-center text-xs"
                                      />
                                    </span>
                                    <span className="text-center">
                                      <SortableHeader 
                                        field="done" 
                                        label="Done" 
                                        currentField={sortField}
                                        currentDirection={sortDirection}
                                        onSort={handleSort}
                                        className="justify-center text-xs"
                                      />
                                    </span>
                                    <span className="text-center">View</span>
                                    <span className="text-center">DL</span>
                                  </div>
                                </th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                let candidates = [...selectedRole.candidates];
                                if (sortField) {
                                  candidates.sort((a, b) => {
                                    let comparison = 0;
                                    switch (sortField) {
                                      case 'name':
                                        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                                        break;
                                      case 'status':
                                        comparison = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
                                        break;
                                      case 'assigned':
                                        const aAssigned = getEarliestAssignedDate(a.assessmentResults);
                                        const bAssigned = getEarliestAssignedDate(b.assessmentResults);
                                        comparison = (aAssigned?.getTime() || 0) - (bAssigned?.getTime() || 0);
                                        break;
                                      case 'done':
                                        const aDone = getLatestCompletedDate(a.assessmentResults);
                                        const bDone = getLatestCompletedDate(b.assessmentResults);
                                        comparison = (aDone?.getTime() || 0) - (bDone?.getTime() || 0);
                                        break;
                                    }
                                    return sortDirection === 'desc' ? -comparison : comparison;
                                  });
                                }
                                return candidates;
                              })().map((candidate) => (
                                <tr key={candidate.id} className="border-b border-border last:border-0 hover:bg-muted/50 align-top">
                                  <td className="py-4 px-4">
                                    <Checkbox
                                      checked={selectedRoleCandidateIds.has(candidate.id)}
                                      onCheckedChange={() => toggleRoleCandidateSelection(candidate.id)}
                                      aria-label={`Select ${candidate.firstName} ${candidate.lastName}`}
                                    />
                                  </td>
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">
                                        {candidate.firstName} {candidate.lastName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{candidate.email}</p>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <Badge className={statusColors[candidate.status]}>
                                      {formatCandidateStatus(candidate.status)}
                                    </Badge>
                                  </td>
                                  <td colSpan={7} className="py-4 px-4">
                                    <CandidateAssessmentsList 
                                      assessmentResults={candidate.assessmentResults}
                                      showHeaders={false}
                                    />
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 bg-popover">
                                        {candidate.status === 'invited' && (
                                          <DropdownMenuItem onClick={() => handleResendInvitation(candidate, selectedRole?.id)}>
                                            <Send className="h-4 w-4 mr-2" />
                                            Resend Invitation
                                          </DropdownMenuItem>
                                        )}
                                        {candidate.status === 'in_progress' && (
                                          <DropdownMenuItem onClick={() => handleSendReminder(candidate)}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Send Reminder
                                          </DropdownMenuItem>
                                        )}
                                        {candidate.status === 'completed' && (
                                          <DropdownMenuItem onClick={() => handleDownloadAllReports(candidate)}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download All Reports
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => openAssignDialog(candidate, selectedRole.id, selectedRole.position.title)}>
                                          <ClipboardPlus className="h-4 w-4 mr-2" />
                                          Assign Assessments
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openAssignAddOnDialog(candidate, selectedRole.id, selectedRole.position.title)}>
                                          <ShieldCheck className="h-4 w-4 mr-2" />
                                          Assign Services
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleRemoveFromRole(candidate.id, selectedRole.id)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <UserMinus className="h-4 w-4 mr-2" />
                                          Remove from Role
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                      
                      {/* Pipeline View Tab */}
                      <TabsContent value="pipeline" className="mt-4">
                        <PipelineView
                          jobId={selectedRole.id}
                          candidates={selectedRole.candidates.map(c => ({
                            ...c,
                            stage: (c.stage || 'NEW_APPLICATION') as any,
                          }))}
                          // Sort assessments by order/index implicitly or just mapped order
                          rounds={selectedRole.assessments.map(a => ({ id: a.id, name: a.name }))}
                          onCandidateClick={(candidate) => {
                            setSelectedCandidateForDrawer(candidate);
                            setCandidateDrawerOpen(true);
                          }}
                          onCandidateMove={(candidateId, newStage) => {
                            // Update local state when candidate is moved
                            setRoles(prev => {
                              const newRoles = prev.map(role => {
                                if (role.id !== selectedRole.id) return role;
                                return {
                                  ...role,
                                  candidates: role.candidates.map(c => {
                                    if (c.id !== candidateId) return c;
                                    
                                    // Update stage and map to status
                                    let newStatus: RoleCandidateStatus = c.status;
                                    
                                    // Map PipelineStage to RoleCandidateStatus
                                    if (newStage === 'OFFER_ACCEPTED') newStatus = 'completed';
                                    else if (newStage === 'REJECTED') newStatus = 'expired';
                                    else if (['TECHNICAL_INTERVIEW', 'ONSITE_INTERVIEW', 'OFFER_EXTENDED', 'RESUME_REVIEW'].includes(newStage)) {
                                      newStatus = 'in_progress';
                                    }
                                    
                                    return { ...c, stage: newStage, status: newStatus };
                                  }),
                                };
                              });
                              
                              // Also update selectedRole to avoid stale data
                              const updatedSelectedRole = newRoles.find(r => r.id === selectedRole.id);
                              if (updatedSelectedRole) {
                                setSelectedRole(updatedSelectedRole);
                              }
                              
                              return newRoles;
                            });
                            
                            // Optimistically update credit balance
                            setCreditBalance(prev => Math.max(0, prev - 1));
                          }}
                        />
                      </TabsContent>
                      
                      <TabsContent value="assessments" className="mt-4">
                        <div className="space-y-3">
                          {selectedRole.assessments.map((assessment) => (
                            <div 
                              key={assessment.id} 
                              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => {
                                setSelectedAssessmentForReview({ id: assessment.id, name: assessment.name });
                                setAssessmentReviewDrawerOpen(true);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={`${categoryColors[assessment.category]} text-xs`}>
                                  {assessment.category}
                                </Badge>
                                <div>
                                  <p className="font-medium text-foreground hover:underline">{assessment.name}</p>
                                  <p className="text-sm text-muted-foreground">{assessment.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {assessment.duration} min
                                </span>
                                <div>
                                  <span className="font-semibold text-foreground">${assessment.price}</span>
                                  <div className="text-xs text-muted-foreground/60">({assessment.creditCost} credits)</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      {/* Services Tab */}
                      <TabsContent value="services" className="mt-4">
                        <div className="space-y-3">
                          {(() => {
                            // Collect all add-on results across candidates for this role
                            const allAddOnRows = selectedRole.candidates.flatMap(candidate =>
                              (candidate.addOnResults || []).map(result => ({
                                candidate,
                                result,
                              }))
                            );
                            
                            if (allAddOnRows.length === 0) {
                              return (
                                <div className="text-center py-12 text-muted-foreground">
                                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
                                  <h3 className="text-lg font-semibold text-foreground mb-2">No Services Assigned</h3>
                                  <p className="text-sm">Assign services to candidates from the Candidates tab dropdown menu.</p>
                                </div>
                              );
                            }

                            const addOnStatusColors: Record<string, string> = {
                              completed: 'bg-success/10 text-success border-success/20',
                              in_progress: 'bg-warning/10 text-warning border-warning/20',
                              pending: 'bg-muted text-muted-foreground border-muted',
                              failed: 'bg-destructive/10 text-destructive border-destructive/20',
                            };

                            return (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-border">
                                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Candidate</th>
                                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service</th>
                                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Requested</th>
                                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Result</th>
                                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {allAddOnRows.map((row, idx) => (
                                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50">
                                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                                          {row.candidate.firstName} {row.candidate.lastName}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-foreground">{row.result.addOnName}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                          {format(new Date(row.result.requestedAt), 'PP')}
                                        </td>
                                        <td className="py-3 px-4">
                                          <Badge className={addOnStatusColors[row.result.status] || ''}>
                                            {row.result.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                          </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                          {row.result.result || '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                          {row.result.reportUrl ? (
                                            <Button variant="ghost" size="sm">
                                              <Download className="h-4 w-4 mr-1" />
                                              Report
                                            </Button>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </div>
                      </TabsContent>

                      <TabsContent value="results" className="mt-4">
                        <RoleResultsView role={selectedRole} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              ) : (
                // Role List View
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search roles..."
                        value={roleSearchQuery}
                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <FilterButtonGroup
                      options={[
                        { value: 'all', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'archived', label: 'Archived' },
                      ]}
                      value={roleFilter}
                      onValueChange={(v) => setRoleFilter(v as any)}
                    />
                  </div>
                  
                  {/* Role Cards */}
                  <div className="space-y-4">
                    {filteredRoles.length === 0 ? (
                      <div className="bg-card rounded-xl border border-border p-12 text-center">
                        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Roles Found</h3>
                        <p className="text-muted-foreground mb-4">
                          {roleSearchQuery || roleFilter !== 'all' 
                            ? 'Try adjusting your search or filters.'
                            : 'Start a new assessment to create your first role.'}
                        </p>
                        <Link to="/wizard">
                          <Button variant="hero">
                            <Plus className="h-4 w-4 mr-2" />
                            Start New Assessment
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      filteredRoles.map((role) => {
                        const candidateStats = getRoleCandidateStats(role);
                        
                        return (
                          <div 
                            key={role.id} 
                            className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedRole(role)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <Briefcase className="h-5 w-5 text-primary" />
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {role.position.title}
                                  </h3>
                                  <Badge className={roleStatusColors[role.status]}>
                                    {formatRoleStatus(role.status)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground ml-8">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {role.position.location}
                                  </span>
                                  <span className="capitalize">{role.position.employmentType}</span>
                                  <span className="capitalize">{role.position.seniority} Level</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-popover">
                                    {role.status !== 'active' && (
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleRoleStatusChange(role.id, 'active');
                                      }}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Mark as Active
                                      </DropdownMenuItem>
                                    )}
                                    {role.status !== 'completed' && (
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleRoleStatusChange(role.id, 'completed');
                                      }}>
                                        <CircleCheck className="h-4 w-4 mr-2" />
                                        Mark as Completed
                                      </DropdownMenuItem>
                                    )}
                                    {role.status !== 'archived' && (
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleRoleStatusChange(role.id, 'archived');
                                      }}>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive Role
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRole(role);
                                  }}
                                >
                                  View Details
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Candidate Progress */}
                            <div className="flex items-center gap-6 mb-4 ml-8">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  {candidateStats.total} Candidate{candidateStats.total !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {candidateStats.completed > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                  <span className="text-sm text-muted-foreground">
                                    {candidateStats.completed} Completed
                                  </span>
                                </div>
                              )}
                              {candidateStats.inProgress > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-warning" />
                                  <span className="text-sm text-muted-foreground">
                                    {candidateStats.inProgress} In Progress
                                  </span>
                                </div>
                              )}
                              {candidateStats.invited > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <AlertCircle className="h-4 w-4 text-info" />
                                  <span className="text-sm text-muted-foreground">
                                    {candidateStats.invited} Invited
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Assessments */}
                            <div className="flex items-center gap-2 ml-8">
                              <ClipboardList className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {role.assessments.length} Assessment{role.assessments.length !== 1 ? 's' : ''}:
                              </span>
                              <div className="flex items-center gap-1.5">
                                {role.assessments.slice(0, 3).map((assessment) => (
                                  <Badge 
                                    key={assessment.id} 
                                    variant="outline" 
                                    className={`${categoryColors[assessment.category]} text-xs`}
                                  >
                                    {assessment.name}
                                  </Badge>
                                ))}
                                {role.assessments.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{role.assessments.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'assessments' && (
            <Tabs defaultValue="all" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <TabsList>
                  <TabsTrigger value="bundles">
                    My Bundles
                    {customBundles.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {customBundles.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="all">All Assessments</TabsTrigger>
                  <TabsTrigger value="favourites">
                    Favourites
                    {favourites.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {favourites.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assessments..."
                      value={assessmentSearch}
                      onChange={(e) => setAssessmentSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <FilterButtonGroup
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'skills', label: 'Skills' },
                      { value: 'behavioural', label: 'Behavioural' },
                      { value: 'aptitude', label: 'Aptitude' },
                    ]}
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  />
                </div>
              </div>
              
              <TabsContent value="bundles" className="space-y-6">
                {/* Standard Bundles Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Standard Bundles</h3>
                    <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                      Discounted
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pre-configured assessment packages with built-in savings.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {standardBundles.map((bundle) => {
                      const bundleAssessments = getBundleAssessments(bundle) as Assessment[];
                      
                      return (
                        <div key={bundle.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {bundle.popular && (
                                <Badge className="bg-success text-success-foreground text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                              Save {bundle.savingsPercent}%
                            </Badge>
                          </div>
                          
                          <h4 className="font-semibold text-foreground mb-1">{bundle.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {bundle.description}
                          </p>
                          
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xl font-bold text-foreground">${bundle.bundlePrice}</span>
                            <span className="text-sm text-muted-foreground line-through">${bundle.originalPrice}</span>
                          </div>
                          <div className="text-xs text-muted-foreground/60 mb-3">({bundle.creditCost} credits)</div>
                          
                          <div className="space-y-1.5 mb-4">
                            {bundleAssessments.slice(0, 3).map((assessment) => (
                              <div key={assessment.id} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className={`${categoryColors[assessment.category]} text-xs`}>
                                  {assessment.category}
                                </Badge>
                                <span className="text-muted-foreground truncate">{assessment.name}</span>
                              </div>
                            ))}
                            {bundleAssessments.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{bundleAssessments.length - 3} more
                              </p>
                            )}
                          </div>
                          
                          {bundle.bestFor && bundle.bestFor.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {bundle.bestFor.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs text-muted-foreground">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <Button variant="hero" size="sm" className="w-full" asChild>
                            <Link to="/wizard">
                              Use in Assessment
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* My Bundles Section */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">My Bundles</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openCreateBundleDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Bundle
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your custom assessment combinations for reuse.
                  </p>
                  
                  {customBundles.length === 0 ? (
                    <div className="bg-muted/50 rounded-lg border border-dashed border-border p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No custom bundles yet. Create one to save your favorite assessment combinations.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {customBundles.map((bundle) => {
                        const bundleAssessments = bundle.assessmentIds
                          .map(id => assessments.find(a => a.id === id))
                          .filter(Boolean) as Assessment[];
                        const total = getBundleTotal(bundle.assessmentIds);
                        
                        return (
                          <div key={bundle.id} className="bg-card rounded-xl border border-border p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-foreground">{bundle.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {bundle.assessmentIds.length} assessment{bundle.assessmentIds.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className="text-lg font-bold text-foreground">${total}</span>
                            </div>
                            
                            <div className="space-y-1.5 mb-4">
                              {bundleAssessments.slice(0, 3).map((assessment) => (
                                <div key={assessment.id} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className={`${categoryColors[assessment.category]} text-xs`}>
                                    {assessment.category}
                                  </Badge>
                                  <span className="text-muted-foreground truncate">{assessment.name}</span>
                                </div>
                              ))}
                              {bundleAssessments.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{bundleAssessments.length - 3} more
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => openEditBundleDialog(bundle)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteBundle(bundle.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4">
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="divide-y divide-border">
                    {filteredAssessments.map((assessment) => (
                      <div key={assessment.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                onClick={() => toggleFavourite(assessment.id)}
                                className="text-muted-foreground hover:text-warning transition-colors"
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    favourites.includes(assessment.id)
                                      ? 'fill-warning text-warning'
                                      : ''
                                  }`}
                                />
                              </button>
                              <h3 className="font-medium text-foreground">{assessment.name}</h3>
                              <Badge variant="outline" className={`${categoryColors[assessment.category]} text-xs`}>
                                {assessment.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {assessment.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {assessment.duration} min
                              </div>
                              <span className="font-semibold text-foreground">${assessment.price}</span>
                              <div className="text-xs text-muted-foreground/60">({assessment.creditCost} credits)</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCreateBundleDialog([assessment.id])}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add to Bundle
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="favourites" className="space-y-4">
                {favourites.length === 0 ? (
                  <div className="bg-card rounded-xl border border-border p-12 text-center">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Favourites Yet</h3>
                    <p className="text-muted-foreground">
                      Click the star icon on any assessment to add it to your favourites.
                    </p>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="divide-y divide-border">
                      {favourites.map((favId) => {
                        const assessment = assessments.find(a => a.id === favId);
                        if (!assessment) return null;
                        
                        return (
                          <div key={assessment.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <button
                                    onClick={() => toggleFavourite(assessment.id)}
                                    className="text-warning"
                                  >
                                    <Star className="h-4 w-4 fill-warning" />
                                  </button>
                                  <h3 className="font-medium text-foreground">{assessment.name}</h3>
                                  <Badge variant="outline" className={`${categoryColors[assessment.category]} text-xs`}>
                                    {assessment.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {assessment.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {assessment.duration} min
                                  </div>
                                  <span className="font-semibold text-foreground">${assessment.price}</span>
                                  <div className="text-xs text-muted-foreground/60">({assessment.creditCost} credits)</div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openCreateBundleDialog([assessment.id])}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Add to Bundle
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {activeTab === 'candidates' && (
            <div className="bg-card rounded-xl border border-border p-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions Bar */}
              {selectedCandidateIds.size > 0 && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {selectedCandidateIds.size} candidate{selectedCandidateIds.size > 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Clear selection
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkDownload}
                      disabled={selectedCandidatesWithCompletedAssessments.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Reports ({totalCompletedReportsInSelection})
                    </Button>
                  </div>
                </div>
              )}

              {/* Candidates Table or Empty State */}
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No candidates found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Add candidates to your roles to start tracking their assessments.'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('roles')}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Roles
                  </Button>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 w-10">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={toggleAllCandidates}
                          aria-label="Select all candidates"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        <SortableHeader 
                          field="name" 
                          label="Candidate" 
                          currentField={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        <SortableHeader 
                          field="role" 
                          label="Role" 
                          currentField={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        <SortableHeader 
                          field="status" 
                          label="Status" 
                          currentField={sortField}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </th>
                      {/* Assessments column header - spans the grid content */}
                      <th colSpan={7} className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        <div className="grid items-center gap-2" style={{ gridTemplateColumns: '20px auto 1fr 72px 72px 28px 28px' }}>
                          <span></span>
                          <span>Type</span>
                          <span>Assessment</span>
                          <span className="text-center">
                            <SortableHeader 
                              field="assigned" 
                              label="Assigned" 
                              currentField={sortField}
                              currentDirection={sortDirection}
                              onSort={handleSort}
                              className="justify-center text-xs"
                            />
                          </span>
                          <span className="text-center">
                            <SortableHeader 
                              field="done" 
                              label="Done" 
                              currentField={sortField}
                              currentDirection={sortDirection}
                              onSort={handleSort}
                              className="justify-center text-xs"
                            />
                          </span>
                          <span className="text-center">View</span>
                          <span className="text-center">DL</span>
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate) => (
                      <tr 
                        key={candidate.id} 
                        className={`border-b border-border last:border-0 hover:bg-muted/50 align-top ${
                          selectedCandidateIds.has(candidate.id) ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="py-4 px-4 w-10">
                          <Checkbox
                            checked={selectedCandidateIds.has(candidate.id)}
                            onCheckedChange={() => toggleCandidateSelection(candidate.id)}
                            aria-label={`Select ${candidate.firstName} ${candidate.lastName}`}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {candidate.firstName} {candidate.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button 
                            className="text-sm text-primary hover:underline"
                            onClick={() => {
                              const role = roles.find(r => r.id === candidate.roleId);
                              if (role) {
                                setSelectedRole(role);
                                setActiveTab('roles');
                              }
                            }}
                          >
                            {candidate.roleName}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={statusColors[candidate.status]}>
                            {formatCandidateStatus(candidate.status)}
                          </Badge>
                        </td>
                        <td colSpan={7} className="py-4 px-4">
                          <CandidateAssessmentsList 
                            assessmentResults={candidate.assessmentResults}
                            showHeaders={false}
                          />
                        </td>
                        <td className="py-4 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-popover">
                              {candidate.status === 'invited' && (
                                <DropdownMenuItem onClick={() => handleResendInvitation(candidate, selectedRole?.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Resend Invitation
                                </DropdownMenuItem>
                              )}
                              {candidate.status === 'in_progress' && (
                                <DropdownMenuItem onClick={() => handleSendReminder(candidate)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                              )}
                              {candidate.status === 'completed' && (
                                <DropdownMenuItem onClick={() => handleDownloadAllReports(candidate)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download All Reports
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openAssignDialog(candidate, candidate.roleId, candidate.roleName)}>
                                <ClipboardPlus className="h-4 w-4 mr-2" />
                                Assign Assessments
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAssignAddOnDialog(candidate, candidate.roleId, candidate.roleName)}>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Assign Services
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveFromRole(candidate.id, candidate.roleId)}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove from Role
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Reports Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Advanced analytics and reporting features are in development. View individual candidate reports in the Candidates tab.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('candidates')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Candidates
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Billing Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-success" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">${billingStats.totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Spent (YTD)</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">${billingStats.pendingAmount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{mockInvoices.length}</p>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      className="pl-10"
                      value={billingSearchQuery}
                      onChange={(e) => setBillingSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <FilterButtonGroup
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'overdue', label: 'Overdue' }
                    ]}
                    value={billingStatusFilter}
                    onValueChange={(v) => setBillingStatusFilter(v as 'all' | 'paid' | 'pending' | 'overdue')}
                  />
                  
                  {/* Date Range Filter */}
                  <Select value={billingDateRange} onValueChange={(v) => setBillingDateRange(v as typeof billingDateRange)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="12months">Last 12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Invoice Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-left text-sm text-muted-foreground">
                        <th className="py-3 px-4">
                          <SortableHeader 
                            field="date" 
                            label="Date" 
                            currentField={billingSortField as SortField}
                            currentDirection={billingSortDirection}
                            onSort={() => handleBillingSortChange('date')}
                          />
                        </th>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">
                          <SortableHeader 
                            field="amount" 
                            label="Amount" 
                            currentField={billingSortField as SortField}
                            currentDirection={billingSortDirection}
                            onSort={() => handleBillingSortChange('amount')}
                          />
                        </th>
                        <th className="py-3 px-4">
                          <SortableHeader 
                            field="status" 
                            label="Status" 
                            currentField={billingSortField as SortField}
                            currentDirection={billingSortDirection}
                            onSort={() => handleBillingSortChange('status')}
                          />
                        </th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            No invoices found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                            <td className="py-4 px-4 text-sm text-foreground">
                              {format(invoice.date, 'MMM d, yyyy')}
                            </td>
                            <td className="py-4 px-4 text-sm font-mono text-foreground">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="py-4 px-4 text-sm text-foreground">
                              {invoice.description}
                            </td>
                            <td className="py-4 px-4 text-sm font-medium text-foreground">
                              ${invoice.amount.toFixed(2)}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={invoiceStatusColors[invoice.status]}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setSelectedInvoice(invoice)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDownloadInvoice(invoice)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{usersStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{usersStats.active}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-warning" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{usersStats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Invites</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-purple-700" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{usersStats.admins}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>

              {/* Main Content Card */}
              <div className="bg-card rounded-xl border border-border p-6">
                {/* Header with Invite Button */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
                  <Button variant="hero" onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      className="pl-10"
                      value={usersSearchQuery}
                      onChange={(e) => setUsersSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <FilterButtonGroup
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'active', label: 'Active' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'deactivated', label: 'Deactivated' }
                    ]}
                    value={usersStatusFilter}
                    onValueChange={(v) => setUsersStatusFilter(v as 'all' | 'active' | 'pending' | 'deactivated')}
                  />
                  
                  {/* Role Filter Dropdown */}
                  <Select value={usersRoleFilter} onValueChange={(v) => setUsersRoleFilter(v as 'all' | UserRole)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                {filteredTeamMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No team members found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {usersSearchQuery || usersStatusFilter !== 'all' || usersRoleFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Invite team members to collaborate on assessments.'}
                    </p>
                    {!usersSearchQuery && usersStatusFilter === 'all' && usersRoleFilter === 'all' && (
                      <Button variant="hero" onClick={() => setInviteDialogOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite User
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left text-sm text-muted-foreground">
                          <th className="py-3 px-4">
                            <button
                              onClick={() => handleUsersSortChange('name')}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              Name
                              {usersSortField === 'name' ? (
                                usersSortDirection === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Position</th>
                          <th className="py-3 px-4">
                            <button
                              onClick={() => handleUsersSortChange('role')}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              Role
                              {usersSortField === 'role' ? (
                                usersSortDirection === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-4">
                            <button
                              onClick={() => handleUsersSortChange('status')}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              Status
                              {usersSortField === 'status' ? (
                                usersSortDirection === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-4">
                            <button
                              onClick={() => handleUsersSortChange('lastActive')}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              Last Active
                              {usersSortField === 'lastActive' ? (
                                usersSortDirection === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeamMembers.map((member) => (
                          <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                                  {member.firstName && member.lastName 
                                    ? `${member.firstName[0]}${member.lastName[0]}`
                                    : member.email[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {member.firstName && member.lastName 
                                      ? `${member.firstName} ${member.lastName}`
                                      : <span className="text-muted-foreground italic">Pending</span>}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {member.email}
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {member.phone && member.phoneCountryCode ? (
                                <span>
                                  {countryCodes.find(cc => cc.code === member.phoneCountryCode)?.flag || ''} {member.phoneCountryCode} {member.phone}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {member.positionTitle || <span className="text-muted-foreground/50">-</span>}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={userRoleColors[member.role]}>
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={userStatusColors[member.status]}>
                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {member.status === 'pending' 
                                ? member.invitedAt 
                                  ? `Invited ${format(member.invitedAt, 'MMM d, yyyy')}`
                                  : 'Pending'
                                : member.lastActiveAt 
                                  ? format(member.lastActiveAt, 'MMM d, yyyy')
                                  : '-'}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-popover">
                                  {member.status !== 'pending' && (
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedUser(member);
                                      setEditUserDialogOpen(true);
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Role
                                    </DropdownMenuItem>
                                  )}
                                  {member.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                                        <Send className="h-4 w-4 mr-2" />
                                        Resend Invitation
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCancelInvite(member.id)}>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Cancel Invitation
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {member.status === 'active' && (
                                    <DropdownMenuItem onClick={() => handleDeactivateUser(member.id)}>
                                      <UserMinus className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  )}
                                  {member.status === 'deactivated' && (
                                    <DropdownMenuItem onClick={() => handleReactivateUser(member.id)}>
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveUser(member.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'addons' && (
            <div className="space-y-8">
              {/* Overview Banner */}
              <div className="p-6 rounded-xl border border-border bg-muted/30">
                <p className="text-muted-foreground">
                  Complement your candidate assessments with AI video interviews, automated reference checks, identity verification, and more — all from one platform.
                </p>
              </div>

              {/* Service Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  {
                    icon: Video,
                    title: 'AI Video Interviews',
                    price: 29,
                    description: 'AI-powered asynchronous video interviews with automated analysis.',
                    features: ['Async candidate recording', 'AI-powered response analysis', 'Customisable question sets', 'Sentiment and confidence scoring'],
                  },
                  {
                    icon: UserCog,
                    title: 'Reference Checks',
                    price: 69,
                    description: 'Automated reference collection and verification.',
                    features: ['Automated referee outreach', 'Structured questionnaires', 'Fraud detection', 'Consolidated reports'],
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Identity Verification',
                    price: 39,
                    description: 'Verify candidate identity and right-to-work status.',
                    features: ['ID document verification', 'Right-to-work validation', 'Biometric matching', 'Global coverage'],
                  },
                  {
                    icon: GraduationCap,
                    title: 'Qualification Verification',
                    price: 49,
                    description: 'Confirm candidate qualifications and certifications.',
                    features: ['Qualification certificate checks', 'Professional licence validation', 'Education history verification', 'Accreditation confirmation'],
                  },
                  {
                    icon: Fingerprint,
                    title: 'Criminal Record Check',
                    price: 59,
                    description: 'Screen candidates with comprehensive criminal background checks.',
                    features: ['National police check', 'International record screening', 'Ongoing monitoring', 'Compliance-ready reports'],
                  },
                ].map((service) => (
                  <div key={service.title} className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <service.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold leading-none tracking-tight">{service.title}</h3>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-foreground">${service.price}</span>
                          <span className="text-sm text-muted-foreground">per candidate</span>
                        </div>
                        <span className="text-xs text-muted-foreground/60">({Math.ceil(service.price / 5)} credits)</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{service.description}</p>
                    </div>
                    <div className="p-6 pt-0 flex-1">
                      <ul className="space-y-2">
                        {service.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ChevronRightIcon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center p-6 pt-0">
                      <Button variant="default" className="w-full">
                        Get Started
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checks & Verifications Table */}
              {(() => {
                const addonChecks = [
                  { id: 'chk-1', candidateName: 'John Doe', candidateEmail: 'john.doe@email.com', checkType: 'Criminal Record Check', checkIcon: Fingerprint, role: 'Software Engineer', requestedDate: new Date('2025-01-12'), status: 'completed' as const, result: 'Clear' },
                  { id: 'chk-2', candidateName: 'John Doe', candidateEmail: 'john.doe@email.com', checkType: 'Identity Verification', checkIcon: ShieldCheck, role: 'Software Engineer', requestedDate: new Date('2025-01-13'), status: 'completed' as const, result: 'Verified' },
                  { id: 'chk-3', candidateName: 'Jane Smith', candidateEmail: 'jane.smith@email.com', checkType: 'Reference Checks', checkIcon: UserCog, role: 'Software Engineer', requestedDate: new Date('2025-01-15'), status: 'in_progress' as const, result: '' },
                  { id: 'chk-4', candidateName: 'Mike Johnson', candidateEmail: 'mike.j@email.com', checkType: 'Criminal Record Check', checkIcon: Fingerprint, role: 'Product Manager', requestedDate: new Date('2025-01-10'), status: 'completed' as const, result: 'Clear' },
                  { id: 'chk-5', candidateName: 'Mike Johnson', candidateEmail: 'mike.j@email.com', checkType: 'Qualification Verification', checkIcon: GraduationCap, role: 'Product Manager', requestedDate: new Date('2025-01-11'), status: 'completed' as const, result: 'Verified' },
                  { id: 'chk-6', candidateName: 'Emma Williams', candidateEmail: 'emma.w@email.com', checkType: 'Identity Verification', checkIcon: ShieldCheck, role: 'Product Manager', requestedDate: new Date('2025-01-12'), status: 'completed' as const, result: 'Verified' },
                  { id: 'chk-7', candidateName: 'Emma Williams', candidateEmail: 'emma.w@email.com', checkType: 'AI Video Interview', checkIcon: Video, role: 'Product Manager', requestedDate: new Date('2025-01-14'), status: 'completed' as const, result: 'Recommended' },
                  { id: 'chk-8', candidateName: 'Sarah Wilson', candidateEmail: 'sarah.w@email.com', checkType: 'Criminal Record Check', checkIcon: Fingerprint, role: 'Sales Representative', requestedDate: new Date('2025-01-16'), status: 'pending' as const, result: '' },
                  { id: 'chk-9', candidateName: 'David Brown', candidateEmail: 'david.b@email.com', checkType: 'Reference Checks', checkIcon: UserCog, role: 'Sales Representative', requestedDate: new Date('2025-01-11'), status: 'completed' as const, result: 'Positive' },
                  { id: 'chk-10', candidateName: 'Lisa Taylor', candidateEmail: 'lisa.t@email.com', checkType: 'Identity Verification', checkIcon: ShieldCheck, role: 'Sales Representative', requestedDate: new Date('2025-01-13'), status: 'failed' as const, result: 'Mismatch' },
                  { id: 'chk-11', candidateName: 'Rachel Martinez', candidateEmail: 'rachel.m@email.com', checkType: 'AI Video Interview', checkIcon: Video, role: 'Sales Representative', requestedDate: new Date('2025-01-17'), status: 'in_progress' as const, result: '' },
                  { id: 'chk-12', candidateName: 'Alex Chen', candidateEmail: 'alex.chen@email.com', checkType: 'Criminal Record Check', checkIcon: Fingerprint, role: 'Software Engineer', requestedDate: new Date('2025-01-18'), status: 'pending' as const, result: '' },
                ];

                const checkStatusColors: Record<string, string> = {
                  completed: 'bg-success/10 text-success border-success/20',
                  in_progress: 'bg-warning/10 text-warning border-warning/20',
                  pending: 'bg-muted text-muted-foreground border-border',
                  failed: 'bg-destructive/10 text-destructive border-destructive/20',
                };

                const checkStatusLabels: Record<string, string> = {
                  completed: 'Completed',
                  in_progress: 'In Progress',
                  pending: 'Pending',
                  failed: 'Failed',
                };

                const checkStatusPriority: Record<string, number> = { failed: 0, pending: 1, in_progress: 2, completed: 3 };

                const handleAddonCheckSort = (field: AddonCheckSortField) => {
                  if (addonCheckSortField === field) {
                    if (addonCheckSortDirection === 'asc') {
                      setAddonCheckSortDirection('desc');
                    } else {
                      setAddonCheckSortField(null);
                    }
                  } else {
                    setAddonCheckSortField(field);
                    setAddonCheckSortDirection('asc');
                  }
                };

                const filteredChecks = addonChecks
                  .filter(c => {
                    const q = addonCheckSearch.toLowerCase();
                    if (!q) return true;
                    return c.candidateName.toLowerCase().includes(q) || c.checkType.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
                  })
                  .sort((a, b) => {
                    if (!addonCheckSortField) return 0;
                    const dir = addonCheckSortDirection === 'asc' ? 1 : -1;
                    switch (addonCheckSortField) {
                      case 'candidate': return dir * a.candidateName.localeCompare(b.candidateName);
                      case 'checkType': return dir * a.checkType.localeCompare(b.checkType);
                      case 'role': return dir * a.role.localeCompare(b.role);
                      case 'requested': return dir * (a.requestedDate.getTime() - b.requestedDate.getTime());
                      case 'status': return dir * ((checkStatusPriority[a.status] ?? 9) - (checkStatusPriority[b.status] ?? 9));
                      default: return 0;
                    }
                  });

                const totalPages = Math.ceil(filteredChecks.length / addonCheckPageSize);
                const startIdx = (addonCheckPage - 1) * addonCheckPageSize;
                const paginatedChecks = filteredChecks.slice(startIdx, startIdx + addonCheckPageSize);
                const showingFrom = filteredChecks.length === 0 ? 0 : startIdx + 1;
                const showingTo = Math.min(startIdx + addonCheckPageSize, filteredChecks.length);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-foreground">Checks & Verifications</h2>
                        <Badge variant="secondary">{addonChecks.length}</Badge>
                      </div>
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by candidate, check type, or role..."
                          value={addonCheckSearch}
                          onChange={(e) => { setAddonCheckSearch(e.target.value); setAddonCheckPage(1); }}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead><SortableHeader field={'candidate' as SortField} label="Candidate" currentField={addonCheckSortField as SortField} currentDirection={addonCheckSortDirection} onSort={(f) => handleAddonCheckSort(f as AddonCheckSortField)} /></TableHead>
                            <TableHead><SortableHeader field={'checkType' as SortField} label="Check Type" currentField={addonCheckSortField as SortField} currentDirection={addonCheckSortDirection} onSort={(f) => handleAddonCheckSort(f as AddonCheckSortField)} /></TableHead>
                            <TableHead><SortableHeader field={'role' as SortField} label="Role" currentField={addonCheckSortField as SortField} currentDirection={addonCheckSortDirection} onSort={(f) => handleAddonCheckSort(f as AddonCheckSortField)} /></TableHead>
                            <TableHead className="w-[100px]"><SortableHeader field={'requested' as SortField} label="Requested" currentField={addonCheckSortField as SortField} currentDirection={addonCheckSortDirection} onSort={(f) => handleAddonCheckSort(f as AddonCheckSortField)} /></TableHead>
                            <TableHead className="w-[140px]"><SortableHeader field={'status' as SortField} label="Status" currentField={addonCheckSortField as SortField} currentDirection={addonCheckSortDirection} onSort={(f) => handleAddonCheckSort(f as AddonCheckSortField)} /></TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedChecks.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No checks found matching your search.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedChecks.map((check) => (
                              <TableRow key={check.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-foreground">{check.candidateName}</div>
                                    <div className="text-xs text-muted-foreground">{check.candidateEmail}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <check.checkIcon className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm">{check.checkType}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{check.role}</TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                  {format(check.requestedDate, 'd MMM yy')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={checkStatusColors[check.status]}>
                                    {checkStatusLabels[check.status]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {check.result || <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                  {check.status === 'completed' || check.status === 'failed' ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info('Opening report...')}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info('Downloading report...')}>
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <span className="text-sm text-muted-foreground">
                          Showing {showingFrom}–{showingTo} of {filteredChecks.length} results
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rows per page:</span>
                          <Select value={String(addonCheckPageSize)} onValueChange={(v) => { setAddonCheckPageSize(Number(v)); setAddonCheckPage(1); }}>
                            <SelectTrigger className="w-[70px] h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" disabled={addonCheckPage <= 1} onClick={() => setAddonCheckPage(p => p - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" disabled={addonCheckPage >= totalPages} onClick={() => setAddonCheckPage(p => p + 1)}>
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* CTA */}
              <div className="max-w-xl mx-auto text-center py-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Need Help Choosing?</h2>
                <p className="text-muted-foreground mb-6">
                  Our team can help you find the right combination of services for your hiring needs.
                </p>
                <Button variant="outline">Contact Our Team</Button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <CompanySettings initialSubTab={settingsSubTab} teamMembers={teamMembers} />
          )}

          {activeTab === 'profile' && (
            <UserProfile 
              user={currentUser}
              onUpdateUser={(updates) => setCurrentUser(prev => ({ ...prev, ...updates }))}
              subTab={profileSubTab}
              setSubTab={setProfileSubTab}
            />
          )}
        </main>
      </div>
      
      {/* Create/Edit Bundle Dialog */}
      <Dialog open={bundleDialogOpen} onOpenChange={setBundleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingBundle ? 'Edit Custom Bundle' : 'Create Custom Bundle'}
            </DialogTitle>
            <DialogDescription>
              {editingBundle 
                ? 'Update your bundle name or modify the included assessments.'
                : 'Build your own assessment package to reuse across roles.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div>
              <Label htmlFor="bundleName">Bundle Name</Label>
              <Input
                id="bundleName"
                value={newBundleName}
                onChange={(e) => setNewBundleName(e.target.value)}
                placeholder="e.g., Customer Service Pack"
                className="mt-1.5"
              />
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <Label className="mb-2">
                Select Assessments ({selectedForBundle.length} selected)
              </Label>
              <div className="flex-1 overflow-y-auto border border-border rounded-lg">
                <div className="divide-y divide-border">
                  {assessments.map((assessment) => (
                    <label
                      key={assessment.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedForBundle.includes(assessment.id)}
                        onCheckedChange={() => toggleAssessmentForBundle(assessment.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">{assessment.name}</span>
                          <Badge variant="outline" className={`${categoryColors[assessment.category]} text-xs`}>
                            {assessment.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-foreground">${assessment.price}</span>
                        <div className="text-xs text-muted-foreground/60">({assessment.creditCost} credits)</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {selectedForBundle.length > 0 && (
              <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedForBundle.length} assessment{selectedForBundle.length !== 1 ? 's' : ''} selected
                </span>
                <span className="font-semibold text-foreground">
                  Total: ${getBundleTotal(selectedForBundle)}
                </span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBundleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={saveBundle}
              disabled={!newBundleName.trim() || selectedForBundle.length === 0}
            >
              {editingBundle ? 'Save Changes' : 'Create Bundle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Candidate Dialog */}
      {selectedRole && (
        <AddCandidateDialog
          open={addCandidateDialogOpen}
          onOpenChange={setAddCandidateDialogOpen}
          roleName={selectedRole.position.title}
          roleId={selectedRole.id}
          onAddCandidates={handleAddCandidates}
        />
      )}

      {/* Candidate Info Drawer */}
      <CandidateInfoDrawer
        open={candidateDrawerOpen}
        onOpenChange={setCandidateDrawerOpen}
        candidate={selectedCandidateForDrawer}
        roleName={selectedRole?.position.title}
        resumeUrl={(selectedCandidateForDrawer as any)?.resumeUrl}
        onResendEmail={() => {
          if (selectedCandidateForDrawer) {
            toast.success(`Invitation resent to ${selectedCandidateForDrawer.email}`);
          }
        }}
      />

      {/* Assessment Review Drawer */}
      {selectedRole && (
        <AssessmentReviewDrawer
          open={assessmentReviewDrawerOpen}
          onOpenChange={setAssessmentReviewDrawerOpen}
          candidates={selectedRole.candidates}
          assessmentName={selectedAssessmentForReview?.name}
          assessmentId={selectedAssessmentForReview?.id}
          onResendEmail={(candidate, assessmentId) => {
            toast.success(`Invitation resent to ${candidate.email}`);
          }}
        />
      )}

      {/* Assign Assessment Dialog */}
      <AssignAssessmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        candidate={selectedCandidateForAssign?.candidate || null}
        roleId={selectedCandidateForAssign?.roleId || ''}
        roleName={selectedCandidateForAssign?.roleName || ''}
        onAssign={handleAssignAssessments}
      />

      {/* Assign Add-On Dialog */}
      <AssignAddOnDialog
        open={assignAddOnDialogOpen}
        onOpenChange={setAssignAddOnDialogOpen}
        candidate={selectedCandidateForAddOn?.candidate || null}
        roleId={selectedCandidateForAddOn?.roleId || ''}
        roleName={selectedCandidateForAddOn?.roleName || ''}
        onAssign={handleAssignAddOns}
      />

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              {selectedInvoice && format(selectedInvoice.date, 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={invoiceStatusColors[selectedInvoice.status]}>
                  {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span className="text-sm font-medium">{format(selectedInvoice.dueDate, 'MMM d, yyyy')}</span>
              </div>
              
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-3">Line Items</h4>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} <span className="text-foreground">×{item.quantity}</span>
                      </span>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">${selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
              Close
            </Button>
            <Button 
              variant="hero" 
              onClick={() => {
                if (selectedInvoice) {
                  handleDownloadInvoice(selectedInvoice);
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team. They'll receive an email with instructions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inviteFirstName">First Name *</Label>
                <Input 
                  id="inviteFirstName"
                  placeholder="John"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteLastName">Last Name *</Label>
                <Input 
                  id="inviteLastName"
                  placeholder="Smith"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                />
              </div>
            </div>
            
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address *</Label>
              <Input 
                id="inviteEmail"
                type="email" 
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            
            {/* Phone Input */}
            <div className="space-y-2">
              <Label>Phone (Optional)</Label>
              <div className="flex gap-2">
                <Select value={invitePhoneCountryCode} onValueChange={setInvitePhoneCountryCode}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((cc) => (
                      <SelectItem key={cc.code} value={cc.code}>
                        {cc.flag} {cc.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="400 000 000"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            {/* Position Title */}
            <div className="space-y-2">
              <Label htmlFor="invitePositionTitle">Position Title (Optional)</Label>
              <Input 
                id="invitePositionTitle"
                placeholder="HR Manager"
                value={invitePositionTitle}
                onChange={(e) => setInvitePositionTitle(e.target.value)}
              />
            </div>
            
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getUserRoleDescription(inviteRole)}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setInviteDialogOpen(false);
              setInviteFirstName('');
              setInviteLastName('');
              setInviteEmail('');
              setInvitePhone('');
              setInvitePhoneCountryCode('+61');
              setInvitePositionTitle('');
              setInviteRole('recruiter');
            }}>
              Cancel
            </Button>
            <Button 
              variant="hero" 
              onClick={handleInviteUser} 
              disabled={!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Role Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role and permissions for {selectedUser?.firstName} {selectedUser?.lastName || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {selectedUser.firstName && selectedUser.lastName 
                    ? `${selectedUser.firstName[0]}${selectedUser.lastName[0]}`
                    : selectedUser.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {selectedUser.firstName && selectedUser.lastName 
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(role) => handleUpdateUserRole(selectedUser.id, role as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex flex-col items-start">
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex flex-col items-start">
                        <span>Manager</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="recruiter">
                      <div className="flex flex-col items-start">
                        <span>Recruiter</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex flex-col items-start">
                        <span>Viewer</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getUserRoleDescription(selectedUser.role)}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditUserDialogOpen(false);
              setSelectedUser(null);
            }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;