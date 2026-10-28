import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function SosWidget() {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#7F1D1D",
        borderRadius: 22,
        padding: 12,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: "myfirstapp://(main)/sos" }}
    >
      {/* HEADER: Tiêu đề nhỏ */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FlexWidget
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: "#EF4444",
            marginRight: 5,
          }}
        />
        <TextWidget
          text="KHẨN CẤP 24/7"
          style={{
            color: "#FCA5A5",
            fontSize: 9,
            fontWeight: "bold",
            letterSpacing: 0.5,
          }}
        />
      </FlexWidget>

      {/* ICON / NÚT BẤM TO */}
      <FlexWidget
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: "#DC2626",
          justifyContent: "center",
          alignItems: "center",
          marginVertical: 4,
        }}
      >
        <TextWidget
          text="SOS"
          style={{
            color: "#FFFFFF",
            fontSize: 18,
            fontWeight: "900",
            letterSpacing: 1,
          }}
        />
      </FlexWidget>

      {/* FOOTER: Hướng dẫn bấm */}
      <FlexWidget
        style={{
          width: "match_parent",
          backgroundColor: "#991B1B",
          borderRadius: 10,
          paddingVertical: 4,
          alignItems: "center",
        }}
      >
        <TextWidget
          text="Chạm gọi Cứu Hộ"
          style={{
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: "bold",
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

