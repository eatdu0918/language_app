import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '대시보드', tabBarLabel: '홈', tabBarIcon: ({ color }) => <TabIcon label="🏠" color={color} /> }} />
      <Tabs.Screen name="vocabulary" options={{ title: '단어 복습', tabBarLabel: '단어', tabBarIcon: ({ color }) => <TabIcon label="📖" color={color} /> }} />
      <Tabs.Screen name="documents" options={{ title: '문서 읽기', tabBarLabel: '문서', tabBarIcon: ({ color }) => <TabIcon label="📄" color={color} /> }} />
      <Tabs.Screen name="conversation" options={{ title: '회화 연습', tabBarLabel: '회화', tabBarIcon: ({ color }) => <TabIcon label="🎙️" color={color} /> }} />
    </Tabs>
  )
}

function TabIcon({ label, color }: { label: string; color: string }) {
  const { Text } = require('react-native') as typeof import('react-native')
  return <Text style={{ fontSize: 18, opacity: color === '#6366f1' ? 1 : 0.5 }}>{label}</Text>
}
