import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '../../services/logger/logger.service';
import { SignInDto, SignInResponseDto } from './dto/signin.dto';
import { User, UserStatus } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<SignInResponseDto> {
    try {
      const { email, password } = signInDto;

      // Find user by email
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        await this.logger.warn('Signin attempt with non-existent email', {
          email,
          reason: 'User not found',
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked()) {
        await this.logger.warn('Signin attempt on locked account', {
          userId: user.id,
          email,
          lockedUntil: user.lockedUntil,
        });
        throw new UnauthorizedException('Account is temporarily locked due to too many failed attempts');
      }

      // Check if account is active
      if (user.status !== UserStatus.ACTIVE) {
        await this.logger.warn('Signin attempt on inactive account', {
          userId: user.id,
          email,
          status: user.status,
        });
        throw new UnauthorizedException('Account is not active');
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Increment login attempts
        user.incrementLoginAttempts();
        await this.userRepository.save(user);

        await this.logger.warn('Invalid password attempt', {
          userId: user.id,
          email,
          loginAttempts: user.loginAttempts,
          isLocked: user.isLocked(),
        });

        throw new UnauthorizedException('Invalid credentials');
      }

      // Reset login attempts on successful login
      user.resetLoginAttempts();
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(payload);

      await this.logger.info('User signed in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 3600, // 1 hour
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      await this.logger.error('Signin failed with unexpected error', {
        email: signInDto.email,
        error: error.message,
        stack: error.stack,
      });
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async createUser(email: string, password: string, name: string, role: string = 'admin'): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: role as any,
    });

    return this.userRepository.save(user);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}