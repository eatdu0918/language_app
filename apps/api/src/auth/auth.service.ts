import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../users/users.service'
import { VocabularyService } from '../vocabulary/vocabulary.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly vocabularyService: VocabularyService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, name: string, password: string) {
    const user = await this.usersService.create(email, name, password)
    await this.vocabularyService.initializeProgress(user.id)
    return this.generateTokens(user.id)
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user || !(await this.usersService.validatePassword(user, password))) {
      throw new UnauthorizedException('Invalid credentials')
    }
    return this.generateTokens(user.id)
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      })
      const user = await this.usersService.findById(payload.sub)
      if (!user) throw new UnauthorizedException()
      return this.generateTokens(user.id)
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  private generateTokens(userId: string) {
    const payload = { sub: userId }
    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    })
    return { accessToken, refreshToken }
  }
}
