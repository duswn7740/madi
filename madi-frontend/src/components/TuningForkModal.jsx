import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import Text from './Text';
import { colors, spacing, typography, radius, fontFamily } from '@/src/theme';

const HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head><body style="margin:0;padding:0"><script>
var ctx=null,osc=null,gain=null;
function play(f){
  if(ctx){try{osc.stop();}catch(e){}try{ctx.close();}catch(e){}}
  ctx=new(window.AudioContext||window.webkitAudioContext)();
  gain=ctx.createGain();
  gain.gain.setValueAtTime(0.001,ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.65,ctx.currentTime+0.1);
  osc=ctx.createOscillator();
  osc.type='sine';
  osc.frequency.value=f;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
}
function stop(){
  if(!ctx)return;
  try{
    gain.gain.setValueAtTime(gain.gain.value,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.08);
  }catch(e){}
  setTimeout(function(){
    try{osc.stop();}catch(e){}
    try{ctx.close();}catch(e){}
    ctx=null;osc=null;gain=null;
  },100);
}
</script></body></html>`;

export default function TuningForkModal({ visible, onClose }) {
  const webviewRef = useRef(null);
  const [hz, setHz] = useState(440);
  const [isPlaying, setIsPlaying] = useState(false);
  const [webReady, setWebReady] = useState(false);

  function sendStop() {
    webviewRef.current?.injectJavaScript('stop();true;');
  }

  function sendPlay(f) {
    webviewRef.current?.injectJavaScript(`play(${f});true;`);
  }

  useEffect(() => {
    if (!visible) {
      sendStop();
      setIsPlaying(false);
    }
  }, [visible]);

  function handleHzChange(newHz) {
    setHz(newHz);
    if (isPlaying) sendPlay(newHz);
  }

  function handleToggle() {
    if (isPlaying) {
      sendStop();
      setIsPlaying(false);
    } else {
      sendPlay(hz);
      setIsPlaying(true);
    }
  }

  function handleClose() {
    sendStop();
    setIsPlaying(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
        <View style={styles.sheet}>

          <WebView
            ref={webviewRef}
            source={{ html: HTML }}
            style={styles.webviewHidden}
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            onLoadEnd={() => setWebReady(true)}
          />

          <View style={styles.header}>
            <Text bold style={styles.title}>소리굽쇠</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noteArea}>
            <Text bold style={styles.noteText}>A</Text>
            <Text bold style={styles.octaveText}>4</Text>
          </View>

          <View style={styles.hzRow}>
            {[440, 442].map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.chip, hz === h && styles.chipActive]}
                onPress={() => handleHzChange(h)}
                activeOpacity={0.8}
              >
                <Text bold={hz === h} style={[styles.chipText, hz === h && styles.chipTextActive]}>
                  {h} Hz
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.stopButton]}
            onPress={handleToggle}
            disabled={!webReady}
            activeOpacity={0.8}
          >
            <Text bold style={styles.playText}>{isPlaying ? '■ 정지' : '▶ 재생'}</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    overflow: 'hidden',
  },

  webviewHidden: { position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: typography.lg, color: colors.textMain },
  close: { fontSize: typography.md, color: colors.textSub },

  noteArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: 4,
  },
  noteText: {
    fontSize: 80,
    lineHeight: 88,
    color: colors.textMain,
    fontFamily: fontFamily.bold,
  },
  octaveText: {
    fontSize: 36,
    lineHeight: 44,
    color: colors.textSub,
    fontFamily: fontFamily.bold,
    marginBottom: 6,
  },

  hzRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.butter, borderColor: colors.butterDark },
  chipText: { fontSize: typography.sm, color: colors.textSub },
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
