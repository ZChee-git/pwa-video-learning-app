# 🚀 APK构建完整指南

## 📋 前提条件

### 必需软件
- [x] Node.js (v16+)
- [x] Android Studio (最新版本)
- [x] Java Development Kit (JDK 11+)

### 环境设置
1. 安装 Android Studio
2. 设置 Android SDK
3. 配置环境变量 `ANDROID_HOME`

## 🛠️ 构建步骤

### 第1步：自动化构建
```bash
# 双击运行
build-apk.bat
```

### 第2步：手动构建（可选）
```bash
# 1. 安装依赖
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. 构建Web应用
npm run build

# 3. 初始化Capacitor
npx cap init "智能视频复习系统" "com.smartreview.videolearning"

# 4. 添加Android平台
npx cap add android

# 5. 同步文件
npx cap sync

# 6. 打开Android Studio
npx cap open android
```

### 第3步：在Android Studio中构建
1. 等待项目加载完成
2. 点击 `Build` → `Build Bundle(s)/APK(s)` → `Build APK(s)`
3. 等待构建完成
4. APK位置：`android/app/build/outputs/apk/debug/app-debug.apk`

## 📱 APK功能特点

### 🎯 核心功能
- ✅ 完全离线运行
- ✅ 原生文件存储
- ✅ 视频播放优化
- ✅ 复习系统
- ✅ 数据持久化

### 🔧 技术特性
- **存储**: 原生文件系统代替IndexedDB
- **性能**: 原生WebView渲染
- **稳定性**: 无网络依赖
- **兼容性**: Android 7.0+

### 📊 存储优势
| 特性 | PWA | APK |
|------|-----|-----|
| 离线存储 | 有限制 | 无限制 |
| 文件持久化 | 不稳定 | 稳定 |
| 系统集成 | 有限 | 完全 |
| 性能 | 良好 | 优秀 |

## 🎨 自定义配置

### 应用图标
1. 准备 1024x1024 图标
2. 使用在线工具生成多尺寸图标
3. 放入 `android/app/src/main/res/mipmap-*/` 文件夹

### 启动画面
1. 编辑 `capacitor.config.ts` 中的 `SplashScreen` 配置
2. 添加启动画面图片到 `android/app/src/main/res/drawable/`

### 应用名称
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.smartreview.videolearning',
  appName: '智能视频复习系统',
  // ...
};
```

## 🔐 签名和发布

### 调试版本
- 自动生成，用于测试
- 位置：`android/app/build/outputs/apk/debug/`

### 发布版本
```bash
# 1. 生成签名密钥
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

# 2. 在Android Studio中选择 Build → Generate Signed Bundle/APK
# 3. 选择APK，使用生成的密钥签名
```

## 🧪 测试和调试

### 安装测试
```bash
# 通过ADB安装
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 查看日志
adb logcat | grep -i "smartreview"
```

### 常见问题
1. **构建失败**: 检查Android SDK和Java版本
2. **权限问题**: 确认manifest.xml权限配置
3. **文件访问**: 验证原生存储配置

## 📦 部署选项

### 本地分发
- 直接分享APK文件
- 通过云存储分享

### 应用商店
- Google Play Store
- 其他Android应用市场

## 🔄 更新策略

### 应用更新
1. 修改版本号
2. 重新构建APK
3. 分发新版本

### 代码热更新
- 使用Capacitor Live Updates
- 或实现自定义更新机制

## 📊 性能优化

### 构建优化
```bash
# 启用ProGuard混淆
# 在 android/app/build.gradle 中配置
android {
  buildTypes {
    release {
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
  }
}
```

### 资源优化
- 压缩图片资源
- 启用R8代码收缩
- 使用WebP格式图片

## 🎯 下一步

1. **测试APK功能**
2. **优化用户体验**
3. **准备发布版本**
4. **考虑上架应用商店**

---

## 📞 技术支持

如果遇到问题，请检查：
1. Android Studio版本是否最新
2. Capacitor依赖是否正确安装
3. 环境变量是否配置正确
4. 参考官方文档：https://capacitorjs.com/docs/android
