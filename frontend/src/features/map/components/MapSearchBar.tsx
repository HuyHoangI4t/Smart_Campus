import React from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
import { LocationItem } from "../types";

interface MapSearchBarProps {
  search: string;
  showSuggestions: boolean;
  searchResults: LocationItem[];
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
  onFocus: () => void;
  onSelectLocation: (loc: LocationItem) => void;
}

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  search,
  showSuggestions,
  searchResults,
  onSearchChange,
  onClearSearch,
  onFocus,
  onSelectLocation,
}) => {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: AppColors.cardBg,
        borderBottomWidth: 1,
        borderColor: AppColors.cardBorder,
        zIndex: 99,
        position: "relative",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          height: 44,
          borderRadius: 14,
          backgroundColor: AppColors.muted,
        }}
      >
        <Feather name="search" size={18} color={AppColors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Tìm kiếm tòa nhà, giảng đường, thư viện..."
          placeholderTextColor={AppColors.textMuted}
          value={search}
          onChangeText={onSearchChange}
          onFocus={onFocus}
          style={{ flex: 1, fontSize: 13, color: AppColors.text, height: "100%" }}
        />
        {search ? (
          <TouchableOpacity onPress={onClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x-circle" size={18} color={AppColors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Dropdown gợi ý tìm kiếm */}
      {showSuggestions && search.trim().length > 0 && searchResults.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 58,
            left: 16,
            right: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            maxHeight: 250,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 10,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {searchResults.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                onPress={() => onSelectLocation(loc)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderColor: "#F1F5F9",
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: loc.color || AppColors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Feather name={(loc.icon as any) || "map-pin"} size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }} numberOfLines={1}>
                    {loc.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: AppColors.textSecondary }} numberOfLines={1}>
                    {loc.building} {loc.floor ? `• ${loc.floor}` : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

