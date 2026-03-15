import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type VitalEntry = { date: string; value: number; value2?: number };
type Vital = {
  id: string;
  label: string;
  unit: string;
  icon: string;
  iconLib: 'ion' | 'mci';
  color: string;
  colorLight: string;
  current: string;
  status: 'normal' | 'warning' | 'alert';
  history: VitalEntry[];
};

type WeightRecord = {
  id: string;
  user_id: string;
  weight: number;
  unit: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
};

const VITALS: Vital[] = [
  {
    id: 'bp', label: 'Blood Pressure', unit: 'mmHg',
    icon: 'heart', iconLib: 'ion', color: Colors.red, colorLight: Colors.redLight,
    current: '118/76', status: 'normal',
    history: [
      { date: 'Feb 27', value: 122, value2: 80 },
      { date: 'Feb 28', value: 119, value2: 78 },
      { date: 'Mar 1', value: 121, value2: 79 },
      { date: 'Mar 2', value: 118, value2: 76 },
      { date: 'Mar 3', value: 120, value2: 77 },
      { date: 'Mar 4', value: 117, value2: 75 },
      { date: 'Mar 5', value: 118, value2: 76 },
    ],
  },
  {
    id: 'sugar', label: 'Blood Sugar', unit: 'mg/dL',
    icon: 'water', iconLib: 'mci', color: Colors.orange, colorLight: Colors.orangeLight,
    current: '98', status: 'normal',
    history: [
      { date: 'Feb 27', value: 102 }, { date: 'Feb 28', value: 99 },
      { date: 'Mar 1', value: 105 }, { date: 'Mar 2', value: 98 },
      { date: 'Mar 3', value: 96 }, { date: 'Mar 4', value: 100 },
      { date: 'Mar 5', value: 98 },
    ],
  },
  {
    id: 'hr', label: 'Heart Rate', unit: 'bpm',
    icon: 'pulse-outline', iconLib: 'ion', color: Colors.primary, colorLight: Colors.primaryLight,
    current: '72', status: 'normal',
    history: [
      { date: 'Feb 27', value: 74 }, { date: 'Feb 28', value: 71 },
      { date: 'Mar 1', value: 73 }, { date: 'Mar 2', value: 70 },
      { date: 'Mar 3', value: 72 }, { date: 'Mar 4', value: 75 },
      { date: 'Mar 5', value: 72 },
    ],
  },
  {
    id: 'weight', label: 'Weight', unit: 'kg',
    icon: 'fitness-outline', iconLib: 'ion', color: Colors.green, colorLight: Colors.greenLight,
    current: '74.2', status: 'normal',
    history: [
      { date: 'Feb 27', value: 74.8 }, { date: 'Feb 28', value: 74.6 },
      { date: 'Mar 1', value: 74.5 }, { date: 'Mar 2', value: 74.4 },
      { date: 'Mar 3', value: 74.3 }, { date: 'Mar 4', value: 74.2 },
      { date: 'Mar 5', value: 74.2 },
    ],
  },
];

const STATUS = { normal: Colors.green, warning: Colors.orange, alert: Colors.red };
const STATUS_LABEL = { normal: 'Normal', warning: 'Watch', alert: 'Alert' };
const BAR_W = (width - 64) / 7;

