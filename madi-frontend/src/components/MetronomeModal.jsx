import { View, Modal, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useState } from 'react';
import { WebView } from 'react-native-webview';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Text from './Text';
import WheelPicker from './WheelPicker';
import { colors, spacing, typography, radius, fontFamily } from '@/src/theme';
import { METRO_HTML } from '@/src/hooks/useMetronome';

const BPM_ITEMS = Array.from({ length: 201 }, (_, i) => String(i + 40));
const BEAT_ITEMS = Array.from({ length: 16 }, (_, i) => String(i + 1));

const SUBDIVISIONS = [
  { label: '♩', value: 1 },
  { label: '♪', value: 2 },
  { label: '𝅘𝅥𝅯', value: 4 },
  { label: '3', value: 3 },
];

const POLYRHYTHMS = [
  { label: '2:3', value: '2:3' },
  { label: '3:4', value: '3:4' },
];

function BeatDot({ indexSV, flashSV, myIndex, isStrong }) {
  const animStyle = useAnimatedStyle(() => {
    const isActive = indexSV.value === myIndex;
    const lit = isActive && flashSV.value > 0.5;
    return {
      backgroundColor: lit
        ? (isStrong ? colors.sageDark : colors.butter)
        : isActive ? colors.border : colors.inactive,
      transform: [{ scale: lit ? 1.3 : 1 }],
    };
  });
  return <Animated.View style={[styles.dot, animStyle]} />;
}

function PolyDot({ indexSV, flashSV, myIndex, isMain }) {
  const animStyle = useAnimatedStyle(() => {
    const lit = indexSV.value === myIndex && flashSV.value > 0.5;
    return {
      backgroundColor: lit ? (isMain ? colors.sageDark : colors.butterDark) : colors.inactive,
      transform: [{ scale: lit ? 1.3 : 1 }],
    };
  });
  return <Animated.View style={[styles.dot, animStyle]} />;
}

function PolyDots({ lcm, indexSV, flashSV, isMain }) {
  return (
    <View style={styles.polyContainer}>
      {Array.from({ length: lcm }, (_, i) => (
        <PolyDot key={i} indexSV={indexSV} flashSV={flashSV} myIndex={i} isMain={isMain} />
      ))}
    </View>
  );
}

const POLY_CONFIG = {
  '2:3': { lcm: 6, a: [0, 3], b: [0, 2, 4] },
  '3:4': { lcm: 12, a: [0, 4, 8], b: [0, 3, 6, 9] },
};

