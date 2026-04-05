import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
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
import { FilterButtonGroup } from '@/components/ui/filter-button-group';
import {
  Building2,
  MapPin,
  CreditCard,
  Coins,
  Image,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Star,
  Check,
  AlertCircle,
  Globe,
  Phone,
  Mail,
  Clock,
  Calendar,
  Languages,
  DollarSign,
  Building,
  FileText,
  Zap,
  Users,
  Shield,
  Sparkles,
  Upload,
  RotateCcw,
  TrendingUp,
  ShoppingCart,
  Info,
} from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { toast } from 'sonner';
import {
  CompanyProfile,
  Address,
  SettingsSubTab,
  CompanySize,
  AddressType,
  CreditPurchase,
} from '@/types/assessment';
import {
  industries,
  companySizes,
  timezones,
  dateFormats,
  languages,
  currencies,
  countries,
  countryCodes,
  addressTypes,
  paymentMethodColors,
  creditTiers,
  getCreditTierPrice,
} from '@/lib/constants';

// Default email template constants
const DEFAULT_EMAIL_SUBJECT = 'You have been invited to complete an assessment for [Position Title]';
const DEFAULT_EMAIL_MESSAGE = `Hi [Name],

You have been invited to complete an assessment for the [Position Title] position at [Company].

This assessment will help us understand your skills and how you might fit within our team. Please complete the assessment at your earliest convenience.

We look forward to reviewing your results.

Best regards,
The [Company] Team`;

