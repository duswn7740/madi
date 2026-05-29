import { useState, useEffect, useRef } from 'react';
import { useSharedValue, withSequence, withTiming, withDelay, runOnUI } from 'react-native-reanimated';

export const METRO_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body>
<script>
var ctx=null;
function gc(){if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx;}
function bpAt(f,d,g,w){var c=gc(),o=c.createOscillator(),a=c.createGain();o.type='sine';o.frequency.value=f;a.gain.setValueAtTime(g,w);a.gain.exponentialRampToValueAtTime(0.001,w+d);o.connect(a);a.connect(c.destination);o.start(w);o.stop(w+d+0.01);}
var _s=0,_t=null,AHEAD=2.0,_sw=0;
function _post(m){try{window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}}
function stop(){_s++;clearTimeout(_t);if(ctx){try{ctx.close();}catch(e){}ctx=null;}}
function start(bpm,beats,div,poly){
  stop();var s=++_s;var c=gc();_sw=Date.now();
  var sched;
  if(poly!=='off'){
    var lcm=poly==='2:3'?6:12;
    var aPos=poly==='2:3'?[0,3]:[0,4,8];
    var bPos=poly==='2:3'?[0,2,4]:[0,3,6,9];
    var sec=60/(bpm*lcm),tick=0,nextAt=c.currentTime+0.1;
    sched=function(){
      if(_s!==s)return;
      var ct=c.currentTime;
      while(nextAt<ct+AHEAD){
        (function(t,w){
          var b=t%lcm;
          if(aPos.indexOf(b)>=0){bpAt(1200,0.09,0.7,w);_post({type:'beatA',wt:_sw+w*1000,beat:b});}
          if(bPos.indexOf(b)>=0){bpAt(580,0.08,0.45,w);_post({type:'beatB',wt:_sw+w*1000,beat:b});}
        })(tick,nextAt);
        tick++;nextAt+=sec;
      }
      _t=setTimeout(sched,25);
    };
  } else {
    var sec=60/(bpm*div),total=beats*div,tick=0,nextAt=c.currentTime+0.1;
    sched=function(){
      if(_s!==s)return;
      while(nextAt<c.currentTime+AHEAD){
        (function(t,w){
          var b=Math.floor(t/div),sub=t%div;
          bpAt(sub===0?(b===0?1200:880):580,sub===0?0.09:0.05,sub===0?(b===0?0.7:0.5):0.3,w);
          if(sub===0)_post({type:'beat',wt:_sw+w*1000,beat:b});
        })(tick,nextAt);
        tick=(tick+1)%total;nextAt+=sec;
      }
      _t=setTimeout(sched,25);
    };
  }
  sched();
}
</script>
</body></html>`;

const FLASH_DUR = 80;

export default function useMetronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beats, setBeats] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [polyrhythm, setPolyrhythm] = useState('off');
  const [polyFlipped, setPolyFlipped] = useState(false);

  // UI 스레드에서 직접 업데이트 — JS re-render 없이 정밀한 타이밍
  const beatIndexSV = useSharedValue(-1);
  const beatFlashSV = useSharedValue(0);
  const beatIndexASV = useSharedValue(-1);
  const beatFlashASV = useSharedValue(0);
  const beatIndexBSV = useSharedValue(-1);
  const beatFlashBSV = useSharedValue(0);

  const [stableBpm, setStableBpm] = useState(120);
  const [stableBeats, setStableBeats] = useState(4);

  useEffect(() => {
    const t = setTimeout(() => setStableBpm(bpm), 300);
    return () => clearTimeout(t);
  }, [bpm]);
  useEffect(() => {
    const t = setTimeout(() => setStableBeats(beats), 300);
    return () => clearTimeout(t);
  }, [beats]);

  const savedBpmRef = useRef(120);
  const savedBeatsRef = useRef(4);
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beats);
  const polyRef = useRef(polyrhythm);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsRef.current = beats; }, [beats]);
  useEffect(() => { polyRef.current = polyrhythm; }, [polyrhythm]);

  const webviewRef = useRef(null);
  const webviewReadyRef = useRef(false);
  const pendingCmdRef = useRef(null);

  const genRef = useRef(0);
  const rnTimersRef = useRef(new Set());

  function clearRnTimers() {
    rnTimersRef.current.forEach(clearTimeout);
    rnTimersRef.current.clear();
  }

  function onWebViewLoad() {
    webviewReadyRef.current = true;
    if (pendingCmdRef.current && webviewRef.current) {
      webviewRef.current.injectJavaScript(pendingCmdRef.current);
      pendingCmdRef.current = null;
    }
  }

  useEffect(() => {
    const cmd = isPlaying
      ? `start(${stableBpm},${stableBeats},${subdivision},'${polyrhythm}'); true;`
      : 'stop(); true;';

    if (webviewRef.current && webviewReadyRef.current) {
      webviewRef.current.injectJavaScript(cmd);
    } else {
      pendingCmdRef.current = cmd;
    }

    genRef.current++;
    clearRnTimers();

    if (!isPlaying) {
      beatIndexSV.value = -1;
      beatFlashSV.value = 0;
      beatIndexASV.value = -1;
      beatFlashASV.value = 0;
      beatIndexBSV.value = -1;
      beatFlashBSV.value = 0;
    }
  }, [isPlaying, stableBpm, stableBeats, subdivision, polyrhythm]);

  function handleWebViewMessage(event) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const gen = genRef.current;
      const delay = Math.max(0, data.wt - Date.now());

      if (data.type === 'beat') {
        const beat = data.beat;
        const id = setTimeout(() => {
          rnTimersRef.current.delete(id);
          if (genRef.current !== gen) return;
          runOnUI(() => {
            'worklet';
            beatIndexSV.value = beat;
            beatFlashSV.value = withSequence(
              withTiming(1, { duration: 0 }),
              withDelay(FLASH_DUR, withTiming(0, { duration: 0 }))
            );
          })();
        }, delay);
        rnTimersRef.current.add(id);
      } else if (data.type === 'beatA') {
        const beat = data.beat;
        const id = setTimeout(() => {
          rnTimersRef.current.delete(id);
          if (genRef.current !== gen) return;
          runOnUI(() => {
            'worklet';
            beatIndexASV.value = beat;
            beatFlashASV.value = withSequence(
              withTiming(1, { duration: 0 }),
              withDelay(FLASH_DUR, withTiming(0, { duration: 0 }))
            );
          })();
        }, delay);
        rnTimersRef.current.add(id);
      } else if (data.type === 'beatB') {
        const beat = data.beat;
        const id = setTimeout(() => {
          rnTimersRef.current.delete(id);
          if (genRef.current !== gen) return;
          runOnUI(() => {
            'worklet';
            beatIndexBSV.value = beat;
            beatFlashBSV.value = withSequence(
              withTiming(1, { duration: 0 }),
              withDelay(FLASH_DUR, withTiming(0, { duration: 0 }))
            );
          })();
        }, delay);
        rnTimersRef.current.add(id);
      }
    } catch {}
  }

  function selectPoly(newPoly) {
    if (newPoly !== 'off' && polyRef.current === 'off') {
      savedBpmRef.current = bpmRef.current;
      savedBeatsRef.current = beatsRef.current;
      setBpm(40);
      setBeats(1);
      setStableBpm(40);
      setStableBeats(1);
    } else if (newPoly === 'off' && polyRef.current !== 'off') {
      setBpm(savedBpmRef.current);
      setBeats(savedBeatsRef.current);
      setStableBpm(savedBpmRef.current);
      setStableBeats(savedBeatsRef.current);
    }
    setPolyrhythm(newPoly);
  }

  return {
    bpm, setBpm,
    isPlaying, toggle: () => setIsPlaying(p => !p),
    beats, setBeats,
    subdivision, setSubdivision,
    polyrhythm, setPolyrhythm: selectPoly,
    polyFlipped, setPolyFlipped,
    beatIndexSV, beatFlashSV,
    beatIndexASV, beatFlashASV,
    beatIndexBSV, beatFlashBSV,
    webviewRef, handleWebViewMessage, onWebViewLoad,
  };
}
