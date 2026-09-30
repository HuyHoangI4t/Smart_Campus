import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../constants/appColors';
import { commonStyles } from '../styles/common.styles';

interface NavHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: any;
  onRight?: () => void;
  bg?: string;
  children?: React.ReactNode;
}

export function NavHeader({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRight,
  bg = AppColors.primary,
  children,
}: NavHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingTop: Math.max(insets.top + 16, 20),
        paddingBottom: 20,
        backgroundColor: bg,
        zIndex: 10,
      }}
    >
      <View style={[commonStyles.row, { gap: 12, marginBottom: children ? 16 : 0 }]}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={commonStyles.iconBtnGlass}
          >
            <Feather name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <Text style={commonStyles.screenTitle}>{title}</Text>
          {subtitle ? (
            <Text style={commonStyles.screenSubtitle}>{subtitle}</Text>
          ) : null}
        </View>

        {rightIcon && (
          <TouchableOpacity
            onPress={onRight}
            activeOpacity={0.7}
            style={commonStyles.iconBtnGlass}
          >
            <Feather name={rightIcon} size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}
