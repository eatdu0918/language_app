import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module'
import { PlacementService } from './placement.service'
import { PlacementController } from './placement.controller'

@Module({
  imports: [UsersModule],
  providers: [PlacementService],
  controllers: [PlacementController],
})
export class PlacementModule {}
