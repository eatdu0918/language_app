import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api-client'
import styles from './billing.module.css'

interface Plan {
  id: string
  name: string
  price: string
  period: string
  features: string[]
  highlight?: boolean
  badge?: string
}

const PLANS: Plan[] = [
  {
    id: 'premium_monthly',
    name: '프리미엄 월간',
    price: '₩9,900',
    period: '/ 월',
    features: ['무제한 AI 회화', '고급 문법 분석 리포트', '발음 상세 피드백', 'Claude AI 고급 분석'],
  },
  {
    id: 'premium_yearly',
    name: '프리미엄 연간',
    price: '₩89,000',
    period: '/ 년',
    highlight: true,
    badge: '2개월 무료',
    features: ['무제한 AI 회화', '고급 문법 분석 리포트', '발음 상세 피드백', 'Claude AI 고급 분석'],
  },
]

export function BillingPage() {
  const { user } = useAuthStore()
  const [selected, setSelected] = useState<string>('premium_yearly')

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) =>
      api.post<{ url: string }>('/payments/checkout', {
        planId,
        successUrl: `${window.location.origin}/?payment=success`,
        cancelUrl: `${window.location.origin}/billing`,
      }),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url
    },
  })

  const isPremium = user?.subscriptionTier !== 'free' && user?.subscriptionTier !== undefined

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>구독 플랜</h1>
        <p className={styles.sub}>현재 플랜: <strong>{isPremium ? '프리미엄' : '무료'}</strong></p>
      </div>

      {isPremium ? (
        <div className={styles.premiumBanner}>
          <span className={styles.premiumIcon}>⭐</span>
          <div>
            <p className={styles.premiumTitle}>프리미엄 구독 중</p>
            <p className={styles.premiumDesc}>모든 기능을 제한 없이 이용할 수 있습니다.</p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.freeFeatures}>
            <h2 className={styles.sectionTitle}>무료 플랜 포함 기능</h2>
            <ul className={styles.featureList}>
              <li>단어 복습 (스페이스드 리피티션)</li>
              <li>문서 읽기 (레벨별)</li>
              <li>AI 회화 (월 10회)</li>
              <li>기본 STT 음성 인식</li>
            </ul>
          </div>

          <h2 className={styles.sectionTitle}>프리미엄으로 업그레이드</h2>
          <div className={styles.plans}>
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                className={`${styles.planCard} ${selected === plan.id ? styles.selectedPlan : ''} ${plan.highlight ? styles.highlightPlan : ''}`}
                onClick={() => setSelected(plan.id)}
              >
                {plan.highlight && <span className={styles.badge}>{plan.badge}</span>}
                <p className={styles.planName}>{plan.name}</p>
                <p className={styles.planPrice}>
                  {plan.price}<span className={styles.planPeriod}>{plan.period}</span>
                </p>
                <ul className={styles.planFeatures}>
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <button
            className={styles.upgradeBtn}
            onClick={() => checkoutMutation.mutate(selected)}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? '처리 중...' : '지금 업그레이드'}
          </button>
          {checkoutMutation.isError && (
            <p className={styles.error}>결제 처리 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
          )}
        </>
      )}
    </div>
  )
}