function MiniChart({ vital }: { vital: Vital }) {
  const vals = vital.history.map((h) => h.value);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const H = 48;
  return (
    <View style={[chartStyles.wrap, { height: H }]}>
      {vital.history.map((h, i) => {
        const pct = (h.value - min) / range;
        const barH = Math.max(6, pct * (H - 8));
        return (
          <View key={i} style={[chartStyles.barWrap, { width: BAR_W }]}>
            <View
              style={[chartStyles.bar, { height: barH, backgroundColor: vital.color + 'CC' }]}
            />
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barWrap: { alignItems: 'center' },
  bar: { borderRadius: 3, minHeight: 6 },
});

function VitalCard({ vital, expanded, onToggle, onLogClick, onViewHistory }: {
  vital: Vital;
  expanded: boolean;
  onToggle: () => void;
  onLogClick?: () => void;
  onViewHistory?: () => void;
}) {
  const Icon = vital.iconLib === 'ion' ? Ionicons : MaterialCommunityIcons;
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: vital.color, borderLeftWidth: 4 }]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.icon, { backgroundColor: vital.colorLight }]}>
          <Icon name={vital.icon as any} size={22} color={vital.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.label}>{vital.label}</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.value, { color: vital.color }]}>{vital.current}</Text>
            <Text style={styles.unit}> {vital.unit}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: STATUS[vital.status] + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS[vital.status] }]}>
              {STATUS_LABEL[vital.status]}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textMuted}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.expanded}>
          <Text style={styles.histLabel}>Last 7 Days</Text>
          <MiniChart vital={vital} />
          <View style={styles.histRow}>
            {vital.history.map((h, i) => (
              <Text key={i} style={[styles.histDate, { width: BAR_W }]}>
                {h.date.split(' ')[1]}
              </Text>
            ))}
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onLogClick}
              disabled={!onLogClick}
            >
              <Ionicons name="add-circle" size={16} color={vital.color} />
              <Text style={[styles.logText, { color: vital.color }]}>Log new reading</Text>
            </TouchableOpacity>
            {onViewHistory && (
              <TouchableOpacity style={styles.actionBtn} onPress={onViewHistory}>
                <Ionicons name="list" size={16} color={vital.color} />
                <Text style={[styles.logText, { color: vital.color }]}>View history</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Weight Modal (Add/Edit) ─────────────────────────────────────────────────
function WeightModal({
  visible,
  onClose,
  onSaved,
  userId,
  editRecord,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  editRecord?: WeightRecord | null;
}) {
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editRecord) {
      setWeight(editRecord.weight.toString());
    } else {
      setWeight('');
    }
  }, [editRecord, visible]);

  const handleSave = async () => {
    const weightNum = parseFloat(weight);
    if (!weight.trim() || isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight.');
      return;
    }

    setSaving(true);

    if (editRecord) {
      // Update existing record
      const { error } = await supabase
        .from('weight_records')
        .update({
          weight: weightNum,
        })
        .eq('id', editRecord.id);

      setSaving(false);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    } else {
      // Insert new record
      const { error } = await supabase.from('weight_records').insert({
        user_id: userId,
        weight: weightNum,
        unit: 'kg',
        recorded_at: new Date().toISOString(),
      });

      setSaving(false);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    }

    setWeight('');
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    if (!editRecord) return;

    Alert.alert(
      'Delete Weight Record',
      'Are you sure you want to delete this weight record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const { error } = await supabase
              .from('weight_records')
              .delete()
              .eq('id', editRecord.id);

            setSaving(false);
            if (error) {
              Alert.alert('Error', error.message);
              return;
            }

            setWeight('');
            onSaved();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.sheet}
      >
        <View style={modalStyles.handle} />
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>
            {editRecord ? 'Edit Weight' : 'Log Weight'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={modalStyles.label}>Weight (kg) *</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="e.g. 74.50"
            placeholderTextColor={Colors.textMuted}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={modalStyles.saveBtnText}>
                {editRecord ? 'Update Weight' : 'Save Weight'}
              </Text>
            )}
          </TouchableOpacity>

          {editRecord && (
            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: Colors.red, marginTop: 10 }]}
              onPress={handleDelete}
              disabled={saving}
            >
              <Text style={modalStyles.saveBtnText}>Delete Record</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Weight History List ─────────────────────────────────────────────────────
