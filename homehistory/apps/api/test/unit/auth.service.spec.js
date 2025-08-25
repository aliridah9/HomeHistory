"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../../src/modules/auth/auth.service");
const prisma_service_1 = require("../../src/modules/database/prisma.service");
const supabase_service_1 = require("../../src/modules/supabase/supabase.service");
const bcrypt = __importStar(require("bcryptjs"));
// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt;
describe('AuthService', () => {
    let service;
    let prismaService;
    let jwtService;
    let supabaseService;
    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
    };
    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };
    const mockSupabaseService = {
        getAdminClient: jest.fn().mockReturnValue({
            auth: {
                admin: {
                    createUser: jest.fn(),
                    deleteUser: jest.fn(),
                },
            },
        }),
        getClient: jest.fn().mockReturnValue({
            auth: {
                signInWithPassword: jest.fn(),
                resetPasswordForEmail: jest.fn(),
            },
        }),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: mockSupabaseService,
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prismaService = module.get(prisma_service_1.PrismaService);
        jwtService = module.get(jwt_1.JwtService);
        supabaseService = module.get(supabase_service_1.SupabaseService);
        // Reset mocks
        jest.clearAllMocks();
    });
    describe('register', () => {
        const registerDto = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
        };
        it('should register a new user successfully', async () => {
            // Mock implementations
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockedBcrypt.hash.mockResolvedValue('hashedPassword');
            mockPrismaService.user.create.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('access-token');
            const result = await service.register(registerDto);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
            expect(mockPrismaService.user.create).toHaveBeenCalled();
            expect(result).toHaveProperty('accessToken', 'access-token');
            expect(result).toHaveProperty('user');
            expect(result.user).not.toHaveProperty('password');
        });
        it('should throw ConflictException if user already exists', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            await expect(service.register(registerDto)).rejects.toThrow(common_1.ConflictException);
        });
    });
    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };
        it('should login user with valid credentials', async () => {
            const userWithPassword = { ...mockUser, password: 'hashedPassword' };
            mockPrismaService.user.findUnique.mockResolvedValue(userWithPassword);
            mockedBcrypt.compare.mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('access-token');
            const result = await service.login(loginDto);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: loginDto.email },
            });
            expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hashedPassword');
            expect(result).toHaveProperty('accessToken', 'access-token');
            expect(result.user).not.toHaveProperty('password');
        });
        it('should throw NotFoundException if user does not exist', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw UnauthorizedException if password is invalid', async () => {
            const userWithPassword = { ...mockUser, password: 'hashedPassword' };
            mockPrismaService.user.findUnique.mockResolvedValue(userWithPassword);
            mockedBcrypt.compare.mockResolvedValue(false);
            await expect(service.login(loginDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('validateUser', () => {
        it('should return user if found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            const result = await service.validateUser('test-user-id');
            expect(result).toEqual(mockUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'test-user-id' },
            });
        });
        it('should return null if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            const result = await service.validateUser('non-existent-id');
            expect(result).toBeNull();
        });
    });
    describe('getUserProfile', () => {
        it('should return user profile', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            const result = await service.getUserProfile('test-user-id');
            expect(result).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                role: mockUser.role,
                createdAt: mockUser.createdAt,
                updatedAt: mockUser.updatedAt,
            });
        });
        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            await expect(service.getUserProfile('non-existent-id')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('refreshToken', () => {
        it('should refresh access token with valid refresh token', async () => {
            const refreshDto = { refreshToken: 'valid-refresh-token' };
            mockJwtService.verify.mockReturnValue({ sub: 'test-user-id' });
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('new-access-token');
            const result = await service.refreshToken(refreshDto);
            expect(mockJwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
            expect(result).toHaveProperty('accessToken', 'new-access-token');
        });
        it('should throw UnauthorizedException with invalid refresh token', async () => {
            const refreshDto = { refreshToken: 'invalid-refresh-token' };
            mockJwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            await expect(service.refreshToken(refreshDto)).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('forgotPassword', () => {
        it('should send password reset email for existing user', async () => {
            const forgotPasswordDto = { email: 'test@example.com' };
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockSupabaseService.getClient().auth.resetPasswordForEmail.mockResolvedValue({
                data: {},
                error: null,
            });
            const result = await service.forgotPassword(forgotPasswordDto);
            expect(result).toHaveProperty('message', 'Password reset email sent successfully');
            expect(mockSupabaseService.getClient().auth.resetPasswordForEmail).toHaveBeenCalledWith(forgotPasswordDto.email);
        });
        it('should return success message even for non-existent user (security)', async () => {
            const forgotPasswordDto = { email: 'nonexistent@example.com' };
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            const result = await service.forgotPassword(forgotPasswordDto);
            expect(result).toHaveProperty('message', 'Password reset email sent successfully');
        });
    });
    describe('generateToken', () => {
        it('should generate access and refresh tokens', async () => {
            mockJwtService.sign
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            const result = await service.generateToken(mockUser);
            expect(result).toEqual({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });
            expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map