const defaultCompanyProfile: CompanyProfile = {
  id: '',
  name: '',
  industry: 'Other',
  size: '1-10',
  website: '',
  primaryEmail: '',
  primaryPhoneCountryCode: '+61',
  primaryPhone: '',
  billingEmail: '',
  billingCurrency: 'USD',
  country: '',
  timezone: 'Australia/Sydney',
  dateFormat: 'DD/MM/YYYY',
  language: 'en-AU',
  invitationEmailSubject: DEFAULT_EMAIL_SUBJECT,
  invitationEmailMessage: DEFAULT_EMAIL_MESSAGE,
  addresses: [],
  contacts: [],
  paymentMethods: [],
  creditBalance: {
    id: 'credit-balance',
    availableCredits: 0,
    totalPurchased: 0,
    totalUsed: 0,
    purchaseHistory: [],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneCountryCode?: string;
  positionTitle?: string;
  status: 'active' | 'pending' | 'deactivated';
}

interface CompanySettingsProps {
  initialSubTab?: SettingsSubTab;
  teamMembers?: TeamMember[];
  profileData?: Partial<CompanyProfile> | null;
  onSaveProfile?: (payload: Partial<CompanyProfile>) => Promise<void> | void;
}

function normalizeCreditPurchase(entry: unknown, index: number): CreditPurchase {
  const row = (entry && typeof entry === 'object') ? (entry as Record<string, unknown>) : {};
  return {
    id: (typeof row.id === 'string' && row.id) ? row.id : `credit-purchase-${index}`,
    quantity: Number(row.quantity || 0),
    pricePerCredit: Number(row.pricePerCredit || 0),
    totalPaid: Number(row.totalPaid || 0),
    purchasedAt: row.purchasedAt ? new Date(String(row.purchasedAt)) : new Date(),
  };
}

function normalizeCreditBalance(value: unknown) {
  const source = (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};
  const purchaseHistory = Array.isArray(source.purchaseHistory)
    ? source.purchaseHistory.map((entry, index) => normalizeCreditPurchase(entry, index))
    : [];

  return {
    id: (typeof source.id === 'string' && source.id) ? source.id : 'credit-balance',
    availableCredits: Number(source.availableCredits || 0),
    totalPurchased: Number(
      source.totalPurchased ??
      purchaseHistory.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    ),
    totalUsed: Number(source.totalUsed || 0),
    lastPurchase: source.lastPurchase ? normalizeCreditPurchase(source.lastPurchase, 0) : undefined,
    purchaseHistory,
  };
}

export function CompanySettings({
  initialSubTab = 'company',
  teamMembers = [],
  profileData = null,
  onSaveProfile,
}: CompanySettingsProps) {
  const [subTab, setSubTab] = useState<SettingsSubTab>(initialSubTab);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    ...defaultCompanyProfile,
    ...(profileData || {}),
    creditBalance: normalizeCreditBalance((profileData as any)?.creditBalance),
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Location dialog state
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Address | null>(null);
  const [locationForm, setLocationForm] = useState<Partial<Address>>({});
  
  // Email editing state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState((profileData?.invitationEmailSubject as string) || defaultCompanyProfile.invitationEmailSubject || '');
  const [emailMessage, setEmailMessage] = useState((profileData?.invitationEmailMessage as string) || defaultCompanyProfile.invitationEmailMessage || '');
  
  // Plan comparison dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  
  // Add Contact dialog state
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '+61',
    phone: '',
    positionTitle: '',
  });

  useEffect(() => {
    if (!profileData) return;
    setCompanyProfile((prev) => ({
      ...prev,
      ...profileData,
      addresses: Array.isArray(profileData.addresses) ? profileData.addresses as Address[] : prev.addresses,
      contacts: Array.isArray(profileData.contacts) ? profileData.contacts : prev.contacts,
      paymentMethods: Array.isArray(profileData.paymentMethods) ? profileData.paymentMethods : prev.paymentMethods,
      creditBalance: normalizeCreditBalance(profileData.creditBalance),
      createdAt: profileData.createdAt ? new Date(profileData.createdAt as any) : prev.createdAt,
      updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt as any) : prev.updatedAt,
    }));
    setEmailSubject((profileData.invitationEmailSubject as string) || DEFAULT_EMAIL_SUBJECT);
    setEmailMessage((profileData.invitationEmailMessage as string) || DEFAULT_EMAIL_MESSAGE);
  }, [profileData]);
  
  // Form handlers
  const handleProfileChange = (field: keyof CompanyProfile, value: any) => {
    setCompanyProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handler to sync contact person details
  const handleContactPersonChange = (userId: string) => {
    const selectedMember = teamMembers.find(m => m.id === userId);
    if (selectedMember) {
      setCompanyProfile(prev => ({
        ...prev,
        primaryContactUserId: userId,
        primaryEmail: selectedMember.email,
        primaryPhone: selectedMember.phone || '',
        primaryPhoneCountryCode: selectedMember.phoneCountryCode || '+61',
      }));
      setHasUnsavedChanges(true);
      toast.success(`Contact synced from ${selectedMember.firstName} ${selectedMember.lastName}`);
    }
  };

  // Handler to add new contact
  const handleAddNewContact = () => {
    if (!newContactForm.firstName || !newContactForm.lastName || !newContactForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // In a real app, this would add to the team members list
    const newId = `user-${Date.now()}`;
    
    setCompanyProfile(prev => ({
      ...prev,
      primaryContactUserId: newId,
      primaryEmail: newContactForm.email,
      primaryPhone: newContactForm.phone,
      primaryPhoneCountryCode: newContactForm.phoneCountryCode,
    }));
    
    toast.success(`${newContactForm.firstName} ${newContactForm.lastName} added as primary contact`);
    setAddContactDialogOpen(false);
    setNewContactForm({
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '+61',
      phone: '',
      positionTitle: '',
    });
    setHasUnsavedChanges(true);
  };
  
  const handleSaveProfile = async () => {
    try {
      await onSaveProfile?.({
        ...companyProfile,
        invitationEmailSubject: emailSubject,
        invitationEmailMessage: emailMessage,
      });
      toast.success('Company profile saved successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save company profile');
    }
  };
  
  // Location handlers
  const handleAddLocation = () => {
    setEditingLocation(null);
    setLocationForm({
      type: 'branch',
      isPrimary: false,
      country: 'Australia',
    });
    setLocationDialogOpen(true);
  };
  
  const handleEditLocation = (location: Address) => {
    setEditingLocation(location);
    setLocationForm(location);
    setLocationDialogOpen(true);
  };
  
  const handleSaveLocation = () => {
    if (!locationForm.label || !locationForm.street1 || !locationForm.city) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (editingLocation) {
      setCompanyProfile(prev => ({
        ...prev,
        addresses: prev.addresses.map(addr =>
          addr.id === editingLocation.id ? { ...addr, ...locationForm } as Address : addr
        ),
      }));
      toast.success('Location updated');
    } else {
      const newLocation: Address = {
        id: `addr-${Date.now()}`,
        label: locationForm.label!,
        street1: locationForm.street1!,
        street2: locationForm.street2,
        city: locationForm.city!,
        state: locationForm.state || '',
        postalCode: locationForm.postalCode || '',
        country: locationForm.country || 'Australia',
        isPrimary: locationForm.isPrimary || false,
        type: locationForm.type || 'branch',
      };
      setCompanyProfile(prev => ({
        ...prev,
        addresses: [...prev.addresses, newLocation],
      }));
      toast.success('Location added');
    }
    
    setLocationDialogOpen(false);
    setLocationForm({});
  };
  
  const handleDeleteLocation = (locationId: string) => {
    setCompanyProfile(prev => ({
      ...prev,
      addresses: prev.addresses.filter(addr => addr.id !== locationId),
    }));
    toast.success('Location removed');
  };
  
  const handleSetPrimaryLocation = (locationId: string) => {
    setCompanyProfile(prev => ({
      ...prev,
      addresses: prev.addresses.map(addr => ({
        ...addr,
        isPrimary: addr.id === locationId,
      })),
    }));
    toast.success('Primary location updated');
  };
  
  // Credit tier selection state (default to 100 credits)
  const [selectedTier, setSelectedTier] = useState<number>(100);
  
  // Email preview helpers
  const getPreviewText = (text: string) => {
    return text
      .replace(/\[Name\]/g, 'Sarah')
      .replace(/\[Position Title\]/g, 'Software Engineer')
      .replace(/\[Company\]/g, companyProfile.name);
  };
  
  const handleSaveEmail = () => {
    handleProfileChange('invitationEmailSubject', emailSubject);
    handleProfileChange('invitationEmailMessage', emailMessage);
    setIsEditingEmail(false);
    toast.success('Email template saved');
  };
  
  const handleCancelEmailEdit = () => {
    setEmailSubject(companyProfile.invitationEmailSubject || '');
    setEmailMessage(companyProfile.invitationEmailMessage || '');
    setIsEditingEmail(false);
  };
  
  const handleResetEmailTemplate = () => {
    setEmailSubject(DEFAULT_EMAIL_SUBJECT);
    setEmailMessage(DEFAULT_EMAIL_MESSAGE);
    handleProfileChange('invitationEmailSubject', DEFAULT_EMAIL_SUBJECT);
    handleProfileChange('invitationEmailMessage', DEFAULT_EMAIL_MESSAGE);
    setIsEditingEmail(false);
    toast.success('Email template reset to default');
  };
  
  const subTabOptions = [
    { value: 'company', label: 'Company Info', icon: Building2 },
    { value: 'locations', label: 'Locations', icon: MapPin },
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'credits', label: 'Credits', icon: Coins },
    { value: 'branding', label: 'Branding', icon: Image },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {subTabOptions.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setSubTab(opt.value as SettingsSubTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                subTab === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {opt.label}
            </button>
          );
        })}
      </div>
      
      {/* Company Information Sub-tab */}
      {subTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={companyProfile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Business Name</Label>
                <Input
                  value={companyProfile.businessName || ''}
                  onChange={(e) => handleProfileChange('businessName', e.target.value)}
                  placeholder="Trading or DBA name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Website</Label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={companyProfile.website || ''}
                    onChange={(e) => handleProfileChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Street Address</Label>
                <Input
                  value={companyProfile.street1 || ''}
                  onChange={(e) => handleProfileChange('street1', e.target.value)}
                  placeholder="123 Business Street"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Street Address 2</Label>
                <Input
                  value={companyProfile.street2 || ''}
                  onChange={(e) => handleProfileChange('street2', e.target.value)}
                  placeholder="Suite, Level, Building (optional)"
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={companyProfile.city || ''}
                    onChange={(e) => handleProfileChange('city', e.target.value)}
                    placeholder="Sydney"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>State / Province</Label>
                  <Input
                    value={companyProfile.state || ''}
                    onChange={(e) => handleProfileChange('state', e.target.value)}
                    placeholder="NSW"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={companyProfile.postalCode || ''}
                    onChange={(e) => handleProfileChange('postalCode', e.target.value)}
                    placeholder="2000"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Select
                    value={companyProfile.primaryCountry || ''}
                    onValueChange={(v) => handleProfileChange('primaryCountry', v)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Business Details */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Business Details
            </h3>
            <div className="flex flex-col space-y-4 flex-1">
              <div>
                <Label>Industry *</Label>
                <Select
                  value={companyProfile.industry}
                  onValueChange={(v) => handleProfileChange('industry', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Size *</Label>
                <Select
                  value={companyProfile.size}
                  onValueChange={(v) => handleProfileChange('size', v as CompanySize)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map(size => (
                      <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Founded Year</Label>
                <Input
                  type="number"
                  value={companyProfile.foundedYear || ''}
                  onChange={(e) => handleProfileChange('foundedYear', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 2015"
                  className="mt-1.5"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <Label>Description</Label>
                <Textarea
                  value={companyProfile.description || ''}
                  onChange={(e) => handleProfileChange('description', e.target.value)}
                  placeholder="Brief description of your company..."
                  className="mt-1.5 resize-none flex-1 min-h-[120px]"
                  rows={5}
                />
              </div>
            </div>
          </div>
          
          {/* Tax & Legal */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Tax & Legal
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Tax ID / ABN</Label>
                <Input
                  value={companyProfile.taxId || ''}
                  onChange={(e) => handleProfileChange('taxId', e.target.value)}
                  placeholder="e.g., 12 345 678 901"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input
                  value={companyProfile.registrationNumber || ''}
                  onChange={(e) => handleProfileChange('registrationNumber', e.target.value)}
                  placeholder="e.g., ACN 123 456 789"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Country *</Label>
                <Select
                  value={companyProfile.country || ''}
                  onValueChange={(v) => handleProfileChange('country', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Primary Contact Person</Label>
                <div className="flex gap-2 mt-1.5">
                  <Select
                    value={companyProfile.primaryContactUserId || ''}
                    onValueChange={handleContactPersonChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers
                        .filter(m => m.status === 'active')
                        .map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setAddContactDialogOpen(true)}
                    title="Add new team member"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecting a contact will sync their email and phone details below
                </p>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  Primary Email *
                  {companyProfile.primaryContactUserId && (
                    <Badge variant="secondary" className="text-xs font-normal">Synced from contact</Badge>
                  )}
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={companyProfile.primaryEmail}
                    onChange={(e) => handleProfileChange('primaryEmail', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  Primary Phone
                  {companyProfile.primaryContactUserId && (
                    <Badge variant="secondary" className="text-xs font-normal">Synced from contact</Badge>
                  )}
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Select
                    value={companyProfile.primaryPhoneCountryCode || '+61'}
                    onValueChange={(v) => handleProfileChange('primaryPhoneCountryCode', v)}
                  >
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
                    type="tel"
                    value={companyProfile.primaryPhone || ''}
                    onChange={(e) => handleProfileChange('primaryPhone', e.target.value)}
                    placeholder="2 1234 5678"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Preferences */}
          <div className="bg-card rounded-xl border border-border p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Timezone</Label>
                <Select
                  value={companyProfile.timezone}
                  onValueChange={(v) => handleProfileChange('timezone', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date Format</Label>
                <Select
                  value={companyProfile.dateFormat}
                  onValueChange={(v) => handleProfileChange('dateFormat', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map(df => (
                      <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <Select
                  value={companyProfile.language}
                  onValueChange={(v) => handleProfileChange('language', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="lg:col-span-2 flex items-center justify-between">
            {hasUnsavedChanges && (
              <p className="text-sm text-warning flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                You have unsaved changes
              </p>
            )}
            <Button 
              variant="hero" 
              onClick={handleSaveProfile}
              className="ml-auto"
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
      
      {/* Locations Sub-tab */}
      {subTab === 'locations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Office Locations</h3>
              <p className="text-sm text-muted-foreground">Manage your company's office locations and addresses</p>
            </div>
            <Button variant="hero" onClick={handleAddLocation}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyProfile.addresses.map(address => (
              <div
                key={address.id}
                className="bg-card rounded-xl border border-border p-5 relative"
              >
                {address.isPrimary && (
                  <Badge className="absolute top-3 right-3 bg-primary/10 text-primary border-primary/20">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Primary
                  </Badge>
                )}
                
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{address.label}</h4>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {addressTypes.find(t => t.value === address.type)?.label || address.type}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-0.5 mb-4">
                  <p>{address.street1}</p>
                  {address.street2 && <p>{address.street2}</p>}
                  <p>{address.city}, {address.state} {address.postalCode}</p>
                  <p>{address.country}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLocation(address)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="px-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      {!address.isPrimary && (
                        <DropdownMenuItem onClick={() => handleSetPrimaryLocation(address.id)}>
                          <Star className="h-4 w-4 mr-2" />
                          Set as Primary
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteLocation(address.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            
            {/* Add Location Card */}
            <button
              onClick={handleAddLocation}
              className="bg-muted/50 rounded-xl border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-2 hover:bg-muted/80 hover:border-primary/50 transition-colors min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Add New Location</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Billing Sub-tab */}
      {subTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Billing Contact */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Billing Contact
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Billing Email *</Label>
                <Input
                  type="email"
                  value={companyProfile.billingEmail}
                  onChange={(e) => handleProfileChange('billingEmail', e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Invoices and receipts will be sent to this email
                </p>
              </div>
            </div>
          </div>
          
          {/* Invoice Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Settings
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Billing Currency</Label>
                <Select
                  value={companyProfile.billingCurrency}
                  onValueChange={(v) => handleProfileChange('billingCurrency', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.symbol} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm">Require PO Number</Label>
                  <p className="text-xs text-muted-foreground">Require purchase order number for invoices</p>
                </div>
                <Switch
                  checked={companyProfile.requirePO}
                  onCheckedChange={(v) => handleProfileChange('requirePO', v)}
                />
              </div>
              <div>
                <Label>Invoice Notes</Label>
                <Textarea
                  value={companyProfile.invoiceNotes || ''}
                  onChange={(e) => handleProfileChange('invoiceNotes', e.target.value)}
                  placeholder="Additional notes to appear on invoices..."
                  className="mt-1.5 resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="bg-card rounded-xl border border-border p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Methods
              </h3>
              <Badge variant="outline" className="border-primary/20 text-primary">
                Managed in Checkout
              </Badge>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 mb-4">
              <p className="text-sm text-foreground">
                Saved cards and wallet methods are created during secure checkout and synced back here when available.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                HRM8 Assess does not support adding, deleting, or changing payment methods from settings yet. To update billing methods, complete the next checkout with the card you want to use or contact support.
              </p>
            </div>

            {companyProfile.paymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyProfile.paymentMethods.map(pm => (
                  <div
                    key={pm.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      pm.isDefault
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {pm.cardBrand || pm.type.replace('_', ' ')}
                          </p>
                          {pm.last4 && (
                            <p className="text-sm text-muted-foreground">•••• {pm.last4}</p>
                          )}
                        </div>
                      </div>
                      {pm.isDefault && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">Default</Badge>
                      )}
                    </div>

                    {pm.expiryMonth && pm.expiryYear && (
                      <p className="text-sm text-muted-foreground">
                        Expires {pm.expiryMonth.toString().padStart(2, '0')}/{pm.expiryYear}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No saved payment methods yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your first successful checkout will attach the payment method details that can be shown here.
                </p>
              </div>
            )}
          </div>
          
          {/* Save Button */}
          <div className="lg:col-span-2 flex justify-end">
            <Button variant="hero" onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </div>
      )}
      
      {/* Credits Sub-tab */}
      {subTab === 'credits' && (
        <div className="space-y-6">
          {/* Credit Balance Summary */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Credit Balance</h3>
                  <p className="text-muted-foreground">Purchase credits to run assessments</p>
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {companyProfile.creditBalance.availableCredits}
                </div>
                <div className="text-sm text-muted-foreground">Available Credits</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {companyProfile.creditBalance.totalPurchased}
                </div>
                <div className="text-sm text-muted-foreground">Total Purchased</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {companyProfile.creditBalance.totalUsed}
                </div>
                <div className="text-sm text-muted-foreground">Total Used</div>
              </div>
            </div>
            
            {/* Low Balance Warning */}
            {companyProfile.creditBalance.availableCredits < 10 && (
              <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 text-warning rounded-lg p-4">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Low credit balance</p>
                  <p className="text-sm opacity-80">You have less than 10 credits remaining. Purchase more to continue running assessments.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Purchase Credits */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Purchase Credits
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Buy credits at $5 each (or less with volume discounts) — credits never expire
            </p>
            
            {/* Tier Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {creditTiers.map(tier => {
                const priceInfo = getCreditTierPrice(tier.quantity);
                const isSelected = selectedTier === tier.quantity;
                
                return (
                  <button
                    key={tier.quantity}
                    onClick={() => setSelectedTier(tier.quantity)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    {tier.discount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-success text-white text-xs">
                        {tier.discount}% OFF
                      </Badge>
                    )}
                    <div className="text-2xl font-bold text-foreground mb-1">{tier.quantity}</div>
                    <div className="text-xs text-muted-foreground mb-2">credits</div>
                    <div className="text-sm font-semibold text-foreground">
                      ${priceInfo?.total.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${tier.pricePerCredit}/credit
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Selected Tier Summary */}
            {(() => {
              const priceInfo = getCreditTierPrice(selectedTier);
              const tier = creditTiers.find(t => t.quantity === selectedTier);
              if (!priceInfo || !tier) return null;
              
              return (
                <div className="bg-muted/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold text-foreground">{selectedTier} Credits</span>
                      {priceInfo.savings > 0 && (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Save ${priceInfo.savings}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Total: <strong className="text-foreground">${priceInfo.total.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>${priceInfo.pricePerCredit.toFixed(2)} per credit</span>
                    </div>
                  </div>
                  <Button variant="hero" size="lg">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase {selectedTier} Credits
                  </Button>
                </div>
              );
            })()}
          </div>
          
          {/* Purchase History */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Purchase History
            </h3>
            
            {companyProfile.creditBalance.purchaseHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Credits</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Price/Credit</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyProfile.creditBalance.purchaseHistory.map(purchase => (
                      <tr key={purchase.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-4 text-sm text-foreground">
                          {format(purchase.purchasedAt, 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{purchase.quantity}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          ${purchase.pricePerCredit.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground text-right font-medium">
                          ${purchase.totalPaid.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No purchase history yet</p>
              </div>
            )}
          </div>
          
          {/* How Credits Work */}
          <div className="bg-muted/30 rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              How Credits Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">1 credit = $5 value</p>
                  <p className="text-sm text-muted-foreground">Assessments cost 4-10 credits based on complexity</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Credits never expire</p>
                  <p className="text-sm text-muted-foreground">Use your credits whenever you need them</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Bundle discounts ~20%</p>
                  <p className="text-sm text-muted-foreground">Assessment bundles cost fewer credits than individual tests</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Volume savings up to 30%</p>
                  <p className="text-sm text-muted-foreground">Buy 1,000 credits at just $3.50 each</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Branding Sub-tab */}
      {subTab === 'branding' && (
        <div className="space-y-6">
          {/* Email Logo */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Email Logo
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This logo will appear at the top of assessment invitation emails sent to candidates.
            </p>
            
            {companyProfile.emailLogoUrl ? (
              <div className="flex items-center gap-4">
                <img 
                  src={companyProfile.emailLogoUrl} 
                  alt="Email logo" 
                  className="h-12 max-w-[200px] object-contain border rounded-lg p-2 bg-white" 
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Change</Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleProfileChange('emailLogoUrl', undefined)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer max-w-xs">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 2MB (recommended: 200x50px)
                </p>
              </div>
            )}
          </div>
          
          {/* Invitation Email Editor */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Invitation Email
              </h3>
              {!isEditingEmail && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingEmail(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            
            {/* Placeholder Help */}
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                Available placeholders (will be replaced with actual candidate and position data):
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-mono text-xs">[Name]</Badge>
                <Badge variant="secondary" className="font-mono text-xs">[Position Title]</Badge>
                <Badge variant="secondary" className="font-mono text-xs">[Company]</Badge>
              </div>
            </div>
            
            {isEditingEmail ? (
              <div className="space-y-4">
                <div>
                  <Label>Subject Line</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Message Body</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Enter your invitation message..."
                    className="mt-1.5 min-h-[200px] font-mono text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleResetEmailTemplate}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelEmailEdit}>
                      Cancel
                    </Button>
                    <Button variant="hero" onClick={handleSaveEmail}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Subject</p>
                  <p className="text-sm text-foreground font-medium">
                    {companyProfile.invitationEmailSubject}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {companyProfile.invitationEmailMessage}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Live Email Preview */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Email Preview
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This is how your invitation email will appear to candidates.
            </p>
            
            <div className="bg-muted rounded-lg p-6">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-md mx-auto border">
                {/* Email Header with Logo */}
                <div className="bg-primary/10 p-4 border-b text-center">
                  {companyProfile.emailLogoUrl ? (
                    <img 
                      src={companyProfile.emailLogoUrl} 
                      alt="Company logo"
                      className="h-10 mx-auto" 
                    />
                  ) : (
                    <div className="w-24 h-8 bg-muted rounded mx-auto" />
                  )}
                </div>
                
                {/* Email Content */}
                <div className="p-6">
                  {/* Subject */}
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {getPreviewText(isEditingEmail ? emailSubject : (companyProfile.invitationEmailSubject || ''))}
                  </h4>
                  
                  {/* Message Body */}
                  <div className="text-sm text-gray-600 whitespace-pre-wrap mb-6 leading-relaxed">
                    {getPreviewText(isEditingEmail ? emailMessage : (companyProfile.invitationEmailMessage || ''))}
                  </div>
                  
                  {/* CTA Button */}
                  <button className="w-full py-3 px-4 rounded-lg bg-primary text-white font-medium">
                    Start Assessment
                  </button>
                </div>
                
                {/* Email Footer */}
                <div className="bg-gray-50 p-4 text-center border-t">
                  <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} {companyProfile.name}. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation 
                ? 'Update the details for this office location'
                : 'Add a new office location to your company profile'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Location Name *</Label>
                <Input
                  value={locationForm.label || ''}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Headquarters, Sydney Office"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Location Type</Label>
                <Select
                  value={locationForm.type}
                  onValueChange={(v) => setLocationForm(prev => ({ ...prev, type: v as AddressType }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {addressTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={locationForm.isPrimary || false}
                    onCheckedChange={(v) => setLocationForm(prev => ({ ...prev, isPrimary: v }))}
                  />
                  <Label className="mb-0">Set as Primary</Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label>Street Address *</Label>
              <Input
                value={locationForm.street1 || ''}
                onChange={(e) => setLocationForm(prev => ({ ...prev, street1: e.target.value }))}
                placeholder="123 Business Street"
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label>Address Line 2</Label>
              <Input
                value={locationForm.street2 || ''}
                onChange={(e) => setLocationForm(prev => ({ ...prev, street2: e.target.value }))}
                placeholder="Suite, Level, Building"
                className="mt-1.5"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  value={locationForm.city || ''}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, city: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>State / Province</Label>
                <Input
                  value={locationForm.state || ''}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, state: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Postal Code</Label>
                <Input
                  value={locationForm.postalCode || ''}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Select
                  value={locationForm.country}
                  onValueChange={(v) => setLocationForm(prev => ({ ...prev, country: v }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleSaveLocation}>
              {editingLocation ? 'Save Changes' : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Contact Dialog */}
      <Dialog open={addContactDialogOpen} onOpenChange={setAddContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member who will become the primary contact.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={newContactForm.firstName}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={newContactForm.lastName}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Smith"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={newContactForm.email}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.smith@company.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="flex gap-2 mt-1.5">
                <Select
                  value={newContactForm.phoneCountryCode}
                  onValueChange={(v) => setNewContactForm(prev => ({ ...prev, phoneCountryCode: v }))}
                >
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
                  type="tel"
                  value={newContactForm.phone}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="2 1234 5678"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Position Title</Label>
              <Input
                value={newContactForm.positionTitle}
                onChange={(e) => setNewContactForm(prev => ({ ...prev, positionTitle: e.target.value }))}
                placeholder="HR Manager"
                className="mt-1.5"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleAddNewContact}>
              Add & Select as Primary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
