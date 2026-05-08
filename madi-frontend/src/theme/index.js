/**
 * 마디 디자인 토큰
 *
 * 모든 색상, 폰트 크기, 간격은 여기서 가져다 씁니다.
 * 색상을 바꾸고 싶으면 이 파일만 수정하면 전체 앱에 반영돼요.
 */

// ─── 색상 ───────────────────────────────────────
export const colors = {
  // 배경
  background: '#F9F9F9', // 메인 배경 (아주 살짝 회색끼)
  surface: '#FFFFFF', // 카드, 입력창 배경

  // 포인트
  butter: '#F5E8B0', // 버터 - 버튼, 배지, 강조
  sage: '#B8D8B0', // 세이지 - 완료 표시

  // 버터 계열
  butterLight: '#FBF5D6', // 버터 연하게
  butterDark: '#D4C7A0', // 버터 진하게

  // 세이지 계열
  sageLight: '#DDF0D8', // 세이지 연하게
  sageDark: '#88B880', // 세이지 진하게

  // 텍스트
  textMain: '#282D33', // 본문 텍스트
  textSub: '#9BA3AE', //부가 정보, 플레이스홀더
  textOnPoint: '#282D33', //포인트 색상 위의 텍스트

  // 상태
  inactive: '#EDE8CC', // 비활성, 미완료, disavbled
  border: '#F0EBD0', // 테두

  // 공통
  error: '#E57373',
  white: '#FEFEFE',
};

export const typography = {
  xs: 11,
  sm: 13,
  md: 15, //기본 본문
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
};

export const fontFamily = {
  regular: 'Galmuri11',
  bold: 'Galmuri11-Bold',
  condensed: 'Galmuri11-Condensed',
  large: 'Galmuri14',
};

// ─── 폰트 굵기 ───────────────────────────────────
export const fontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// ─── 간격(padding, margin, gap) ───────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── 모서리 둥글기 ───────────────────────────────────
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
};

// ─── 그림자 ──────────────────────────────────────
export const shadow = {
  sm: {
    shadowColor: '#F5E8B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,   // Android
  },
  md: {
    shadowColor: '#F5E8B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};


