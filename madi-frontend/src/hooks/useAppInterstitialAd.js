import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import { INTERSTITIAL_AD_ID } from '@/src/constants/adIds';

const isExpoGo = Constants.appOwnership === 'expo';
const FOREGROUND_INTERVAL_MS = 60 * 60 * 1000;

export function useAppInterstitialAd() {
  const adRef = useRef(null);
  const loadedRef = useRef(false);
  const shownOnLaunchRef = useRef(false);
  const lastShownAtRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (isExpoGo) return;

    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');

    function createAd() {
      const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_ID);
      ad.addAdEventListener(AdEventType.LOADED, () => { loadedRef.current = true; });
      ad.addAdEventListener(AdEventType.CLOSED, () => { loadedRef.current = false; createAd(); });
      ad.load();
      adRef.current = ad;
    }

    function tryShow() {
      if (!loadedRef.current || !adRef.current) return;
      adRef.current.show();
      lastShownAtRef.current = Date.now();
      loadedRef.current = false;
    }

    createAd();

    const launchTimer = setTimeout(() => {
      if (!shownOnLaunchRef.current) {
        shownOnLaunchRef.current = true;
        tryShow();
      }
    }, 1000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (nextState === 'active' && prev !== 'active') {
        if (!shownOnLaunchRef.current) {
          shownOnLaunchRef.current = true;
          tryShow();
          return;
        }
        const now = Date.now();
        if (lastShownAtRef.current === null || now - lastShownAtRef.current >= FOREGROUND_INTERVAL_MS) {
          tryShow();
        }
      }
    });

    return () => {
      clearTimeout(launchTimer);
      subscription.remove();
    };
  }, []);
}
