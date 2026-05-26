import Constants from 'expo-constants';
import { BANNER_AD_ID } from '@/src/constants/adIds';

const isExpoGo = Constants.appOwnership === 'expo';

export default function BannerAdView() {
  if (isExpoGo) return null;

  const { BannerAd, BannerAdSize } = require('react-native-google-mobile-ads');
  return (
    <BannerAd
      unitId={BANNER_AD_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
    />
  );
}
