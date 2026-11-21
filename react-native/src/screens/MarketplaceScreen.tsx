import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ITEMS = [
  { id: '1', title: 'Teal 8-Speed City Commuter Bicycle', price: '$340', location: 'Riverside Heights' },
  { id: '2', title: 'Mirrorless Camera + 35mm f/2 Lens', price: '$890', location: 'Riverside Heights' },
];

export default function MarketplaceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Local Marketplace</Text>
      <FlatList
        data={ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.price}>{item.price}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.location}</Text>
            <TouchableOpacity style={styles.msgBtn}>
              <Text style={styles.msgBtnText}>Message Seller</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, gap: 4 },
  price: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  meta: { fontSize: 12, color: '#64748B' },
  msgBtn: { marginTop: 8, backgroundColor: '#1877F2', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  msgBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
