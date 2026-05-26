import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Text from '@/src/components/Text';
import Header from '@/src/components/Header';
import ConfirmModal from '@/src/components/ConfirmModal';
import { colors, spacing, typography, radius, fontFamily } from '@/src/theme';
import { STICKER_PACKS, DEFAULT_PACK } from '@/src/constants/stickers';
import { getShop, buyPack } from '@/src/api/shop';
import { getActivePack, selectPack } from '@/src/api/packs';
import { watchAd } from '@/src/api/ads';
import { useRewardedAd } from '@/src/hooks/useRewardedAd';

const GRID_PADDING = spacing.md;
const GRID_GAP = spacing.sm;
const CARD_WIDTH = Math.floor((Dimensions.get('window').width - GRID_PADDING * 2 - GRID_GAP * 2) / 3);

function formatToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ShopScreen() {
  const [shopData, setShopData] = useState(null);
  const [activePack, setActivePack] = useState(DEFAULT_PACK);
  const [loading, setLoading] = useState(true);
  const [actionPack, setActionPack] = useState(null);
  const [adWatching, setAdWatching] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', confirmText: '확인', cancelText: undefined, onConfirm: null });
  const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title, message) => setAlertModal({ visible: true, title, message });
  const showConfirm = (title, message, confirmText, onConfirm) =>
    setConfirmModal({ visible: true, title, message, confirmText, cancelText: '취소', onConfirm });

  const { loaded: adLoaded, show: showAd } = useRewardedAd({
    onRewarded: async () => {
      try {
        const res = await watchAd();
        setShopData(prev => prev ? { ...prev, coins: res.coins, todayAdCount: res.todayCount } : prev);
      } catch (err) {
        showAlert('', err.response?.data?.error ?? '코인 적립에 실패했어요.');
      } finally {
        setAdWatching(false);
      }
    },
    onError: () => {
      showAlert('', '광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      setAdWatching(false);
    },
  });

  function handleWatchAd() {
    if (!adLoaded) {
      showAlert('', '광고를 불러오는 중이에요. 잠시 후 다시 시도해주세요.');
      return;
    }
    setAdWatching(true);
    showAd();
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shop, packRes] = await Promise.all([
        getShop(),
        getActivePack(formatToday()),
      ]);
      setShopData(shop);
      setActivePack(packRes.packId ?? DEFAULT_PACK);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSelect = (pack) => {
    if (activePack === pack.name) return;
    showConfirm('팩 변경', `${pack.name} 팩을 사용할까요?`, '변경', async () => {
      setConfirmModal(m => ({ ...m, visible: false }));
      setActionPack(pack.id);
      try {
        await selectPack(pack.id);
        setActivePack(pack.name);
      } catch {
        showAlert('', '변경에 실패했어요.');
      } finally {
        setActionPack(null);
      }
    });
  };

  const handleBuy = (pack) => {
    const { coins = 0, totalStickers = 0 } = shopData ?? {};
    if (pack.unlock_type === 'stickers' && totalStickers < pack.required_stickers) {
      showAlert('스티커 부족', `스티커 ${pack.required_stickers}개 달성 후 구매할 수 있어요\n현재 ${totalStickers}개`);
      return;
    }
    if (pack.unlock_type === 'coins' && coins < pack.price) {
      showAlert('코인 부족', `코인이 부족해요.\n필요: ${pack.price}개, 보유: ${coins}개`);
      return;
    }
    const name = pack.name ?? pack.id;
    const condition = pack.unlock_type === 'stickers'
      ? `스티커 ${pack.required_stickers}개 달성`
      : `코인 ${pack.price}개`;
    showConfirm('팩 구매', `${name} 팩을\n${condition}으로 구매할까요?`, '구매', async () => {
      setConfirmModal(m => ({ ...m, visible: false }));
      setActionPack(pack.id);
      try {
        await buyPack(pack.id);
        await load();
      } catch (err) {
        showAlert('', err.response?.data?.error ?? '구매에 실패했어요.');
      } finally {
        setActionPack(null);
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="스티커 상점" />
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.butterDark} />
      </SafeAreaView>
    );
  }

  const { totalStickers = 0, coins = 0, todayAdCount = 0, packs = [] } = shopData ?? {};
  const adLimitReached = todayAdCount >= 5;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="스티커 상점"
        right={
          <View style={styles.coinBadge}>
            <Image source={require('@/assets/icons/coin.png')} style={styles.coinIcon} />
            <Text style={styles.coinNum}>{coins}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          style={[styles.adButton, (!adLoaded || adWatching || adLimitReached) && styles.adButtonDisabled]}
          onPress={handleWatchAd}
          disabled={!adLoaded || adWatching || adLimitReached}
          activeOpacity={0.8}
        >
          {adWatching
            ? <ActivityIndicator size="small" color={colors.surface} />
            : <Text style={styles.adButtonText}>
                광고 보고 1코인 받기 하루({todayAdCount}/5)제한
              </Text>
          }
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>팩 도감</Text>
        <View style={styles.grid}>
          {packs.map(pack => {
            const images = STICKER_PACKS[pack.id];
            const isActive = activePack === pack.id;
            const isOwned = pack.unlocked;
            const canUnlock = pack.canUnlock && !isOwned;

            const stickerPreview = images && (
              <View style={styles.stickerGrid2}>
                <View style={styles.stickerRow}>
                  {images.slice(0, 2).map((src, i) => (
                    <Image key={i} source={src} style={[styles.stickerImg, !isOwned && styles.stickerImgLocked]} />
                  ))}
                </View>
                <View style={styles.stickerRow}>
                  {images.slice(2).map((src, i) => (
                    <Image key={i} source={src} style={[styles.stickerImg, !isOwned && styles.stickerImgLocked]} />
                  ))}
                </View>
              </View>
            );

            const priceRow = pack.unlock_type === 'coins' ? (
              <View style={styles.priceTag}>
                <Image source={require('@/assets/icons/coin.png')} style={styles.priceIcon} />
                <Text style={styles.priceText}>{pack.price}</Text>
              </View>
            ) : pack.unlock_type === 'stickers' ? (
              <Text style={styles.conditionText}>스티커 {pack.required_stickers}개</Text>
            ) : null;

            const ownedCondition = pack.unlock_type === 'coins' ? (
              <View style={styles.priceTag}>
                <Image source={require('@/assets/icons/coin.png')} style={styles.priceIcon} />
                <Text style={styles.priceText}>{pack.price}</Text>
              </View>
            ) : pack.unlock_type === 'stickers' ? (
              <Text style={styles.conditionText}>스티커 {pack.required_stickers}개</Text>
            ) : (
              <Text style={styles.conditionText}>기본팩</Text>
            );

            if (isOwned) {
              return (
                <TouchableOpacity
                  key={pack.id}
                  style={[styles.card, isActive && styles.cardActive]}
                  onPress={() => handleSelect(pack)}
                  disabled={actionPack === pack.id || isActive}
                  activeOpacity={0.8}
                >
                  {stickerPreview}
                  <Text style={styles.packName}>{pack.name ?? pack.id}</Text>
                  {ownedCondition}
                  <View style={[styles.badge, isActive && styles.badgeActive]}>
                    <Text style={[styles.badgeText, isActive && { color: colors.surface }]}>
                      {isActive ? '사용중' : '보유'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            if (canUnlock) {
              return (
                <TouchableOpacity
                  key={pack.id}
                  style={[styles.card, styles.cardUnlockable]}
                  onPress={() => handleBuy(pack)}
                  disabled={actionPack === pack.id}
                  activeOpacity={0.8}
                >
                  {stickerPreview}
                  <Text style={styles.packName}>{pack.name ?? pack.id}</Text>
                  {priceRow}
                  <View style={[styles.badge, styles.badgeUnlock]}>
                    <Text style={[styles.badgeText, { color: colors.surface }]}>구매</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={pack.id}
                style={[styles.card, styles.cardUnlockable]}
                onPress={() => handleBuy(pack)}
                activeOpacity={0.8}
              >
                {stickerPreview}
                <Text style={styles.packName}>{pack.name ?? pack.id}</Text>
                {priceRow}
                <View style={[styles.badge, styles.badgeUnlock]}>
                  <Text style={[styles.badgeText, { color: colors.surface }]}>구매</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(m => ({ ...m, visible: false }))}
      />
      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="확인"
        onConfirm={() => setAlertModal(m => ({ ...m, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: GRID_PADDING, gap: spacing.lg, paddingBottom: spacing.xxl },

  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.butterLight, borderRadius: 20,
    paddingHorizontal: spacing.md, paddingVertical: 5,
  },
  coinIcon: { width: 16, height: 16, resizeMode: 'contain' },
  coinNum: { fontSize: typography.sm, fontFamily: fontFamily.bold, color: colors.butterDark },

  sectionTitle: {
    fontSize: typography.sm, fontFamily: fontFamily.bold, color: colors.textSub,
    paddingHorizontal: spacing.xs,
  },

  adButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.sageDark,
    borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  adButtonDisabled: { opacity: 0.5 },
  adButtonText: { fontSize: typography.sm, fontFamily: fontFamily.bold, color: colors.surface },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  card: {
    width: CARD_WIDTH, alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, padding: spacing.sm,
  },
  cardActive: { borderColor: colors.butter, backgroundColor: colors.butterLight },
  cardLocked: {},
  cardUnlockable: { borderColor: colors.sage, borderStyle: 'dashed' },

  stickerGrid2: { alignItems: 'center', gap: 2 },
  stickerRow: { flexDirection: 'row', justifyContent: 'center', gap: 2 },
  stickerImg: { width: 22, height: 22, resizeMode: 'contain' },
  stickerImgLocked: { opacity: 0.35 },

  packName: { fontSize: typography.sm, fontFamily: fontFamily.bold, color: colors.textMain, textAlign: 'center' },
  conditionText: { fontSize: typography.xs, fontFamily: fontFamily.regular, color: colors.textSub, textAlign: 'center' },

  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 3, opacity: 0.45 },
  priceIcon: { width: 13, height: 13, resizeMode: 'contain' },
  priceText: { fontSize: typography.xs, fontFamily: fontFamily.bold, color: colors.textMain },

  badge: {
    backgroundColor: colors.surface, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  badgeActive: { backgroundColor: colors.butterDark, borderColor: colors.butterDark },
  badgeUnlock: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  badgeText: { fontSize: typography.xs, fontFamily: fontFamily.bold, color: colors.textSub },
});
