import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'
import { AuthService } from './auth.service'

class RegisterDto {
  @IsEmail() email!: string
  @IsString() name!: string
  @IsString() @MinLength(8) password!: string
}

class LoginDto {
  @IsEmail() email!: string
  @IsString() password!: string
}

class RefreshDto {
  @IsString() refreshToken!: string
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.name, dto.password)
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password)
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken)
  }
}
