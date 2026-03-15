import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Medication = {
  id: string;
  name: string;
  box_info: string;
  used_for: string;
  mfg_date: string;
  exp_date: string;
  timings: string[];
  created_at: string;
};

type WeightRecord = {
  user_id: string;
  weight: number;
  created_at: string;
};

type ServoSchedule = {
  id: string;
  user_id: string;
  servo_name: 'servo1' | 'servo2';
  scheduled_time: string;
  target_status: number;
  is_active: boolean;
  created_at: string;
};

const PRESET_TIMINGS = [
  { label: 'Morning', time: '08:00 AM' },
  { label: 'Afternoon', time: '02:00 PM' },
  { label: 'Evening', time: '06:00 PM' },
  { label: 'Night', time: '09:00 PM' },
];

// ─── Weight Card ──────────────────────────────────────────────────────────────
function WeightCard({
  currentWeight,
  lastUpdated,
  onAddWeight,
}: {
  currentWeight: number | null;
  lastUpdated: string | null;
  onAddWeight: () => void;
}) {
  return (
    <View style={styles.weightCard}>
      <View style={styles.weightCardHeader}>
        <View style={styles.weightIconWrap}>
          <Ionicons name="fitness-outline" size={24} color={Colors.green} />
        </View>
        <View style={styles.weightInfo}>
          <Text style={styles.weightLabel}>Current Weight</Text>
          {currentWeight ? (
            <View style={styles.weightValueRow}>
              <Text style={styles.weightValue}>{currentWeight.toFixed(2)}</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
          ) : (
            <Text style={styles.noWeightText}>No weight recorded</Text>
          )}
          {lastUpdated && (
            <Text style={styles.weightLastUpdated}>
              Updated {new Date(lastUpdated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.weightAddBtn} onPress={onAddWeight}>
          <Ionicons name={currentWeight ? 'create-outline' : 'add'} size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Servo Schedule Card ──────────────────────────────────────────────────────
function ServoScheduleCard({
  schedules,
  onAddSchedule,
  onDeleteSchedule,
  onToggleActive,
}: {
  schedules: ServoSchedule[];
  onAddSchedule: () => void;
  onDeleteSchedule: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <View style={styles.servoCard}>
      <View style={styles.servoCardHeader}>
        <View style={styles.servoHeaderLeft}>
          <View style={styles.servoIconWrap}>
            <Ionicons name="timer-outline" size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.servoCardTitle}>Servo Timer Control</Text>
            <Text style={styles.servoCardSubtitle}>{schedules.length} schedules</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.servoAddBtn} onPress={onAddSchedule}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.emptySchedule}>
          <Ionicons name="calendar-outline" size={32} color={Colors.border} />
          <Text style={styles.emptyScheduleText}>No schedules yet</Text>
          <Text style={styles.emptyScheduleHint}>Tap + to add a timer</Text>
        </View>
      ) : (
        <View style={styles.schedulesList}>
          {schedules.map((schedule) => (
            <View key={schedule.id} style={styles.scheduleItem}>
              <View style={styles.scheduleLeft}>
                <View
                  style={[
                    styles.servoIndicator,
                    { backgroundColor: schedule.servo_name === 'servo1' ? Colors.primary : Colors.orange },
                  ]}
                >
                  <Ionicons name="toggle" size={16} color={Colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleServoName}>
                    {schedule.servo_name === 'servo1' ? 'Servo 1' : 'Servo 2'}
                  </Text>
                  <View style={styles.scheduleDetails}>
                    <Ionicons name="time" size={12} color={Colors.textMuted} />
                    <Text style={styles.scheduleTime}>{formatTime(schedule.scheduled_time)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: schedule.target_status === 1 ? Colors.greenLight : Colors.redLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: schedule.target_status === 1 ? Colors.green : Colors.red },
                        ]}
                      >
                        {schedule.target_status === 1 ? 'ON' : 'OFF'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.scheduleActions}>
                <TouchableOpacity
                  style={[styles.scheduleToggle, !schedule.is_active && styles.scheduleToggleInactive]}
                  onPress={() => onToggleActive(schedule.id, !schedule.is_active)}
                >
                  <Ionicons
                    name={schedule.is_active ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={schedule.is_active ? Colors.green : Colors.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDeleteSchedule(schedule.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={Colors.red} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Add Schedule Modal ───────────────────────────────────────────────────────
function AddScheduleModal({
  visible,
  onClose,
  onSaved,
  userId,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
}) {
  const [servoName, setServoName] = useState<'servo1' | 'servo2'>('servo1');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!time.trim()) {
      Alert.alert('Required', 'Please enter the scheduled time.');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g., 14:30)');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('servo_schedules').insert({
      user_id: userId,
      servo_name: servoName,
      scheduled_time: time,
      target_status: status,
      is_active: true,
    });

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setTime('');
    setServoName('servo1');
    setStatus(1);
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modalSheet, { maxHeight: '60%' }]}
      >
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Servo Schedule</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.fieldLabel}>Select Servo *</Text>
          <View style={styles.servoSelector}>
            <TouchableOpacity
              style={[styles.servoOption, servoName === 'servo1' && styles.servoOptionSelected]}
              onPress={() => setServoName('servo1')}
            >
              <Ionicons
                name="toggle"
                size={20}
                color={servoName === 'servo1' ? Colors.white : Colors.primary}
              />
              <Text
                style={[styles.servoOptionText, servoName === 'servo1' && styles.servoOptionTextSelected]}
              >
                Servo 1
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.servoOption, servoName === 'servo2' && styles.servoOptionSelected]}
              onPress={() => setServoName('servo2')}
            >
              <Ionicons
                name="toggle"
                size={20}
                color={servoName === 'servo2' ? Colors.white : Colors.orange}
              />
              <Text
                style={[styles.servoOptionText, servoName === 'servo2' && styles.servoOptionTextSelected]}
              >
                Servo 2
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Scheduled Time (24-hour format) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 14:30 or 08:00"
            placeholderTextColor={Colors.textMuted}
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          <Text style={styles.fieldHint}>Enter time in HH:MM format (e.g., 14:30 for 2:30 PM)</Text>

          <Text style={styles.fieldLabel}>Target Status *</Text>
          <View style={styles.statusSelector}>
            <TouchableOpacity
              style={[styles.statusOption, status === 1 && styles.statusOptionOn]}
              onPress={() => setStatus(1)}
            >
              <Ionicons name="flash" size={20} color={status === 1 ? Colors.white : Colors.green} />
              <Text style={[styles.statusOptionText, status === 1 && { color: Colors.white }]}>
                Turn ON
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusOption, status === 0 && styles.statusOptionOff]}
              onPress={() => setStatus(0)}
            >
              <Ionicons name="flash-off" size={20} color={status === 0 ? Colors.white : Colors.red} />
              <Text style={[styles.statusOptionText, status === 0 && { color: Colors.white }]}>
                Turn OFF
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save Schedule</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Quick Weight Modal ───────────────────────────────────────────────────────
function QuickWeightModal({
  visible,
  onClose,
  onSaved,
  userId,
  currentWeight,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  currentWeight: number | null;
}) {
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && currentWeight) {
      setWeight(currentWeight.toString());
    } else if (visible && !currentWeight) {
      setWeight('');
    }
  }, [visible, currentWeight]);

  const handleSave = async () => {
    const weightNum = parseFloat(weight);
    if (!weight.trim() || isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('weight_records').upsert(
      {
        user_id: userId,
        weight: weightNum,
      },
      { onConflict: 'user_id' }
    );

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setWeight('');
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modalSheet, { maxHeight: '50%' }]}
      >
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Update Weight</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.fieldLabel}>Weight (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 74.50"
            placeholderTextColor={Colors.textMuted}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            autoFocus
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save Weight</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Medication Card ──────────────────────────────────────────────────────────
function MedicationCard({ med, onDelete }: { med: Medication; onDelete: (id: string) => void }) {
  const isExpired = med.exp_date && new Date(med.exp_date) < new Date();

  return (
    <View style={styles.medCard}>
      <View style={styles.medCardHeader}>
        <View style={styles.medIconWrap}>
          <Ionicons name="medkit-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{med.name}</Text>
          {med.box_info ? <Text style={styles.medBoxInfo}>{med.box_info}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => onDelete(med.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={Colors.red} />
        </TouchableOpacity>
      </View>

      {med.used_for ? (
        <View style={styles.medRow}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
          <Text style={styles.medMeta}>Used for: <Text style={styles.medMetaBold}>{med.used_for}</Text></Text>
        </View>
      ) : null}

      <View style={styles.medDatesRow}>
        {med.mfg_date ? (
          <View style={styles.datePill}>
            <Text style={styles.datePillLabel}>MFG</Text>
            <Text style={styles.datePillValue}>{med.mfg_date}</Text>
          </View>
        ) : null}
        {med.exp_date ? (
          <View style={[styles.datePill, isExpired && styles.datePillExpired]}>
            <Text style={[styles.datePillLabel, isExpired && { color: Colors.red }]}>EXP</Text>
            <Text style={[styles.datePillValue, isExpired && { color: Colors.red }]}>{med.exp_date}</Text>
          </View>
        ) : null}
      </View>

      {med.timings && med.timings.length > 0 ? (
        <View style={styles.timingsWrap}>
          <Ionicons name="time-outline" size={13} color={Colors.textSub} style={{ marginRight: 4 }} />
          {med.timings.map((t, i) => (
            <View key={i} style={styles.timingChip}>
              <Text style={styles.timingChipText}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ─── Add Medication Modal ─────────────────────────────────────────────────────
type FormState = {
  name: string;
  box_info: string;
  used_for: string;
  mfg_date: string;
  exp_date: string;
  timings: string[];
  customTiming: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  box_info: '',
  used_for: '',
  mfg_date: '',
  exp_date: '',
  timings: [],
  customTiming: '',
};

function AddMedicationModal({
  visible,
  onClose,
  onSaved,
  userId,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof FormState, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const togglePreset = (time: string) => {
    setForm((f) => ({
      ...f,
      timings: f.timings.includes(time)
        ? f.timings.filter((t) => t !== time)
        : [...f.timings, time],
    }));
  };

  const addCustomTiming = () => {
    const t = form.customTiming.trim();
    if (!t || form.timings.includes(t)) return;
    setForm((f) => ({ ...f, timings: [...f.timings, t], customTiming: '' }));
  };

  const removeTiming = (t: string) =>
    setForm((f) => ({ ...f, timings: f.timings.filter((x) => x !== t) }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter the medicine name.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('medications').insert({
      user_id: userId,
      name: form.name.trim(),
      box_info: form.box_info.trim() || null,
      used_for: form.used_for.trim() || null,
      mfg_date: form.mfg_date.trim() || null,
      exp_date: form.exp_date.trim() || null,
      timings: form.timings,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setForm(EMPTY_FORM);
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalSheet}
      >
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Medication</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Name */}
          <Text style={styles.fieldLabel}>Medicine Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Metformin 500mg"
            placeholderTextColor={Colors.textMuted}
            value={form.name}
            onChangeText={(v) => setField('name', v)}
          />

          {/* Box info */}
          <Text style={styles.fieldLabel}>Medicine Box / Packaging</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Strip of 10 tablets, 30ml bottle"
            placeholderTextColor={Colors.textMuted}
            value={form.box_info}
            onChangeText={(v) => setField('box_info', v)}
          />

          {/* Used for */}
          <Text style={styles.fieldLabel}>Used For (Purpose / Condition)</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            placeholder="e.g. Type 2 Diabetes, Blood Pressure control"
            placeholderTextColor={Colors.textMuted}
            value={form.used_for}
            onChangeText={(v) => setField('used_for', v)}
            multiline
          />

          {/* Dates */}
          <View style={styles.datesRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>MFG Date</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YYYY"
                placeholderTextColor={Colors.textMuted}
                value={form.mfg_date}
                onChangeText={(v) => setField('mfg_date', v)}
                keyboardType="numeric"
                maxLength={7}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>EXP Date</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YYYY"
                placeholderTextColor={Colors.textMuted}
                value={form.exp_date}
                onChangeText={(v) => setField('exp_date', v)}
                keyboardType="numeric"
                maxLength={7}
              />
            </View>
          </View>

          {/* Timings */}
          <Text style={styles.fieldLabel}>Timings</Text>
          <View style={styles.presetRow}>
            {PRESET_TIMINGS.map((p) => {
              const selected = form.timings.includes(p.time);
              return (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.presetChip, selected && styles.presetChipSelected]}
                  onPress={() => togglePreset(p.time)}
                >
                  <Text style={[styles.presetChipText, selected && styles.presetChipTextSelected]}>
                    {p.label}
                  </Text>
                  <Text style={[styles.presetChipTime, selected && { color: Colors.white }]}>
                    {p.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom timing */}
          <View style={styles.customTimingRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Custom time, e.g. 11:30 AM"
              placeholderTextColor={Colors.textMuted}
              value={form.customTiming}
              onChangeText={(v) => setField('customTiming', v)}
            />
            <TouchableOpacity style={styles.addTimingBtn} onPress={addCustomTiming}>
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Selected timings */}
          {form.timings.length > 0 && (
            <View style={styles.selectedTimingsWrap}>
              {form.timings.map((t, i) => (
                <TouchableOpacity key={i} style={styles.selectedTimingChip} onPress={() => removeTiming(t)}>
                  <Text style={styles.selectedTimingText}>{t}</Text>
                  <Ionicons name="close-circle" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save Medication</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<ServoSchedule[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [lastWeightUpdate, setLastWeightUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const fetchMedications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (!error && data) setMedications(data as Medication[]);
  }, [user?.id]);

  const fetchLatestWeight = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('weight_records')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      const latest = data as WeightRecord;
      setCurrentWeight(latest.weight);
      setLastWeightUpdate(latest.created_at);
    }
  }, [user?.id]);

  const fetchSchedules = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('servo_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: true });

    if (!error && data) {
      setSchedules(data as ServoSchedule[]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMedications();
    fetchLatestWeight();
    fetchSchedules();
  }, [fetchMedications, fetchLatestWeight, fetchSchedules]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Medication', 'Are you sure you want to remove this medication?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('medications').delete().eq('id', id);
          setMedications((prev) => prev.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  const handleWeightSaved = () => {
    fetchLatestWeight();
  };

  const handleScheduleSaved = () => {
    fetchSchedules();
  };

  const handleDeleteSchedule = (id: string) => {
    Alert.alert('Delete Schedule', 'Are you sure you want to remove this schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('servo_schedules').delete().eq('id', id);
          setSchedules((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  };

  const handleToggleScheduleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('servo_schedules')
      .update({ is_active: isActive })
      .eq('id', id);

    if (!error) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s))
      );
    } else {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>My Medications</Text>
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Weight Card */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <WeightCard
          currentWeight={currentWeight}
          lastUpdated={lastWeightUpdate}
          onAddWeight={() => setShowWeightModal(true)}
        />
      </View>

      {/* Servo Schedule Card */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <ServoScheduleCard
          schedules={schedules}
          onAddSchedule={() => setShowScheduleModal(true)}
          onDeleteSchedule={handleDeleteSchedule}
          onToggleActive={handleToggleScheduleActive}
        />
      </View>

      {medications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="medkit-outline" size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>No medications yet</Text>
          <Text style={styles.emptySubtitle}>Tap the + button to add your first medication.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {medications.map((med) => (
            <MedicationCard key={med.id} med={med} onDelete={handleDelete} />
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      <AddMedicationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSaved={fetchMedications}
        userId={user?.id ?? ''}
      />

      <QuickWeightModal
        visible={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSaved={handleWeightSaved}
        userId={user?.id ?? ''}
        currentWeight={currentWeight}
      />

      <AddScheduleModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSaved={handleScheduleSaved}
        userId={user?.id ?? ''}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSub, marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6 },

  list: { padding: 16 },

  // Weight card
  weightCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: Colors.green,
  },
  weightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightInfo: {
    flex: 1,
  },
  weightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  weightValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.green,
  },
  weightUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  noWeightText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  weightLastUpdated: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  weightAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Servo Schedule Card
  servoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  servoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  servoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servoIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servoCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  servoCardSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  servoAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyScheduleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSub,
    marginTop: 8,
  },
  emptyScheduleHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  schedulesList: {
    gap: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  servoIndicator: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleServoName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  scheduleTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleToggle: {
    padding: 4,
  },
  scheduleToggleInactive: {
    opacity: 0.5,
  },

  // Servo Selector Modal
  servoSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  servoOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: Colors.card,
  },
  servoOptionSelected: {
    backgroundColor: Colors.primary,
  },
  servoOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  servoOptionTextSelected: {
    color: Colors.white,
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: Colors.card,
  },
  statusOptionOn: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  statusOptionOff: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },

  // Medication card
  medCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  medCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  medIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  medBoxInfo: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  medMeta: { fontSize: 12, color: Colors.textSub },
  medMetaBold: { fontWeight: '700', color: Colors.text },
  medDatesRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePillExpired: { borderColor: Colors.red, backgroundColor: Colors.redLight },
  datePillLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5 },
  datePillValue: { fontSize: 12, fontWeight: '700', color: Colors.text },
  timingsWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  timingChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timingChipText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },

  // Form
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSub, marginBottom: 6, marginTop: 14 },
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
  datesRow: { flexDirection: 'row', marginTop: 4 },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  presetChip: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  presetChipSelected: { backgroundColor: Colors.primary },
  presetChipText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  presetChipTextSelected: { color: Colors.white },
  presetChipTime: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  customTimingRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  addTimingBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedTimingsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  selectedTimingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectedTimingText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  saveBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
