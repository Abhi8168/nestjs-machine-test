import {
  BadRequestException,
  Body,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
// import { UserService } from 'src/users/user.service';
// import { OrganizationService } from 'src/organizations/organization.service';
@Injectable()
export class AuthService {
  constructor(
    // private usersService: UserService,
    private jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async signUp(payload) {
    const { email } = payload;
    const existingUser = await this.prismaService.user.findFirst({
      where: {
        email: {
          contains: email, // or use startsWith / endsWith
          mode: 'insensitive',
        },
      },
    });
    if (existingUser) {
      throw new BadRequestException({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const secureRounds: any = process.env.SALT_ROUNDS;
    const saltRounds = parseInt(secureRounds, 10) || 10;
    const bcryptPassword = await bcrypt.hash(payload.password, saltRounds);
    return await this.prismaService.user.create({
      data: {
        ...payload,
        password: bcryptPassword,
      },
    });
  }

  async signIn(email: string, password: string) {
    // Find user by email (case-insensitive)
    const user = await this.prismaService.user.findFirst({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'User not found',
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid password',
      });
    }

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
    };
    const secretAuthKey = process.env.AUTH_TOKEN_SECRET_KEY;
    const secretRefreshKey = process.env.REFRESH_AUTH_TOKEN_SECRET_KEY;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: secretAuthKey,
        expiresIn: process.env.JWT_EXPIRATION_TIME,
      }),
      this.jwtService.signAsync(payload, {
        secret: secretRefreshKey,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME,
      }),
    ]);

    console.log('Generated Access Token:', accessToken);
    console.log('Generated Refresh Token:', refreshToken);

    // Hash the refresh token before storing
    await this.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    const userPayload = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.REFRESH_AUTH_TOKEN_SECRET_KEY,
    });
    const user = await this.userReadById(userPayload.id);
    if (!user || !user.refreshToken)
      throw new BadRequestException({
        success: false,
        message: 'No user found or refresh token not set',
      });
    // Verify the refresh token

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatches)
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid refresh token',
      });

    const payload = { _id: user.id, email: user.email };

    const secretAuthKey = process.env.AUTH_TOKEN_SECRET_KEY;
    const secretRefreshKey = process.env.REFRESH_AUTH_TOKEN_SECRET_KEY;

    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: secretAuthKey,
        expiresIn: process.env.JWT_EXPIRATION_TIME,
      }),
      this.jwtService.signAsync(payload, {
        secret: secretRefreshKey,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME,
      }),
    ]);

    // Update the user's refresh token in the database
    await this.updateRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async userReadById(userId: string) {
    const findUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!findUser) {
      throw new UnauthorizedException({
        success: false,
        message: 'User not found',
      });
    }
    return findUser;
  }

  async fetchUserDetailForAuthGuard(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        id: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'User not found',
      });
    }

    return user;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const secureSaltRounds: any = process.env.SALT_ROUNDS;
    const saltRounds = parseInt(secureSaltRounds, 10) || 10;
    refreshToken = await bcrypt.hash(refreshToken, saltRounds);
    return await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
