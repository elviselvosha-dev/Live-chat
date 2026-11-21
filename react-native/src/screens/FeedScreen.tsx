import React, { useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFreeMode } from '../context/FreeModeContext';

export default function FeedScreen() {
  const { freeMode, toggleFreeMode, dataSavedKb } = useFreeMode();
  const [composerText, setComposerText] = useState('');
  const [posts, setPosts] = useState([
    { id: '1', author: 'Maya Lin', text: 'Morning rush at the Oakwood Artisan Market!', image: true, likes: 14 },
    { id: '2', author: 'Marcus Vance', text: 'Tuned up my commuter bike and listed it on Marketplace.', image: true, likes: 9 },
  ]);

  const publish = () => {
    if (!composerText.trim()) return;
    setPosts([{ id: String(Date.now()), author: 'You', text: composerText.trim(), image: false, likes: 0 }, ...posts]);
    setComposerText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Kinbook</Text>
        <TouchableOpacity onPress={toggleFreeMode} style={[styles.freeBtn, freeMode && styles.freeBtnActive]}>
          <Text style={[styles.freeBtnText, freeMode && styles.freeBtnTextActive]}>
            {freeMode ? `Free Mode (${dataSavedKb} KB saved)` : 'Free Mode'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={composerText}
          onChangeText={setComposerText}
          placeholder="What's happening nearby?"
        />
        <TouchableOpacity onPress={publish} style={styles.postBtn}>
          <Text style={styles.postBtnText}>Post</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.body}>{item.text}</Text>
            {item.image && freeMode ? (
              <View style={styles.freePlaceholder}>
                <Text style={styles.freePlaceholderText}>Photo hidden in Free Mode (0 KB used)</Text>
              </View>
            ) : item.image ? (
              <Image source={{ uri: 'https://localhost/placeholder.jpg' }} style={styles.media} />
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#FFFFFF' },
  brand: { fontSize: 22, fontWeight: '800', color: '#1877F2' },
  freeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  freeBtnActive: { backgroundColor: '#0F172A' },
  freeBtnText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  freeBtnTextActive: { color: '#FFFFFF' },
  composer: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#FFFFFF', marginTop: 8 },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, height: 42 },
  postBtn: { backgroundColor: '#1877F2', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  postBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#FFFFFF', marginTop: 10, padding: 14 },
  author: { fontWeight: '700', fontSize: 15, color: '#0F172A' },
  body: { marginTop: 6, fontSize: 14, color: '#334155', lineHeight: 20 },
  media: { marginTop: 10, height: 220, borderRadius: 12, backgroundColor: '#E2E8F0' },
  freePlaceholder: { marginTop: 10, padding: 20, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  freePlaceholderText: { fontSize: 12, fontWeight: '600', color: '#475569' },
});
