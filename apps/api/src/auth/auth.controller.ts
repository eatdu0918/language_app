import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AuthService } from './auth.service'

class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail() email!: string

  @ApiProperty({ example: '홍길동' })
  @IsString() name!: string

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString() @MinLength(8) password!: string
}

class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail() email!: string

  @ApiProperty({ example: 'password123' })
  @IsString() password!: string
}

class RefreshDto {
  @ApiProperty({ description: 'JWT refresh token' })
  @IsString() refreshToken!: string
}

class AuthTokensResponse {
  @ApiProperty() accessToken!: string
  @ApiProperty() refreshToken!: string
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: AuthTokensResponse })
  @ApiResponse({ status: 409, description: '이미 등록된 이메일' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.name, dto.password)
  }

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, type: AuthTokensResponse })
  @ApiResponse({ status: 401, description: '잘못된 인증 정보' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Access token 재발급', description: 'Refresh token으로 새 토큰 쌍 발급' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 201, type: AuthTokensResponse })
  @ApiResponse({ status: 401, description: '유효하지 않은 refresh token' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken)
  }
}
