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
    verificationRequired: boolean;
    message: string;
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

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            credentials: 'include', // Important for cookies
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

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

    async getCurrentUser(): Promise<ApiResponse<UserData>> {
        return this.request<UserData>('/api/assess/me', {
            method: 'GET',
        });
    }

    async logout(): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>('/api/assess/logout', {
            method: 'POST',
        });
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
                // Don't set Content-Type header - browser will set it with boundary
            });
            const data = await response.json();

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
                });
                const responseData = await response.json();
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

    async addAssessmentsToJob(jobId: string, assessments: any[]): Promise<ApiResponse<{ message: string }>> {
        return this.request(`/api/assess/jobs/${jobId}/assessments`, {
            method: 'POST',
            body: JSON.stringify({ assessments }),
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);

export type { RegisterRequest, RegisterResponse, UserData, ApiResponse };
