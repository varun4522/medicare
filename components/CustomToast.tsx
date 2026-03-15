import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[styles.base, styles.success]}
      contentContainerStyle={styles.content}
      text1Style={styles.title}
      text2Style={styles.subtitle}
      renderLeadingIcon={() => (
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.green} />
        </View>
      )}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[styles.base, styles.error]}
      contentContainerStyle={styles.content}
      text1Style={styles.title}
      text2Style={styles.subtitle}
      renderLeadingIcon={() => (
        <View style={styles.iconWrap}>
          <Ionicons name="close-circle" size={24} color={Colors.red} />
        </View>
      )}
    />
  ),
  info: ({ text1, text2 }) => (
    <View style={[styles.base, styles.info]}>
      <View style={styles.iconWrap}>
        <Ionicons name="information-circle" size={24} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    borderLeftWidth: 0,
    paddingVertical: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    backgroundColor: Colors.card,
    height: 'auto',
    minHeight: 64,
  },
  success: { borderLeftWidth: 5, borderLeftColor: Colors.green },
  error: { borderLeftWidth: 5, borderLeftColor: Colors.red },
  info: { borderLeftWidth: 5, borderLeftColor: Colors.primary },
  iconWrap: { paddingHorizontal: 12, justifyContent: 'center' },
  content: { flex: 1, paddingRight: 12, paddingVertical: 6 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
});

export default toastConfig;
