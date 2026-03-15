import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ServoControlRow = {
  id: number;
  status: number | null;
};

const SERVO_ROW_ID = 1;

export default function ServoScreen() {
  const [status, setStatus] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchServoControl = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('servo_control')
      .select('id, status')
      .eq('id', SERVO_ROW_ID)
      .maybeSingle<ServoControlRow>();

    if (error) {
      setLoading(false);
      Alert.alert('Servo sync failed', error.message);
      return;
    }

    if (!data) {
      const { data: insertedRow, error: insertError } = await supabase
        .from('servo_control')
        .upsert({ id: SERVO_ROW_ID, status: 0 }, { onConflict: 'id' })
        .select('id, status')
        .single<ServoControlRow>();

      setLoading(false);

      if (insertError) {
        Alert.alert('Servo setup failed', insertError.message);
        return;
      }

      setStatus(insertedRow.status ?? 0);
      return;
    }

    setStatus(data.status ?? 0);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchServoControl();
    }, [fetchServoControl])
  );

  const handleToggle = useCallback(
    async (nextValue: boolean) => {
      const nextStatus = nextValue ? 1 : 0;
      const previousStatus = status;

      setStatus(nextStatus);
      setUpdating(true);

      const { data, error } = await supabase
        .from('servo_control')
        .upsert({ id: SERVO_ROW_ID, status: nextStatus }, { onConflict: 'id' })
        .select('id, status')
        .single<ServoControlRow>();

      setUpdating(false);

      if (error) {
        setStatus(previousStatus);
        Alert.alert('Update failed', error.message);
        return;
      }

      setStatus(data.status ?? nextStatus);
    },
    [status]
  );

  const isOn = status === 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Servo Control</Text>
        <Text style={styles.pageSub}>
          Connected to Supabase table `servo_control` using row id {SERVO_ROW_ID}.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: isOn ? Colors.greenLight : Colors.orangeLight }]}>
              <Ionicons
                name={isOn ? 'flash' : 'flash-off'}
                size={26}
                color={isOn ? Colors.green : Colors.orange}
              />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.cardTitle}>Motor Power</Text>
              <Text style={styles.cardSubTitle}>
                Current `status`: {status}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isOn ? Colors.greenLight : Colors.redLight }]}>
              <Text style={[styles.badgeText, { color: isOn ? Colors.green : Colors.red }]}>
                {isOn ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderText}>Loading servo status...</Text>
            </View>
          ) : (
            <>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Power switch</Text>
                  <Text style={styles.switchHint}>
                    Toggle the switch to update the `status` column in Supabase.
                  </Text>
                </View>
                <Switch
                  value={isOn}
                  onValueChange={handleToggle}
                  disabled={updating}
                  trackColor={{ false: Colors.border, true: Colors.primaryMid }}
                  thumbColor={Colors.white}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  isOn ? styles.buttonOff : styles.buttonOn,
                  pressed && styles.buttonPressed,
                  updating && styles.buttonDisabled,
                ]}
                onPress={() => handleToggle(!isOn)}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons
                      name={isOn ? 'power' : 'flash-outline'}
                      size={20}
                      color={Colors.white}
                    />
                    <Text style={styles.buttonText}>{isOn ? 'Turn Servo Off' : 'Turn Servo On'}</Text>
                  </>
                )}
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={() => void fetchServoControl()}>
                <Ionicons name="refresh" size={18} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Refresh from Supabase</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  pageSub: {
    marginTop: 4,
    marginBottom: 20,
    fontSize: 13,
    color: Colors.textSub,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  cardSubTitle: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.textSub,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
    color: Colors.textSub,
  },
  switchRow: {
    marginTop: 28,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  switchHint: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSub,
    maxWidth: 230,
  },
  button: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonOn: {
    backgroundColor: Colors.green,
  },
  buttonOff: {
    backgroundColor: Colors.red,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  secondaryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});