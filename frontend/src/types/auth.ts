/**
 * Unified Auth Types — Single source of truth for user roles and auth interfaces.
 * 'admin' role has been removed. Only 4 roles exist:
 *   user | blogger | super_admin | seller
 */

export type UserRole = 'user' | 'blogger' | 'super_admin' | 'seller';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    bio?: string;
    username?: string;
    phone?: string;
    isProfessional: boolean;
    isBlocked: boolean;
    address?: string;
    telegram?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
