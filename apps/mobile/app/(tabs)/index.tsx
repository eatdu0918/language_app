import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../src/stores/auth'
import { api } from '../../src/lib/api'
import type { VocabularyStats } from '@language-app/shared'

const NAV_ITEMS = [
  { href: '/vocabulary' as const, icon: '📖', label: '단어', desc: '스페이스드 리피티션 복습' },
  { href: '/documents' as const, icon: '📄', label: '문서', desc: 'AI 레벨 조정 읽기 연습' },
  { href: '/conversation' as const, icon: '🎙️', label: '회화', desc: 'AI와 실시간 대화 연습' },
]

export default function DashboardScreen() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const { data: stats } = useQuery({
    queryKey: ['vocabulary', 'stats'],
    queryFn: () => api.get<VocabularyStats>('/vocabulary/stats'),
  })

  const statItems = [
    { label: '오늘 복습 예정', value: stats?.dueToday ?? '-' },
    { label: '오늘 완료', value: stats?.reviewedToday ?? '-' },
    { label: '학습한 단어', value: stats?.totalLearned ?? '-' },
  ]

  const handleLogout = async () => {
    await logout()
    void router.replace('/(auth)/login')
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.greeting}>안녕하세요, {user?.name ?? '학습자'}님 👋</Text>
          <Text style={s.sub}>오늘도 꾸준히 학습해 봐요.</Text>
        </View>
        <TouchableOpacity onPress={() => void handleLogout()}>
          <Text style={s.logout}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {statItems.map((item) => (
          <View key={item.label} style={s.statCard}>
            <Text style={s.statValue}>{item.value}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.grid}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity key={item.href} style={s.card} onPress={() => void router.push(item.href)}>
            <Text style={s.cardIcon}>{item.icon}</Text>
            <Text style={s.cardLabel}>{item.label}</Text>
            <Text style={s.cardDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  sub: { fontSize: 13, color: '#64748b' },
  logout: { fontSize: 13, color: '#64748b', paddingTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  grid: { gap: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 20 },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardLabel: { fontSize: 17, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },
})
