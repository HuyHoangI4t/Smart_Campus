import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppColors } from '../constants/appColors';
import { tabBarStyles } from '../constants/globalStyles';

export interface StandaloneNavProps {
  selectedIndex: number;
  onDestinationSelected: (index: number) => void;
}

export type CustomBottomNavProps = BottomTabBarProps | StandaloneNavProps;

interface TabItemConfig {
  route: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const TAB_ITEMS: TabItemConfig[] = [
  { route: 'home/index', label: 'Trang chủ', icon: 'home' },
  { route: 'map/index', label: 'Bản đồ', icon: 'location-on' },
  { route: 'schedule/index', label: 'Lịch học', icon: 'calendar-today' },
  { route: 'grades/index', label: 'Kết quả', icon: 'assessment' },
  { route: 'profile/index', label: 'Hồ sơ', icon: 'person-outline' },
];

export function CustomBottomNav(props: CustomBottomNavProps) {
  const isTabBarProps = 'state' in props;

  let activeIndex = 0;
  if (isTabBarProps) {
    const currentRoute = props.state.routes[props.state.index];
    const matchIndex = TAB_ITEMS.findIndex((t) => t.route === currentRoute?.name);
    // Hide tab bar on sub-screens like feedback, sos, grades_detail, change_password, test
    if (matchIndex === -1) {
      return null;
    }
    activeIndex = matchIndex;
  } else {
    activeIndex = props.selectedIndex;
  }

  const handleSelect = (index: number) => {
    if (isTabBarProps) {
      const targetItem = TAB_ITEMS[index];
      const isSelected = activeIndex === index;
      const event = props.navigation.emit({
        type: 'tabPress',
        target: targetItem.route,
        canPreventDefault: true,
      });

      if (!isSelected && !event.defaultPrevented) {
        props.navigation.navigate(targetItem.route);
      }
    } else {
      props.onDestinationSelected(index);
    }
  };

  return (
    <View style={tabBarStyles.container}>
      <View style={tabBarStyles.navCard}>
        {TAB_ITEMS.map((item, index) => {
          const isSelected = index === activeIndex;
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => handleSelect(index)}
              activeOpacity={0.7}
              style={tabBarStyles.tabItem}
            >
              <View
                style={[
                  tabBarStyles.iconContainer,
                  isSelected && tabBarStyles.selectedIconContainer,
                ]}
              >
                <MaterialIcons
                  name={item.icon}
                  size={24}
                  color={isSelected ? AppColors.primary : AppColors.textMuted}
                />
              </View>
              <Text
                style={[
                  tabBarStyles.label,
                  {
                    fontWeight: isSelected ? '900' : '800',
                    color: isSelected ? AppColors.primary : AppColors.textMuted,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

