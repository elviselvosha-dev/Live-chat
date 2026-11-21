import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFreeMode } from '../context/FreeModeContext';

export default function ReelsScreen() {
  const { freeMode } = useFreeMode();
  const [liked, setLiked] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.stage}>
        {freeMode ? (
          <View style={styles.freeOverlay}>
            <Text style={styles.freeTitle}>Reel Video Paused in Free Mode</Text>
            <Text style={styles.freeSub}>&ldquo;Golden hour boardwalk ride down by the harbor.&rdquo;</Text>
          </View>
        ) : (
          <Text style={styles.videoLabel}>9:16 Vertical Reel Player</Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.creator}>@mayalin</Text>
          <Text style={styles.caption}>Golden hour boardwalk ride down by the harbor.</Text>
          <TouchableOpacity onPress={() => setLiked((l) => !l)} style={styles.likeBtn}>
            <Text style={styles.likeText}>{liked ? 'Liked' : 'Like'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  stage: { flex: 1, justifyContent: 'space-between', padding: 20 },
  freeOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  freeTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  freeSub: { color: '#94A3B8', fontSize: 13, marginTop: 8, textAlign: 'center' },
  videoLabel: { color: '#94A3B8', textAlign: 'center', marginTop: 120 },
  footer: { gap: 8 },
  creator: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  caption: { color: '#E2E8F0', fontSize: 13 },
  likeBtn: { alignSelf: 'flex-start', backgroundColor: '#1877F2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  likeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});
