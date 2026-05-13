import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../src/lib/api'
import { useAuthStore } from '../../src/stores/auth'
import type { AuthTokens, UserProfile } from '@language-app/shared'

export default function LoginScreen() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      Alert.alert('오류', '모든 항목을 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      const { accessToken } = await api.post<AuthTokens>(
        mode === 'login' ? '/auth/login' : '/auth/register',
        mode === 'login' ? { email, password } : { email, name, password },
      )
      const user = await api.get<UserProfile>('/users/me')
      await setAuth(user, accessToken)
      void router.replace('/(tabs)/')
    } catch (err) {
      Alert.alert('오류', err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.title}>LangApp</Text>
        <Text style={s.subtitle}>AI와 함께하는 언어 학습</Text>

        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, mode === 'login' && s.activeTab]} onPress={() => setMode('login')}>
            <Text style={[s.tabText, mode === 'login' && s.activeTabText]}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, mode === 'register' && s.activeTab]} onPress={() => setMode('register')}>
            <Text style={[s.tabText, mode === 'register' && s.activeTabText]}>회원가입</Text>
          </TouchableOpacity>
        </View>

        {mode === 'register' && (
          <TextInput style={s.input} placeholder="이름" value={name} onChangeText={setName} autoCapitalize="words" />
        )}
        <TextInput style={s.input} placeholder="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={() => void handleSubmit()} disabled={loading}>
          <Text style={s.btnText}>{loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#1e293b', borderRadius: 16, padding: 28 },
  title: { fontSize: 28, fontWeight: '700', color: '#f8fafc', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  tabs: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 8, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  activeTab: { backgroundColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: '#6366f1', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
