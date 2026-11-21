import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageItem {
  id: string;
  sender: string;
  text: string;
  reaction?: string;
}

export default function MessagesScreen() {
  const [text, setText] = useState('');
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([
    { id: '1', sender: 'Marcus Vance', text: 'Are you saving any rosemary focaccia today?' },
  ]);

  const send = () => {
    if (!text.trim()) return;
    setMessages([...messages, { id: String(Date.now()), sender: 'You', text: text.trim() }]);
    setText('');
  };

  const attachReaction = (id: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m))
    );
    setActiveTargetId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Live Chat</Text>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={styles.msgGroup}>
            {activeTargetId === item.id && (
              <View style={styles.picker}>
                {EMOJIS.map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => attachReaction(item.id, emoji)} style={styles.emojiBtn}>
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              activeOpacity={0.85}
              onLongPress={() => setActiveTargetId(item.id)}
              style={styles.bubble}
            >
              <Text style={styles.sender}>{item.sender}</Text>
              <Text style={styles.msg}>{item.text}</Text>
            </TouchableOpacity>
            {item.reaction && (
              <View style={styles.reactionBadge}>
                <Text style={styles.reactionText}>{item.reaction}</Text>
              </View>
            )}
          </View>
        )}
      />
      <View style={styles.row}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Message..." />
        <TouchableOpacity onPress={send} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  msgGroup: { marginBottom: 10 },
  picker: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 6, marginBottom: 6, alignSelf: 'flex-start', gap: 4 },
  emojiBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  bubble: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 },
  sender: { fontSize: 12, fontWeight: '700', color: '#1877F2' },
  msg: { fontSize: 14, color: '#0F172A', marginTop: 2 },
  reactionBadge: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  reactionText: { fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  sendBtn: { backgroundColor: '#1877F2', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#FFFFFF', fontWeight: '700' },
});
