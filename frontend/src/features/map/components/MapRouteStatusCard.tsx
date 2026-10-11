import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
import { LocationItem, ParsedCampusRoom } from "../types";

export interface MapRouteStatusCardProps {
  bottomOffset: number;
  activeRoute: {
    distanceMeters?: number;
    durationMinutes?: number;
    gateId?: string;
    gateName?: string;
  } | null;
  targetRoom: string;
  currentParsed: ParsedCampusRoom | null;
  selectedLoc: LocationItem | null;
  onSwitchGate: () => void;
  onClearRoute: () => void;
}

/**
 * Thẻ trạng thái chỉ dẫn đường bộ nội bộ khuôn viên trường
 * Hỗ trợ hiển thị cổng trường, đổi cổng, wireframe skeleton và nút Dừng
 */
export const MapRouteStatusCard = React.memo(function MapRouteStatusCard({
  bottomOffset,
  activeRoute,
  targetRoom,
  currentParsed,
  selectedLoc,
  onSwitchGate,
  onClearRoute,
}: MapRouteStatusCardProps) {
  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftInfoGroup}>
          <View style={styles.iconCircle}>
            <Feather name="navigation" size={22} color={AppColors.primary} />
          </View>
          <View style={styles.textGroup}>
            <View style={styles.gateTagRow}>
              {activeRoute?.gateName ? (
                <Text style={styles.gateNameText}>
                  {`Qua ${activeRoute.gateName}`}
                </Text>
              ) : (
                <View style={styles.gateWireframePlaceholder} />
              )}
              {activeRoute?.gateName ? (
                <TouchableOpacity
                  onPress={onSwitchGate}
                  activeOpacity={0.7}
                  style={styles.switchGateButton}
                >
                  <Feather name="refresh-cw" size={9} color={AppColors.primary} />
                  <Text style={styles.switchGateButtonText}>Đổi cổng</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {!activeRoute?.distanceMeters ? (
              <View style={styles.loadingWireframeContainer}>
                <View style={styles.wireframeBarLarge} />
                <View style={styles.wireframeBarSmall} />
              </View>
            ) : (
              <>
                <Text style={styles.destinationTitle} numberOfLines={1}>
                  {targetRoom && currentParsed ? currentParsed.fullDisplay : selectedLoc?.name || "Điểm đến"}
                </Text>
                <Text style={styles.distanceDurationText}>
                  {`~${activeRoute.distanceMeters}m • ~${activeRoute.durationMinutes || 1} phút đi bộ`}
                </Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={onClearRoute}
          activeOpacity={0.8}
          style={styles.stopButton}
        >
          <Feather name="x-circle" size={16} color="#DC2626" />
          <Text style={styles.stopButtonText}>Dừng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 999,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftInfoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  textGroup: {
    flex: 1,
  },
  gateTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gateNameText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  gateWireframePlaceholder: {
    width: 75,
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 5,
    marginVertical: 2,
  },
  switchGateButton: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  switchGateButtonText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: AppColors.primary,
  },
  loadingWireframeContainer: {
    gap: 6,
    marginTop: 4,
  },
  wireframeBarLarge: {
    width: "80%",
    height: 14,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
  },
  wireframeBarSmall: {
    width: "50%",
    height: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
  },
  destinationTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 1,
  },
  distanceDurationText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#059669",
    marginTop: 2,
  },
  stopButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  stopButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },
});
