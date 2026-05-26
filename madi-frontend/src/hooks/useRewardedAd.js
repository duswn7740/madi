import { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { REWARDED_AD_ID } from '@/src/constants/adIds';

const isExpoGo = Constants.appOwnership === 'expo';

export function useRewardedAd({ onRewarded, onError } = {}) {
  const adRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (isExpoGo) return;

    const { RewardedAd, RewardedAdEventType, AdEventType } = require('react-native-google-mobile-ads');

    function load() {
      const ad = RewardedAd.createForAdRequest(REWARDED_AD_ID);
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => setLoaded(true));
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { onRewarded?.(); });
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        setShowing(false);
        setLoaded(false);
        load();
      });
      ad.addAdEventListener(AdEventType.ERROR, (e) => {
        setLoaded(false);
        setShowing(false);
        onError?.(e);
        setTimeout(load, 5000);
      });
      ad.load();
      adRef.current = ad;
    }

    load();
  }, []);

  function show() {
    if (isExpoGo || !loaded || !adRef.current) return;
    setShowing(true);
    adRef.current.show();
  }

  return { loaded: isExpoGo ? false : loaded, showing, show };
}
