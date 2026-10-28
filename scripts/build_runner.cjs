const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const job_id = process.env.JOB_ID || `build_${Date.now()}`;
  const app_name = process.env.APP_NAME || 'ApkifyApp';
  const package_id = process.env.PACKAGE_ID || 'com.apkify.app';
  let target_url = (process.env.TARGET_URL || '').trim();
  const html_code = process.env.HTML_CODE || '';
  const is_premium = process.env.IS_PREMIUM === 'true';

  console.log('====================================================');
  console.log(`Starting APK Build Runner for Job: ${job_id}`);
  console.log(`App Name: ${app_name}`);
  console.log(`Package ID: ${package_id}`);
  console.log(`Target URL: ${target_url}`);
  console.log(`Is Premium: ${is_premium}`);
  console.log('====================================================');

  // Normalize URL to always include protocol
  if (target_url && !target_url.startsWith('http://') && !target_url.startsWith('https://')) {
    target_url = `https://${target_url}`;
  }

  const workspaceRoot = process.cwd();
  const tempDir = path.join(workspaceRoot, 'build-temp', job_id);
  const outDir = path.join(workspaceRoot, 'build-output');

  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Prepare minimal package.json
  const pkg = {
    name: 'apk-build-job',
    version: '1.0.0',
    private: true,
    type: 'module',
    dependencies: {
      '@capacitor/core': '^6.0.0',
      '@capacitor/android': '^6.0.0'
    },
    devDependencies: {
      '@capacitor/cli': '^6.0.0'
    }
  };
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));

  // 2. Prepare capacitor.config.json
  const isLocalMode = html_code && html_code.trim().length > 0;
  const isUrlMode = target_url && target_url.trim().length > 0 && !isLocalMode;

  const capConfig = {
    appId: package_id,
    appName: app_name,
    webDir: 'www'
  };

  if (isUrlMode) {
    capConfig.server = {
      url: target_url,
      cleartext: true,
      androidScheme: 'https',
      allowNavigation: ['*']
    };
  }

  fs.writeFileSync(path.join(tempDir, 'capacitor.config.json'), JSON.stringify(capConfig, null, 2));

  // 3. Create dummy www directory
  const wwwDir = path.join(tempDir, 'www');
  fs.mkdirSync(wwwDir, { recursive: true });
  const indexHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${app_name}</title>
  ${isUrlMode ? `<script>
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
      window.location.replace("${target_url}");
    }
  </script>` : ''}
</head>
<body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#ffffff;">
  ${isLocalMode ? html_code : `<div id="app">Loading ${app_name}...</div>`}
</body>
</html>`;
  fs.writeFileSync(path.join(wwwDir, 'index.html'), indexHtmlContent);

  // 4. Install npm dependencies
  console.log('[Step 1/5] Installing Capacitor dependencies...');
  execSync('npm install', { cwd: tempDir, stdio: 'inherit' });

  // 5. Add Android platform
  console.log('[Step 2/5] Adding Android platform...');
  const capCmd = process.platform === 'win32' 
    ? path.join(tempDir, 'node_modules', '.bin', 'cap.cmd') 
    : path.join(tempDir, 'node_modules', '.bin', 'cap');
  
  execSync(`"${capCmd}" add android`, { cwd: tempDir, stdio: 'inherit' });
  execSync(`"${capCmd}" sync android`, { cwd: tempDir, stdio: 'inherit' });

  // Write capacitor config directly into android assets to avoid sync transpile discrepancies
  const assetsConfigPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'assets', 'capacitor.config.json');
  fs.mkdirSync(path.dirname(assetsConfigPath), { recursive: true });
  fs.writeFileSync(assetsConfigPath, JSON.stringify(capConfig, null, 2));

  // 6. Splash branding
  if (!is_premium) {
    console.log('[Step 3/5] Injecting Splash branding...');
    const pkgPath = package_id.replace(/\./g, '/');
    const javaDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'java', pkgPath);
    fs.mkdirSync(javaDir, { recursive: true });

    const splashJava = `package ${package_id};

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.widget.ImageView;

