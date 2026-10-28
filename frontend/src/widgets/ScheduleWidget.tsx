import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export interface ScheduleWidgetData {
  hasClasses?: boolean;
  subjectName?: string;
  courseName?: string;
  room?: string;
  periodText?: string;
  timeText?: string;
  lecturer?: string;
  dateStr?: string;
  remainingCount?: number;
}

export function ScheduleWidget({ data }: { data?: ScheduleWidgetData | null }) {
  const hasClasses = data?.hasClasses !== false && Boolean(data?.subjectName || data?.courseName);
  const subjectName = data?.subjectName || data?.courseName || "Lập trình thiết bị di động";
  const room = data?.room || "Phòng B2.302";
  const periodText = data?.periodText || "Tiết 1 - 3 (07:00 - 09:25)";
  const lecturer = data?.lecturer ? ` • GV: ${data.lecturer}` : "";
  const dateStr = data?.dateStr || "HÔM NAY";
  const remainingText = data?.remainingCount && data.remainingCount > 0 ? `+${data.remainingCount} môn khác` : "";

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
      clickActionData={{ uri: "myfirstapp://(main)/schedule" }}
    >
      {/* HEADER: Tiêu đề & Ngày */}
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
              backgroundColor: "#3B82F6",
              marginRight: 6,
            }}
          />
          <TextWidget
            text="LỊCH HỌC • SMART CAMPUS"
            style={{
              color: "#94A3B8",
              fontSize: 10,
              fontWeight: "bold",
              letterSpacing: 0.5,
            }}
          />
        </FlexWidget>

        <TextWidget
          text={dateStr}
          style={{
            color: "#60A5FA",
            fontSize: 10,
            fontWeight: "bold",
          }}
        />
      </FlexWidget>

      {/* BODY: MÔN HỌC SẮP TỚI */}
      {hasClasses ? (
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "column",
            marginVertical: 4,
          }}
        >
          <TextWidget
            text={subjectName}
            truncate="END"
            maxLines={1}
            style={{
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: "bold",
              marginBottom: 4,
            }}
          />

          <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
            <FlexWidget
              style={{
                backgroundColor: "#1E3A8A",
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginRight: 6,
              }}
            >
              <TextWidget
                text={room}
                style={{
                  color: "#93C5FD",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
            </FlexWidget>

            <TextWidget
              text={periodText + lecturer}
              truncate="END"
              maxLines={1}
              style={{
                color: "#94A3B8",
                fontSize: 10,
              }}
            />
          </FlexWidget>
        </FlexWidget>
      ) : (
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "column",
            justifyContent: "center",
            marginVertical: 4,
          }}
        >
          <TextWidget
            text="Hôm nay bạn không có lịch học 🎉"
            style={{
              color: "#F1F5F9",
              fontSize: 13,
              fontWeight: "bold",
            }}
          />
          <TextWidget
            text="Tận hưởng thời gian nghỉ ngơi hoặc ôn tập nhé!"
            style={{
              color: "#94A3B8",
              fontSize: 10,
              marginTop: 2,
            }}
          />
        </FlexWidget>
      )}

      {/* FOOTER: NÚT XEM CHI TIẾT */}
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
        <TextWidget
          text="Chạm để mở thời khóa biểu"
          style={{
            color: "#94A3B8",
            fontSize: 10,
          }}
        />

        {remainingText ? (
          <TextWidget
            text={remainingText}
            style={{
              color: "#38BDF8",
              fontSize: 10,
              fontWeight: "bold",
            }}
          />
        ) : (
          <TextWidget
            text="Xem tất cả »"
            style={{
              color: "#60A5FA",
              fontSize: 10,
              fontWeight: "bold",
            }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

