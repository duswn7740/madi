import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export default function useMetronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beats, setBeats] = useState(4);        // 분자 (몇 박)
  const [subdivision, setSubdivision] = useState(1); // 1=4분, 2=8분, 4=16분, 3=3잇단
  const [polyrhythm, setPolyrhythm] = useState('off');
  const [polyFlipped, setPolyFlipped] = useState(false);

  const [activeBeat, setActiveBeat] = useState(0);
  const [activeSubBeat, setActiveSubBeat] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [polyABeat, setPolyABeat] = useState(0);
  const [polyBBeat, setPolyBBeat] = useState(0);
  const [polyFlashA, setPolyFlashA] = useState(false);
  const [polyFlashB, setPolyFlashB] = useState(false);

  const [stableBpm, setStableBpm] = useState(120);
  const [stableBeats, setStableBeats] = useState(4);

  // 스크롤 중 미친듯이 재시작 방지 - 300ms debounce
  useEffect(() => {
    const t = setTimeout(() => setStableBpm(bpm), 300);
    return () => clearTimeout(t);
  }, [bpm]);
  useEffect(() => {
    const t = setTimeout(() => setStableBeats(beats), 300);
    return () => clearTimeout(t);
  }, [beats]);

  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beats);
  const subRef = useRef(subdivision);
  const polyRef = useRef(polyrhythm);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsRef.current = beats; }, [beats]);
  useEffect(() => { subRef.current = subdivision; }, [subdivision]);
  useEffect(() => { polyRef.current = polyrhythm; }, [polyrhythm]);

  const POOL_SIZE = 3;
  const sounds = useRef({ beep1: [], beep2: [], beep3: [] });
  const poolIdx = useRef({ beep1: 0, beep2: 0, beep3: 0 });
  const intervalRef = useRef(null);
  const tickRef = useRef(0);
  const flashTimerMain = useRef(null);
  const flashTimerA = useRef(null);
  const flashTimerB = useRef(null);

  useEffect(() => {
    async function load() {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const [p1, p2, p3] = await Promise.all([
        Promise.all(Array.from({ length: POOL_SIZE }, () => Audio.Sound.createAsync(require('../../assets/sounds/beep1.wav')))),
        Promise.all(Array.from({ length: POOL_SIZE }, () => Audio.Sound.createAsync(require('../../assets/sounds/beep2.wav')))),
        Promise.all(Array.from({ length: POOL_SIZE }, () => Audio.Sound.createAsync(require('../../assets/sounds/beep3.wav')))),
      ]);
      sounds.current = {
        beep1: p1.map(r => r.sound),
        beep2: p2.map(r => r.sound),
        beep3: p3.map(r => r.sound),
      };
    }
    load();
    return () => {
      Object.values(sounds.current).forEach(pool => pool.forEach(s => s?.unloadAsync()));
    };
  }, []);

  function playSound(key) {
    const pool = sounds.current[key];
    if (!pool?.length) return;
    const idx = poolIdx.current[key];
    pool[idx]?.replayAsync();
    poolIdx.current[key] = (idx + 1) % POOL_SIZE;
  }

  function flash(setFn, timerRef) {
    setFn(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFn(false), 80);
  }

  function tick() {
    const t = tickRef.current;
    const b = beatsRef.current;
    const div = subRef.current;
    const poly = polyRef.current;

    if (poly === 'off') {
      const totalTicks = b * div;
      const beat = Math.floor(t / div);
      const sub = t % div;
      setActiveBeat(beat);
      setActiveSubBeat(sub);
      flash(setFlashOn, flashTimerMain);
      if (sub === 0) {
        playSound(beat === 0 ? 'beep1' : 'beep2');
      } else {
        playSound('beep3');
      }
      tickRef.current = (t + 1) % totalTicks;

    } else if (poly === '2:3') {
      const isA = t % 3 === 0;
      const isB = t % 2 === 0;
      if (isA) { setPolyABeat((t / 3) % 2); flash(setPolyFlashA, flashTimerA); playSound('beep1'); }
      if (isB) { setPolyBBeat((t / 2) % 3); flash(setPolyFlashB, flashTimerB); if (!isA) playSound('beep3'); }
      tickRef.current = (t + 1) % 6;

    } else if (poly === '3:4') {
      const isA = t % 4 === 0;
      const isB = t % 3 === 0;
      if (isA) { setPolyABeat((t / 4) % 3); flash(setPolyFlashA, flashTimerA); playSound('beep1'); }
      if (isB) { setPolyBBeat((t / 3) % 4); flash(setPolyFlashB, flashTimerB); if (!isA) playSound('beep3'); }
      tickRef.current = (t + 1) % 12;
    }
  }

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!isPlaying) {
      setActiveBeat(0); setActiveSubBeat(0); setFlashOn(false);
      setPolyABeat(0); setPolyBBeat(0);
      tickRef.current = 0;
      return;
    }

    const poly = polyRef.current;
    const div = subRef.current;
    let intervalMs;
    if (poly === 'off') intervalMs = 60000 / (stableBpm * div);
    else if (poly === '2:3') intervalMs = 60000 / (bpm * 6);
    else intervalMs = 60000 / (bpm * 12);

    tickRef.current = 0;
    tick();
    intervalRef.current = setInterval(tick, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, stableBpm, stableBeats, subdivision, polyrhythm]);

  return {
    bpm, setBpm,
    isPlaying, toggle: () => setIsPlaying(p => !p),
    beats, setBeats,
    subdivision, setSubdivision,
    polyrhythm, setPolyrhythm,
    polyFlipped, setPolyFlipped,
    activeBeat, activeSubBeat, flashOn,
    polyABeat, polyBBeat, polyFlashA, polyFlashB,
  };
}
