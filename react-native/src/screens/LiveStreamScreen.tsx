import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LiveStreamScreen() {
  const [broadcasting, setBroadcasting] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{broadcasting ? 'LIVE NOW · 14 viewers' : 'Live Broadcast Studio'}</Text>
        <Text style={styles.sub}>Stream live video and real-time chat to your followers on Android.</Text>
        <TouchableOpacity
          onPress={() => setBroadcasting((b) => !b)}
          style={[styles.btn, broadcasting && styles.btnStop]}
        >
          <Text style={styles.btnText}>{broadcasting ? 'End Live Stream' : 'Go Live Now'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7', padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B' },
  btn: { backgroundColor: '#E11D48', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnStop: { backgroundColor: '#0F172A' },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
