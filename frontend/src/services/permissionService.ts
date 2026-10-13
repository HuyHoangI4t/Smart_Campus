import { Platform, PermissionsAndroid, Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Kiểm tra xem phiên hiện tại có phải là người dùng "Khách" hay không.
 * Chế độ khách: chưa đăng nhập hoặc có mssv === 'guest'.
 */
export async function isGuestUser(): Promise<boolean> {
  try {
    const userStr = await AsyncStorage.getItem("@auth_user");
    if (!userStr) return true;
    const user = JSON.parse(userStr);
    const mssv = user.mssv || user.masv || "";
    return !mssv || mssv === "guest";
  } catch {
    return true;
  }
}

/**
 * 1. Yêu cầu quyền truy cập bộ nhớ khi mở ứng dụng (Startup Permission)
 * Tự động yêu cầu quyền bộ nhớ / lưu trữ tài liệu và ảnh phù hợp với từng phiên bản Android & iOS
 * Chế độ khách (guest): Bỏ qua hoàn toàn, tuyệt đối không hỏi quyền bộ nhớ
 */
export async function requestAppStartupStoragePermission(): Promise<boolean> {
  try {
    if (await isGuestUser()) {
      return false;
    }

    if (Platform.OS === "android") {
      const androidVersion = typeof Platform.Version === "number" ? Platform.Version : parseInt(String(Platform.Version), 10) || 30;

      if (androidVersion >= 33) {
        // Android 13+ (API 33+) yêu cầu READ_MEDIA_IMAGES
        const hasMediaPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );

        if (!hasMediaPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: "Yêu cầu quyền truy cập bộ nhớ",
              message:
                "Ứng dụng cần quyền bộ nhớ để lưu trữ tài liệu bài viết, tải tập tin đính kèm và lưu bản đồ ngoại tuyến.",
              buttonNeutral: "Để sau",
              buttonNegative: "Từ chối",
              buttonPositive: "Đồng ý",
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else {
        // Android 12 trở xuống (API <= 32)
        const hasRead = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        const hasWrite = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );

        if (!hasRead || !hasWrite) {
          const statuses = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ]);

          return (
            statuses[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            statuses[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED
          );
        }
        return true;
      }
    }

    // Trên iOS: Thăm dò quyền Media Library
    const res = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (res.status !== "granted") {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return req.granted;
    }
    return true;
  } catch (error) {
    console.warn("Lỗi yêu cầu quyền bộ nhớ khởi động:", error);
    return false;
  }
}

/**
 * 2. Yêu cầu quyền truy cập thư viện ảnh khi người dùng chọn đổi ảnh đại diện từ thư viện
 */
export async function requestPhotoLibraryPermission(): Promise<boolean> {
  try {
    // 1. Thăm dò quyền hiện tại qua Expo ImagePicker
    const res = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (res.granted) {
      return true;
    }

    // 2. Yêu cầu cấp quyền nếu chưa có
    const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (req.granted) {
      return true;
    }

    // 3. Trên Android 13+ (API 33+), Android Photo Picker hệ thống (ACTION_PICK_IMAGES)
    // hoạt động độc lập và không cần quyền bộ nhớ runtime nguy hiểm.
    if (Platform.OS === "android") {
      const androidVersion = typeof Platform.Version === "number" ? Platform.Version : parseInt(String(Platform.Version), 10) || 30;
      if (androidVersion >= 33) {
        return true;
      }
    }

    promptOpenSettings("thư viện ảnh");
    return false;
  } catch (error) {
    console.warn("Lỗi yêu cầu quyền thư viện ảnh:", error);
    // Vẫn trả về true để cho phép hệ thống mở Photo Picker
    return true;
  }
}

/**
 * 3. Yêu cầu quyền máy ảnh khi chụp ảnh đại diện mới
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const res = await ImagePicker.getCameraPermissionsAsync();
    if (res.granted) {
      return true;
    }

    const req = await ImagePicker.requestCameraPermissionsAsync();
    if (req.granted) {
      return true;
    }

    promptOpenSettings("máy ảnh (Camera)");
    return false;
  } catch (error) {
    console.warn("Lỗi yêu cầu quyền máy ảnh:", error);
    promptOpenSettings("máy ảnh (Camera)");
    return false;
  }
}

function promptOpenSettings(permissionName: string) {
  Alert.alert(
    "Yêu cầu quyền truy cập",
    `Ứng dụng chưa được cấp quyền truy cập ${permissionName}. Vui lòng mở Cài đặt của thiết bị và cho phép quyền để tiếp tục.`,
    [
      { text: "Để sau", style: "cancel" },
      {
        text: "Mở Cài đặt",
        onPress: () => {
          Linking.openSettings().catch(() => {});
        },
      },
    ]
  );
}

