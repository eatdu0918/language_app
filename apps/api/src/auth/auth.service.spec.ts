// bcrypt는 네이티브 모듈 — 테스트 환경에서 사전 mock 처리
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}))

import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'

const mockUser = { id: 'user-uuid', email: 'test@example.com', name: '테스트' } as any

const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  validatePassword: jest.fn(),
}

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn(),
}

const mockConfigService = {
  get: jest.fn().mockReturnValue('dev-refresh-secret'),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('register', () => {
    it('사용자를 생성하고 토큰을 반환한다', async () => {
      mockUsersService.create.mockResolvedValue(mockUser)

      const result = await service.register('test@example.com', '테스트', 'password123')

      expect(mockUsersService.create).toHaveBeenCalledWith('test@example.com', '테스트', 'password123')
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
    })

    it('이미 등록된 이메일이면 ConflictException을 전파한다', async () => {
      mockUsersService.create.mockRejectedValue(new ConflictException())

      await expect(service.register('dup@example.com', '테스트', 'pass1234')).rejects.toThrow(ConflictException)
    })
  })

  describe('login', () => {
    it('유효한 인증 정보로 토큰을 반환한다', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      mockUsersService.validatePassword.mockResolvedValue(true)

      const result = await service.login('test@example.com', 'password123')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('존재하지 않는 이메일이면 UnauthorizedException을 던진다', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)

      await expect(service.login('none@example.com', 'pass')).rejects.toThrow(UnauthorizedException)
    })

    it('비밀번호가 틀리면 UnauthorizedException을 던진다', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      mockUsersService.validatePassword.mockResolvedValue(false)

      await expect(service.login('test@example.com', 'wrong')).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('refresh', () => {
    it('유효한 refresh token으로 새 토큰 쌍을 반환한다', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-uuid' })
      mockUsersService.findById.mockResolvedValue(mockUser)

      const result = await service.refresh('valid-refresh-token')

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(Object))
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('유효하지 않은 refresh token이면 UnauthorizedException을 던진다', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid') })

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException)
    })

    it('토큰에 해당하는 사용자가 없으면 UnauthorizedException을 던진다', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'ghost-uuid' })
      mockUsersService.findById.mockResolvedValue(null)

      await expect(service.refresh('token-for-deleted-user')).rejects.toThrow(UnauthorizedException)
    })
  })
})
