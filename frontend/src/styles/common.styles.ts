import { StyleSheet } from 'react-native';
import { AppColors } from '../constants/appColors';
import { Theme } from './theme';

export const commonStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    padding: Theme.spacing.xxl,
    gap: Theme.spacing.lg,
    paddingBottom: 110,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Typography
  screenTitle: {
    color: '#FFFFFF',
    fontWeight: Theme.typography.weights.black,
    fontSize: Theme.typography.sizes.xl,
  },
  screenSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Theme.typography.sizes.sm,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.black,
    color: AppColors.textForeground,
  },
  sectionLink: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.bold,
    color: AppColors.accent,
  },
  label: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.extraBold,
    letterSpacing: 0.8,
    color: AppColors.textMuted,
    marginBottom: Theme.spacing.sm,
  },

  // Cards
  card: {
    backgroundColor: AppColors.cardBg,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    ...Theme.shadows.card,
  },
  cardElevated: {
    backgroundColor: AppColors.cardBg,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.xl,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    ...Theme.shadows.elevated,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  infoCard: {
    backgroundColor: AppColors.cardBg,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
  },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.cardBg,
    borderRadius: Theme.radii.md,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    paddingHorizontal: Theme.spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: Theme.typography.sizes.md,
    color: AppColors.textForeground,
    paddingVertical: 10,
  },
  inputPlain: {
    backgroundColor: AppColors.cardBg,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    color: AppColors.textForeground,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  iconPrefix: {
    marginRight: Theme.spacing.sm,
  },
  iconSuffix: {
    padding: Theme.spacing.xs,
  },

  // Buttons
  primaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: AppColors.primary,
    borderRadius: Theme.radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: Theme.typography.weights.extraBold,
    fontSize: Theme.typography.sizes.md,
  },
  dangerBtn: {
    width: '100%',
    height: 50,
    backgroundColor: AppColors.danger,
    borderRadius: Theme.radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontWeight: Theme.typography.weights.extraBold,
    fontSize: Theme.typography.sizes.md,
  },
  outlineBtn: {
    width: '100%',
    height: 50,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    borderRadius: Theme.radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    color: AppColors.textForeground,
    fontWeight: Theme.typography.weights.bold,
    fontSize: Theme.typography.sizes.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnGlass: {
    width: 36,
    height: 36,
    borderRadius: Theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Status Alerts
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Theme.radii.md,
    padding: Theme.spacing.md,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 12.5,
    fontWeight: Theme.typography.weights.medium,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Theme.radii.md,
    padding: Theme.spacing.md,
  },
  successText: {
    color: AppColors.success,
    fontSize: 12.5,
    fontWeight: Theme.typography.weights.medium,
    flex: 1,
  },

  // Chips & Badges
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radii.pill,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    backgroundColor: AppColors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.bold,
    color: AppColors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: Theme.typography.weights.extraBold,
  },
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: Theme.radii.pill,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: Theme.typography.weights.extraBold,
  },
});
