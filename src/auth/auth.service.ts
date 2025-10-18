import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if username already exists
    const existingUsername = await this.usersService.findByUsername(registerDto.username);
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Create new user (password stored as plain text as requested)
    const user = await this.usersService.create(registerDto);

    // Generate JWT token
    const payload = { sub: user.id, username: user.username, email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by username
    const user = await this.usersService.findByUsername(loginDto.username);

    // Check if user exists and password matches (plain text comparison as requested)
    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Generate JWT token
    const payload = { sub: user.id, username: user.username, email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    };
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findOne(payload.sub);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    // Return user without password
    const { password, ...result } = user;
    return result;
  }
}

