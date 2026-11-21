import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const [following, setFollowing] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>Maya Lin</Text>
        <Text style={styles.meta}>Oakwood District · 3 Followers · 2 Following</Text>
        <TouchableOpacity onPress={() => setFollowing((f) => !f)} style={styles.btn}>
          <Text style={styles.btnText}>{following ? 'Following' : 'Follow'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7', padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 10 },
  name: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  meta: { fontSize: 13, color: '#64748B' },
  btn: { backgroundColor: '#1877F2', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
