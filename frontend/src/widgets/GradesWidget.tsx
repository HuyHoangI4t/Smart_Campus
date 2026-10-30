"use no memo";
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export interface GradesWidgetData {
  gpa4?: string;
  gpa10?: string;
  totalCredits?: number;
  rank?: string;
  rankColor?: string;
  studentName?: string;
  mssv?: string;
}

export function GradesWidget({ data }: { data?: GradesWidgetData | null }) {
  const gpa4 = data?.gpa4 || "3.52";
  const gpa10 = data?.gpa10 || "8.20";
  const credits = data?.totalCredits || 72;
  const rank = data?.rank || "Giỏi";
  const studentName = data?.studentName || "Sinh viên";
  const mssv = data?.mssv ? ` (${data.mssv})` : "";

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        justifyContent: "space-between",
        alignItems: "flex-start",
        backgroundColor: "#0F172A",
        borderRadius: 20,
        padding: 14,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: "myfirstapp://(main)/grades" }}
    >
      {/* HEADER: Tiêu đề & Logo tên trường */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
          <FlexWidget
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#10B981",
              marginRight: 6,
            }}
          />
          <TextWidget
            text="ĐH TÂY NGUYÊN • ĐIỂM TÍCH LŨY"
            style={{
              color: "#94A3B8",
              fontSize: 10,
              fontWeight: "bold",
              letterSpacing: 0.5,
            }}
          />
        </FlexWidget>

        <TextWidget
          text={studentName + mssv}
          truncate="END"
          maxLines={1}
          style={{
            color: "#64748B",
            fontSize: 10,
            fontWeight: "500",
          }}
        />
      </FlexWidget>

      {/* BODY: GPA HỆ 4 & HỆ 10 NỔI BẬT */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginVertical: 4,
        }}
      >
        {/* GPA 4.0 */}
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget
            text="GPA HỆ 4"
            style={{
              color: "#94A3B8",
              fontSize: 9,
              fontWeight: "bold",
              marginBottom: 1,
            }}
          />
          <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <TextWidget
              text={gpa4}
              style={{
                color: "#FBBF24",
                fontSize: 28,
                fontWeight: "bold",
              }}
            />
            <TextWidget
              text=" /4.0"
              style={{
                color: "#64748B",
                fontSize: 13,
                fontWeight: "bold",
                marginLeft: 2,
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* GPA 10 */}
        <FlexWidget style={{ flexDirection: "column", alignItems: "flex-end" }}>
          <TextWidget
            text="THANG 10"
            style={{
              color: "#94A3B8",
              fontSize: 9,
              fontWeight: "bold",
              marginBottom: 1,
            }}
          />
          <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <TextWidget
              text={gpa10}
              style={{
                color: "#38BDF8",
                fontSize: 22,
                fontWeight: "bold",
              }}
            />
            <TextWidget
              text="/10"
              style={{
                color: "#64748B",
                fontSize: 11,
                fontWeight: "500",
                marginLeft: 2,
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* FOOTER: TÍN CHỈ TÍCH LŨY & XẾP LOẠI HỌC LỰC */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#1E293B",
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
          <TextWidget
            text="Tích lũy: "
            style={{
              color: "#94A3B8",
              fontSize: 11,
            }}
          />
          <TextWidget
            text={`${credits} tín chỉ`}
            style={{
              color: "#F1F5F9",
              fontSize: 11,
              fontWeight: "bold",
            }}
          />
        </FlexWidget>

        {/* Badge xếp loại */}
        <FlexWidget
          style={{
            backgroundColor: "#064E3B",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <TextWidget
            text={`★ ${rank}`}
            style={{
              color: "#6EE7B7",
              fontSize: 10,
              fontWeight: "bold",
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

