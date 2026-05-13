import {
  Controller, Post, Body, Headers, Req,
  UseGuards, Request, HttpCode,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PaymentsService } from './payments.service'

class CheckoutDto {
  @IsString() planId!: string
  @IsString() successUrl!: string
  @IsString() cancelUrl!: string
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @Request() req: { user: { sub: string } },
    @Body() dto: CheckoutDto,
  ) {
    return this.paymentsService.createCheckoutSession(
      req.user.sub,
      dto.planId,
      dto.successUrl,
      dto.cancelUrl,
    )
  }

  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: { rawBody: Buffer },
  ) {
    return this.paymentsService.handleWebhook(signature, req.rawBody)
  }
}
