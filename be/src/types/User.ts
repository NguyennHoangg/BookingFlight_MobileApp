export interface User{
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    avatarUrl: string;
    loyaltyPoints: number;
    membershipTier: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    gender: boolean | null;
    dateOfBirth: Date | null;
    upcomingFlights?: number;
};

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    phone: string;
}

export interface DecodedToken {
    userId: string;
    role: string;
}
