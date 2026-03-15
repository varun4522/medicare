import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  primary: '#1565C0',
  primaryMid: '#1E88E5',
  primaryLight: '#E3F2FD',
  teal: '#00838F',
  tealLight: '#E0F7FA',
  green: '#2E7D32',
  greenLight: '#E8F5E9',
  orange: '#E65100',
  orangeLight: '#FFF3E0',
  purple: '#6A1B9A',
  purpleLight: '#F3E5F5',
  red: '#C62828',
  redLight: '#FFEBEE',
  bg: '#EEF2F7',
  card: '#FFFFFF',
  text: '#0D1B2A',
  textSub: '#455A64',
  textMuted: '#90A4AE',
  border: '#CFD8DC',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Medication = {
  id: string;
  name: string;
  dose: string;
  color: string;
  colorLight: string;
  icon: string;
  times: string[];
  enabled: boolean;
};

type HealthCheck = {
  id: string;
  label: string;
  icon: string;
  color: string;
  colorLight: string;
  time: string;
  enabled: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={C.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function TimeBadge({
  time,
  onPress,
}: {
  time: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.timeBadge} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name="time-outline" size={12} color={C.primary} />
      <Text style={styles.timeBadgeText}>{time}</Text>
    </TouchableOpacity>
  );
}

// ─── Time Picker Modal ────────────────────────────────────────────────────────
function TimePickerModal({
  visible,
  initial,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  initial: string;
  onConfirm: (time: string) => void;
  onClose: () => void;
}) {
  const parts = initial.split(/[: ]/);
  const [hour, setHour] = useState(parts[0] ?? '08');
  const [minute, setMinute] = useState(parts[1] ?? '00');
  const [period, setPeriod] = useState(parts[2] ?? 'AM');

  const Drum = ({
    items,
    selected,
    onSelect,
  }: {
    items: string[];
    selected: string;
    onSelect: (v: string) => void;
  }) => (
    <View style={styles.drumColumn}>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[styles.drumItem, item === selected && styles.drumItemActive]}
          onPress={() => onSelect(item)}
        >
          <Text style={[styles.drumText, item === selected && styles.drumTextActive]}>
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="alarm-outline" size={22} color={C.primary} />
              <Text style={styles.modalTitle}>Set Time</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={styles.timePreview}>
            <Text style={styles.timePreviewText}>
              {hour}:{minute} {period}
            </Text>
          </View>

          {/* Drums */}
          <View style={styles.drumRow}>
            <ScrollView style={styles.drumScroll} showsVerticalScrollIndicator={false}>
              <Drum items={HOURS} selected={hour} onSelect={setHour} />
            </ScrollView>
            <Text style={styles.drumSep}>:</Text>
            <ScrollView style={styles.drumScroll} showsVerticalScrollIndicator={false}>
              <Drum items={MINUTES} selected={minute} onSelect={setMinute} />
            </ScrollView>
            <View style={styles.drumColumn}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.drumItem, p === period && styles.drumItemActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.drumText, p === period && styles.drumTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnConfirm}
              onPress={() => onConfirm(`${hour}:${minute} ${period}`)}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.btnConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ScheduleScreen() {
  // ── State ──────────────────────────────────────────────────────────────
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: 'm1',
      name: 'Metformin',
      dose: '500 mg',
      color: C.primary,
      colorLight: C.primaryLight,
      icon: 'pill',
      times: ['08:00 AM', '01:00 PM', '08:00 PM'],
      enabled: true,
    },
    {
      id: 'm2',
      name: 'Lisinopril',
      dose: '10 mg',
      color: C.teal,
      colorLight: C.tealLight,
      icon: 'heart-pulse',
      times: ['09:00 AM'],
      enabled: true,
    },
    {
      id: 'm3',
      name: 'Atorvastatin',
      dose: '20 mg',
      color: C.purple,
      colorLight: C.purpleLight,
      icon: 'water',
      times: ['09:00 PM'],
      enabled: false,
    },
  ]);

  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      id: 'h1',
      label: 'Blood Pressure',
      icon: 'heart',
      color: C.red,
      colorLight: C.redLight,
      time: '07:30 AM',
      enabled: true,
    },
    {
      id: 'h2',
      label: 'Blood Sugar',
      icon: 'water',
      color: C.orange,
      colorLight: C.orangeLight,
      time: '07:00 AM',
      enabled: true,
    },
    {
      id: 'h3',
      label: 'Weight Check',
      icon: 'fitness',
      color: C.green,
      colorLight: C.greenLight,
      time: '06:30 AM',
      enabled: false,
    },
  ]);

  const [sleepTime, setSleepTime] = useState('10:30 PM');
  const [wakeTime, setWakeTime] = useState('06:30 AM');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [appointmentDate, setAppointmentDate] = useState('March 12, 2026');
  const [drinkWaterEnabled, setDrinkWaterEnabled] = useState(true);
  const [waterInterval, setWaterInterval] = useState('02:00');
  const [exerciseEnabled, setExerciseEnabled] = useState(true);
  const [exerciseTime, setExerciseTime] = useState('06:00 AM');

  // ── Picker state ───────────────────────────────────────────────────────
  type PickerTarget =
    | { kind: 'med'; medId: string; timeIdx: number }
    | { kind: 'health'; checkId: string }
    | { kind: 'sleep' }
    | { kind: 'wake' }
    | { kind: 'appointment' }
    | { kind: 'exercise' };

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [pickerInitial, setPickerInitial] = useState('08:00 AM');

  function openPicker(target: PickerTarget, initial: string) {
    setPickerTarget(target);
    setPickerInitial(initial);
    setPickerVisible(true);
  }

  function handleTimeConfirm(time: string) {
    if (!pickerTarget) return;
    if (pickerTarget.kind === 'med') {
      setMedications((prev) =>
        prev.map((m) => {
          if (m.id !== pickerTarget.medId) return m;
          const newTimes = [...m.times];
          newTimes[pickerTarget.timeIdx] = time;
          return { ...m, times: newTimes };
        })
      );
    } else if (pickerTarget.kind === 'health') {
      setHealthChecks((prev) =>
        prev.map((h) => (h.id === pickerTarget.checkId ? { ...h, time } : h))
      );
    } else if (pickerTarget.kind === 'sleep') {
      setSleepTime(time);
    } else if (pickerTarget.kind === 'wake') {
      setWakeTime(time);
    } else if (pickerTarget.kind === 'appointment') {
      setAppointmentTime(time);
    } else if (pickerTarget.kind === 'exercise') {
      setExerciseTime(time);
    }
    setPickerVisible(false);
  }

  function toggleMed(id: string) {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  }

  function toggleHealth(id: string) {
    setHealthChecks((prev) =>
      prev.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h))
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.dateLabel}>{todayLabel()}</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <FontAwesome5 name="user-md" size={22} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Banner ── */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerTitle}>Today's Schedule</Text>
            <Text style={styles.bannerSub}>
              {medications.filter((m) => m.enabled).length} active medications ·{' '}
              {healthChecks.filter((h) => h.enabled).length} health checks
            </Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.bannerIcon}>
            <FontAwesome5 name="heartbeat" size={48} color="rgba(255,255,255,0.25)" />
          </View>
        </View>

        {/* ══ SECTION 1: Medication Reminders ══════════════════════════════ */}
        <SectionHeader title="Medication Reminders" icon="medkit-outline" />

        {medications.map((med) => (
          <View key={med.id} style={[styles.card, !med.enabled && styles.cardDisabled]}>
            <View style={styles.cardTop}>
              {/* Icon */}
              <View style={[styles.medIcon, { backgroundColor: med.colorLight }]}>
                <MaterialCommunityIcons
                  name={med.icon as any}
                  size={24}
                  color={med.color}
                />
              </View>
              {/* Info */}
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDose}>{med.dose} · {med.times.length}x daily</Text>
              </View>
              {/* Toggle */}
              <Switch
                value={med.enabled}
                onValueChange={() => toggleMed(med.id)}
                trackColor={{ false: C.border, true: med.color + '70' }}
                thumbColor={med.enabled ? med.color : '#ccc'}
              />
            </View>

            {/* Time badges */}
            {med.enabled && (
              <View style={styles.timesRow}>
                {med.times.map((t, idx) => (
                  <TimeBadge
                    key={idx}
                    time={t}
                    onPress={() => openPicker({ kind: 'med', medId: med.id, timeIdx: idx }, t)}
                  />
                ))}
                <TouchableOpacity style={styles.addTimeBtn}>
                  <Ionicons name="add-circle-outline" size={18} color={C.textMuted} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Add medication */}
        <TouchableOpacity style={styles.addCard}>
          <Ionicons name="add-circle" size={22} color={C.primary} />
          <Text style={styles.addCardText}>Add Medication</Text>
        </TouchableOpacity>

        {/* ══ SECTION 2: Health Check-in Times ═════════════════════════════ */}
        <SectionHeader title="Health Check-in Times" icon="pulse-outline" />

        {healthChecks.map((hc) => (
          <View key={hc.id} style={[styles.card, styles.cardRow, !hc.enabled && styles.cardDisabled]}>
            <View style={[styles.healthIcon, { backgroundColor: hc.colorLight }]}>
              <Ionicons name={hc.icon as any} size={22} color={hc.color} />
            </View>
            <View style={styles.healthInfo}>
              <Text style={styles.healthLabel}>{hc.label}</Text>
              {hc.enabled ? (
                <TouchableOpacity
                  onPress={() => openPicker({ kind: 'health', checkId: hc.id }, hc.time)}
                >
                  <Text style={[styles.healthTime, { color: hc.color }]}>
                    <Ionicons name="time-outline" size={12} color={hc.color} /> {hc.time}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.disabledText}>Reminder off</Text>
              )}
            </View>
            <Switch
              value={hc.enabled}
              onValueChange={() => toggleHealth(hc.id)}
              trackColor={{ false: C.border, true: hc.color + '70' }}
              thumbColor={hc.enabled ? hc.color : '#ccc'}
            />
          </View>
        ))}

        {/* ══ SECTION 3: Sleep Schedule ════════════════════════════════════ */}
        <SectionHeader title="Sleep Schedule" icon="moon-outline" />

        <View style={styles.card}>
          <View style={styles.sleepRow}>
            {/* Bedtime */}
            <TouchableOpacity
              style={styles.sleepBlock}
              onPress={() => openPicker({ kind: 'sleep' }, sleepTime)}
            >
              <View style={[styles.sleepIconWrap, { backgroundColor: C.purpleLight }]}>
                <Ionicons name="moon" size={22} color={C.purple} />
              </View>
              <Text style={styles.sleepLabel}>Bedtime</Text>
              <Text style={[styles.sleepTime, { color: C.purple }]}>{sleepTime}</Text>
              <Text style={styles.sleepEdit}>Tap to edit</Text>
            </TouchableOpacity>

            <View style={styles.sleepDivider} />

            {/* Wake time */}
            <TouchableOpacity
              style={styles.sleepBlock}
              onPress={() => openPicker({ kind: 'wake' }, wakeTime)}
            >
              <View style={[styles.sleepIconWrap, { backgroundColor: C.orangeLight }]}>
                <Ionicons name="sunny" size={22} color={C.orange} />
              </View>
              <Text style={styles.sleepLabel}>Wake Time</Text>
              <Text style={[styles.sleepTime, { color: C.orange }]}>{wakeTime}</Text>
              <Text style={styles.sleepEdit}>Tap to edit</Text>
            </TouchableOpacity>
          </View>

          {/* Sleep duration */}
          <View style={styles.sleepDuration}>
            <Ionicons name="bed-outline" size={16} color={C.textSub} />
            <Text style={styles.sleepDurationText}>
              Estimated sleep · <Text style={{ color: C.primary, fontWeight: '700' }}>8h 00m</Text>
            </Text>
          </View>
        </View>

        {/* ══ SECTION 4: Exercise Reminder ════════════════════════════════ */}
        <SectionHeader title="Exercise Reminder" icon="fitness-outline" />

        <View style={[styles.card, styles.cardRow]}>
          <View style={[styles.healthIcon, { backgroundColor: C.greenLight }]}>
            <Ionicons name="walk-outline" size={22} color={C.green} />
          </View>
          <View style={styles.healthInfo}>
            <Text style={styles.healthLabel}>Daily Exercise</Text>
            {exerciseEnabled ? (
              <TouchableOpacity
                onPress={() => openPicker({ kind: 'exercise' }, exerciseTime)}
              >
                <Text style={[styles.healthTime, { color: C.green }]}>
                  <Ionicons name="time-outline" size={12} color={C.green} /> {exerciseTime}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.disabledText}>Reminder off</Text>
            )}
          </View>
          <Switch
            value={exerciseEnabled}
            onValueChange={setExerciseEnabled}
            trackColor={{ false: C.border, true: C.green + '70' }}
            thumbColor={exerciseEnabled ? C.green : '#ccc'}
          />
        </View>

        {/* ══ SECTION 5: Water Reminder ════════════════════════════════════ */}
        <SectionHeader title="Hydration Reminder" icon="water-outline" />

        <View style={styles.card}>
          <View style={[styles.cardRow, { alignItems: 'center' }]}>
            <View style={[styles.healthIcon, { backgroundColor: C.tealLight }]}>
              <Ionicons name="water" size={22} color={C.teal} />
            </View>
            <View style={styles.healthInfo}>
              <Text style={styles.healthLabel}>Drink Water</Text>
              {drinkWaterEnabled ? (
                <Text style={[styles.healthTime, { color: C.teal }]}>
                  Every {waterInterval} hours
                </Text>
              ) : (
                <Text style={styles.disabledText}>Reminder off</Text>
              )}
            </View>
            <Switch
              value={drinkWaterEnabled}
              onValueChange={setDrinkWaterEnabled}
              trackColor={{ false: C.border, true: C.teal + '70' }}
              thumbColor={drinkWaterEnabled ? C.teal : '#ccc'}
            />
          </View>

          {drinkWaterEnabled && (
            <View style={styles.intervalRow}>
              <Text style={styles.intervalLabel}>Remind every</Text>
              <View style={styles.intervalControls}>
                {['01:00', '01:30', '02:00', '02:30', '03:00'].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.intervalChip,
                      waterInterval === v && styles.intervalChipActive,
                    ]}
                    onPress={() => setWaterInterval(v)}
                  >
                    <Text
                      style={[
                        styles.intervalChipText,
                        waterInterval === v && styles.intervalChipTextActive,
                      ]}
                    >
                      {v}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ══ SECTION 6: Upcoming Appointment ════════════════════════════ */}
        <SectionHeader title="Upcoming Appointment" icon="calendar-outline" />

        <View style={[styles.card, styles.appointmentCard]}>
          <View style={styles.apptLeft}>
            <View style={styles.apptDateBox}>
              <Text style={styles.apptMonth}>MAR</Text>
              <Text style={styles.apptDay}>12</Text>
            </View>
          </View>
          <View style={styles.apptInfo}>
            <Text style={styles.apptTitle}>Dr. Sarah Johnson</Text>
            <Text style={styles.apptSpec}>Cardiologist · General Checkup</Text>
            <TouchableOpacity
              style={styles.apptTimeRow}
              onPress={() => openPicker({ kind: 'appointment' }, appointmentTime)}
            >
              <Ionicons name="time-outline" size={14} color={C.primary} />
              <Text style={styles.apptTime}>{appointmentTime}</Text>
              <Ionicons name="create-outline" size={14} color={C.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.apptAlert}>
            <Ionicons name="notifications" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Time Picker Modal ── */}
      {pickerTarget && (
        <TimePickerModal
          visible={pickerVisible}
          initial={pickerInitial}
          onConfirm={handleTimeConfirm}
          onClose={() => setPickerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: C.text },
  dateLabel: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Banner
  banner: {
    backgroundColor: C.primaryMid,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerLeft: { flex: 1 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bannerBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  bannerIcon: { justifyContent: 'center', paddingLeft: 8 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardDisabled: { opacity: 0.55 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.primary,
    marginBottom: 16,
  },
  addCardText: { color: C.primary, fontWeight: '700', fontSize: 14 },

  // Medication card
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInfo: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '700', color: C.text },
  medDose: { fontSize: 12, color: C.textSub, marginTop: 2 },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: C.primaryLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.primary + '40',
  },
  timeBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  addTimeBtn: { padding: 4 },

  // Health check
  healthIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthInfo: { flex: 1 },
  healthLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  healthTime: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  disabledText: { fontSize: 12, color: C.textMuted, marginTop: 3 },

  // Sleep schedule
  sleepRow: { flexDirection: 'row', gap: 0 },
  sleepBlock: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  sleepDivider: { width: 1, backgroundColor: C.border, marginVertical: 8 },
  sleepIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sleepLabel: { fontSize: 12, color: C.textSub, marginBottom: 4 },
  sleepTime: { fontSize: 22, fontWeight: '800' },
  sleepEdit: { fontSize: 11, color: C.textMuted, marginTop: 4 },
  sleepDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  sleepDurationText: { fontSize: 13, color: C.textSub },

  // Water interval
  intervalRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  intervalLabel: { fontSize: 13, color: C.textSub, marginBottom: 8 },
  intervalControls: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  intervalChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  intervalChipActive: { backgroundColor: C.tealLight, borderColor: C.teal },
  intervalChipText: { fontSize: 13, color: C.textSub, fontWeight: '600' },
  intervalChipTextActive: { color: C.teal },

  // Appointment
  appointmentCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  apptLeft: {},
  apptDateBox: {
    width: 54,
    height: 60,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptMonth: { fontSize: 11, fontWeight: '700', color: C.primary },
  apptDay: { fontSize: 24, fontWeight: '900', color: C.primary, lineHeight: 28 },
  apptInfo: { flex: 1 },
  apptTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  apptSpec: { fontSize: 12, color: C.textSub, marginTop: 2 },
  apptTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  apptTime: { fontSize: 13, fontWeight: '700', color: C.primary, flex: 1 },
  apptAlert: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },

  timePreview: {
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  timePreviewText: { fontSize: 36, fontWeight: '900', color: C.primary, letterSpacing: 2 },

  drumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxHeight: 200,
  },
  drumScroll: { maxHeight: 200, width: 72 },
  drumColumn: { alignItems: 'center' },
  drumSep: { fontSize: 28, fontWeight: '900', color: C.primary, marginHorizontal: 4 },
  drumItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  drumItemActive: { backgroundColor: C.primaryLight },
  drumText: { fontSize: 18, color: C.textMuted, fontWeight: '500' },
  drumTextActive: { color: C.primary, fontWeight: '800', fontSize: 20 },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
  },
  btnCancelText: { fontSize: 15, fontWeight: '700', color: C.textSub },
  btnConfirm: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
