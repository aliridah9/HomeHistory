import { PrismaService } from '../../modules/database/prisma.service';
import { User } from '@homehistory/database';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateData: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=users.service.d.ts.map
