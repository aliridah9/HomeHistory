import { UsersService } from './users.service';
import { UpdateUserProfileDto, UserResponseDto, UsersQueryDto, UserStatsDto } from './dto';
import { User } from '@homehistory/database';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getCurrentUserProfile(user: User): Promise<UserResponseDto>;
    updateCurrentUserProfile(user: User, dto: UpdateUserProfileDto): Promise<UserResponseDto>;
    deleteCurrentUser(user: User): Promise<void>;
    getCurrentUserActivity(user: User, query: {
        page?: number;
        limit?: number;
        action?: string;
    }): Promise<any>;
    getUserPreferences(user: User): Promise<any>;
    updateUserPreferences(user: User, dto: {
        preferences: any;
    }): Promise<any>;
    getAllUsers(user: User, query: UsersQueryDto): Promise<any>;
    getUserStats(user: User): Promise<UserStatsDto>;
    getUserById(currentUser: User, userId: string): Promise<UserResponseDto>;
    updateUserById(currentUser: User, userId: string, dto: UpdateUserProfileDto & {
        role?: 'USER' | 'ADMIN';
    }): Promise<UserResponseDto>;
    deleteUserById(currentUser: User, userId: string): Promise<void>;
    suspendUser(currentUser: User, userId: string, dto: {
        reason?: string;
        duration?: number;
    }): Promise<any>;
    unsuspendUser(currentUser: User, userId: string): Promise<any>;
    getUserActivity(currentUser: User, userId: string, query: {
        page?: number;
        limit?: number;
        action?: string;
    }): Promise<any>;
}
//# sourceMappingURL=users.controller.d.ts.map