public class SplashActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        final ImageView logo = findViewById(R.id.splash_logo);
        if (logo != null) logo.setAlpha(0f);
        if (logo != null) logo.animate().alpha(1f).setDuration(300).start();

        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                if (logo != null) logo.animate().alpha(0f).setDuration(300).start();
            }
        }, 1200);

        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                overridePendingTransition(0, 0);
                finish();
            }
        }, 1500);
    }
}
`;
    fs.writeFileSync(path.join(javaDir, 'SplashActivity.java'), splashJava);

    const layoutDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res', 'layout');
    fs.mkdirSync(layoutDir, { recursive: true });
    const splashXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:background="#FFFFFF">
    <ImageView
        android:id="@+id/splash_logo"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:src="@drawable/apkify_logo" />
</LinearLayout>
`;
    fs.writeFileSync(path.join(layoutDir, 'activity_splash.xml'), splashXml);

    const drawableDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res', 'drawable');
    fs.mkdirSync(drawableDir, { recursive: true });
    const localLogoJpg = path.join(workspaceRoot, 'assets', 'apkify_logo.jpg');
    const localLogoPng = path.join(workspaceRoot, 'assets', 'apkify_logo.png');
    if (fs.existsSync(localLogoPng)) {
      fs.copyFileSync(localLogoPng, path.join(drawableDir, 'apkify_logo.png'));
    } else if (fs.existsSync(localLogoJpg)) {
      fs.copyFileSync(localLogoJpg, path.join(drawableDir, 'apkify_logo.jpg'));
    }

    const manifestPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    let manifestData = fs.readFileSync(manifestPath, 'utf8');
    const intentFilterRegex = /<intent-filter>[\s\S]*?<action android:name="android\.intent\.action\.MAIN" \/>[\s\S]*?<category android:name="android\.intent\.category\.LAUNCHER" \/>[\s\S]*?<\/intent-filter>/;
    manifestData = manifestData.replace(intentFilterRegex, '');

    const splashTag = `
        <activity
            android:name=".SplashActivity"
            android:exported="true"
            android:theme="@style/AppTheme.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    `;
    manifestData = manifestData.replace('<activity', splashTag + '\n        <activity');
    fs.writeFileSync(manifestPath, manifestData, 'utf8');
  }

  // 7. Inject public index.html fallback
  if (isUrlMode) {
    const assetsIndexHtml = path.join(tempDir, 'android', 'app', 'src', 'main', 'assets', 'public', 'index.html');
    fs.mkdirSync(path.dirname(assetsIndexHtml), { recursive: true });
    fs.writeFileSync(assetsIndexHtml, indexHtmlContent);
  }

  // 8. Configure Release Signing Keys
  console.log('[Step 4/5] Configuring signing keys & properties...');
  const gradlePropsFile = path.join(tempDir, 'android', 'gradle.properties');
  const workspaceKeystorePath = path.join(workspaceRoot, 'assets', 'release.keystore');
  const buildKeystorePath = path.join(tempDir, 'android', 'app', 'release.keystore');
  if (fs.existsSync(workspaceKeystorePath)) {
    fs.copyFileSync(workspaceKeystorePath, buildKeystorePath);
  }

  let props = fs.readFileSync(gradlePropsFile, 'utf8');
  props += `\nRELEASE_STORE_FILE=release.keystore\nRELEASE_STORE_PASSWORD=android\nRELEASE_KEY_ALIAS=key0\nRELEASE_KEY_PASSWORD=android\nandroid.builder.sdkDownload=true\n`;
  fs.writeFileSync(gradlePropsFile, props);

  // Configure local.properties with Android SDK location
  const sdkDir = process.env.ANDROID_HOME || (process.platform === 'win32' ? 'C:\\\\Users\\\\Kamaljit\\\\android-sdk' : '/usr/local/lib/android/sdk');
  const localPropsPath = path.join(tempDir, 'android', 'local.properties');
  fs.writeFileSync(localPropsPath, `sdk.dir=${sdkDir.replace(/\\/g, '/')}\n`);

  const appBuildGradleFile = path.join(tempDir, 'android', 'app', 'build.gradle');
  let buildGradleContent = fs.readFileSync(appBuildGradleFile, 'utf8');
  const buildTypesRegex = /buildTypes\s*\{/;
  if (buildGradleContent.match(buildTypesRegex)) {
    buildGradleContent = buildGradleContent.replace(buildTypesRegex, `signingConfigs {
        release {
            storeFile file(RELEASE_STORE_FILE)
            storePassword RELEASE_STORE_PASSWORD
            keyAlias RELEASE_KEY_ALIAS
            keyPassword RELEASE_KEY_PASSWORD
        }
    }

    buildTypes {`);
  }
  const releaseBuildTypeRegex = /(buildTypes\s*\{\s*)release\s*\{/;
  if (buildGradleContent.match(releaseBuildTypeRegex)) {
    buildGradleContent = buildGradleContent.replace(releaseBuildTypeRegex, `$1release {\n            signingConfig signingConfigs.release`);
  }
  fs.writeFileSync(appBuildGradleFile, buildGradleContent);

  // 9. Run Gradle assembleRelease
  console.log('[Step 5/5] Compiling and assembling Release APK...');
  const androidDir = path.join(tempDir, 'android');
  if (process.platform !== 'win32') {
    try { execSync('chmod +x ./gradlew', { cwd: androidDir }); } catch (_) {}
  }

  const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  execSync(`${gradlewCmd} assembleRelease`, { cwd: androidDir, stdio: 'inherit' });

  // 10. Copy APK to output
  const generatedApk = path.join(tempDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  if (!fs.existsSync(generatedApk)) {
    throw new Error('Build completed but release APK was not found at expected location.');
  }

  const sanitizedAppName = app_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalApkName = `${sanitizedAppName}.apk`;
  const finalApkDest = path.join(outDir, finalApkName);
  fs.copyFileSync(generatedApk, finalApkDest);

  const stats = fs.statSync(finalApkDest);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('====================================================');
  console.log(`>>> APK BUILD SUCCEEDED! <<<`);
  console.log(`Output: ${finalApkDest}`);
  console.log(`File Size: ${sizeMb} MB (${stats.size} bytes)`);
  console.log('====================================================');

  // Output variable for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `apk_path=${finalApkDest}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `apk_name=${finalApkName}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `apk_size=${sizeMb} MB\n`);
  }
}

main().catch((err) => {
  console.error('\n>>> BUILD FAILED <<<', err);
  process.exit(1);
});
