import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'lib/common/decorators';
import { UserSignupDto } from './dto/signup.dto';
import { UserSigninDto } from './dto/signin.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'User signup' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ type: UserSignupDto })
  async signUp(@Res() res: any, @Body() payload: UserSignupDto) {
    try {
      const user = await this.authService.signUp(payload);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'User created successfully',
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json(error.getResponse());
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Something went wrong while signing up',
      });
    }
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: UserSigninDto })
  async signIn(
    @Body() payload: UserSigninDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      let data = await this.authService.signIn(payload.email, payload.password);
      if (typeof data === 'string') {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: data,
        });
      } else {
        return res.status(HttpStatus.OK).json({
          success: true,
          message: 'User logged in successfully',
          data,
        });
      }
    } catch (err) {
      if (err instanceof ForbiddenException) {
        return res.status(HttpStatus.FORBIDDEN).json(err.getResponse());
      } else if (err instanceof UnauthorizedException) {
        return res.status(HttpStatus.UNAUTHORIZED).json(err.getResponse());
      } else if (err instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json(err.getResponse());
      } else if (err instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json(err.getResponse());
      } else {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
    }
  }

  @Public()
  @Post('refreshToken')
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(
    @Body() payload: RefreshTokenDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      let data = await this.authService.refreshTokens(payload.refreshToken);
      if (typeof data === 'string') {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: data,
        });
      } else {
        return res.status(HttpStatus.OK).json({
          success: true,
          data,
        });
      }
    } catch (err) {
      if (err instanceof ForbiddenException) {
        return res.status(HttpStatus.FORBIDDEN).json(err.getResponse());
      } else if (err instanceof UnauthorizedException) {
        return res.status(HttpStatus.UNAUTHORIZED).json(err.getResponse());
      } else if (err instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json(err.getResponse());
      } else if (err instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json(err.getResponse());
      } else {
        throw new InternalServerErrorException({
          success: false,
          message: 'Something went wrong',
        });
      }
    }
  }
}
