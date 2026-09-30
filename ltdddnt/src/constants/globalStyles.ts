import { StyleSheet } from 'react-native';
import { AppColors } from './appColors';

export * from '../styles/theme';
export * from '../styles/common.styles';
export * from '../styles/screen.styles';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1, 
    paddingBottom: 32
  },

  /* HEADER */
  headerContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  brandContainer: {
    paddingLeft: 28,
    paddingBottom: 22,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: AppColors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: AppColors.primary,
    letterSpacing: 0.2,
    marginLeft: 10,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textMuted,
    marginTop: 4,
  },

  /* TAB SWITCHER */
  tabOuterPadding: {
    paddingHorizontal: 24,
    marginVertical: 18,
  },
  tabTrack: {
    height: 48,
    padding: 4,
    backgroundColor: 'rgba(238, 242, 249, 0.7)',
    borderRadius: 30,
    flexDirection: 'row',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13.5,
  },
  tabLabelActive: {
    fontWeight: '900',
    color: AppColors.primary,
  },
  tabLabelInactive: {
    fontWeight: '700',
    color: AppColors.textMuted,
  },

  /* FORM BODY */
  formContainer: {
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: AppColors.textMuted,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.cardBg,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: AppColors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 1,
  },
  iconPrefix: {
    marginRight: 10,
  },
  iconSuffix: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textForeground,
  },
  dropdownText: {
    fontSize: 14,
    color: AppColors.textForeground,
    flex: 1,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotPassText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AppColors.accent,
  },

  /* BUTTONS */
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: AppColors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.border,
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 12,
    color: AppColors.textMuted,
  },
  guestButton: {
    width: '100%',
    height: 50,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    backgroundColor: 'transparent',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.textMuted,
  },
});

export const mainStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  between: { justifyContent: "space-between" },
  card: { backgroundColor: AppColors.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "700", color: AppColors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: AppColors.muted, borderWidth: 1, borderColor: AppColors.border, borderRadius: 12 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: AppColors.textForeground },
  inputPlain: { backgroundColor: AppColors.cardBg, borderWidth: 1, borderColor: AppColors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: AppColors.textForeground },
  primaryBtn: { backgroundColor: AppColors.primary, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: AppColors.textForeground },
  sectionLink: { fontSize: 12, fontWeight: "700", color: AppColors.accent },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: AppColors.border, backgroundColor: AppColors.cardBg },
  chipText: { fontSize: 12, fontWeight: "700", color: AppColors.textMuted },
});

export const navHeaderStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: AppColors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 100,
  },
  navCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: AppColors.cardBg,
    borderRadius: 32,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    paddingHorizontal: 10,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: '#EEF2FF',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 4,
  },
});
