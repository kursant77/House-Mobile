export type ApplicationType = 'seller' | 'blogger';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface RoleApplication {
    id: string;
    userId: string;
    type: ApplicationType;
    status: ApplicationStatus;
    fullName: string;
    phone: string;
    email?: string;
    telegram?: string;
    instagram?: string;
    businessName?: string; // for sellers
    businessDescription?: string; // for sellers
    contentTheme?: string; // for bloggers
    audienceSize?: string; // for bloggers
    reason: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateApplicationData {
    type: ApplicationType;
    fullName: string;
    phone: string;
    email?: string;
    telegram?: string;
    instagram?: string;
    businessName?: string;
    businessDescription?: string;
    contentTheme?: string;
    audienceSize?: string;
    reason: string;
}
