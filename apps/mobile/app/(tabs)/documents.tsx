import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useQuery, useMutation } from '@tanstack/react-query'
import * as Speech from 'expo-speech'
import { api } from '../../src/lib/api'
import type { Document, SupportedLanguage, ProficiencyLevel } from '@language-app/shared'

const LEVELS: ProficiencyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced']
const LEVEL_KO: Record<ProficiencyLevel, string> = {
  beginner: '초급', elementary: '초중급', intermediate: '중급', advanced: '고급',
}

export default function DocumentsScreen() {
  const [lang, setLang] = useState<SupportedLanguage>('en')
  const [selected, setSelected] = useState<Document | null>(null)
  const [adapted, setAdapted] = useState<string | null>(null)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', lang],
    queryFn: () => api.get<Document[]>(`/documents?language=${lang}`),
  })

  const adaptMutation = useMutation({
    mutationFn: ({ id, level }: { id: string; level: ProficiencyLevel }) =>
      api.post<{ text: string }>(`/documents/${id}/adapt?level=${level}`),
    onSuccess: (data) => setAdapted(data.text),
  })

  const speak = (text: string) => Speech.speak(text, { language: lang === 'en' ? 'en-US' : 'ja-JP' })

  if (selected) {
    const content = adapted ?? selected.content
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.backBtn} onPress={() => { setSelected(null); setAdapted(null) }}>
          <Text style={s.backText}>← 목록으로</Text>
        </TouchableOpacity>

        <Text style={s.docTitle}>{selected.title}</Text>
        <Text style={s.docLevel}>{LEVEL_KO[selected.level]} · {selected.estimatedReadingMinutes}분</Text>

        <View style={s.docActions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => speak(content)}>
            <Text style={s.actionBtnText}>🔊 읽어주기</Text>
          </TouchableOpacity>
          {adaptMutation.isPending && (
            <ActivityIndicator size="small" color="#6366f1" />
          )}
        </View>

        <View style={s.levelPicker}>
          <Text style={s.levelPickerLabel}>레벨 조정</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {LEVELS.map((l) => (
              <TouchableOpacity
                key={l}
                style={[s.levelChip, adapted !== null && s.levelChipActive]}
                onPress={() => adaptMutation.mutate({ id: selected.id, level: l })}
              >
                <Text style={s.levelChipText}>{LEVEL_KO[l]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={s.docContent}>{content}</Text>
      </ScrollView>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.langSwitch}>
        {(['en', 'ja'] as SupportedLanguage[]).map((l) => (
          <TouchableOpacity
            key={l}
            style={[s.langBtn, lang === l && s.langBtnActive]}
            onPress={() => setLang(l)}
          >
            <Text style={[s.langBtnText, lang === l && s.langBtnTextActive]}>
              {l === 'en' ? '영어' : '일본어'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#6366f1" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {documents?.map((doc) => (
            <TouchableOpacity key={doc.id} style={s.docCard} onPress={() => setSelected(doc)}>
              <Text style={s.docCardLevel}>{LEVEL_KO[doc.level]}</Text>
              <Text style={s.docCardTitle}>{doc.title}</Text>
              <Text style={s.docCardMeta}>{doc.estimatedReadingMinutes}분 읽기</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  langSwitch: { flexDirection: 'row', backgroundColor: '#1e293b', margin: 16, borderRadius: 10, padding: 3 },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  langBtnActive: { backgroundColor: '#6366f1' },
  langBtnText: { color: '#64748b', fontWeight: '600' },
  langBtnTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  docCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 18 },
  docCardLevel: { fontSize: 11, color: '#6366f1', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  docCardTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  docCardMeta: { fontSize: 13, color: '#64748b' },
  backBtn: { marginBottom: 16 },
  backText: { color: '#6366f1', fontSize: 15 },
  docTitle: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  docLevel: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  docActions: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'center' },
  actionBtn: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#94a3b8', fontSize: 14 },
  levelPicker: { marginBottom: 20 },
  levelPickerLabel: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  levelChip: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  levelChipActive: { borderColor: '#6366f1', borderWidth: 1 },
  levelChipText: { color: '#94a3b8', fontSize: 13 },
  docContent: { fontSize: 16, color: '#cbd5e1', lineHeight: 26 },
})
