import { Platform, PermissionsAndroid, Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

/**
 * 1. Yêu cầu quyền truy cập bộ nhớ khi mở ứng dụng (Startup Permission)
 * Tự động yêu cầu quyền bộ nhớ / lưu trữ tài liệu và ảnh phù hợp với từng phiên bản Android & iOS
 */
export async function requestAppStartupStoragePermission(): Promise<boolean> {
  try {
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
    if (Platform.OS === "android") {
      const androidVersion = typeof Platform.Version === "number" ? Platform.Version : parseInt(String(Platform.Version), 10) || 30;

      if (androidVersion >= 33) {
        const hasMedia = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        if (!hasMedia) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: "Quyền truy cập thư viện ảnh",
              message:
                "Ứng dụng cần quyền truy cập thư viện ảnh để bạn có thể chọn và tải ảnh đại diện lên hệ thống.",
              buttonNeutral: "Để sau",
              buttonNegative: "Từ chối",
              buttonPositive: "Đồng ý",
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            promptOpenSettings("thư viện ảnh");
            return false;
          }
        }
      } else {
        const hasRead = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        if (!hasRead) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: "Quyền truy cập thư viện ảnh",
              message:
                "Ứng dụng cần quyền đọc bộ nhớ để chọn ảnh từ thư viện của bạn.",
              buttonNeutral: "Để sau",
              buttonNegative: "Từ chối",
              buttonPositive: "Đồng ý",
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            promptOpenSettings("thư viện ảnh");
            return false;
          }
        }
      }
    }

    // Sử dụng Expo ImagePicker Permission
    const expoStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!expoStatus.granted) {
      promptOpenSettings("thư viện ảnh");
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Lỗi yêu cầu quyền thư viện ảnh:", error);
    promptOpenSettings("thư viện ảnh");
    return false;
  }
}

/**
 * 3. Yêu cầu quyền máy ảnh khi chụp ảnh đại diện mới
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      const hasCamera = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (!hasCamera) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Quyền truy cập máy ảnh",
            message:
              "Ứng dụng cần quyền máy ảnh để bạn có thể chụp ảnh đại diện mới.",
            buttonNeutral: "Để sau",
            buttonNegative: "Từ chối",
            buttonPositive: "Đồng ý",
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          promptOpenSettings("máy ảnh (Camera)");
          return false;
        }
      }
    }

    const expoStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (!expoStatus.granted) {
      promptOpenSettings("máy ảnh (Camera)");
      return false;
    }

    return true;
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

