/**
 * HRM8-Assess API Client
 * Handles communication with the hrm8-backend for registration and auth
 */

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL as string | undefined;

if (!RAW_API_BASE_URL || !RAW_API_BASE_URL.trim()) {
    throw new Error('Missing VITE_API_URL. Set it in your environment (e.g. .env).');
}

const API_BASE_URL = RAW_API_BASE_URL.trim().replace(/\/+$/, '');

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: string[];
}

interface RegisterRequest {
    companyName: string;
    companyWebsite: string;
    country: string;
    industry: string;
    companySize?: string;
    billingEmail?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    mobile?: string;
    mobileCountryCode?: string;
    jobTitle?: string;
    acceptTerms: boolean;
}

interface RegisterResponse {
    companyId: string;
    userId: string;
    email: string;
    sessionId?: string;
    verificationRequired: boolean;
    message: string;
}

interface BootstrapRequest {
    companyName: string;
    workEmail: string;
    password: string;
    acceptTerms: boolean;
}

interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    company: {
        id: string;
        name: string;
        domain: string;
        verificationStatus: string;
        industry?: string;
        size?: string;
    };
}

class ApiClient {
    private baseURL: string;
    private readonly assessSessionStorageKey = 'hrm8_assess_session_id';

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private getStoredSessionId(): string | null {
        if (typeof window === 'undefined') return null;
        const value = window.localStorage.getItem(this.assessSessionStorageKey);
        return value && value.trim() ? value : null;
    }

    private storeSessionId(sessionId?: string | null): void {
        if (typeof window === 'undefined') return;
        if (sessionId && sessionId.trim()) {
            window.localStorage.setItem(this.assessSessionStorageKey, sessionId.trim());
            return;
        }
        window.localStorage.removeItem(this.assessSessionStorageKey);
    }

    private persistSessionIdFromResponse(payload: unknown): void {
        if (!payload || typeof payload !== 'object') return;
        const root = payload as Record<string, unknown>;
        const data = (root.data && typeof root.data === 'object') ? (root.data as Record<string, unknown>) : null;
        const sessionId =
            (typeof root.sessionId === 'string' && root.sessionId) ||
            (data && typeof data.sessionId === 'string' ? data.sessionId : null);
        if (sessionId) {
            this.storeSessionId(sessionId);
        }
    }

