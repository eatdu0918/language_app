import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from './user.entity'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email }, select: { passwordHash: true, id: true, email: true, name: true, subscriptionTier: true } })
  }

  async create(email: string, name: string, password: string): Promise<User> {
    const existing = await this.repo.findOneBy({ email })
    if (existing) throw new ConflictException('Email already registered')

    const passwordHash = await bcrypt.hash(password, 12)
    const user = this.repo.create({ email, name, passwordHash })
    return this.repo.save(user)
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash)
  }
}