export default function MetronomeModal({
  visible, onClose,
  bpm, setBpm,
  isPlaying, toggle,
  beats, setBeats,
  subdivision, setSubdivision,
  polyrhythm, setPolyrhythm,
  polyFlipped, setPolyFlipped,
  beatIndexSV, beatFlashSV,
  beatIndexASV, beatFlashASV,
  beatIndexBSV, beatFlashBSV,
  webviewRef, handleWebViewMessage, onWebViewLoad,
}) {
  const [editingBpm, setEditingBpm] = useState(false);
  const [bpmInput, setBpmInput] = useState('');
  const [editingBeats, setEditingBeats] = useState(false);
  const [beatsInput, setBeatsInput] = useState('');

  function confirmBpm() {
    const val = parseInt(bpmInput);
    if (!isNaN(val) && val >= 40 && val <= 240) setBpm(val);
    setEditingBpm(false);
  }

  function confirmBeats() {
    const val = parseInt(beatsInput);
    if (!isNaN(val) && val >= 1 && val <= 16) setBeats(val);
    setEditingBeats(false);
  }

  const isPoly = polyrhythm !== 'off';
  const polyConf = POLY_CONFIG[polyrhythm] ?? null;
  const topIsMain = !polyFlipped;

  return (
    <>
    <View style={styles.audioWebView} pointerEvents="none">
      <WebView
        ref={webviewRef}
        source={{ html: METRO_HTML }}
        onMessage={handleWebViewMessage}
        onLoadEnd={onWebViewLoad}
        javaScriptEnabled
        originWhitelist={['*']}
        style={styles.audioWebViewInner}
      />
    </View>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>

          {/* 헤더 */}
          <View style={styles.header}>
            <Text bold style={styles.title}>메트로놈</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 비트 시각화 */}
          <View style={styles.beatArea}>
            {isPoly && polyConf ? (
              <>
                <PolyDots
                  lcm={polyConf.lcm}
                  indexSV={polyFlipped ? beatIndexBSV : beatIndexASV}
                  flashSV={polyFlipped ? beatFlashBSV : beatFlashASV}
                  isMain={topIsMain}
                />
                <TouchableOpacity onPress={() => setPolyFlipped(f => !f)} style={styles.swapBtn}>
                  <Text style={styles.swapText}>⇅</Text>
                </TouchableOpacity>
                <PolyDots
                  lcm={polyConf.lcm}
                  indexSV={polyFlipped ? beatIndexASV : beatIndexBSV}
                  flashSV={polyFlipped ? beatFlashASV : beatFlashBSV}
                  isMain={!topIsMain}
                />
              </>
            ) : (
              <View style={styles.dotsRow}>
                {Array.from({ length: beats }, (_, i) => (
                  <BeatDot
                    key={i}
                    indexSV={beatIndexSV}
                    flashSV={beatFlashSV}
                    myIndex={i}
                    isStrong={i === 0}
                  />
                ))}
              </View>
            )}
          </View>

          {/* BPM + 박 선택 (폴리 모드에서 잠금) */}
          <View style={[styles.pickersRow, isPoly && styles.pickersLocked]} pointerEvents={isPoly ? 'none' : 'auto'}>
            {/* BPM */}
            <View style={styles.pickerBlock}>
              <Text style={styles.pickerLabel}>BPM</Text>
              <WheelPicker
                items={BPM_ITEMS}
                selectedIndex={bpm - 40}
                onSelect={i => setBpm(i + 40)}
                width={90}
              />
              <TouchableOpacity onPress={() => { setBpmInput(String(bpm)); setEditingBpm(true); }}>
                {editingBpm ? (
                  <TextInput
                    style={styles.numInput}
                    value={bpmInput}
                    onChangeText={setBpmInput}
                    keyboardType="number-pad"
                    autoFocus
                    onBlur={confirmBpm}
                    onSubmitEditing={confirmBpm}
                  />
                ) : (
                  <Text bold style={styles.numText}>{bpm}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 박 */}
            <View style={styles.pickerBlock}>
              <Text style={styles.pickerLabel}>박</Text>
              <WheelPicker
                items={BEAT_ITEMS}
                selectedIndex={beats - 1}
                onSelect={i => setBeats(i + 1)}
                width={70}
              />
              <TouchableOpacity onPress={() => { setBeatsInput(String(beats)); setEditingBeats(true); }}>
                {editingBeats ? (
                  <TextInput
                    style={styles.numInput}
                    value={beatsInput}
                    onChangeText={setBeatsInput}
                    keyboardType="number-pad"
                    autoFocus
                    onBlur={confirmBeats}
                    onSubmitEditing={confirmBeats}
                  />
                ) : (
                  <Text bold style={styles.numText}>{beats}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 음표 분할 */}
          <View style={styles.row}>
            {SUBDIVISIONS.map(d => (
              <TouchableOpacity
                key={d.value}
                style={[styles.chip, !isPoly && subdivision === d.value && styles.chipActive]}
                onPress={() => { setSubdivision(d.value); setPolyrhythm('off'); }}
              >
                <Text bold={!isPoly && subdivision === d.value} style={[styles.chipText, !isPoly && subdivision === d.value && styles.chipTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 폴리리듬 */}
          <View style={styles.row}>
            {POLYRHYTHMS.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[styles.chip, polyrhythm === p.value && styles.chipActive]}
                onPress={() => setPolyrhythm(p.value)}
              >
                <Text bold={polyrhythm === p.value} style={[styles.chipText, polyrhythm === p.value && styles.chipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 시작/정지 */}
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.stopButton]}
            onPress={toggle}
          >
            <Text bold style={styles.playText}>{isPlaying ? '■ 정지' : '▶ 시작'}</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  audioWebView: { position: 'absolute', width: 2, height: 2, top: 0, left: 0 },
  audioWebViewInner: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: typography.lg, color: colors.textMain },
  close: { fontSize: typography.md, color: colors.textSub },

  beatArea: { alignItems: 'center', alignSelf: 'stretch', gap: spacing.sm, minHeight: 60 },
  dotsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  polyContainer: { flexDirection: 'row', justifyContent: 'space-evenly', alignSelf: 'stretch', paddingHorizontal: spacing.md },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.inactive,
  },

  swapBtn: { paddingVertical: spacing.xs },
  swapText: { fontSize: typography.lg, color: colors.textSub },

  pickersRow: { flexDirection: 'row', justifyContent: 'space-around' },
  pickersLocked: { opacity: 0.35 },
  pickerBlock: { alignItems: 'center', gap: spacing.xs },
  pickerLabel: { fontSize: typography.xs, color: colors.textSub },
  numText: { fontSize: 32, color: colors.textMain, minWidth: 60, textAlign: 'center' },
  numInput: {
    fontSize: 32,
    color: colors.textMain,
    minWidth: 60,
    textAlign: 'center',
    fontFamily: fontFamily.bold,
    borderBottomWidth: 2,
    borderBottomColor: colors.butter,
  },

  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.butter, borderColor: colors.butterDark },
  chipText: { fontSize: typography.sm, color: colors.textSub, includeFontPadding: false, textAlignVertical: 'center' },
  chipTextActive: { color: colors.textMain },

  playButton: {
    backgroundColor: colors.sage,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  stopButton: { backgroundColor: colors.inactive },
  playText: { fontSize: typography.lg, color: colors.textMain },
});
