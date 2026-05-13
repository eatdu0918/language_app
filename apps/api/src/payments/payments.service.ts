import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'
import { UsersService } from '../users/users.service'

const PRICE_IDS: Record<string, string> = {
  premium_monthly: 'price_premium_monthly',
  premium_yearly: 'price_premium_yearly',
}

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe
  private readonly webhookSecret: string
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY', ''))
    this.webhookSecret = config.get('STRIPE_WEBHOOK_SECRET', '')
  }

  async createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string) {
    const priceId = PRICE_IDS[planId]
    if (!priceId) throw new BadRequestException('Invalid plan')

    const user = await this.usersService.findById(userId)
    if (!user) throw new BadRequestException('User not found')

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      metadata: { userId },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return { url: session.url }
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    let event: Stripe.Event
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret)
    } catch {
      throw new BadRequestException('Invalid webhook signature')
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.['userId']
        if (userId && session.customer) {
          await this.updateUserSubscription(userId, session.customer as string, 'premium')
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customer = await this.stripe.customers.retrieve(sub.customer as string)
        if (!customer.deleted && customer.metadata?.['userId']) {
          await this.updateUserSubscription(customer.metadata['userId'], sub.customer as string, 'free')
        }
        break
      }
    }

    return { received: true }
  }

  private async updateUserSubscription(userId: string, customerId: string, tier: 'free' | 'premium') {
    const user = await this.usersService.findById(userId)
    if (!user) return
    await this.usersService.updateSubscription(userId, customerId, tier)
    this.logger.log(`User ${userId} subscription → ${tier}`)
  }
}