    private buildHeaders(extraHeaders?: HeadersInit, includeJsonContentType: boolean = true): Record<string, string> {
        const headers: Record<string, string> = {};
        if (includeJsonContentType) {
            headers['Content-Type'] = 'application/json';
        }

        if (extraHeaders && !Array.isArray(extraHeaders) && !(extraHeaders instanceof Headers)) {
            Object.assign(headers, extraHeaders as Record<string, string>);
        } else if (Array.isArray(extraHeaders)) {
            for (const [key, value] of extraHeaders) {
                headers[key] = value;
            }
        } else if (extraHeaders instanceof Headers) {
            extraHeaders.forEach((value, key) => {
                headers[key] = value;
            });
        }

        const headerKeys = new Set(Object.keys(headers).map((key) => key.toLowerCase()));
        const sessionId = this.getStoredSessionId();
        if (sessionId && !headerKeys.has('x-session-id')) {
            headers['x-session-id'] = sessionId;
        }

        return headers;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: this.buildHeaders(options.headers),
            credentials: 'include', // Important for cookies
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            this.persistSessionIdFromResponse(data);

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || `HTTP ${response.status}: ${response.statusText}`,
                    errors: data.errors,
                };
            }

            return data as ApiResponse<T>;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    async login(data: { email: string; password: string }): Promise<ApiResponse<RegisterResponse>> {
        return this.request<RegisterResponse>('/api/assess/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
        return this.request<RegisterResponse>('/api/assess/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async bootstrapSignup(data: BootstrapRequest): Promise<ApiResponse<RegisterResponse>> {
        return this.request<RegisterResponse>('/api/assess/signup/bootstrap', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getCurrentUser(): Promise<ApiResponse<UserData>> {
        return this.request<UserData>('/api/assess/me', {
            method: 'GET',
        });
    }

    async getAssessDashboardMeta(): Promise<ApiResponse<{
        currentUser: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
            phone?: string;
            phoneCountryCode?: string;
            positionTitle?: string;
            joinedAt?: string;
            lastActiveAt?: string;
        };
        teamMembers: Array<{
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            phoneCountryCode?: string;
            positionTitle?: string;
            role: string;
            status: string;
            invitedAt?: string;
            joinedAt?: string;
            lastActiveAt?: string;
        }>;
        invoices: Array<{
            id: string;
            invoiceNumber: string;
            date: string;
            dueDate: string;
            amount: number;
            status: 'paid' | 'pending' | 'overdue';
            description: string;
            items?: Array<{ name: string; quantity: number; price: number }>;
            currency?: string;
            paidAt?: string;
        }>;
        sessions: Array<{
            id: string;
            sessionId: string;
            createdAt: string;
            lastActivity: string;
            expiresAt: string;
            isCurrent: boolean;
        }>;
        companyProfile: Record<string, unknown>;
    }>> {
        return this.request('/api/assess/dashboard/meta', {
            method: 'GET',
        });
    }

    async logout(): Promise<ApiResponse<{ message: string }>> {
        const response = await this.request<{ message: string }>('/api/assess/logout', {
            method: 'POST',
        });
        if (response.success) {
            this.storeSessionId(null);
        }
        return response;
    }

    async getJobOptions(): Promise<ApiResponse<{
        departments: string[];
        locations: string[];
        categories: string[];
        employmentTypes: Array<{ value: string; label: string }>;
        experienceLevels: Array<{ value: string; label: string }>;
        workArrangements: Array<{ value: string; label: string }>;
    }>> {
        return this.request('/api/assess/job-options', {
            method: 'GET',
        });
    }

    async getAIRecommendations(data: {
        title: string;
        department?: string;
        experienceLevel?: string;
        requirements?: string[];
        responsibilities?: string[];
    }): Promise<ApiResponse<{
        packs: Array<{
            id: string;
            name: string;
            description: string;
            assessmentCount: number;
            price: number;
            features: string[];
            popular?: boolean;
        }>;
        recommendedPackId: string;
        assessmentTypes: string[];
        questionTypes: Array<{ id: string; name: string; description: string; recommended: boolean; reason?: string }>;
        reasoning: string;
    }>> {
        return this.request('/api/assess/recommendations', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getAssessPackages(): Promise<ApiResponse<Array<{
        id: string;
        packageId: string;
        code: string;
        name: string;
        description: string;
        assessmentCount: number;
        price: number;
        perCandidatePrice: number;
        includedCandidates: number;
        currency: string;
        features: string[];
        popular?: boolean;
    }>>> {
        return this.request('/api/assess/packages', {
            method: 'GET',
        });
    }

    async createInternalJob(data: {
        title: string;
        department?: string;
        location?: string;
        category?: string;
        employmentType: string;
        experienceLevel?: string;
        workArrangement?: string;
        vacancies?: number;
        requirements?: string[];
        responsibilities?: string[];
        description?: string;
    }): Promise<ApiResponse<{
        jobId: string;
        title: string;
        positionDescriptionUrl?: string;
        message: string;
    }>> {
        return this.request('/api/assess/jobs', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async uploadPositionDescription(file: File): Promise<ApiResponse<{
        url: string;
        publicId: string;
        fileName: string;
    }>> {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseURL}/api/assess/jobs/upload-description`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: this.buildHeaders(undefined, false),
                // Don't set Content-Type header - browser will set it with boundary
            });
            const data = await response.json();
            this.persistSessionIdFromResponse(data);

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || `HTTP ${response.status}: ${response.statusText}`,
                };
            }

            return data as ApiResponse<{ url: string; publicId: string; fileName: string }>;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    async finalizeJob(jobId: string, assessments: Array<{ name: string; type: string; questionType?: string }>): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/api/assess/jobs/${jobId}/finalize`, {
            method: 'POST',
            body: JSON.stringify({ assessments }),
        });
    }

    // ============ ROLES / JOBS API ============

    async getMyJobs(): Promise<ApiResponse<Array<{
        id: string;
        position: {
            id: string;
            title: string;
            location: string;
            employmentType: string;
            seniority: string;
            skills: string[];
            responsibilities: string;
        };
        assessments: Array<{ id: string; name: string; description: string; category: string }>;
        candidates: Array<{
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            status: string;
            stage?: string;
            resumeUrl?: string;
            assessmentResults?: Array<{
                assessmentId: string;
                assessmentName: string;
                status: string;
                assignedAt?: Date;
                completedAt?: Date;
            }>;
        }>;
        status: string;
        createdAt: Date;
        orderId: string;
    }>>> {
        return this.request('/api/assess/my-jobs', { method: 'GET' });
    }

    async getJobWithCandidates(jobId: string): Promise<ApiResponse<unknown>> {
        return this.request(`/api/assess/jobs/${jobId}`, { method: 'GET' });
    }

    async addCandidateToJob(jobId: string, data: {
        firstName: string;
        lastName: string;
        email: string;
        mobile?: string;
        mobileCountryCode?: string;
    }, resumeFile?: File): Promise<ApiResponse<{
        candidateId: string;
        applicationId: string;
        message: string;
    }>> {
        if (resumeFile) {
            // Use FormData for file upload
            const formData = new FormData();
            formData.append('firstName', data.firstName);
            formData.append('lastName', data.lastName);
            formData.append('email', data.email);
            if (data.mobile) formData.append('mobile', data.mobile);
            if (data.mobileCountryCode) formData.append('mobileCountryCode', data.mobileCountryCode);
            formData.append('resume', resumeFile);

            const url = `${this.baseURL}/api/assess/jobs/${jobId}/candidates`;
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    headers: this.buildHeaders(undefined, false),
                });
                const responseData = await response.json();
                this.persistSessionIdFromResponse(responseData);
                if (!response.ok) {
                    return { success: false, error: responseData.error || 'Failed to add candidate' };
                }
                return responseData;
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Network error' };
            }
        } else {
            return this.request(`/api/assess/jobs/${jobId}/candidates`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        }
    }

    async moveCandidate(jobId: string, candidateId: string, data: {
        stage?: string;
        roundId?: string;
    }): Promise<ApiResponse<{ message: string }>> {
        return this.request(`/api/assess/jobs/${jobId}/candidates/${candidateId}/move`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getCompanyBalance(): Promise<ApiResponse<{
        balance: number;
        currency: string;
    }>> {
        return this.request('/api/assess/balance', {
            method: 'GET',
        });
    }

    async addTestCredits(): Promise<ApiResponse<{
        balance: number;
        currency: string;
        message: string;
    }>> {
        return this.request('/api/assess/test-credits', {
            method: 'POST',
        });
    }

    async getJob(jobId: string): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}`, {
            method: 'GET',
        });
    }

    async updateAssessJobStatus(jobId: string, status: 'active' | 'completed' | 'archived'): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async addAssessmentsToJob(jobId: string, assessments: any[]): Promise<ApiResponse<{ message: string }>> {
        return this.request(`/api/assess/jobs/${jobId}/assessments`, {
            method: 'POST',
            body: JSON.stringify({ assessments }),
        });
    }

    async upsertAssessDraftJob(jobId: string, payload: {
        title: string;
        description?: string;
        department?: string;
        location?: string;
        employmentType?: string;
        workArrangement?: string;
        numberOfVacancies?: number;
    }): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/draft`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async saveAssessPackage(jobId: string, payload: {
        packId: string;
        selectedAssessments: Array<{
            assessmentCatalogId: string;
            name: string;
            questionType: string;
            recommendedReason?: string;
        }>;
    }): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/package`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async bulkUpsertAssessCandidates(jobId: string, payload: {
        candidates: Array<{
            firstName: string;
            lastName: string;
            email: string;
            mobile?: string;
        }>;
    }): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/candidates/bulk`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async getPricingPreview(jobId: string, payload: {
        packageId: string;
        candidateCount: number;
    }): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/pricing-preview`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async initCheckout(jobId: string, payload: {
        packageId: string;
        candidateCount: number;
    }): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/checkout/init`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async activateAssessJob(jobId: string, payload: {
        packageId?: string;
        candidateCount?: number;
        orderId?: string;
        checkoutSessionId?: string;
        paymentAttemptId?: string;
    }): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/activate`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getBillingPaymentStatus(paymentAttemptId: string): Promise<ApiResponse<any>> {
        return this.request(`/api/billing/payments/${paymentAttemptId}`, {
            method: 'GET',
        });
    }

    async assignPackageToCandidate(jobId: string, candidateId: string, payload: {
        packageId?: string;
    }): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/candidates/${candidateId}/assign-package`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async sendCandidateInvite(jobId: string, candidateId: string): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/candidates/${candidateId}/send-invite`, {
            method: 'POST',
        });
    }

    async getCandidateAssessmentStatus(jobId: string, candidateId: string): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/jobs/${jobId}/candidates/${candidateId}/assessment-status`, {
            method: 'GET',
        });
    }

    async getAssessCompanyProfile(): Promise<ApiResponse<any>> {
        return this.request('/api/assess/company/profile', {
            method: 'GET',
        });
    }

    async updateAssessCompanyProfile(payload: Record<string, unknown>): Promise<ApiResponse<any>> {
        return this.request('/api/assess/company/profile', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async updateAssessMyProfile(payload: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        phoneCountryCode?: string;
        positionTitle?: string;
    }): Promise<ApiResponse<any>> {
        return this.request('/api/assess/me/profile', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async changeAssessPassword(payload: {
        currentPassword: string;
        newPassword: string;
    }): Promise<ApiResponse<any>> {
        return this.request('/api/assess/me/change-password', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getAssessSessions(): Promise<ApiResponse<any>> {
        return this.request('/api/assess/me/sessions', {
            method: 'GET',
        });
    }

    async logoutOtherAssessSessions(): Promise<ApiResponse<any>> {
        return this.request('/api/assess/me/sessions/logout-others', {
            method: 'POST',
        });
    }

    async inviteAssessTeamMember(payload: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        phoneCountryCode?: string;
        positionTitle?: string;
        role: string;
    }): Promise<ApiResponse<any>> {
        return this.request('/api/assess/team/invite', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getAssessInvitation(token: string): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/invitation/${token}`, {
            method: 'GET',
        });
    }

    async acceptAssessInvitation(token: string, payload: {
        firstName: string;
        lastName: string;
        phone?: string;
        phoneCountryCode?: string;
        positionTitle?: string;
        password: string;
    }): Promise<ApiResponse<any>> {
        return this.request(`/api/assess/invitation/${token}/accept`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async initiateUpgrade(): Promise<ApiResponse<any>> {
        return this.request('/api/assess/upgrade/initiate', {
            method: 'POST',
        });
    }

    async completeUpgrade(): Promise<ApiResponse<any>> {
        return this.request('/api/assess/upgrade/complete', {
            method: 'POST',
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);

export type { RegisterRequest, RegisterResponse, BootstrapRequest, UserData, ApiResponse };
