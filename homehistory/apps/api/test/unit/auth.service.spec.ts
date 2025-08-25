import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { SupabaseService } from '../../src/modules/supabase/supabase.service';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let supabaseService: SupabaseService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

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

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
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

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const userWithPassword = { ...mockUser, password: 'hashedPassword' };
      
      mockPrismaService.user.findUnique.mockResolvedValue(userWithPassword);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
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

      await expect(service.getUserProfile('non-existent-id')).rejects.toThrow(NotFoundException);
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

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(UnauthorizedException);
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
      expect(mockSupabaseService.getClient().auth.resetPasswordForEmail).toHaveBeenCalledWith(
        forgotPasswordDto.email
      );
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