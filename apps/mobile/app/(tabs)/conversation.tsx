import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Speech from 'expo-speech'
import { api } from '../../src/lib/api'
import type { SupportedLanguage, ConversationSession } from '@language-app/shared'

const SCENARIOS = [
  { id: 'free', label: '자유 대화' },
  { id: 'interview', label: '인터뷰' },
  { id: 'shopping', label: '쇼핑' },
  { id: 'restaurant', label: '레스토랑' },
] as const

export default function ConversationScreen() {
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [scenario, setScenario] = useState('free')
  const [session, setSession] = useState<ConversationSession | null>(null)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [aiStreaming, setAiStreaming] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  const startMutation = useMutation({
    mutationFn: () =>
      api.post<ConversationSession>('/conversation/sessions', { language: lang, scenario }),
    onSuccess: (data) => {
      setSession(data)
      setMessages([])
    },
  })

  const sendMessage = async () => {
    if (!session || !input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])

    try {
      setAiStreaming('')
      const token = await import('@react-native-async-storage/async-storage')
        .then(m => m.default.getItem('accessToken'))
      const apiUrl = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1'

      const res = await fetch(`${apiUrl}/conversation/sessions/${session.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ content: userMsg }),
      })

      if (!res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          const text = line.slice(6)
          if (text === '[DONE]') break
          fullText += text
          setAiStreaming(fullText)
        }
      }

      Speech.speak(fullText, { language: lang === 'en' ? 'en-US' : 'ja-JP' })
      setMessages((prev) => [...prev, { role: 'assistant', content: fullText }])
      setAiStreaming('')
      setTimeout(() => scrollRef.current?.scrollToEnd(), 100)
    } catch (err) {
      console.error(err)
    }
  }

  if (!session) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.setupContent}>
        <Text style={s.setupTitle}>회화 설정</Text>

        <Text style={s.sectionLabel}>언어 선택</Text>
        <View style={s.langSwitch}>
          {(['en', 'ja'] as SupportedLanguage[]).map((l) => (
            <TouchableOpacity
              key={l}
              style={[s.langBtn, lang === l && s.langBtnActive]}
              onPress={() => setLang(l)}
            >
              <Text style={[s.langBtnText, lang === l && s.langBtnTextActive]}>
                {l === 'en' ? '🇺🇸 영어' : '🇯🇵 일본어'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>시나리오</Text>
        <View style={s.scenarioGrid}>
          {SCENARIOS.map((sc) => (
            <TouchableOpacity
              key={sc.id}
              style={[s.scenarioBtn, scenario === sc.id && s.scenarioBtnActive]}
              onPress={() => setScenario(sc.id)}
            >
              <Text style={[s.scenarioBtnText, scenario === sc.id && s.scenarioBtnTextActive]}>
                {sc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.startBtn, startMutation.isPending && s.startBtnDisabled]}
          onPress={() => startMutation.mutate()}
          disabled={startMutation.isPending}
        >
          <Text style={s.startBtnText}>
            {startMutation.isPending ? '시작 중...' : '대화 시작'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        style={s.messages}
        contentContainerStyle={s.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
      >
        {messages.map((msg, idx) => (
          <View key={idx} style={[s.bubble, msg.role === 'user' ? s.userBubble : s.aiBubble]}>
            <Text style={[s.bubbleText, msg.role === 'user' ? s.userBubbleText : s.aiBubbleText]}>
              {msg.content}
            </Text>
          </View>
        ))}
        {aiStreaming !== '' && (
          <View style={[s.bubble, s.aiBubble]}>
            <Text style={[s.bubbleText, s.aiBubbleText]}>{aiStreaming}▊</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="메시지 입력..."
          placeholderTextColor="#475569"
          multiline
          onSubmitEditing={() => void sendMessage()}
        />
        <TouchableOpacity style={s.sendBtn} onPress={() => void sendMessage()} disabled={!input.trim()}>
          <Text style={s.sendBtnText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  setupContent: { padding: 24, gap: 0 },
  setupTitle: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  langSwitch: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  langBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#1e293b', borderRadius: 10, alignItems: 'center' },
  langBtnActive: { backgroundColor: '#6366f1' },
  langBtnText: { color: '#64748b', fontWeight: '600' },
  langBtnTextActive: { color: '#fff' },
  scenarioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  scenarioBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 8 },
  scenarioBtnActive: { backgroundColor: '#312e81' },
  scenarioBtnText: { color: '#64748b', fontWeight: '600' },
  scenarioBtnTextActive: { color: '#a5b4fc' },
  startBtn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center' },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10 },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 12 },
  userBubble: { backgroundColor: '#6366f1', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#1e293b', alignSelf: 'flex-start' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: '#fff' },
  aiBubbleText: { color: '#e2e8f0' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#1e293b' },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700' },
})
