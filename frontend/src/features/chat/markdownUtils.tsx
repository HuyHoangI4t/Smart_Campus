import React from "react";
import { View, Text } from "react-native";

/**
 * Trình phân tích Markdown nhẹ cho Chatbot
 * Hỗ trợ in đậm **bold** và gạch đầu dòng bullet
 * Chuẩn hóa kiểu font chữ tiếng Việt (fontWeight: 700 cho chữ đậm, không dùng 800/900 gây lỗi font trên Android)
 */
export function parseBotMarkdown(text: string, textColor: string, boldColor: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<View key={`sp-${lineIdx}`} style={{ height: 6 }} />);
      return;
    }

    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ");
    const content = isBullet ? trimmed.slice(2) : trimmed;

    // Parse inline bold **text**
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Text
            key={`t-${lineIdx}-${lastIndex}`}
            style={{
              color: textColor,
              fontSize: 14,
              lineHeight: 22,
              fontWeight: "400",
            }}
          >
            {content.slice(lastIndex, match.index)}
          </Text>
        );
      }
      parts.push(
        <Text
          key={`b-${lineIdx}-${match.index}`}
          style={{
            color: boldColor,
            fontSize: 14,
            lineHeight: 22,
            fontWeight: "700",
          }}
        >
          {match[1]}
        </Text>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push(
        <Text
          key={`e-${lineIdx}`}
          style={{
            color: textColor,
            fontSize: 14,
            lineHeight: 22,
            fontWeight: "400",
          }}
        >
          {content.slice(lastIndex)}
        </Text>
      );
    }

    elements.push(
      <View
        key={`ln-${lineIdx}`}
        style={
          isBullet
            ? { flexDirection: "row", alignItems: "flex-start", marginTop: 3 }
            : { marginTop: lineIdx > 0 ? 3 : 0 }
        }
      >
        {isBullet && (
          <Text
            style={{
              color: boldColor,
              fontSize: 14,
              lineHeight: 22,
              marginRight: 6,
              fontWeight: "700",
            }}
          >
            •
          </Text>
        )}
        <Text
          style={{
            fontSize: 14,
            lineHeight: 22,
            flex: isBullet ? 1 : undefined,
            color: textColor,
          }}
        >
          {parts}
        </Text>
      </View>
    );
  });

  return elements;
}