function WeightHistoryModal({
  visible,
  onClose,
  records,
  onEditRecord,
}: {
  visible: boolean;
  onClose: () => void;
  records: WeightRecord[];
  onEditRecord: (record: WeightRecord) => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWeightChange = (index: number) => {
    if (index === records.length - 1) return null;
    const current = records[index].weight;
    const previous = records[index + 1].weight;
    const change = current - previous;
    return change;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[modalStyles.sheet, { maxHeight: '85%' }]}
      >
        <View style={modalStyles.handle} />
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Weight History</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {records.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Ionicons name="fitness-outline" size={48} color={Colors.textMuted} />
              <Text style={{ marginTop: 12, fontSize: 14, color: Colors.textMuted }}>
                No weight records yet
              </Text>
            </View>
          ) : (
            records.map((record, index) => {
              const change = getWeightChange(index);
              return (
                <TouchableOpacity
                  key={record.id}
                  style={historyStyles.recordCard}
                  onPress={() => {
                    onClose();
                    onEditRecord(record);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={historyStyles.recordLeft}>
                    <View style={historyStyles.weightBadge}>
                      <Text style={historyStyles.weightValue}>{record.weight.toFixed(2)}</Text>
                      <Text style={historyStyles.weightUnit}>kg</Text>
                    </View>
                    {change !== null && (
                      <View
                        style={[
                          historyStyles.changeBadge,
                          { backgroundColor: change > 0 ? Colors.redLight : Colors.greenLight },
                        ]}
                      >
                        <Ionicons
                          name={change > 0 ? 'arrow-up' : 'arrow-down'}
                          size={10}
                          color={change > 0 ? Colors.red : Colors.green}
                        />
                        <Text
                          style={[
                            historyStyles.changeText,
                            { color: change > 0 ? Colors.red : Colors.green },
                          ]}
                        >
                          {Math.abs(change).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={historyStyles.recordRight}>
                    <Text style={historyStyles.recordDate}>{formatDate(record.recorded_at)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const TIPS = [
  { icon: 'water-outline', text: 'Drink at least 8 glasses of water daily', color: Colors.teal },
  { icon: 'walk-outline', text: '30 minutes of walking improves heart health', color: Colors.green },
  { icon: 'moon-outline', text: 'Aim for 7–9 hours of quality sleep', color: Colors.purple },
  { icon: 'nutrition-outline', text: 'Eat balanced meals, reduce sodium & sugar', color: Colors.orange },
];

export default function HealthScreen() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WeightRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState<Vital[]>(VITALS);

  const fetchWeightRecords = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('weight_records')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false });
    setLoading(false);
    if (!error && data) {
      setWeightRecords(data as WeightRecord[]);
      updateWeightVital(data as WeightRecord[]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWeightRecords();
  }, [fetchWeightRecords]);

  const updateWeightVital = (records: WeightRecord[]) => {
    if (records.length === 0) return;

    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const history: VitalEntry[] = sortedRecords.slice(-7).map((r) => ({
      date: new Date(r.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: r.weight,
    }));

    const currentWeight = records[0].weight;
    const status: 'normal' | 'warning' | 'alert' =
      currentWeight >= 60 && currentWeight <= 90 ? 'normal' :
      currentWeight >= 50 && currentWeight <= 100 ? 'warning' : 'alert';

    setVitals((prev) =>
      prev.map((v) =>
        v.id === 'weight'
          ? {
              ...v,
              current: currentWeight.toFixed(2),
              status,
              history: history.length > 0 ? history : v.history,
            }
          : v
      )
    );
  };

  const handleWeightSaved = () => {
    fetchWeightRecords();
    setEditingRecord(null);
  };

  const handleEditRecord = (record: WeightRecord) => {
    setEditingRecord(record);
    setShowWeightModal(true);
  };

  const handleCloseWeightModal = () => {
    setShowWeightModal(false);
    setEditingRecord(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Health Tracking</Text>
        <Text style={styles.pageSub}>March 15, 2026 · All readings normal</Text>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Streak', value: '12 days', icon: 'flame-outline', color: Colors.orange },
            { label: 'Readings', value: '28 this month', icon: 'bar-chart-outline', color: Colors.primary },
            { label: 'Score', value: '92/100', icon: 'heart-circle-outline', color: Colors.red },
          ].map((s) => (
            <View key={s.label} style={styles.summaryCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.summaryVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Vital Signs</Text>
        {loading && weightRecords.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          vitals.map((v) => (
            <VitalCard
              key={v.id}
              vital={v}
              expanded={expandedId === v.id}
              onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)}
              onLogClick={v.id === 'weight' ? () => setShowWeightModal(true) : undefined}
              onViewHistory={v.id === 'weight' ? () => setShowHistoryModal(true) : undefined}
            />
          ))
        )}

        <Text style={styles.sectionTitle}>Health Tips</Text>
        {TIPS.map((t) => (
          <View key={t.text} style={styles.tipCard}>
            <View style={[styles.tipIcon, { backgroundColor: t.color + '20' }]}>
              <Ionicons name={t.icon as any} size={20} color={t.color} />
            </View>
            <Text style={styles.tipText}>{t.text}</Text>
          </View>
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      <WeightModal
        visible={showWeightModal}
        onClose={handleCloseWeightModal}
        onSaved={handleWeightSaved}
        userId={user?.id ?? ''}
        editRecord={editingRecord}
      />

      <WeightHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        records={weightRecords}
        onEditRecord={handleEditRecord}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  pageSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2, marginBottom: 16 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  summaryVal: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10, marginTop: 4 },

  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  label: { fontSize: 12, color: Colors.textSub },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  value: { fontSize: 20, fontWeight: '800' },
  unit: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  right: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  expanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  histLabel: { fontSize: 12, color: Colors.textSub, marginBottom: 8 },
  histRow: { flexDirection: 'row', marginTop: 4 },
  histDate: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logText: { fontSize: 13, fontWeight: '700' },

  tipCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  tipIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSub, lineHeight: 18 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSub, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});

const historyStyles = StyleSheet.create({
  recordCard: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordLeft: {
    alignItems: 'center',
    gap: 4,
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  weightValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.green,
  },
  weightUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  recordRight: {
    flex: 1,
  },
  recordDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  recordNotes: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
