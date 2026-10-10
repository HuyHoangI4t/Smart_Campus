const { withMainActivity, withAndroidManifest, createRunOncePlugin } = require('@expo/config-plugins');

function applyHighRefreshRateToMainActivity(mainActivityContent) {
  // Tránh thêm trùng lặp nếu đã tồn tại
  if (mainActivityContent.includes('preferredDisplayModeId') || mainActivityContent.includes('highestMode')) {
    return mainActivityContent;
  }

  const isKotlin = mainActivityContent.includes('class MainActivity :') || mainActivityContent.includes('class MainActivity:');

  const kotlinCode = `
    // [High Refresh Rate] Ép ứng dụng chạy ở tần số quét cao nhất của màn hình (90Hz / 120Hz / 144Hz / 165Hz)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
      val disp = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
        display
      } else {
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay
      }
      disp?.supportedModes?.maxByOrNull { it.refreshRate }?.let { highestMode ->
        val lp = window.attributes
        lp.preferredDisplayModeId = highestMode.modeId
        window.attributes = lp
      }
    }
`;

  const javaCode = `
    // [High Refresh Rate] Ép ứng dụng chạy ở tần số quét cao nhất của màn hình (90Hz / 120Hz / 144Hz / 165Hz)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
      android.view.Display disp = (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R)
        ? getDisplay()
        : getWindowManager().getDefaultDisplay();
      if (disp != null) {
        android.view.Display.Mode[] modes = disp.getSupportedModes();
        if (modes != null && modes.length > 0) {
          android.view.Display.Mode highest = modes[0];
          for (android.view.Display.Mode m : modes) {
            if (m.getRefreshRate() > highest.getRefreshRate()) {
              highest = m;
            }
          }
          android.view.WindowManager.LayoutParams lp = getWindow().getAttributes();
          lp.preferredDisplayModeId = highest.getModeId();
          getWindow().setAttributes(lp);
        }
      }
    }
`;

  if (isKotlin) {
    if (mainActivityContent.includes('super.onCreate(savedInstanceState)')) {
      return mainActivityContent.replace(
        'super.onCreate(savedInstanceState)',
        `super.onCreate(savedInstanceState)\n${kotlinCode}`
      );
    } else if (mainActivityContent.includes('super.onCreate(null)')) {
      return mainActivityContent.replace(
        'super.onCreate(null)',
        `super.onCreate(null)\n${kotlinCode}`
      );
    }
  } else {
    if (mainActivityContent.includes('super.onCreate(savedInstanceState);')) {
      return mainActivityContent.replace(
        'super.onCreate(savedInstanceState);',
        `super.onCreate(savedInstanceState);\n${javaCode}`
      );
    } else if (mainActivityContent.includes('super.onCreate(null);')) {
      return mainActivityContent.replace(
        'super.onCreate(null);',
        `super.onCreate(null);\n${javaCode}`
      );
    }
  }

  return mainActivityContent;
}

const withHighRefreshRate = (config) => {
  // 1. Hook MainActivity để gán preferredDisplayModeId cao nhất
  config = withMainActivity(config, (modConfig) => {
    modConfig.modResults.contents = applyHighRefreshRateToMainActivity(modConfig.modResults.contents);
    return modConfig;
  });

  // 2. Kích hoạt tăng tốc đồ họa phần cứng trên Android Manifest
  config = withAndroidManifest(config, (modConfig) => {
    const app = modConfig.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:hardwareAccelerated'] = 'true';
    }
    return modConfig;
  });

  return config;
};

module.exports = createRunOncePlugin(withHighRefreshRate, 'withHighRefreshRate', '1.0.0');
