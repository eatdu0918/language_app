import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Speech from 'expo-speech'
import { api } from '../../src/lib/api'
import type { VocabularyProgress, SupportedLanguage } from '@language-app/shared'

const QUALITY_LABELS = ['다시', '어려움', '애매', '기억', '쉬움', '완벽']
const QUALITY_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

export default function VocabularyScreen() {
  const qc = useQueryClient()
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const { data: words, isLoading } = useQuery({
    queryKey: ['vocabulary', 'due', lang],
    queryFn: () => api.get<VocabularyProgress[]>(`/vocabulary/due?language=${lang}`),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ wordId, quality }: { wordId: string; quality: number }) =>
      api.post(`/vocabulary/${wordId}/review`, { quality }),
    onSuccess: () => {
      const next = current + 1
      if (words && next >= words.length) {
        void qc.invalidateQueries({ queryKey: ['vocabulary', 'due', lang] })
        setCurrent(0)
      } else {
        setCurrent(next)
      }
      setFlipped(false)
    },
  })

  const speak = (text: string) => {
    Speech.speak(text, { language: lang === 'en' ? 'en-US' : 'ja-JP' })
  }

  if (isLoading) return <View style={s.center}><ActivityIndicator color="#6366f1" size="large" /></View>

  const currentWord = words?.[current]?.word

  if (!words || words.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.emptyIcon}>🎉</Text>
        <Text style={s.emptyText}>오늘 복습할 단어가 없습니다!</Text>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.langSwitch}>
          {(['en', 'ja'] as SupportedLanguage[]).map((l) => (
            <TouchableOpacity
              key={l}
              style={[s.langBtn, lang === l && s.langBtnActive]}
              onPress={() => { setLang(l); setCurrent(0); setFlipped(false) }}
            >
              <Text style={[s.langBtnText, lang === l && s.langBtnTextActive]}>
                {l === 'en' ? '영어' : '일본어'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.progress}>{current + 1} / {words.length}</Text>
      </View>

      <TouchableOpacity style={s.card} onPress={() => setFlipped(!flipped)} activeOpacity={0.9}>
        {!flipped ? (
          <View style={s.cardFront}>
            <Text style={s.wordText}>{currentWord?.word}</Text>
            {currentWord?.reading && <Text style={s.readingText}>{currentWord.reading}</Text>}
            <TouchableOpacity style={s.speakBtn} onPress={() => currentWord && speak(currentWord.word)}>
              <Text style={s.speakBtnText}>🔊 발음 듣기</Text>
            </TouchableOpacity>
            <Text style={s.tapHint}>탭해서 뜻 보기</Text>
          </View>
        ) : (
          <View style={s.cardBack}>
            <Text style={s.meaningText}>{currentWord?.meaning}</Text>
            <Text style={s.exampleText}>{currentWord?.exampleSentence}</Text>
            <Text style={s.translationText}>{currentWord?.exampleTranslation}</Text>
          </View>
        )}
      </TouchableOpacity>

      {flipped && words[current] && (
        <View style={s.qualityButtons}>
          {QUALITY_LABELS.map((label, i) => (
            <TouchableOpacity
              key={i}
              style={[s.qualityBtn, { borderColor: QUALITY_COLORS[i] }]}
              onPress={() => reviewMutation.mutate({ wordId: words[current]!.word.id, quality: i })}
              disabled={reviewMutation.isPending}
            >
              <Text style={[s.qualityBtnText, { color: QUALITY_COLORS[i] }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#94a3b8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  langSwitch: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 8, padding: 3 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 6 },
  langBtnActive: { backgroundColor: '#6366f1' },
  langBtnText: { color: '#64748b', fontWeight: '600' },
  langBtnTextActive: { color: '#fff' },
  progress: { color: '#64748b', fontSize: 14 },
  card: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardFront: { alignItems: 'center', gap: 12 },
  cardBack: { alignItems: 'center', gap: 12 },
  wordText: { fontSize: 36, fontWeight: '700', color: '#f8fafc', textAlign: 'center' },
  readingText: { fontSize: 18, color: '#94a3b8' },
  speakBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  speakBtnText: { color: '#93c5fd', fontSize: 14 },
  tapHint: { color: '#475569', fontSize: 13, marginTop: 8 },
  meaningText: { fontSize: 28, fontWeight: '700', color: '#f8fafc', textAlign: 'center' },
  exampleText: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
  translationText: { fontSize: 13, color: '#475569', textAlign: 'center' },
  qualityButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingBottom: 8 },
  qualityBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#1e293b',
  },
  qualityBtnText: { fontWeight: '600', fontSize: 13 },
})
