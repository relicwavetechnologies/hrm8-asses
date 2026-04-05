import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from "@/contexts/AuthContext";
import { Link } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Briefcase, 
  Users, 
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  X,
  Clock,
  Upload,
  FileText,
  Loader2,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Edit,
  Search,
  Package,
  Star,
  ShieldCheck
} from 'lucide-react';
import AssessmentCard from '@/components/AssessmentCard';
import BundleCard from '@/components/BundleCard';
import { WizardState, Candidate, Assessment, AssessmentBundle, CustomBundle } from '@/types/assessment';
import { addOnServices } from '@/data/addons';
import { assessments, getAssessmentRecommendations } from '@/data/assessments';
import { bundles, getBundleAssessments, getRecommendedBundle } from '@/data/bundles';
import { assessmentPacks as defaultAssessmentPacks, questionTypes, type AssessmentPack } from '@/data/packs';
import type { RecommendationResult } from '@/types/assessment';

const ASSESS_PENDING_CHECKOUT_KEY = 'hrm8_assess_pending_checkout_v1';

const steps = [
  { id: 1, title: 'Company', icon: Building2 },
  { id: 2, title: 'Your Details', icon: User },
  { id: 3, title: 'Position', icon: Briefcase },
  { id: 4, title: 'Assessments', icon: ClipboardCheck },
  { id: 5, title: 'Candidates & Pay', icon: CreditCard },
];

const industries = [
  'Consulting', 'Construction', 'Education', 'Engineering', 'Finance', 
  'Government', 'Healthcare', 'Manufacturing', 'Non-profit', 'Professional Services', 
  'Recruitment', 'Retail', 'Technology', 'Other'
];

const companySizes = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
];

const employmentTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'casual', label: 'Casual' },
];

const seniorityLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'manager', label: 'Manager' },
  { value: 'executive', label: 'Executive' },
];

import { categoryColors, countryCodes, countries } from '@/lib/constants';

const Wizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingJobId = searchParams.get('existingJobId');
  const paymentStateParam = (
    searchParams.get('assess_payment')
    || searchParams.get('payment_status')
    || searchParams.get('status')
    || ''
  ).toLowerCase();
  const paymentSuccessParam = (
    searchParams.get('payment_success')
    || searchParams.get('success')
    || ''
  ).toLowerCase();
  const paymentCancelParam = (
    searchParams.get('payment_cancel')
    || searchParams.get('canceled')
    || searchParams.get('cancelled')
    || ''
  ).toLowerCase();
  const isPaymentReturnSuccess =
    paymentStateParam === 'success'
    || paymentSuccessParam === 'true'
    || paymentSuccessParam === '1'
    || paymentStateParam === 'paid';
  const isPaymentReturnCancel =
    paymentStateParam === 'cancel'
    || paymentStateParam === 'canceled'
    || paymentStateParam === 'cancelled'
    || paymentCancelParam === 'true'
    || paymentCancelParam === '1';
  const isPaymentReturn = isPaymentReturnSuccess || isPaymentReturnCancel;
  const initialStep = parseInt(searchParams.get('step') || '1', 10);
  const [currentStep, setCurrentStep] = useState(() => (
    isPaymentReturn ? 5 : existingJobId ? initialStep : 1
  ));
  const [checkoutPhase, setCheckoutPhase] = useState<'idle' | 'preparing' | 'confirming'>(
    isPaymentReturnSuccess ? 'confirming' : 'idle'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult>({ primary: [], suggested: [] });
  const [showSelectedAssessments, setShowSelectedAssessments] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'skills' | 'behavioural' | 'aptitude'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bundle state
  const [showBundles, setShowBundles] = useState(true);
  const [recommendedBundle, setRecommendedBundle] = useState<AssessmentBundle | null>(null);
  
  // Custom bundle state
  const [customBundles, setCustomBundles] = useState<CustomBundle[]>(() => {
    const saved = localStorage.getItem('hrm8_custom_bundles');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCustomBundle, setSelectedCustomBundle] = useState<string>('');
  const [showCustomBundleCreator, setShowCustomBundleCreator] = useState(false);
  const [customBundleDialogOpen, setCustomBundleDialogOpen] = useState(false);
  const [newCustomBundleName, setNewCustomBundleName] = useState('');
  const [selectedForCustomBundle, setSelectedForCustomBundle] = useState<string[]>([]);
  
  const [wizardData, setWizardData] = useState<WizardState>({
    step: 1,
    company: {},
    user: {},
    position: {},
    candidates: [],
    selectedAssessments: [],
    selectedBundle: null,
    selectedAddOns: [],
  });

  const [newCandidate, setNewCandidate] = useState<Partial<Candidate>>({});
  
  const [skillInput, setSkillInput] = useState('');
  const [authorizedConfirmed, setAuthorizedConfirmed] = useState(false);
  const [candidateConsentConfirmed, setCandidateConsentConfirmed] = useState(false);
  
  // Selected assessment pack state
  const [availablePacks, setAvailablePacks] = useState<AssessmentPack[]>(defaultAssessmentPacks);
  const [selectedPack, setSelectedPack] = useState<AssessmentPack | null>(null);
  const packCatalog = availablePacks.length > 0 ? availablePacks : defaultAssessmentPacks;
  const [aiRecommendations, setAiRecommendations] = useState<{
    recommendedPackId: string;
    assessmentTypes: string[];
    questionTypes: Array<{ id: string; name: string; description: string; recommended: boolean; reason?: string }>;
    assessmentSpecificRecommendations?: Record<string, { type: string; reason: string }>;
    reasoning: string;
  } | null>(null);
  const { user, isAuthenticated, refreshUser, loading } = useAuth();
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [dialogAssessmentCategory, setDialogAssessmentCategory] = useState<'all' | 'skills' | 'behavioural' | 'aptitude'>('all');
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');
  
  // Job options from API
  const [jobOptions, setJobOptions] = useState<{
    departments: string[];
    locations: string[];
    categories: string[];
    employmentTypes: Array<{ value: string; label: string }>;
    experienceLevels: Array<{ value: string; label: string }>;
    workArrangements: Array<{ value: string; label: string }>;
  }>({
    departments: [],
    locations: [],
    categories: [],
    employmentTypes: [],
    experienceLevels: [],
    workArrangements: [],
  });

  const [isLoadingJobOptions, setIsLoadingJobOptions] = useState(false);
  
  // Position Description upload state
  const [pdFile, setPdFile] = useState<File | null>(null);
  const [isAnalyzingPD, setIsAnalyzingPD] = useState(false);
  const [pdAnalyzed, setPdAnalyzed] = useState(false);
  
  // Fetch job options on mount
  useEffect(() => {
    const fetchJobOptions = async () => {
      setIsLoadingJobOptions(true);
      try {
        const response = await apiClient.getJobOptions();
        if (response.success && response.data) {
          setJobOptions(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch job options:', error);
      } finally {
        setIsLoadingJobOptions(false);
      }
    };
    fetchJobOptions();
  }, []);

  useEffect(() => {
    const fetchPackageCatalog = async () => {
      try {
        const response = await apiClient.getAssessPackages();
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setAvailablePacks(response.data.map((pack) => ({
            id: pack.id,
            name: pack.name,
            description: pack.description,
            assessmentCount: Number(pack.assessmentCount || 1),
            price: Number(pack.price || 0),
            popular: Boolean(pack.popular),
            features: Array.isArray(pack.features) ? pack.features : [],
          })));
        }
      } catch (error) {
        console.error('Failed to load assess package catalog:', error);
      }
    };
    void fetchPackageCatalog();
  }, []);

  // Fetch existing job if ID provided
  useEffect(() => {
    const fetchExistingJob = async () => {
        if (!existingJobId) return;

        try {
            const response = await apiClient.getJob(existingJobId);
            if (response.success && response.data) {
                const job = response.data;
                // Map job data to wizard state
                setWizardData(prev => ({
                    ...prev,
                    position: {
                        title: job.title,
                        department: job.department,
                        location: job.location,
                        employmentType: job.employment_type || 'full-time',
                        seniority: 'mid', // Default as not present in Job model
                        workArrangement: job.work_arrangement || 'on-site',
                        vacancies: job.number_of_vacancies || 1,
                        skills: job.requirements || [],
                        responsibilities: job.responsibilities?.join('\n') || '',
                    },
                    company: {
                        ...prev.company,
                        // job.company_id exists but maybe we don't need to overwrite company info if already logged in
                    }
                }));

                // Trigger AI recommendations based on the existing job details
                try {
                    const aiResponse = await apiClient.getAIRecommendations({
                        title: job.title,
                        department: job.department,
                        experienceLevel: 'mid', // Default
                        requirements: job.requirements || [],
                        responsibilities: job.responsibilities || [],
                    });

                    if (aiResponse.success && aiResponse.data) {
                        setAiRecommendations({
                            recommendedPackId: aiResponse.data.recommendedPackId,
                            assessmentTypes: aiResponse.data.assessmentTypes,
                            questionTypes: aiResponse.data.questionTypes,
                            assessmentSpecificRecommendations: (aiResponse.data as any).assessmentSpecificRecommendations,
                            reasoning: aiResponse.data.reasoning,
                        });

                        // Initialize configured assessments
                        const initialConfig = aiResponse.data.assessmentTypes.map((type: string) => {
                             const mapping = (aiResponse.data as any).assessmentSpecificRecommendations?.[type];
                             return {
                                 name: type,
                                 questionType: mapping?.type || 'multiple-choice',
                                 reason: mapping?.reason
                             };
                        });
                        setConfiguredAssessments(initialConfig);

                        // Auto-select recommended pack
                        const recPack = packCatalog.find(p => p.id === aiResponse.data.recommendedPackId);
                        if (recPack) setSelectedPack(recPack);
                    }
                } catch (aiError) {
                    console.error('Failed to get AI recommendations for existing job:', aiError);
                    // Don't fail the whole load if AI fails
                }
            }
        } catch (error) {
            console.error('Failed to fetch existing job:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load job details',
            });
        }
    };
    fetchExistingJob();
  }, [existingJobId]);

  // Check auth and skip steps if logged in
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const hydrateFromSession = async () => {
      const nameParts = user.name.split(' ');
      let companyPatch: Record<string, unknown> = {
        billingEmail: user.email,
      };
      let userPatch: Record<string, unknown> = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' '),
        email: user.email,
      };

      try {
        const [companyRes, metaRes] = await Promise.all([
          apiClient.getAssessCompanyProfile(),
          apiClient.getAssessDashboardMeta(),
        ]);

        if (companyRes.success && companyRes.data) {
          companyPatch = {
            name: companyRes.data.name || '',
            website: companyRes.data.website || '',
            country: companyRes.data.country || '',
            industry: companyRes.data.industry || '',
            size: companyRes.data.size || '',
            billingEmail: companyRes.data.billingEmail || user.email,
          };
        }

        if (metaRes.success && metaRes.data?.currentUser) {
          const currentUser = metaRes.data.currentUser;
          userPatch = {
            firstName: currentUser.firstName || nameParts[0] || '',
            lastName: currentUser.lastName || nameParts.slice(1).join(' '),
            email: currentUser.email || user.email,
            mobileCountryCode: currentUser.phoneCountryCode || '+61',
            mobile: currentUser.phone || '',
            jobTitle: currentUser.positionTitle || '',
          };
        }
      } catch (error) {
        console.error('Failed to hydrate wizard from session profile:', error);
      }

      setWizardData((prev) => ({
        ...prev,
        company: {
          ...prev.company,
          ...companyPatch,
        },
        user: {
          ...prev.user,
          ...userPatch,
        },
      }));
      setAuthorizedConfirmed(true);
      if (!existingJobId) {
        if (isPaymentReturnSuccess || checkoutPhase !== 'idle') {
          // Keep user on checkout step while payment finalization runs.
          setCurrentStep(5);
        } else if (!isPaymentReturn) {
          setCurrentStep(3); // Skip to Position step only for new jobs
        }
      }
    };

    void hydrateFromSession();
  }, [isAuthenticated, user, existingJobId, isPaymentReturn, isPaymentReturnSuccess, checkoutPhase]);
  
  // Persist custom bundles to localStorage
  useEffect(() => {
    localStorage.setItem('hrm8_custom_bundles', JSON.stringify(customBundles));
  }, [customBundles]);

  const updateCompany = (field: string, value: string) => {
    setWizardData(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  const updateUser = (field: string, value: string) => {
    setWizardData(prev => ({
      ...prev,
      user: { ...prev.user, [field]: value }
    }));
  };

  const updatePosition = (field: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      position: { ...prev.position, [field]: value }
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = wizardData.position.skills || [];
      updatePosition('skills', [...currentSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = wizardData.position.skills || [];
    updatePosition('skills', currentSkills.filter(s => s !== skill));
  };

  const handlePDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdFile(file);
      setPdAnalyzed(false);
    }
  };

  const removePDFile = () => {
    setPdFile(null);
    setPdAnalyzed(false);
  };

  const analyzePositionDescription = async () => {
    if (!pdFile) return;
    
    setIsAnalyzingPD(true);
    
    try {
      // Upload file to Cloudinary via backend
      const uploadResponse = await apiClient.uploadPositionDescription(pdFile);
      
      if (uploadResponse.success && uploadResponse.data) {
        // Store the Cloudinary URL in position data
        updatePosition('pdFileName', uploadResponse.data.fileName);
        updatePosition('jobDescription', uploadResponse.data.url);
        console.log('Position description uploaded to:', uploadResponse.data.url);
      } else {
        console.error('Upload failed:', uploadResponse.error);
      }

      // Keep the uploaded description URL and let user edit fields manually until
      // backend-side document parsing is enabled for this endpoint.
      setPdAnalyzed(true);
    } catch (error) {
      console.error('Error analyzing position description:', error);
    } finally {
      setIsAnalyzingPD(false);
    }
  };

  const addCandidate = () => {
    if (!newCandidate.firstName?.trim() || !newCandidate.lastName?.trim() || !newCandidate.email?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in all candidate fields (First Name, Last Name, Email).',
      });
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCandidate.email.trim())) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      });
      return;
    }
    const candidate: Candidate = {
      id: crypto.randomUUID(),
      firstName: newCandidate.firstName.trim(),
      lastName: newCandidate.lastName.trim(),
      email: newCandidate.email.trim(),
      
    };
    setWizardData(prev => ({
      ...prev,
      candidates: [...prev.candidates, candidate]
    }));
    setNewCandidate({});
    
  };

  const removeCandidate = (id: string) => {
    setWizardData(prev => ({
      ...prev,
      candidates: prev.candidates.filter(c => c.id !== id)
    }));
  };

  const toggleAssessment = (assessment: Assessment) => {
    setWizardData(prev => {
      // If assessment is in the active bundle, do nothing
      if (prev.selectedBundle?.assessmentIds.includes(assessment.id)) {
        return prev;
      }
      const isSelected = prev.selectedAssessments.some(a => a.id === assessment.id);
      const newSelectedAssessments = isSelected
        ? prev.selectedAssessments.filter(a => a.id !== assessment.id)
        : [...prev.selectedAssessments, assessment];
      
      return {
        ...prev,
        selectedAssessments: newSelectedAssessments,
      };
    });
  };

  const selectBundle = (bundle: AssessmentBundle) => {
    setWizardData(prev => ({
      ...prev,
      // Remove any individually selected assessments that overlap with the bundle
      selectedAssessments: prev.selectedAssessments.filter(a => !bundle.assessmentIds.includes(a.id)),
      selectedBundle: bundle,
    }));
  };

  const deselectBundle = () => {
    setWizardData(prev => ({
      ...prev,
      selectedBundle: null,
    }));
  };

  const toggleBundle = (bundle: AssessmentBundle) => {
    if (wizardData.selectedBundle?.id === bundle.id) {
      deselectBundle();
    } else {
      selectBundle(bundle);
    }
  };
  
  // Custom bundle functions
  const selectCustomBundle = (bundleId: string) => {
    const customBundle = customBundles.find(b => b.id === bundleId);
    if (customBundle) {
      const bundleAssessments = customBundle.assessmentIds
        .map(id => assessments.find(a => a.id === id))
        .filter(Boolean) as Assessment[];
      setWizardData(prev => ({
        ...prev,
        selectedAssessments: bundleAssessments,
        selectedBundle: null, // Custom bundles don't have bundle pricing
      }));
      setSelectedCustomBundle(bundleId);
    }
  };
  
  const saveNewCustomBundle = () => {
    if (!newCustomBundleName.trim() || selectedForCustomBundle.length === 0) return;
    
    const newBundle: CustomBundle = {
      id: `custom-${Date.now()}`,
      name: newCustomBundleName.trim(),
      assessmentIds: selectedForCustomBundle,
      createdAt: new Date(),
    };
    setCustomBundles(prev => [...prev, newBundle]);
    
    // Also select this bundle
    const bundleAssessments = selectedForCustomBundle
      .map(id => assessments.find(a => a.id === id))
      .filter(Boolean) as Assessment[];
    setWizardData(prev => ({
      ...prev,
      selectedAssessments: bundleAssessments,
      selectedBundle: null,
    }));
    
    setCustomBundleDialogOpen(false);
    setNewCustomBundleName('');
    setSelectedForCustomBundle([]);
    setSelectedCustomBundle(newBundle.id);
  };
  
  const toggleAssessmentForCustomBundle = (assessmentId: string) => {
    setSelectedForCustomBundle(prev =>
      prev.includes(assessmentId)
        ? prev.filter(id => id !== assessmentId)
        : [...prev, assessmentId]
    );
  };
  
  const getCustomBundleTotal = (assessmentIds: string[]) => {
    return assessmentIds.reduce((sum, id) => {
      const assessment = assessments.find(a => a.id === id);
      return sum + (assessment?.price || 0);
    }, 0);
  };

  const analyzeRole = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      const skills = wizardData.position.skills || [];
      const seniority = wizardData.position.seniority || 'mid';
      const result = getAssessmentRecommendations(skills, seniority);
      setRecommendations(result);
      
      // Get recommended bundle based on position
      const recBundle = getRecommendedBundle(skills, seniority);
      setRecommendedBundle(recBundle);
      
      // Auto-select recommended bundle if available, otherwise use primary recommendations
      if (recBundle) {
        const bundleAssessments = getBundleAssessments(recBundle).filter(Boolean) as Assessment[];
        setWizardData(prev => ({
          ...prev,
          selectedAssessments: bundleAssessments,
          selectedBundle: recBundle,
        }));
      } else {
        setWizardData(prev => ({
          ...prev,
          selectedAssessments: result.primary,
          selectedBundle: null,
        }));
      }
      setIsAnalyzing(false);
      setCurrentStep(4);
    }, 2000);
  };

  const toggleAddOn = (addOnId: string) => {
    setWizardData(prev => {
      const current = prev.selectedAddOns || [];
      const isSelected = current.includes(addOnId);
      return {
        ...prev,
        selectedAddOns: isSelected
          ? current.filter(id => id !== addOnId)
          : [...current, addOnId],
      };
    });
  };

  const getAddOnsTotal = () => {
    return (wizardData.selectedAddOns || []).reduce((sum, id) => {
      const addon = addOnServices.find(a => a.id === id);
      return sum + (addon?.price || 0);
    }, 0);
  };

  const calculateTotal = () => {
    const candidateCount = wizardData.candidates.length || 1;
    return (getEffectivePrice() + getAddOnsTotal()) * candidateCount;
  };

  const getEffectivePrice = () => {
    const bundlePrice = wizardData.selectedBundle?.bundlePrice || 0;
    const individualPrice = wizardData.selectedAssessments.reduce((sum, a) => sum + a.price, 0);
    return bundlePrice + individualPrice;
  };

  const getIndividualTotal = () => {
    // Sum all assessment prices at individual rates (bundle items + individual selections)
    const bundleItemsTotal = wizardData.selectedBundle
      ? wizardData.selectedBundle.assessmentIds.reduce((sum, id) => {
          const assessment = assessments.find(a => a.id === id);
          return sum + (assessment?.price || 0);
        }, 0)
      : 0;
    const individualTotal = wizardData.selectedAssessments.reduce((sum, a) => sum + a.price, 0);
    return bundleItemsTotal + individualTotal;
  };

  const getBundleSavings = () => {
    if (!wizardData.selectedBundle) return 0;
    return wizardData.selectedBundle.savings;
  };

  const getAllSelectedAssessments = () => {
    const bundleAssessments = wizardData.selectedBundle
      ? wizardData.selectedBundle.assessmentIds
          .map(id => assessments.find(a => a.id === id))
          .filter(Boolean) as Assessment[]
      : [];
    return [...bundleAssessments, ...wizardData.selectedAssessments];
  };

  const resolveCheckoutPack = (): AssessmentPack | null => {
    const selectedCount = getAllSelectedAssessments().length;
    if (selectedCount <= 0) return selectedPack;

    const sortedPacks = [...packCatalog].sort((a, b) => a.assessmentCount - b.assessmentCount);
    const matched = sortedPacks.find((pack) => pack.assessmentCount >= selectedCount)
      || sortedPacks[sortedPacks.length - 1]
      || null;
    return matched || selectedPack;
  };

  const [isRegistering, setIsRegistering] = useState(false);
  const [isFinalizingPayment, setIsFinalizingPayment] = useState(false);
  const paymentFinalizeInFlightRef = useRef(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const { toast } = useToast();

  const createAssessCheckoutFlow = async (jobId: string, pack: AssessmentPack) => {
    const normalizeCatalogId = (name: string, index: number) => {
      const normalized = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return normalized || `assessment-${index + 1}`;
    };

    const selectedUiAssessments = getAllSelectedAssessments().slice(0, pack.assessmentCount);
    const selectedAssessments = selectedUiAssessments.map((assessment, index) => {
      const mappedType = aiRecommendations?.assessmentSpecificRecommendations?.[assessment.name]?.type;
      const questionType = mappedType
        || (assessment.category === 'skills' ? 'code-challenge' : 'multiple-choice');
      return {
        assessmentCatalogId: normalizeCatalogId(assessment.name, index),
        name: assessment.name,
        questionType,
        recommendedReason: aiRecommendations?.assessmentSpecificRecommendations?.[assessment.name]?.reason,
      };
    });

    if (selectedAssessments.length === 0) {
      throw new Error('At least one assessment must be selected for the package');
    }

    const draftRes = await apiClient.upsertAssessDraftJob(jobId, {
      title: wizardData.position.title || 'Untitled Role',
      description: wizardData.position.responsibilities || '',
      department: wizardData.position.department,
      location: wizardData.position.location || 'Remote',
      employmentType: wizardData.position.employmentType || 'full-time',
      workArrangement: wizardData.position.workArrangement || 'remote',
      numberOfVacancies: wizardData.position.vacancies || 1,
    });
    if (!draftRes.success) {
      throw new Error(draftRes.error || 'Unable to save draft job details');
    }

    const packageRes = await apiClient.saveAssessPackage(jobId, {
      packId: pack.id,
      selectedAssessments,
    });
    if (!packageRes.success) {
      throw new Error(packageRes.error || 'Unable to save package selection');
    }

    const candidatePayload = wizardData.candidates.map((candidate) => ({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      mobile: candidate.mobile,
    }));
    if (candidatePayload.length > 0) {
      const candidateRes = await apiClient.bulkUpsertAssessCandidates(jobId, {
        candidates: candidatePayload,
      });
      if (!candidateRes.success) {
        throw new Error(candidateRes.error || 'Unable to save candidates');
      }
    }

    const candidateCount = Math.max(1, wizardData.candidates.length);
    const pricingRes = await apiClient.getPricingPreview(jobId, {
      packageId: pack.id,
      candidateCount,
    });
    if (!pricingRes.success) {
      throw new Error(pricingRes.error || 'Unable to calculate pricing');
    }

    const checkoutRes = await apiClient.initCheckout(jobId, {
      packageId: pack.id,
      candidateCount,
    });
    if (!checkoutRes.success) {
      throw new Error(checkoutRes.error || 'Unable to initialize checkout');
    }

    const paymentAttemptId = checkoutRes.data?.paymentAttemptId || checkoutRes.data?.checkoutSessionId;
    const redirectUrl = checkoutRes.data?.redirectUrl;
    if (!paymentAttemptId || !redirectUrl) {
      throw new Error('Checkout response is missing payment reference or redirect URL');
    }

    return {
      jobId,
      packageId: pack.id,
      candidateCount,
      paymentAttemptId,
      redirectUrl,
    };
  };

  const savePendingCheckout = (payload: {
    jobId: string;
    packageId: string;
    candidateCount: number;
    paymentAttemptId: string;
  }) => {
    localStorage.setItem(ASSESS_PENDING_CHECKOUT_KEY, JSON.stringify({
      ...payload,
      createdAt: new Date().toISOString(),
    }));
  };

  const readPendingCheckout = (): null | {
    jobId: string;
    packageId: string;
    candidateCount: number;
    paymentAttemptId: string;
    createdAt?: string;
  } => {
    const raw = localStorage.getItem(ASSESS_PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.jobId || !parsed.packageId || !parsed.paymentAttemptId) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const clearPendingCheckout = () => {
    localStorage.removeItem(ASSESS_PENDING_CHECKOUT_KEY);
  };

  const handlePayment = async () => {
    setIsRegistering(true);
    setRegistrationError(null);
    setCheckoutPhase('preparing');
    setCurrentStep(5);

    try {
      const selectedAssessments = getAllSelectedAssessments();
      if (selectedAssessments.length === 0) {
        throw new Error('Please select at least one assessment before completing order');
      }

      if (wizardData.candidates.length === 0) {
        throw new Error('Please add at least one candidate before completing order');
      }

      const effectivePack = resolveCheckoutPack();
      if (!effectivePack) {
        throw new Error('Please select an assessment package before completing order');
      }

      // If already authenticated, just create the job and proceed
      if (isAuthenticated) {
          let jobId = existingJobId || '';
          if (!jobId) {
            const jobRes = await apiClient.createInternalJob({
              title: wizardData.position.title || '',
              department: wizardData.position.department,
              location: wizardData.position.location,
              category: wizardData.position.category,
              employmentType: wizardData.position.employmentType || 'full-time',
              experienceLevel: wizardData.position.seniority,
              workArrangement: wizardData.position.workArrangement,
              vacancies: wizardData.position.vacancies,
              requirements: wizardData.position.skills,
              responsibilities: wizardData.position.responsibilities ? [wizardData.position.responsibilities] : [],
            });
            if (!jobRes.success || !jobRes.data?.jobId) {
              throw new Error(jobRes.error || 'Unable to create role for checkout');
            }
            jobId = jobRes.data.jobId;
          }

          const checkout = await createAssessCheckoutFlow(jobId, effectivePack);
          savePendingCheckout(checkout);
          window.location.href = checkout.redirectUrl;
          return;
      }

      // First register company and user with backend
      if (!wizardData.company.name?.trim()) {
        throw new Error('Company name is required');
      }
      if (!wizardData.user.email?.trim()) {
        throw new Error('Work email is required');
      }
      if (!wizardData.user.password) {
        throw new Error('Password is required');
      }
      if (wizardData.user.password !== wizardData.user.confirmPassword) {
        throw new Error('Password and confirm password must match');
      }
      if (!authorizedConfirmed) {
        throw new Error('Please confirm authorization to continue');
      }

      const response = await apiClient.bootstrapSignup({
        companyName: wizardData.company.name || '',
        workEmail: wizardData.user.email || '',
        password: wizardData.user.password || '',
        acceptTerms: authorizedConfirmed,
      });

      if (!response.success) {
        // Handle validation errors (e.g., email domain mismatch)
        const errorMessage = response.errors?.join(', ') || response.error || 'Registration failed';
        setRegistrationError(errorMessage);
        toast({
          title: 'Registration Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // Update auth context with new user session
      await refreshUser();
      
      // Create the internal job now that we are registered
      const jobRes = await apiClient.createInternalJob({
          title: wizardData.position.title || '',
          department: wizardData.position.department,
          location: wizardData.position.location,
          category: wizardData.position.category,
          employmentType: wizardData.position.employmentType || 'full-time',
          experienceLevel: wizardData.position.seniority,
          workArrangement: wizardData.position.workArrangement,
          vacancies: wizardData.position.vacancies,
          requirements: wizardData.position.skills,
          responsibilities: wizardData.position.responsibilities ? [wizardData.position.responsibilities] : [],
      });

      if (!jobRes.success || !jobRes.data?.jobId) {
        throw new Error(jobRes.error || 'Unable to create role for checkout');
      }

      const checkout = await createAssessCheckoutFlow(jobRes.data.jobId, effectivePack);
      savePendingCheckout(checkout);
      window.location.href = checkout.redirectUrl;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setRegistrationError(errorMessage);
      setCheckoutPhase('idle');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (isPaymentReturnCancel) {
      setCheckoutPhase('idle');
      setCurrentStep(5);
      clearPendingCheckout();
      toast({
        title: 'Payment canceled',
        description: 'You can resume checkout from this wizard.',
        variant: 'destructive',
      });
      return;
    }

    if (!isPaymentReturnSuccess || paymentFinalizeInFlightRef.current) return;
    setCheckoutPhase('confirming');
    setCurrentStep(5);
    const pending = readPendingCheckout();
    const callbackJobId = String(searchParams.get('jobId') || '').trim();
    if (!pending && !isAuthenticated) return;
    if (!pending && !callbackJobId) return;

    const finalize = async () => {
      paymentFinalizeInFlightRef.current = true;
      setIsFinalizingPayment(true);
      setRegistrationError(null);

      try {
        const paymentAttemptId =
          searchParams.get('payment_attempt_id') ||
          pending?.paymentAttemptId ||
          '';
        const activationJobId = pending?.jobId || callbackJobId;
        let activationRes: Awaited<ReturnType<typeof apiClient.activateAssessJob>> | null = null;

        for (let i = 0; i < 20; i += 1) {
          activationRes = await apiClient.activateAssessJob(activationJobId, {
            packageId: pending?.packageId,
            candidateCount: pending?.candidateCount,
            paymentAttemptId: paymentAttemptId || undefined,
            checkoutSessionId: paymentAttemptId || undefined,
            orderId: `assess_order_${Date.now()}`,
          });

          if (activationRes.success) {
            break;
          }

          const message = String(activationRes.error || '').toLowerCase();
          const stillPending =
            message.includes('payment is not completed yet') ||
            message.includes('payment confirmation is still pending');

          if (!stillPending) {
            throw new Error(activationRes.error || 'Unable to activate assess job after payment');
          }

          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        if (!activationRes?.success) {
          throw new Error(activationRes?.error || 'Payment confirmation is still pending. Please keep this page open and retry in a few moments.');
        }

        clearPendingCheckout();
        setCheckoutPhase('idle');
        toast({
          title: 'Success!',
          description: 'Payment confirmed and assessment package activated.',
        });
        navigate('/dashboard');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to finalize payment';
        setRegistrationError(message);
        setCheckoutPhase('confirming');
        toast({
          title: 'Payment verification pending',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsFinalizingPayment(false);
        paymentFinalizeInFlightRef.current = false;
      }
    };

    void finalize();
  }, [searchParams, navigate, toast, isPaymentReturnCancel, isPaymentReturnSuccess, loading, isAuthenticated]);

  const [configuredAssessments, setConfiguredAssessments] = useState<Array<{ name: string; questionType: string; reason?: string }>>([]);

  const handleContinue = async () => {
    if (currentStep === 3) {
      // Get AI recommendations when leaving Position step.
      setIsAnalyzing(true);
      try {
        // Fetch AI recommendations
        const response = await apiClient.getAIRecommendations({
          title: wizardData.position.title || '',
          department: wizardData.position.department,
          experienceLevel: wizardData.position.seniority,
          requirements: wizardData.position.skills,
          responsibilities: wizardData.position.responsibilities ? [wizardData.position.responsibilities] : [],
        });

        if (response.success && response.data) {
          setAiRecommendations({
            recommendedPackId: response.data.recommendedPackId,
            assessmentTypes: response.data.assessmentTypes,
            questionTypes: response.data.questionTypes,
            assessmentSpecificRecommendations: (response.data as any).assessmentSpecificRecommendations,
            reasoning: response.data.reasoning,
          });
          
          // Initialize configured assessments based on AI types and mapping
          const initialConfig = response.data.assessmentTypes.map((type: string) => {
              const mapping = (response.data as any).assessmentSpecificRecommendations?.[type];
              return {
                  name: type,
                  questionType: mapping?.type || 'multiple-choice',
                  reason: mapping?.reason
              };
          });
          setConfiguredAssessments(initialConfig);

          // Auto-select recommended pack
          const recPack = packCatalog.find(p => p.id === response.data.recommendedPackId);
          if (recPack) setSelectedPack(recPack);
        }
      } catch (error) {
        console.error('Error during Step 3 transition:', error);
      } finally {
        setIsAnalyzing(false);
        setCurrentStep(4);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Sync configuredAssessments with selectedPack count
  useEffect(() => {
    if (!selectedPack) return;

    setConfiguredAssessments(prev => {
      const currentCount = prev.length;
      const targetCount = selectedPack.assessmentCount;

      if (currentCount === targetCount) return prev;

      if (currentCount < targetCount) {
        // We need to add more. Try to use AI recommendations if available, otherwise defaults
        const newAssessments = [...prev];
        const usedNames = new Set(prev.map(a => a.name));

        // Find unused AI recommendations
        const unusedRecommendations = aiRecommendations?.assessmentTypes
          .filter(type => !usedNames.has(type)) || [];
        
        for (let i = 0; i < targetCount - currentCount; i++) {
            if (unusedRecommendations[i]) {
                // Use AI recommendation
                const type = unusedRecommendations[i];
                const mapping = aiRecommendations?.assessmentSpecificRecommendations?.[type];
                newAssessments.push({
                    name: type,
                    questionType: mapping?.type || 'multiple-choice',
                    reason: mapping?.reason
                });
            } else {
                // Default placeholder
                newAssessments.push({
                    name: `Assessment ${currentCount + i + 1}`,
                    questionType: 'multiple-choice'
                });
            }
        }
        return newAssessments;
      } else {
        // We need to trim
        return prev.slice(0, targetCount);
      }
    });
  }, [selectedPack, aiRecommendations]);

  const canProceed = () => {
    if (currentStep === 1) {
      return Boolean(wizardData.company.name?.trim());
    }

    if (currentStep === 2) {
      if (isAuthenticated) return true;
      const email = wizardData.user.email?.trim();
      const password = wizardData.user.password || '';
      const confirmPassword = wizardData.user.confirmPassword || '';
      return Boolean(email && password && confirmPassword && password === confirmPassword && authorizedConfirmed);
    }

    if (currentStep === 3) {
      return Boolean(wizardData.position.title?.trim());
    }

    return true;
  };

  const assessmentTotalPerCandidate = getEffectivePrice();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (checkoutPhase === 'preparing' || checkoutPhase === 'confirming' || isPaymentReturnSuccess) {
    const isConfirming = checkoutPhase === 'confirming' || isPaymentReturnSuccess;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-10 shadow-card-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {isConfirming ? 'Confirming your payment...' : 'Preparing your secure checkout...'}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                {isConfirming
                  ? 'We are verifying your payment and activating your assessment workspace. Please keep this page open.'
                  : 'We are creating your account, setting up your role, and redirecting you to payment.'}
              </p>
              {registrationError ? (
                <div className="mt-6 w-full rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left">
                  <p className="text-sm font-medium text-destructive">We still need a moment to finish setup.</p>
                  <p className="mt-2 text-sm text-destructive">{registrationError}</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                      Retry confirmation
                    </Button>
                    <Button type="button" onClick={() => navigate('/dashboard')}>
                      Go to dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    This page will move forward automatically as soon as the payment provider confirms the transaction.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.id 
                        ? 'bg-success text-success-foreground' 
                        : currentStep === step.id 
                          ? 'hero-gradient text-primary-foreground shadow-lg' 
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 md:w-24 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-card-lg p-8">
            {isPaymentReturnSuccess && (
              <div className={`mb-6 rounded-lg border p-4 ${registrationError ? 'border-destructive/40 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-center gap-2">
                  {isFinalizingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <p className="text-sm font-medium text-foreground">Confirming your payment and activating your role...</p>
                    </>
                  ) : registrationError ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <p className="text-sm font-medium text-destructive">Payment confirmation needs attention.</p>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Payment return detected. Finalizing setup...</p>
                    </>
                  )}
                </div>
                {registrationError && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-destructive">{registrationError}</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 1: Company Details */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-2">Company Details</h2>
                <p className="text-muted-foreground mb-8">Tell us about your organization.</p>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={wizardData.company.name || ''}
                      onChange={(e) => updateCompany('name', e.target.value)}
                      placeholder="Acme Inc."
                      className="mt-1.5"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website URL</Label>
                      <Input
                        id="website"
                        type="url"
                        value={wizardData.company.website || ''}
                        onChange={(e) => updateCompany('website', e.target.value)}
                        placeholder="https://www.example.com"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Country *</Label>
                      <Select 
                        value={wizardData.company.country || ''} 
                        onValueChange={(v) => updateCompany('country', v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Australia', 'New Zealand', 'United States', 'United Kingdom', 'Canada', 'Singapore', 'India', 'Germany', 'France', 'Japan', 'Other'].map((country) => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Industry *</Label>
                      <Select 
                        value={wizardData.company.industry} 
                        onValueChange={(v) => updateCompany('industry', v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Company Size</Label>
                      <Select 
                        value={wizardData.company.size} 
                        onValueChange={(v) => updateCompany('size', v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size} value={size}>{size} employees</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="billingEmail">Billing Email *</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      value={wizardData.company.billingEmail || ''}
                      onChange={(e) => updateCompany('billingEmail', e.target.value)}
                      placeholder="billing@company.com"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: User Details */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-2">Your Details</h2>
                <p className="text-muted-foreground mb-8">Who will be managing this assessment?</p>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={wizardData.user.firstName || ''}
                        onChange={(e) => updateUser('firstName', e.target.value)}
                        placeholder="Jane"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={wizardData.user.lastName || ''}
                        onChange={(e) => updateUser('lastName', e.target.value)}
                        placeholder="Smith"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Work Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={wizardData.user.email || ''}
                      onChange={(e) => updateUser('email', e.target.value)}
                      placeholder="jane.smith@company.com"
                      className="mt-1.5"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={wizardData.user.password || ''}
                        onChange={(e) => updateUser('password', e.target.value)}
                        placeholder="••••••••"
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Min. 8 characters with number and special character</p>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={wizardData.user.confirmPassword || ''}
                        onChange={(e) => updateUser('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        className="mt-1.5"
                      />
                      {wizardData.user.password && wizardData.user.confirmPassword && 
                       wizardData.user.password !== wizardData.user.confirmPassword && (
                        <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mobile">Mobile (optional)</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Select 
                          value={wizardData.user.mobileCountryCode || '+61'} 
                          onValueChange={(v) => updateUser('mobileCountryCode', v)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="+61" />
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
                          id="mobile"
                          value={wizardData.user.mobile || ''}
                          onChange={(e) => updateUser('mobile', e.target.value)}
                          placeholder="400 000 000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={wizardData.user.jobTitle || ''}
                        onChange={(e) => updateUser('jobTitle', e.target.value)}
                        placeholder="HR Manager"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Checkbox 
                      id="authorized" 
                      checked={authorizedConfirmed}
                      onCheckedChange={(checked) => setAuthorizedConfirmed(checked as boolean)}
                    />
                    <Label htmlFor="authorized" className="text-sm leading-relaxed cursor-pointer">
                      I confirm I'm authorised to purchase assessments on behalf of this company.
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Position Details */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-2">Position Details</h2>
                <p className="text-muted-foreground mb-8">Tell us about the role you're hiring for.</p>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="positionTitle">Position Title *</Label>
                    <Input
                      id="positionTitle"
                      value={wizardData.position.title || ''}
                      onChange={(e) => updatePosition('title', e.target.value)}
                      placeholder="Software Engineer"
                      className="mt-1.5"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Department</Label>
                      <Select 
                        value={wizardData.position.department || ''} 
                        onValueChange={(v) => updatePosition('department', v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {(jobOptions.departments.length > 0 ? jobOptions.departments : ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Other']).map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vacancies">Number of Vacancies</Label>
                      <Input
                        id="vacancies"
                        type="number"
                        min="1"
                        value={wizardData.position.vacancies || 1}
                        onChange={(e) => updatePosition('vacancies', parseInt(e.target.value) || 1)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={wizardData.position.location || ''}
                        onChange={(e) => updatePosition('location', e.target.value)}
                        placeholder="Sydney, NSW"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Job Category</Label>
                      <Select 
                        value={wizardData.position.category || ''} 
                        onValueChange={(v) => updatePosition('category', v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {(jobOptions.categories.length > 0 ? jobOptions.categories : ['IT & Technology', 'Finance', 'Marketing', 'Sales', 'Operations', 'HR', 'Customer Service', 'Other']).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Employment Type *</Label>
                      <Select 
                        value={wizardData.position.employmentType} 
                        onValueChange={(v) => updatePosition('employmentType', v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {employmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Seniority Level</Label>
                      <Select 
                        value={wizardData.position.seniority} 
                        onValueChange={(v) => updatePosition('seniority', v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {seniorityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Work Arrangement</Label>
                      <Select 
                        value={wizardData.position.workArrangement || 'on-site'} 
                        onValueChange={(v) => updatePosition('workArrangement', v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select arrangement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on-site">On-site</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Position Description Upload */}
                  <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <Label className="text-base font-medium">Position Description</Label>
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </div>
                    
                    {!pdFile ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Upload a position description to automatically extract key skills and responsibilities.
                        </p>
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload PDF, DOCX, or TXT
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.docx,.doc,.txt"
                            onChange={handlePDUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {pdFile.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({(pdFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removePDFile}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={analyzePositionDescription}
                          disabled={isAnalyzingPD || pdAnalyzed}
                          className="w-full"
                        >
                          {isAnalyzingPD ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : pdAnalyzed ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Analysis Complete
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Analyze Position Description
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Label>Key Skills</Label>
                      {pdAnalyzed && (wizardData.position.skills?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Suggested
                        </Badge>
                      )}
                    </div>
                    {!pdFile && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Upload a position description above for AI suggestions, or add skills manually.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add a skill"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" variant="secondary" onClick={addSkill}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {(wizardData.position.skills?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {wizardData.position.skills?.map((skill) => (
                          <Badge key={skill} variant="secondary" className="gap-1">
                            {skill}
                            <button onClick={() => removeSkill(skill)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Label htmlFor="responsibilities">Key Responsibilities</Label>
                      {pdAnalyzed && wizardData.position.responsibilities && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    {!pdFile && !wizardData.position.responsibilities && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Upload a position description above for AI draft, or enter manually.
                      </p>
                    )}
                    <Textarea
                      id="responsibilities"
                      value={wizardData.position.responsibilities || ''}
                      onChange={(e) => updatePosition('responsibilities', e.target.value)}
                      placeholder="Describe the main responsibilities of this role..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Assessments & Services */}
            {currentStep === 4 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Assessments & Services</h2>
                <p className="text-muted-foreground mb-8">Select the assessments and services you need for this role.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assessments Card */}
                  <div className="p-6 rounded-xl border-2 border-border bg-card hover:border-primary/30 transition-all flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">Assessments</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Choose from packs, AI-recommended tests, bundles, and individual assessments.
                    </p>
                    {wizardData.selectedBundle ? (
                      <div className="p-3 bg-success/10 rounded-lg mb-4 flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-foreground">{wizardData.selectedBundle.name}</span>
                        <span className="text-sm text-muted-foreground ml-auto">${wizardData.selectedBundle.bundlePrice}/candidate</span>
                      </div>
                    ) : wizardData.selectedAssessments.length > 0 ? (
                      <div className="p-3 bg-success/10 rounded-lg mb-4 flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-foreground">{wizardData.selectedAssessments.length} assessment{wizardData.selectedAssessments.length !== 1 ? 's' : ''}</span>
                        <span className="text-sm text-muted-foreground ml-auto">${getEffectivePrice()}/candidate</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-lg mb-4">
                        <span className="text-sm text-muted-foreground">No assessments selected</span>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAssessmentDialogOpen(true)}
                      className="w-full"
                    >
                      Browse Assessments
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  {/* Services Card */}
                  <div className="p-6 rounded-xl border-2 border-border bg-card hover:border-primary/30 transition-all flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">Services</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Video interviews, reference checks, identity & qualification verification, and more.
                    </p>
                    {(wizardData.selectedAddOns || []).length > 0 ? (
                      <div className="p-3 bg-success/10 rounded-lg mb-4 flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-foreground">{(wizardData.selectedAddOns || []).length} selected</span>
                        <span className="text-sm text-muted-foreground ml-auto">${getAddOnsTotal()}/candidate</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-lg mb-4">
                        <span className="text-sm text-muted-foreground">No services selected</span>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setServicesDialogOpen(true)}
                      className="w-full"
                    >
                      Browse Services
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Assessments Dialog */}
            <Dialog open={assessmentDialogOpen} onOpenChange={(open) => {
              setAssessmentDialogOpen(open);
              if (!open) {
                setDialogAssessmentCategory('all');
                setDialogSearchQuery('');
              }
            }}>
              <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Select Assessments</DialogTitle>
                  <DialogDescription>Build your ideal assessment suite for this role.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4 overflow-y-auto flex-1">
                  {/* AI Recommendations */}
                  {(recommendations.primary.length > 0 || recommendations.suggested.length > 0) && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">AI Recommendations</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            recommendations.primary.forEach(a => {
                              if (!wizardData.selectedAssessments.some(s => s.id === a.id)) {
                                toggleAssessment(a);
                              }
                            });
                          }}
                        >
                          Apply Recommendations
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {recommendations.primary.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Recommended for this role:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {recommendations.primary.map(a => (
                                <Badge
                                  key={a.id}
                                  variant={wizardData.selectedAssessments.some(s => s.id === a.id) ? 'default' : 'outline'}
                                  className="cursor-pointer text-xs"
                                  onClick={() => toggleAssessment(a)}
                                >
                                  {wizardData.selectedAssessments.some(s => s.id === a.id) && <Check className="h-3 w-3 mr-1" />}
                                  {a.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {recommendations.suggested.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Also consider:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {recommendations.suggested.map(a => (
                                <Badge
                                  key={a.id}
                                  variant={wizardData.selectedAssessments.some(s => s.id === a.id) ? 'default' : 'outline'}
                                  className="cursor-pointer text-xs"
                                  onClick={() => toggleAssessment(a)}
                                >
                                  {wizardData.selectedAssessments.some(s => s.id === a.id) && <Check className="h-3 w-3 mr-1" />}
                                  {a.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bundles */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Bundles</h3>
                        <p className="text-xs text-muted-foreground">Save up to 21% with pre-configured bundles</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bundles.map(bundle => {
                        const bundleAssessments = getBundleAssessments(bundle).filter(Boolean) as Assessment[];
                        return (
                          <BundleCard
                            key={bundle.id}
                            bundle={bundle}
                            bundleAssessments={bundleAssessments}
                            isSelected={wizardData.selectedBundle?.id === bundle.id}
                            isRecommended={recommendedBundle?.id === bundle.id}
                            onSelect={() => toggleBundle(bundle)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* All Assessments with Category Filter + Search */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">All Assessments</h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                        {([
                          { value: 'all', label: `All (${assessments.length})` },
                          { value: 'skills', label: `Skills (${assessments.filter(a => a.category === 'skills').length})` },
                          { value: 'behavioural', label: `Behavioural (${assessments.filter(a => a.category === 'behavioural').length})` },
                          { value: 'aptitude', label: `Aptitude (${assessments.filter(a => a.category === 'aptitude').length})` },
                        ] as const).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setDialogAssessmentCategory(opt.value)}
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                              dialogAssessmentCategory === opt.value
                                ? 'bg-background text-foreground shadow-sm'
                                : 'hover:bg-background/50 hover:text-foreground'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div className="relative flex-1 w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search assessments..."
                          value={dialogSearchQuery}
                          onChange={(e) => setDialogSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {assessments
                        .filter(a => dialogAssessmentCategory === 'all' || a.category === dialogAssessmentCategory)
                        .filter(a => !dialogSearchQuery || a.name.toLowerCase().includes(dialogSearchQuery.toLowerCase()) || a.description.toLowerCase().includes(dialogSearchQuery.toLowerCase()))
                        .map(assessment => {
                          const isInBundle = wizardData.selectedBundle?.assessmentIds.includes(assessment.id) || false;
                          const isSelected = isInBundle || wizardData.selectedAssessments.some(s => s.id === assessment.id);
                          const isRecommended = recommendations.primary.some(r => r.id === assessment.id);
                          const categoryIcon = assessment.category === 'skills' ? ClipboardCheck : assessment.category === 'behavioural' ? Users : Star;
                          const CategoryIcon = categoryIcon;
                          return (
                            <button
                              key={assessment.id}
                              type="button"
                              onClick={() => !isInBundle && toggleAssessment(assessment)}
                              className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                                isInBundle
                                  ? 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/30'
                              }`}
                            >
                              <Checkbox checked={isSelected} disabled={isInBundle} className="mt-1" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <CategoryIcon className={`h-5 w-5 ${isInBundle ? 'text-muted-foreground' : 'text-primary'}`} />
                                    <span className={`font-semibold ${isInBundle ? 'text-muted-foreground' : 'text-foreground'}`}>{assessment.name}</span>
                                    {isInBundle && (
                                      <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground">Included in bundle</Badge>
                                    )}
                                    {!isInBundle && isRecommended && (
                                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Recommended</Badge>
                                    )}
                                  </div>
                                  {!isInBundle && (
                                    <span className="font-bold text-foreground">${assessment.price}<span className="text-xs font-normal text-muted-foreground"> / candidate</span></span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{assessment.description}</p>
                                <ul className="grid grid-cols-2 gap-1">
                                  {assessment.useCases.map((useCase, i) => (
                                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <Check className="h-3 w-3 text-success shrink-0" />
                                      {useCase}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </button>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>

                {/* Summary Footer */}
                <div className="border-t pt-4 space-y-3">
                  {(wizardData.selectedBundle || wizardData.selectedAssessments.length > 0) && (
                    <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {wizardData.selectedBundle && (
                          <span className="text-success font-medium">{wizardData.selectedBundle.name}</span>
                        )}
                        {wizardData.selectedBundle && wizardData.selectedAssessments.length > 0 && (
                          <span> + {wizardData.selectedAssessments.length} additional</span>
                        )}
                        {!wizardData.selectedBundle && (
                          <span>{wizardData.selectedAssessments.length} selected</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {wizardData.selectedBundle && (
                          <span className="text-muted-foreground line-through text-xs">${getIndividualTotal()}</span>
                        )}
                        <span className="font-medium text-foreground">${getEffectivePrice()} / candidate</span>
                        {wizardData.selectedBundle && (
                          <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                            Save ${getBundleSavings()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <DialogFooter className="flex-row justify-between sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAssessmentDialogOpen(false);
                        setServicesDialogOpen(true);
                      }}
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Browse Services
                    </Button>
                    <Button type="button" onClick={() => setAssessmentDialogOpen(false)}>
                      Done
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>

            {/* Services Dialog */}
            <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Select Services</DialogTitle>
                  <DialogDescription>Choose verification and screening services for your candidates.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  {addOnServices.map((addon) => {
                    const isSelected = (wizardData.selectedAddOns || []).includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddOn(addon.id)}
                        className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <Checkbox checked={isSelected} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <addon.icon className="h-5 w-5 text-primary" />
                              <span className="font-semibold text-foreground">{addon.name}</span>
                            </div>
                            <span className="font-bold text-foreground">${addon.price}<span className="text-xs font-normal text-muted-foreground"> / candidate</span></span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{addon.description}</p>
                          <ul className="grid grid-cols-2 gap-1">
                            {addon.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Check className="h-3 w-3 text-success shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {(wizardData.selectedAddOns || []).length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{(wizardData.selectedAddOns || []).length} service{(wizardData.selectedAddOns || []).length !== 1 ? 's' : ''} selected</span>
                    <span className="font-medium text-foreground">+${getAddOnsTotal()} / candidate</span>
                  </div>
                )}
                <DialogFooter className="flex-row justify-between sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setServicesDialogOpen(false);
                      setAssessmentDialogOpen(true);
                    }}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Browse Assessments
                  </Button>
                  <Button type="button" onClick={() => setServicesDialogOpen(false)}>
                    Confirm Selection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Step 5: Complete Order */}
            {currentStep === 5 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-2">Complete Your Order</h2>
                <p className="text-muted-foreground mb-8">Review your selection and proceed to payment.</p>
                
                <div className="space-y-6">
                  {/* Add Candidates */}
                  <div className="p-6 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">Add Candidates</h3>
                        {wizardData.candidates.length > 0 && (
                          <Badge variant="secondary">{wizardData.candidates.length} added</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Candidate Entry Form */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="candFirstName" className="text-xs mb-1 block">First Name *</Label>
                          <Input
                            id="candFirstName"
                            placeholder="First name"
                            value={newCandidate.firstName || ''}
                            onChange={(e) => setNewCandidate(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="candLastName" className="text-xs mb-1 block">Last Name *</Label>
                          <Input
                            id="candLastName"
                            placeholder="Last name"
                            value={newCandidate.lastName || ''}
                            onChange={(e) => setNewCandidate(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="candEmail" className="text-xs block">Email *</Label>
                          <Input
                            id="candEmail"
                            type="email"
                            placeholder="candidate@email.com"
                            value={newCandidate.email || ''}
                            onChange={(e) => setNewCandidate(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <Button type="button" variant="outline" onClick={addCandidate} className="h-10">
                          <Plus className="h-4 w-4 mr-1" /> Add Candidate
                        </Button>
                      </div>
                    </div>

                    {/* Candidate List */}
                    {wizardData.candidates.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/70 text-muted-foreground text-xs">
                              <th className="text-left px-3 py-2 font-medium">Name</th>
                              <th className="text-left px-3 py-2 font-medium">Email</th>
                              
                              <th className="w-10 px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {wizardData.candidates.map((c) => (
                              <tr key={c.id} className="border-t border-border">
                                <td className="px-3 py-2 font-medium">{c.firstName} {c.lastName}</td>
                                <td className="px-3 py-2 text-muted-foreground">{c.email}</td>
                                
                                <td className="px-3 py-2">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeCandidate(c.id)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                        No candidates added yet. Add at least one candidate to proceed.
                      </p>
                    )}
                  </div>

                  {/* Selected Assessments Summary */}
                  {(wizardData.selectedBundle || wizardData.selectedAssessments.length > 0) && (
                    <div className="p-6 bg-muted/50 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">Assessments</h3>
                          <p className="text-sm text-muted-foreground">
                            {getAllSelectedAssessments().length} assessment{getAllSelectedAssessments().length !== 1 ? 's' : ''}
                            {wizardData.selectedBundle && wizardData.selectedAssessments.length > 0 && (
                              <span> ({wizardData.selectedBundle.assessmentIds.length} bundled + {wizardData.selectedAssessments.length} additional)</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${getEffectivePrice()}</div>
                          <div className="text-xs text-muted-foreground">per candidate</div>
                        </div>
                      </div>
                      {wizardData.selectedBundle && (
                        <div className="mt-4 border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{wizardData.selectedBundle.name} — Bundled:</h4>
                              <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                                Save ${getBundleSavings()}
                              </Badge>
                            </div>
                            <span className="font-semibold text-sm">${wizardData.selectedBundle.bundlePrice}</span>
                          </div>
                          <ul className="space-y-2">
                            {wizardData.selectedBundle.assessmentIds.map(id => {
                              const a = assessments.find(ass => ass.id === id);
                              if (!a) return null;
                              return (
                                <li key={a.id} className="flex items-center gap-2 text-sm p-2 bg-background rounded border">
                                  <span className="flex-1">{a.name}</span>
                                  <Badge variant="outline" className={`text-xs ${categoryColors[a.category] || ''}`}>
                                    {a.category}
                                  </Badge>
                                  <span className="text-muted-foreground line-through text-xs w-14 text-right">${a.price}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {wizardData.selectedAssessments.length > 0 && (
                        <div className={`${wizardData.selectedBundle ? 'mt-4' : 'mt-4 border-t pt-4'}`}>
                          <h4 className="font-medium text-sm mb-2">
                            {wizardData.selectedBundle ? 'Additional Assessments:' : 'Selected Assessments:'}
                          </h4>
                          <ul className="space-y-2">
                            {wizardData.selectedAssessments.map((a) => (
                              <li key={a.id} className="flex items-center gap-2 text-sm p-2 bg-background rounded border">
                                <span className="flex-1">{a.name}</span>
                                <Badge variant="outline" className={`text-xs ${categoryColors[a.category] || ''}`}>
                                  {a.category}
                                </Badge>
                                <span className="font-medium w-14 text-right">${a.price}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Add-On Services */}
                  {(wizardData.selectedAddOns || []).length > 0 && (
                    <div className="p-6 bg-muted/50 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">Services</h3>
                          <p className="text-sm text-muted-foreground">
                            {(wizardData.selectedAddOns || []).length} service{(wizardData.selectedAddOns || []).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${getAddOnsTotal()}</div>
                          <div className="text-xs text-muted-foreground">per candidate</div>
                        </div>
                      </div>
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-medium text-sm mb-2">Services Included:</h4>
                        <ul className="space-y-2">
                          {(wizardData.selectedAddOns || []).map(id => {
                            const addon = addOnServices.find(a => a.id === id);
                            if (!addon) return null;
                            return (
                              <li key={id} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                                <div className="flex items-center gap-2">
                                  <addon.icon className="h-4 w-4 text-primary" />
                                  <span>{addon.name}</span>
                                </div>
                                <span className="font-medium">${addon.price}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Position Summary */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <Label className="font-medium mb-2 block">Position</Label>
                    <p className="text-foreground font-semibold">{wizardData.position.title || 'Not specified'}</p>
                    <p className="text-sm text-muted-foreground">
                      {wizardData.position.location} • {wizardData.position.employmentType}
                    </p>
                  </div>

                  {/* Order Total */}
                  <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Assessments</span>
                        <span className="font-medium">${getEffectivePrice()}</span>
                      </div>
                      {(wizardData.selectedAddOns || []).length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Services</span>
                          <span className="font-medium">${getAddOnsTotal()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                        <span className="text-sm font-medium">Cost per candidate</span>
                        <span className="font-bold text-primary">
                          ${getEffectivePrice() + getAddOnsTotal()}
                        </span>
                      </div>
                      {wizardData.candidates.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Candidates</span>
                          <span className="font-medium">× {wizardData.candidates.length}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                        <span className="text-lg font-medium">Order Total</span>
                        <span className="text-3xl font-bold text-primary">
                          ${(getEffectivePrice() + getAddOnsTotal()) * (wizardData.candidates.length || 0)}
                        </span>
                      </div>
                    </div>
                    {wizardData.candidates.length === 0 && (
                      <p className="text-sm text-warning">
                        Add at least one candidate above to complete your order.
                      </p>
                    )}
                  </div>

                  {/* Payment Consent */}
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Checkbox 
                      id="paymentConsent" 
                      checked={candidateConsentConfirmed}
                      onCheckedChange={(checked) => setCandidateConsentConfirmed(checked as boolean)}
                    />
                    <Label htmlFor="paymentConsent" className="text-sm leading-relaxed cursor-pointer">
                      I agree to the terms of service and understand that payment will be processed upon clicking "Complete Order".
                    </Label>
                  </div>

                  {registrationError && (
                    <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive">{registrationError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={isAnalyzing || isRegistering}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {currentStep === 1 && <div />}
            
            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleContinue}
                disabled={!canProceed() || isAnalyzing}
                className="hero-gradient shadow-glow ml-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handlePayment}
                disabled={!candidateConsentConfirmed || isRegistering || isFinalizingPayment || wizardData.candidates.length === 0}
                className="hero-gradient shadow-glow ml-auto"
              >
                {isRegistering || isFinalizingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isFinalizingPayment ? 'Verifying Payment...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Complete Order — ${(getEffectivePrice() + getAddOnsTotal()) * (wizardData.candidates.length || 0)}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wizard;
