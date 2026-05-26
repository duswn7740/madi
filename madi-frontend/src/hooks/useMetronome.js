import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export default function useMetronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beats, setBeats] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
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

  const POOL_SIZE = 6;
  const sounds = useRef({ beep1: [], beep2: [], beep3: [] });
  const poolIdx = useRef({ beep1: 0, beep2: 0, beep3: 0 });
  const tickTimerRef = useRef(null);
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

  useEffect(() => {
    clearTimeout(tickTimerRef.current);

    if (!isPlaying) {
      setActiveBeat(0); setActiveSubBeat(0); setFlashOn(false);
      setPolyABeat(0); setPolyBBeat(0);
      return;
    }

    const poly = polyRef.current;
    const div = subRef.current;
    let intervalMs;
    if (poly === 'off') intervalMs = 60000 / (stableBpm * div);
    else if (poly === '2:3') intervalMs = 60000 / (stableBpm * 6);
    else intervalMs = 60000 / (stableBpm * 12);

    let nextBeatTime = performance.now();
    let scheduledTick = 0;
    let active = true;

    function getNextTick(t) {
      if (poly === 'off') return (t + 1) % (beatsRef.current * div);
      if (poly === '2:3') return (t + 1) % 6;
      return (t + 1) % 12;
    }

    // Sound only — no state updates, so no re-render blocking
    function playTick(t) {
      if (!active) return;
      if (poly === 'off') {
        const beat = Math.floor(t / div);
        const sub = t % div;
        playSound(sub === 0 ? (beat === 0 ? 'beep1' : 'beep2') : 'beep3');
      } else if (poly === '2:3') {
        const isA = t % 3 === 0;
        const isB = t % 2 === 0;
        if (isA) playSound('beep1');
        if (isB && !isA) playSound('beep3');
        if (isA && isB) playSound('beep1');
      } else {
        const isA = t % 4 === 0;
        const isB = t % 3 === 0;
        if (isA) playSound('beep1');
        if (isB && !isA) playSound('beep3');
      }
    }

    // Visual only — state updates separated from sound scheduling
    function updateVisual(t) {
      if (!active) return;
      if (poly === 'off') {
        const beat = Math.floor(t / div);
        const sub = t % div;
        setActiveBeat(beat);
        setActiveSubBeat(sub);
        flash(setFlashOn, flashTimerMain);
      } else if (poly === '2:3') {
        const isA = t % 3 === 0;
        const isB = t % 2 === 0;
        if (isA) { setPolyABeat((t / 3) % 2); flash(setPolyFlashA, flashTimerA); }
        if (isB) { setPolyBBeat((t / 2) % 3); flash(setPolyFlashB, flashTimerB); }
      } else {
        const isA = t % 4 === 0;
        const isB = t % 3 === 0;
        if (isA) { setPolyABeat((t / 4) % 3); flash(setPolyFlashA, flashTimerA); }
        if (isB) { setPolyBBeat((t / 3) % 4); flash(setPolyFlashB, flashTimerB); }
      }
    }

    function scheduler() {
      if (!active) return;
      const now = performance.now();
      while (nextBeatTime <= now + 300) {
        const delay = Math.max(0, nextBeatTime - now);
        const t = scheduledTick;
        setTimeout(() => playTick(t), delay);
        setTimeout(() => updateVisual(t), delay);
        scheduledTick = getNextTick(t);
        nextBeatTime += intervalMs;
      }
      tickTimerRef.current = setTimeout(scheduler, 25);
    }

    scheduler();
    return () => { active = false; clearTimeout(tickTimerRef.current); };
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
