import { UserRole } from '@homehistory/database';
export declare class UserProfileDto {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    phone?: string | null;
    emailVerified?: boolean;
    preferences?: any;
}
//# sourceMappingURL=user-profile.dto.d.ts.map
