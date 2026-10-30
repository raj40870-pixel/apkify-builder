/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec, spawn, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { existsSync, mkdirSync, realpathSync, readdirSync } from 'fs';
import os from 'os';
import mongoose from 'mongoose';
import authRoutes from './src/server/routes/auth.js';
import adminRoutes from './src/server/routes/admin.js';
import supportRoutes from './src/server/routes/support.js';
import jwt from 'jsonwebtoken';
import User from './src/server/models/User.js';
import Build from './src/server/models/Build.js';
import AdmZip from 'adm-zip';
dotenv.config({ path: '.env.local' });

// Connect MongoDB on startup with retry logic
const connectDB = async () => {
  let mongoUrl = process.env.MONGODB_URL || process.env.MONGODB_URI;
  if (!mongoUrl) {
    console.warn('[MongoDB] ⚠️  MONGODB_URL not set in .env.local. Starting in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUrl = mongod.getUri();
      console.log(`[MongoDB] 🧠 Started in-memory MongoDB at: ${mongoUrl}`);
    } catch (err: any) {
      console.error('[MongoDB] ❌ Failed to start in-memory MongoDB:', err.message);
      return;
    }
  }

  try {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 8000 });
    console.log('[MongoDB] ✅ Connected successfully');
  } catch (err: any) {
    console.error('[MongoDB] ❌ Connection error:', err.message);
    console.log('[MongoDB] 🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();
const execAsync = promisify(exec);

const app = express();
mkdirSync(path.join(process.cwd(), 'apks'), { recursive: true });
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/apks', express.static(path.join(process.cwd(), 'apks')));

// Mount Auth & Admin & Support Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
// Request logging
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Google Search Console Site Verification
app.get('/google61d8850f40d616b0.html', (req, res) => {
  res.type('text/html').send('google-site-verification: google61d8850f40d616b0.html');
});

// Diagnostic endpoint to inspect live environment
app.get('/api/diag', (req, res) => {
  const run = (cmd: string) => {
    try { return execSync(cmd + ' 2>&1').toString().trim(); }
    catch (e: any) { return 'ERR: ' + (e.stdout?.toString() || e.message); }
  };
  const info: any = {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
    freeMemMB: Math.round(os.freemem() / 1024 / 1024),
    env: {
      JAVA_HOME: process.env.JAVA_HOME,
      ANDROID_HOME: process.env.ANDROID_HOME,
      PATH: process.env.PATH,
      K_SERVICE: process.env.K_SERVICE,
    },
    tools: {
      curl: run('which curl'),
      tar: run('which tar'),
      unzip: run('which unzip'),
      java: run('which java'),
      javac: run('which javac'),
      sdkmanager: run('which sdkmanager'),
    }
  };
  try {
    if (process.platform !== 'win32') {
      info.tmpJdkExists = existsSync('/tmp/jdk-17');
      info.tmpSdkExists = existsSync('/tmp/android-sdk');
      info.androidSdkDirs = run('ls -la /tmp/android-sdk 2>&1');
      info.buildToolsDirs = run('ls -la /tmp/android-sdk/build-tools 2>&1');
      info.lastDaemonLog = run('cat /tmp/.gradle/daemon/*/*.out.log 2>&1 | tail -n 40');
      info.jvmCrashReports = run('ls -la /tmp/hs_err*.log ./hs_err*.log 2>&1');
      info.aapt2Check = run('/tmp/android-sdk/build-tools/34.0.0/aapt2 version 2>&1');
    }
  } catch (_) {}
  res.json(info);
});


// Helper function to run the Capacitor Android build process natively on the server host

// Helper to write all official Android SDK license hashes for automated builds
async function writeAllLicenses(licensesDir: string) {
  await fs.mkdir(licensesDir, { recursive: true });
  await fs.writeFile(
    path.join(licensesDir, 'android-sdk-license'),
    '24333f8a63718c41501f30fb50a0f44766699865\n8933042294d9c04146c0775a119bc8473e4b43d5\nd56f518547957e8415d31f49d69c65996bc2262d\n24333f8a63b6825ea9c5514f83c2829b004d1fee\n8933bad161af4178b1185d1a37fbf41ea5269c55\nd56f5187479451eabf01fb78af6dfcb131a6481e\n'
  );
  await fs.writeFile(
    path.join(licensesDir, 'android-sdk-preview-license'),
    '84831b9409646a918e30573bab4c9c91346d8abd\n'
  );
  await fs.writeFile(
    path.join(licensesDir, 'android-googletv-license'),
    '601085b94cd77f0b54ff86406957099ebe79c4d6\n'
  );
  await fs.writeFile(
    path.join(licensesDir, 'android-googlexr-license'),
    'ceff83576aac4f7f37cb98fe189e9fb3c49d3b81\n'
  );
  await fs.writeFile(
    path.join(licensesDir, 'android-sdk-arm-dbt-license'),
    '859f317696f67ef3d7f30a50a5560e7834b43903\n'
  );
  await fs.writeFile(
    path.join(licensesDir, 'google-gdk-license'),
    '33b6a2b64607f11b759f320ef9dff4ae5c47d97a\n'
  );
  await fs.writeFile(
    path.join(licensesDir, 'mips-android-sysimage-license'),
    'e9acab5b5fbb560a72cfaecce8946896ff6aab9d\n'
  );
}

// Auto-provision portable OpenJDK 17 and Android SDK on Linux without root/apt-get
async function ensureLinuxJavaAndSdk(sendProgress: (p: number, s: string) => void) {
  if (process.platform === 'win32') return;

  const jdkHome = '/tmp/jdk-17/jdk-17.0.11+9';

  // 1. Check & Ensure Java 17
  let hasWorkingJava = false;
  try {
    const v = execSync('java -version 2>&1').toString();
    if (v.includes('Runtime Environment') || v.includes('openjdk') || v.includes('version')) {
      hasWorkingJava = true;
    }
  } catch (_) {}

  if (!hasWorkingJava) {
    if (existsSync(path.join(jdkHome, 'bin', 'java'))) {
      process.env.JAVA_HOME = jdkHome;
      process.env.PATH = `${jdkHome}/bin:${process.env.PATH}`;
      console.log('[AutoJava] Using cached Java 17 at:', jdkHome);
    } else {
      sendProgress(12, "Setting up Java 17 Runtime (one-time setup)...");
      console.log('[AutoJava] Downloading portable OpenJDK 17 Linux tarball...');
      await fs.mkdir('/tmp/jdk-17', { recursive: true });
      const tarPath = '/tmp/jdk17.tar.gz';
      const jdkUrl = 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.11%2B9/OpenJDK17U-jdk_x64_linux_hotspot_17.0.11_9.tar.gz';
      try {
        execSync(`curl -fsSL -L -o "${tarPath}" "${jdkUrl}"`);
      } catch (_) {
        const resp = await fetch(jdkUrl, { redirect: 'follow' });
        const buf = Buffer.from(await resp.arrayBuffer());
        await fs.writeFile(tarPath, buf);
      }
      execSync(`tar -xzf "${tarPath}" -C /tmp/jdk-17`);
      await fs.unlink(tarPath).catch(() => {});
      process.env.JAVA_HOME = jdkHome;
      process.env.PATH = `${jdkHome}/bin:${process.env.PATH}`;
      console.log('[AutoJava] Portable Java 17 ready at:', jdkHome);
    }
  }

  // 2. Check & Ensure Android SDK & Licenses
  const sdkHome = '/tmp/android-sdk';
  process.env.ANDROID_HOME = sdkHome;
  process.env.ANDROID_SDK_ROOT = sdkHome;

  // Always make sure official accepted licenses exist
  await writeAllLicenses(path.join(sdkHome, 'licenses'));

  const sdkmanager = `${sdkHome}/cmdline-tools/latest/bin/sdkmanager`;
  const hasPlatforms34 = existsSync(path.join(sdkHome, 'platforms', 'android-34'));

  if (!existsSync(sdkmanager)) {
    sendProgress(14, "Setting up Android SDK Tools (one-time setup)...");
    console.log('[AutoSdk] Downloading Android SDK Command-line tools...');
    await fs.mkdir(`${sdkHome}/cmdline-tools`, { recursive: true });
    const zipPath = '/tmp/cmdline-tools.zip';
    const sdkUrl = 'https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip';
    try {
      execSync(`curl -fsSL -L -o "${zipPath}" "${sdkUrl}"`);
    } catch (_) {
      const resp = await fetch(sdkUrl, { redirect: 'follow' });
      const buf = Buffer.from(await resp.arrayBuffer());
      await fs.writeFile(zipPath, buf);
    }

    try {
      execSync(`unzip -q -o "${zipPath}" -d "${sdkHome}/cmdline-tools"`);
    } catch (_) {
      const jarBin = existsSync(`${jdkHome}/bin/jar`) ? `${jdkHome}/bin/jar` : 'jar';
      execSync(`"${jarBin}" -xf "${zipPath}"`, { cwd: `${sdkHome}/cmdline-tools` });
    }
    execSync(`rm -rf "${sdkHome}/cmdline-tools/latest" && mv "${sdkHome}/cmdline-tools/cmdline-tools" "${sdkHome}/cmdline-tools/latest"`);
    await fs.unlink(zipPath).catch(() => {});
  }

  if (existsSync(sdkmanager) && !hasPlatforms34) {
    sendProgress(16, "Installing Android 34 SDK platform and build tools...");
    try {
      execSync(`chmod +x "${sdkmanager}"`);
      execSync(`yes | "${sdkmanager}" --sdk_root="${sdkHome}" --licenses 2>/dev/null || true`);
      execSync(`"${sdkmanager}" --sdk_root="${sdkHome}" "platform-tools" "platforms;android-34" "build-tools;34.0.0"`);
    } catch (err: any) {
      console.warn('[AutoSdk] sdkmanager install warning (Gradle will auto-download with accepted licenses):', err.message);
    }
  }

  process.env.PATH = `${sdkHome}/cmdline-tools/latest/bin:${sdkHome}/platform-tools:${process.env.PATH}`;
  console.log('[AutoSdk] Android SDK ready at:', sdkHome);
}

async function buildApkViaGitHubActions(
  jobId: string,
  url: string,
  appName: string,
  packageId: string,
  sendProgress: (p: number, s: string, extra?: any) => void,
  htmlCode?: string,
  zipData?: string,
  isPremium: boolean = false,
  iconUrl?: string
) {
  const token = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'raj40870-pixel';
  const repoName = process.env.GITHUB_REPO_NAME || 'apk-backend-';

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not configured on server.');
  }

  sendProgress(10, 'Processing project inputs...');

  let effectiveHtmlCode = htmlCode || '';
  let zipUrl = '';

  if (zipData && zipData.trim()) {
    try {
      const matches = zipData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const b64 = matches ? matches[2] : zipData;
      const zipBuffer = Buffer.from(b64, 'base64');

      // 1. Save locally in apks/ so it can be served
      const apksDir = path.join(process.cwd(), 'apks');
      await fs.mkdir(apksDir, { recursive: true }).catch(() => {});
      const localZipPath = path.join(apksDir, `${jobId}_source.zip`);
      await fs.writeFile(localZipPath, zipBuffer);

      // 2. Upload to GitHub as a temporary build asset in repo so runner can access it directly
      sendProgress(15, 'Uploading project package to build runner...');
      const uploadPath = `uploads/${jobId}.zip`;
      const uploadApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${uploadPath}`;
      
      const uploadRes = await fetch(uploadApiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'APKify-Builder'
        },
        body: JSON.stringify({
          message: `chore: upload source zip for ${jobId}`,
          content: zipBuffer.toString('base64'),
          branch: 'main'
        })
      });

      if (uploadRes.ok) {
        zipUrl = `uploads/${jobId}.zip`;
        effectiveHtmlCode = ''; // Prevent large multiline inputs in workflow dispatch
        console.log(`[GitHub Actions] Successfully uploaded ${uploadPath} for build ${jobId}`);
      } else {
        const publicHost = process.env.PUBLIC_BACKEND_URL || process.env.API_BASE_URL || 'https://apkify-builder.ai.studio';
        zipUrl = `${publicHost}/apks/${jobId}_source.zip`;
      }
    } catch (zipErr: any) {
      console.error('[API] Error processing zipData for GitHub Actions:', zipErr);
    }
  } else if (htmlCode && htmlCode.trim()) {
    try {
      sendProgress(15, 'Packaging HTML code package for cloud runner...');
      const zip = new AdmZip();
      zip.addFile('index.html', Buffer.from(htmlCode, 'utf8'));
      const zipBuffer = zip.toBuffer();

      const uploadPath = `uploads/${jobId}.zip`;
      const uploadApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${uploadPath}`;
      
      const uploadRes = await fetch(uploadApiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'APKify-Builder'
        },
        body: JSON.stringify({
          message: `chore: upload html source for ${jobId}`,
          content: zipBuffer.toString('base64'),
          branch: 'main'
        })
      });

      if (uploadRes.ok) {
        zipUrl = `uploads/${jobId}.zip`;
        effectiveHtmlCode = ''; // Packaging into zip protects against GitHub Actions 1024 char input limit
        console.log(`[GitHub Actions] Successfully uploaded HTML package ${uploadPath} for build ${jobId}`);
      }
    } catch (htmlErr: any) {
      console.error('[API] Error packaging HTML code for GitHub Actions:', htmlErr);
    }
  }

  
  let iconUploadRelativePath = '';
  if (iconUrl && iconUrl.trim()) {
    try {
      sendProgress(12, 'Processing custom app icon...');
      const matches = iconUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const iconB64 = matches ? matches[2] : iconUrl;
      const iconBuffer = Buffer.from(iconB64, 'base64');

      const iconUploadPath = `uploads/${jobId}_icon.png`;
      const iconApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${iconUploadPath}`;
      const iconRes = await fetch(iconApiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'APKify-Builder'
        },
        body: JSON.stringify({
          message: `chore: upload icon for ${jobId}`,
          content: iconBuffer.toString('base64'),
          branch: 'main'
        })
      });

      if (iconRes.ok) {
        iconUploadRelativePath = iconUploadPath;
        console.log(`[GitHub Actions] Successfully uploaded ${iconUploadPath} for build ${jobId}`);
      }
    } catch (iconErr: any) {
      console.error('[API] Error uploading icon for GitHub Actions:', iconErr);
    }
  }

  sendProgress(20, 'Triggering GitHub Actions 16GB Cloud Runner...');

  const dispatchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/build-apk.yml/dispatches`;
  const dispatchRes = await fetch(dispatchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'APKify-Builder'
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        job_id: jobId,
        app_name: appName,
        package_id: packageId,
        target_url: url || '',
        html_code: effectiveHtmlCode || '',
        zip_url: zipUrl || '',
        icon_url: iconUploadRelativePath || '',
        is_premium: isPremium ? 'true' : 'false'
      }
    })
  });

  if (!dispatchRes.ok) {
    const errText = await dispatchRes.text();
    throw new Error(`Failed to trigger GitHub Actions: ${dispatchRes.status} ${errText}`);
  }

  sendProgress(20, 'GitHub Actions workflow started. Provisioning Android SDK & Java 17...');

  const runsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?event=workflow_dispatch&per_page=5`;
  let workflowRunId: number | null = null;
  const startTime = Date.now();

  while (!workflowRunId && Date.now() - startTime < 60000) {
    await new Promise(r => setTimeout(r, 4000));
    try {
      const runsRes = await fetch(runsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'APKify-Builder'
        }
      });
      if (runsRes.ok) {
        const runsData: any = await runsRes.json();
        const latestRun = runsData.workflow_runs?.[0];
        if (latestRun && new Date(latestRun.created_at).getTime() >= startTime - 15000) {
          workflowRunId = latestRun.id;
        }
      }
    } catch (_) {}
  }

  if (!workflowRunId) {
    throw new Error('Timed out waiting for GitHub Actions workflow to start.');
  }

  const singleRunUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs/${workflowRunId}`;
  let status = 'in_progress';
  let conclusion: string | null = null;
  let progressStep = 30;

  while (status !== 'completed' && Date.now() - startTime < 360000) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const runCheck = await fetch(singleRunUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'APKify-Builder'
        }
      });
      if (runCheck.ok) {
        const runObj: any = await runCheck.json();
        status = runObj.status;
        conclusion = runObj.conclusion;
        if (status === 'in_progress') {
          progressStep = Math.min(progressStep + 8, 88);
          if (progressStep <= 45) sendProgress(progressStep, 'Setting up Android SDK 34 & Capacitor platform...');
          else if (progressStep <= 70) sendProgress(progressStep, 'Compiling Release APK with Gradle on 16GB runner...');
          else sendProgress(progressStep, 'Signing and packaging Release APK...');
        }
      }
    } catch (_) {}
  }

  if (conclusion !== 'success') {
    throw new Error(`GitHub Actions build ${conclusion || 'failed'}.`);
  }

  sendProgress(95, 'Finalizing APK download URL...');

  const sanitizedAppName = appName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalApkName = `${sanitizedAppName}.apk`;
  const directDownloadUrl = `https://github.com/${repoOwner}/${repoName}/releases/download/builds/${finalApkName}`;

  sendProgress(100, 'Completed', {
    success: true,
    downloadUrl: directDownloadUrl
  });

  return directDownloadUrl;
}

async function buildApkLocally(
  jobId: string,
  url: string,
  appName: string,
  packageId: string,
  iconUrl: string | undefined,
  sendProgress: (progress: number, stage: string, extra?: any) => void,
  htmlCode?: string,
  zipData?: string,
  isPremium: boolean = false
) {
  const isCloudOrMock = process.env.MOCK_BUILD === 'true';
  if (isCloudOrMock) {
    console.log('[local-build] MOCK_BUILD mode active. Simulating APK build...');
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    sendProgress(10, "Extracting ZIP contents...");
    await sleep(800);
    sendProgress(15, "Installing Capacitor CLI and core packages...");
    await sleep(1000);
    sendProgress(25, "Adding Android platform...");
    await sleep(1000);
    sendProgress(40, "Syncing assets and configurations...");
    await sleep(800);
    sendProgress(45, "Injecting Splash Branding...");
    await sleep(500);
    
    if (iconUrl && iconUrl.trim()) {
      try {
        sendProgress(42, "Configuring custom app launcher icon...");
        const matches = iconUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const b64 = matches ? matches[2] : iconUrl;
        const iconBuffer = Buffer.from(b64, 'base64');
        const resDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res');
        const mipmapDirs = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
        for (const dirName of mipmapDirs) {
          const targetFolder = path.join(resDir, dirName);
          await fs.mkdir(targetFolder, { recursive: true });
          await fs.writeFile(path.join(targetFolder, 'ic_launcher.png'), iconBuffer);
          await fs.writeFile(path.join(targetFolder, 'ic_launcher_round.png'), iconBuffer);
          await fs.writeFile(path.join(targetFolder, 'ic_launcher_foreground.png'), iconBuffer);
        }
        await fs.unlink(path.join(resDir, 'drawable-v24', 'ic_launcher_foreground.xml')).catch(() => {});
        await fs.unlink(path.join(resDir, 'drawable', 'ic_launcher_foreground.xml')).catch(() => {});
        await fs.rm(path.join(resDir, 'mipmap-anydpi-v26'), { recursive: true, force: true }).catch(() => {});
        console.log('[local-build] Custom icon injected into all mipmap directories.');
      } catch (iconErr) {
        console.warn('[local-build] Failed to configure custom icon:', iconErr);
      }
    }

    sendProgress(50, "Injecting WebView URL configuration...");
    await sleep(500);
    sendProgress(55, "Configuring build signing keys...");
    await sleep(500);
    sendProgress(70, "Compiling and packaging Android release APK...");
    await sleep(1500);
    sendProgress(80, "Compiling code...");
    await sleep(1000);
    sendProgress(90, "Packaging Release APK...");
    await sleep(1000);
    
    const apkFilename = `${appName.replace(/[^a-zA-Z0-9_]/g, '_')}.apk`;
    const apksDir = path.join(process.cwd(), 'apks');
    await fs.mkdir(apksDir, { recursive: true });
    const finalApkPath = path.join(apksDir, apkFilename);
    await fs.writeFile(finalApkPath, "MOCK_APK_FILE_CONTENT_FOR_LOCAL_TESTING");
    
    sendProgress(100, "Completed", {
      success: true,
      downloadUrl: `/apks/${apkFilename}`,
      size: "0.01MB"
    });
    return;
  }

  const tempDir = path.join(process.cwd(), 'worker-temp', jobId);
  const apksDir = path.join(process.cwd(), 'apks');
  
  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(apksDir, { recursive: true });

  console.log(`[local-build] Starting build in directory: ${tempDir}`);

  // Write package.json
  const packageJson = {
    name: "apk_build_job",
    version: "1.0.0",
    type: "module",
    dependencies: {
      "@capacitor/core": "^6.0.0",
      "@capacitor/android": "^6.0.0"
    },
    devDependencies: {
      "@capacitor/cli": "^6.0.0",
      "typescript": "^5.0.0"
    }
  };
  await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Normalize URL to always include protocol (prevents Capacitor MalformedURLException / NullPointerException)
  if (url && typeof url === 'string') {
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
  }

  // Write capacitor.config.ts and capacitor.config.json
  const isLocalMode = (htmlCode && htmlCode.trim().length > 0) || (zipData && zipData.trim().length > 0);
  const isUrlMode = url && url.trim().length > 0 && !isLocalMode;

  const capConfigObj: any = {
    appId: packageId,
    appName: appName,
    webDir: "www"
  };
  if (isUrlMode) {
    capConfigObj.server = {
      url: url,
      cleartext: true,
      androidScheme: "https",
      allowNavigation: ["*"]
    };
  }

  await fs.writeFile(path.join(tempDir, 'capacitor.config.json'), JSON.stringify(capConfigObj, null, 2));

  // Using capacitor.config.json directly to avoid Node.js TypeScript/ESM parsing warnings on Linux
  await fs.unlink(path.join(tempDir, 'capacitor.config.ts')).catch(() => {});

  const runCommand = (cmd: string, args: string[], cwd: string, onLog: (data: string) => void) => {
    return new Promise<boolean>((resolve) => {
      const isWin = process.platform === 'win32';
      let javaHome = process.env.JAVA_HOME;
      if (!javaHome || javaHome.includes('Lenovo')) {
        if (isWin) {
          javaHome = 'C:\\Program Files\\Microsoft\\jdk-17.0.19.10-hotspot';
        } else {
          if (existsSync('/tmp/jdk-17/jdk-17.0.11+9/bin/java')) {
            javaHome = '/tmp/jdk-17/jdk-17.0.11+9';
          } else {
            try {
              const whichJ = execSync('which java 2>/dev/null').toString().trim();
              if (whichJ) {
                const realJ = realpathSync(whichJ);
                javaHome = path.dirname(path.dirname(realJ));
              }
            } catch (_) {}
            if (!javaHome && existsSync('/usr/lib/jvm/java-17-openjdk-amd64')) {
              javaHome = '/usr/lib/jvm/java-17-openjdk-amd64';
            }
          }
        }
      }

      let androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
      if (!androidHome) {
        androidHome = isWin ? 'C:\\Users\\Kamaljit\\android-sdk' : '/tmp/android-sdk';
      }

      const sslOpts = isWin ? "-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT" : "";

      const env: any = {
        ...process.env,
        GRADLE_USER_HOME: isWin ? (process.env.GRADLE_USER_HOME || path.join(os.homedir(), '.gradle')) : '/tmp/.gradle',
        GRADLE_OPTS: `${sslOpts} -Dorg.gradle.daemon=false -Dorg.gradle.parallel=false -Dorg.gradle.workers.max=1 -Xmx220m -XX:MaxMetaspaceSize=96m -XX:+UseSerialGC -Dkotlin.compiler.execution.strategy=in-process`
      };
      if (javaHome) {
        env.JAVA_HOME = javaHome;
        env.PATH = `${javaHome}/bin:${env.PATH || ''}`;
      }
      if (androidHome) {
        env.ANDROID_HOME = androidHome;
        env.ANDROID_SDK_ROOT = androidHome;
        env.PATH = `${androidHome}/cmdline-tools/latest/bin:${androidHome}/platform-tools:${env.PATH || ''}`;
      }

      const safeCmd = isWin && cmd.includes(' ') && !cmd.startsWith('"') ? `"${cmd}"` : cmd;
      const processInstance = spawn(safeCmd, args, { 
        cwd, 
        shell: true,
        env
      });
      
      processInstance.stdout.on('data', (data) => onLog(data.toString()));
      processInstance.stderr.on('data', (data) => onLog(data.toString()));
      processInstance.on('close', (code) => resolve(code === 0));
    });
  };

  let projectType: 'web' = 'web';

  if (zipData && zipData.trim()) {
    sendProgress(10, "Extracting ZIP contents...");
    const matches = zipData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const zipBuffer = Buffer.from(matches[2], 'base64');
      const zipPath = path.join(tempDir, 'source.zip');
      await fs.writeFile(zipPath, zipBuffer);
      
      const wwwDir = path.join(tempDir, 'www');
      await fs.mkdir(wwwDir, { recursive: true });

      try {
        const zip = new AdmZip(zipBuffer);
        zip.extractAllTo(wwwDir, true);
        console.log('[ZIP Extract] Extracted successfully using AdmZip');
      } catch (e: any) {
        throw new Error(`Failed to extract uploaded ZIP file: ${e.message}`);
      }
      await fs.unlink(zipPath).catch(() => {});

      // Hoist nested folder contents if ZIP was wrapped in a folder
      let items = await fs.readdir(wwwDir);
      items = items.filter(item => item !== '__MACOSX' && !item.startsWith('.'));
      if (items.length === 1) {
        const firstItem = path.join(wwwDir, items[0]);
        const stat = await fs.stat(firstItem).catch(() => null);
        if (stat && stat.isDirectory()) {
          const subFiles = await fs.readdir(firstItem);
          for (const sf of subFiles) {
            await fs.rename(path.join(firstItem, sf), path.join(wwwDir, sf));
          }
          await fs.rm(firstItem, { recursive: true, force: true }).catch(() => {});
        }
      }

      // Robust ZIP Handling: Ensure index.html exists in www/
      if (!existsSync(path.join(wwwDir, 'index.html'))) {
        const findHtmlRecursive = async (dir: string): Promise<string | null> => {
          try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            // First check if index.html exists anywhere
            for (const entry of entries) {
              if (entry.name === '__MACOSX' || entry.name.startsWith('.')) continue;
              if (entry.isFile() && entry.name.toLowerCase() === 'index.html') {
                return path.join(dir, entry.name);
              }
            }
            // Next check any .html file
            for (const entry of entries) {
              if (entry.name === '__MACOSX' || entry.name.startsWith('.')) continue;
              const fullPath = path.join(dir, entry.name);
              if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
                return fullPath;
              }
              if (entry.isDirectory()) {
                const res = await findHtmlRecursive(fullPath);
                if (res) return res;
              }
            }
          } catch (e) {}
          return null;
        };

        const foundHtml = await findHtmlRecursive(wwwDir);
        if (foundHtml) {
          const parentDir = path.dirname(foundHtml);
          if (parentDir !== wwwDir) {
            // Hoist files from parentDir to wwwDir so relative paths (css/, js/, assets/) continue working
            try {
              const parentFiles = await fs.readdir(parentDir);
              for (const pf of parentFiles) {
                const src = path.join(parentDir, pf);
                const dest = path.join(wwwDir, pf);
                if (!existsSync(dest)) {
                  await fs.rename(src, dest).catch(() => {});
                }
              }
            } catch (e) {}
          }
          if (!existsSync(path.join(wwwDir, 'index.html'))) {
            await fs.rename(foundHtml, path.join(wwwDir, 'index.html')).catch(() => {});
          }
        } else {
          await fs.writeFile(path.join(wwwDir, 'index.html'), '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>App</title></head><body style="background:#0a0a0c;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><h1>App Ready</h1></body></html>');
        }
      }
    }
  } else {
    await fs.mkdir(path.join(tempDir, 'www'), { recursive: true });
    if (htmlCode && htmlCode.trim()) {
      await fs.writeFile(path.join(tempDir, 'www', 'index.html'), htmlCode);
    } else {
      await fs.writeFile(path.join(tempDir, 'www', 'index.html'), '<html><body>Redirecting...</body></html>');
    }
  }

  if (projectType === 'web') {
    // Inject/merge Capacitor dependencies into package.json to support custom user uploads
    const pkgPath = path.join(tempDir, 'package.json');
    let currentPkg: any = {};
    if (existsSync(pkgPath)) {
      try {
        const content = await fs.readFile(pkgPath, 'utf8');
        currentPkg = JSON.parse(content);
      } catch (e) {
        console.warn("Failed to parse package.json dependencies, using template", e);
      }
    }
    if (!currentPkg.dependencies) currentPkg.dependencies = {};
    if (!currentPkg.devDependencies) currentPkg.devDependencies = {};
    
    currentPkg.type = "module";
    currentPkg.dependencies["@capacitor/core"] = "^6.0.0";
    currentPkg.dependencies["@capacitor/android"] = "^6.0.0";
    currentPkg.devDependencies["@capacitor/cli"] = "^6.0.0";
    await fs.writeFile(pkgPath, JSON.stringify(currentPkg, null, 2));

    sendProgress(15, "Installing Capacitor CLI and core packages...");
    const npmInstallOk = await runCommand('npm', ['install'], tempDir, (log) => {
      console.log(`[npm] ${log.trim()}`);
    });
    if (!npmInstallOk) throw new Error("Failed to install npm dependencies.");

    sendProgress(25, "Adding Android platform...");
    const capBinAbs = path.join(tempDir, 'node_modules', '.bin', process.platform === 'win32' ? 'cap.cmd' : 'cap');
    const hasCapBin = existsSync(capBinAbs);
    const capCmd = hasCapBin ? (process.platform === 'win32' ? `"${capBinAbs}"` : './node_modules/.bin/cap') : 'npx';
    const capAddArgs = hasCapBin ? ['add', 'android'] : ['--package=@capacitor/cli', 'cap', 'add', 'android'];

    let capAddLogs = '';
    const capAddOk = await runCommand(capCmd, capAddArgs, tempDir, (log) => {
      capAddLogs += log + '\n';
      console.log(`[cap add] ${log.trim()}`);
    });
    if (!capAddOk) throw new Error(`Failed to add Android platform. Logs: ${capAddLogs.slice(-400).trim()}`);

    sendProgress(40, "Syncing assets and configurations...");
    const capSyncArgs = hasCapBin ? ['sync', 'android'] : ['--package=@capacitor/cli', 'cap', 'sync', 'android'];
    let capSyncLogs = '';
    const capSyncOk = await runCommand(capCmd, capSyncArgs, tempDir, (log) => {
      capSyncLogs += log + '\n';
      console.log(`[cap sync] ${log.trim()}`);
    });
    if (!capSyncOk) throw new Error(`Failed to sync Android project. Logs: ${capSyncLogs.slice(-400).trim()}`);

    // Direct configuration sync to avoid Capacitor 6 asset sync/transpile issues and prevent NullPointerException
    const assetsConfigJson = path.join(tempDir, 'android', 'app', 'src', 'main', 'assets', 'capacitor.config.json');
    await fs.mkdir(path.dirname(assetsConfigJson), { recursive: true }).catch(() => {});
    await fs.writeFile(assetsConfigJson, JSON.stringify(capConfigObj, null, 2));

    if (!isPremium) {
      sendProgress(45, "Injecting Splash Branding...");
      const packagePath = packageId.replace(/\./g, '/');
      const javaDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'java', packagePath);
      await fs.mkdir(javaDir, { recursive: true });

      const splashActivityCode = `package ${packageId};

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
      await fs.writeFile(path.join(javaDir, 'SplashActivity.java'), splashActivityCode);

      const layoutDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res', 'layout');
      await fs.mkdir(layoutDir, { recursive: true });
      const splashLayoutXml = `<?xml version="1.0" encoding="utf-8"?>
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
      await fs.writeFile(path.join(layoutDir, 'activity_splash.xml'), splashLayoutXml);

      const drawableDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res', 'drawable');
      await fs.mkdir(drawableDir, { recursive: true });
      const workspaceLogoPath = path.join(process.cwd(), 'assets', 'apkify_logo.png');
      const workspaceLogoJpgPath = path.join(process.cwd(), 'assets', 'apkify_logo.jpg');
      if (existsSync(workspaceLogoPath)) {
        await fs.copyFile(workspaceLogoPath, path.join(drawableDir, 'apkify_logo.png'));
      } else if (existsSync(workspaceLogoJpgPath)) {
        await fs.copyFile(workspaceLogoJpgPath, path.join(drawableDir, 'apkify_logo.jpg'));
      } else {
        const placeholderLogoB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        await fs.writeFile(path.join(drawableDir, 'apkify_logo.png'), Buffer.from(placeholderLogoB64, 'base64'));
      }

      const manifestPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
      let manifestData = await fs.readFile(manifestPath, 'utf8');
      const intentFilterRegex = /<intent-filter>[\s\S]*?<action android:name="android\.intent\.action\.MAIN" \/>[\s\S]*?<category android:name="android\.intent\.category\.LAUNCHER" \/>[\s\S]*?<\/intent-filter>/;
      manifestData = manifestData.replace(intentFilterRegex, '');

      const splashActivityTag = `
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
      manifestData = manifestData.replace('<activity', splashActivityTag + '\n        <activity');
      await fs.writeFile(manifestPath, manifestData, 'utf8');
    }

    sendProgress(50, "Injecting WebView URL configuration...");
    if (!htmlCode && !zipData) {
      const assetsIndexHtml = path.join(tempDir, 'android', 'app', 'src', 'main', 'assets', 'public', 'index.html');
      await fs.mkdir(path.dirname(assetsIndexHtml), { recursive: true });
      const customIndexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="url" content="${url}" />
  <title>${appName}</title>
  <script>
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
      window.location.replace("${url}");
    }
  </script>
</head>
<body style="margin:0;padding:0;background:#ffffff;display:flex;height:100vh;align-items:center;justify-content:center;font-family:sans-serif;">
  <div id="app">Loading ${appName}...</div>
</body>
</html>`;
      await fs.writeFile(assetsIndexHtml, customIndexHtml);
    }

    sendProgress(55, "Configuring build signing keys...");
    const gradlePropsFile = path.join(tempDir, 'android', 'gradle.properties');
    if (existsSync(gradlePropsFile)) {
      let propsContent = await fs.readFile(gradlePropsFile, 'utf8');
      if (!propsContent.includes('RELEASE_STORE_FILE')) {
        const workspaceKeystorePath = path.join(process.cwd(), 'assets', 'release.keystore');
        const buildKeystorePath = path.join(tempDir, 'android', 'app', 'release.keystore');
        if (existsSync(workspaceKeystorePath)) {
          await fs.copyFile(workspaceKeystorePath, buildKeystorePath);
        } else {
          const placeholderKeystoreB64 = "/u3+7wAAAAEAAAABAAAAAQAAAAIAAAAABQADAAAAbgAAAGwAAgEAAkM9VVMsTz1BcGxpZnlOb3csa2V5c3RvcmUFAAAAcgAAAHAAAgEAAkM9VVMsTz1BcGxpZnlOb3csa2V5c3RvcmUFAAAAcwAAAHIAAgEAAkM9VVMsTz1BcGxpZnlOb3csa2V5c3RvcmUFAAAAdAAAAHMAAgEAAkM9VVMsTz1BcGxpZnlOb3csa2V5c3RvcmU=";
          await fs.writeFile(buildKeystorePath, Buffer.from(placeholderKeystoreB64, 'base64'));
        }
        
        propsContent = propsContent.replace(/org\.gradle\..*/g, '');
        propsContent += `\norg.gradle.daemon=false\norg.gradle.parallel=false\norg.gradle.workers.max=1\norg.gradle.vfs.watch=false\nkotlin.compiler.execution.strategy=in-process\norg.gradle.jvmargs=-Xmx220m -XX:MaxMetaspaceSize=96m -XX:+UseSerialGC -Dfile.encoding=UTF-8\nRELEASE_STORE_FILE=release.keystore\nRELEASE_STORE_PASSWORD=android\nRELEASE_KEY_ALIAS=key0\nRELEASE_KEY_PASSWORD=android\nandroid.builder.sdkDownload=true\n`;
        await fs.writeFile(gradlePropsFile, propsContent);

        const appBuildGradleFile = path.join(tempDir, 'android', 'app', 'build.gradle');
        if (existsSync(appBuildGradleFile)) {
          let buildGradleContent = await fs.readFile(appBuildGradleFile, 'utf8');
          const signingConfigsRegex = /signingConfigs\s*\{/;
          
          if (!buildGradleContent.match(signingConfigsRegex)) {
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
          }

          const releaseBuildTypeRegex = /(buildTypes\s*\{\s*)release\s*\{/;
          if (buildGradleContent.match(releaseBuildTypeRegex)) {
            buildGradleContent = buildGradleContent.replace(releaseBuildTypeRegex, `$1release {\n            signingConfig signingConfigs.release`);
          }
          await fs.writeFile(appBuildGradleFile, buildGradleContent);
        }
      }
    }

    const gradleZipDir = path.join(os.homedir(), '.gradle', 'wrapper', 'dists', 'gradle-8.2.1-all', '16f119zgmyuloex46vr4p0coj');
    const gradleZipPath = path.join(gradleZipDir, 'gradle-8.2.1-all.zip');
    let needsDownload = true;
    try {
      if (existsSync(gradleZipPath)) {
        const stats = await fs.stat(gradleZipPath);
        if (stats.size > 10 * 1024 * 1024) {
          needsDownload = false;
        } else {
          await fs.unlink(gradleZipPath);
        }
      }
    } catch (e) {}

    if (needsDownload) {
      sendProgress(65, "Preparing Gradle build tool...");
      await fs.mkdir(gradleZipDir, { recursive: true });
      try {
        const curlCmd = `curl.exe -L -k --retry 3 --connect-timeout 30 -o "${gradleZipPath}" "https://services.gradle.org/distributions/gradle-8.2.1-all.zip"`;
        await execAsync(curlCmd);
      } catch (err: any) {
        console.warn('[gradle-wrapper] Pre-download failed, letting gradlew handle it:', err.message);
      }
    }

    if (process.platform !== 'win32') {
      await ensureLinuxJavaAndSdk(sendProgress);
      try {
        await execAsync('chmod +x ./gradlew', { cwd: path.join(tempDir, 'android') });
      } catch (_) {}
    }
    sendProgress(70, "Compiling and packaging Android release APK...");
    if (process.platform !== 'win32') {
      await fs.mkdir('/tmp/.gradle', { recursive: true }).catch(() => {});
    }
    const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    const gradleArgs = [
      'assembleRelease',
      '--no-daemon',
      '--no-parallel',
      '--max-workers=1',
      '-Dorg.gradle.daemon=false',
      '-Dorg.gradle.jvmargs=-Xmx220m -XX:MaxMetaspaceSize=96m -XX:+UseSerialGC',
      '-Dkotlin.compiler.execution.strategy=in-process'
    ];
    // Ensure local.properties and licenses exist for Gradle
    try {
      const androidDir = path.join(tempDir, 'android');
      const isWin = process.platform === 'win32';
      const sdkDir = process.env.ANDROID_HOME || (isWin ? 'C:\\Users\\Kamaljit\\android-sdk' : '/tmp/android-sdk');
      await fs.writeFile(path.join(androidDir, 'local.properties'), `sdk.dir=${sdkDir.replace(/\\/g, '/')}\n`);
      await writeAllLicenses(path.join(androidDir, 'licenses'));
      if (process.platform !== 'win32') {
        await writeAllLicenses(path.join('/tmp/android-sdk', 'licenses'));
      }
    } catch (_) {}

    let gradleLogs = '';
    const gradleOk = await runCommand(gradleCmd, gradleArgs, path.join(tempDir, 'android'), (log) => {
      gradleLogs += log + '\n';
      console.log(`[gradle] ${log.trim()}`);
      if (log.includes(':app:processReleaseResources')) {
        sendProgress(75, "Processing Android resources...");
      } else if (log.includes(':app:compileReleaseJavaWithJavac') || log.includes(':app:compileReleaseKotlin')) {
        sendProgress(80, "Compiling code...");
      } else if (log.includes(':app:dexBuilderRelease')) {
        sendProgress(85, "Generating DEX files...");
      } else if (log.includes(':app:packageRelease')) {
        sendProgress(90, "Packaging Release APK...");
      }
    });
    if (!gradleOk) {
      throw new Error(`Gradle compilation failed. Logs: ${gradleLogs.slice(-2000).trim()}`);
    }

    const apkPath = path.join(tempDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    if (!existsSync(apkPath)) {
      throw new Error("Compilation output missing: release APK file was not generated.");
    }

    const apkFilename = `${appName.replace(/[^a-zA-Z0-9_]/g, '_')}.apk`;
    const finalApkPath = path.join(apksDir, apkFilename);
    await fs.copyFile(apkPath, finalApkPath);

    const stats = await fs.stat(finalApkPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    fs.rm(tempDir, { recursive: true, force: true }).catch(err => console.error("Temp cleanup error:", err));

    sendProgress(100, "Completed", {
      success: true,
      downloadUrl: `/apks/${apkFilename}`,
      size: `${sizeMb}MB`
    });
  }
}

// POST /api/build-apk - Native local build runner
app.post('/api/build-apk', async (req, res) => {
  let { url, appName, packageId, iconUrl, htmlCode, zipData, isPremium } = req.body;
  if (url && typeof url === 'string') {
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
  }
  const isLocalMode = (htmlCode && htmlCode.trim().length > 0) || (zipData && zipData.trim().length > 0);
  
  if (!appName || !packageId) {
    return res.status(400).json({ success: false, error: 'Missing parameters: appName and packageId are required.' });
  }
  if (!isLocalMode && !url) {
    return res.status(400).json({ success: false, error: 'Missing parameters: url is required when not using HTML or ZIP mode.' });
  }

  // ZIP Content Validation: reject Flutter, Android Studio, Backend or non-HTML archives
  if (zipData && typeof zipData === 'string' && zipData.trim()) {
    try {
      const matches = zipData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const b64 = matches ? matches[2] : zipData;
      const zipBuffer = Buffer.from(b64, 'base64');
      const zip = new AdmZip(zipBuffer);
      const fileNames = zip.getEntries().map(e => e.entryName.toLowerCase());

      const isFlutter = fileNames.some(name => name.includes('pubspec.yaml'));
      const isNativeAndroid = fileNames.some(name => name.includes('build.gradle') || name.includes('androidmanifest.xml') || name.includes('settings.gradle'));
      const isBackend = fileNames.some(name => name.includes('manage.py') || name.includes('composer.json') || name.includes('pom.xml') || name.includes('gemfile') || name.includes('requirements.txt'));
      const hasHtml = fileNames.some(name => name.endsWith('.html'));

      if (isFlutter) {
        return res.status(400).json({ success: false, error: 'Aapne galat file daali hai! Flutter projects abhi support nahi karta. Sirf frontend HTML, CSS aur JavaScript web projects support karta hai.' });
      }
      if (isNativeAndroid) {
        return res.status(400).json({ success: false, error: 'Aapne galat file daali hai! Native Android Studio (Java/Kotlin) projects abhi support nahi karta. Sirf frontend HTML, CSS aur JavaScript support karta hai.' });
      }
      if (isBackend && !hasHtml) {
        return res.status(400).json({ success: false, error: 'Aapne galat file daali hai! Backend/Fullstack (Python/Node/PHP) projects support nahi karta. Sirf frontend HTML, CSS aur JavaScript support karta hai.' });
      }
      if (!hasHtml) {
        return res.status(400).json({ success: false, error: 'Aapne galat file daali hai! Is ZIP file mein koi HTML file (.html) nahi mili. Abhi sirf HTML, CSS aur JavaScript web projects (index.html ke saath) support karta hai.' });
      }
    } catch (zipErr) {
      return res.status(400).json({ success: false, error: 'Invalid ya corrupt ZIP file upload ki gayi hai.' });
    }
  }

  // PRD Validation: URL live check (skip for HTML/ZIP mode and localhost)
  const isLocalHost = url && (url.includes('localhost') || url.includes('127.0.0.1'));
  if (!isLocalMode && url && !isLocalHost) {
    try {
      const parsedUrl = new URL(url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(parsedUrl.href, { 
        method: 'HEAD',
        signal: controller.signal
      }).catch(() => fetch(parsedUrl.href, { 
        method: 'GET',
        signal: controller.signal
      }));
      
      clearTimeout(timeout);
      if (!response.ok) {
        console.warn(`[API] URL live check returned status ${response.status} for ${url}`);
      }
    } catch (err: any) {
      console.warn(`[API] URL live check failed or timed out for ${url}: ${err.message}`);
    }
  }

  // PRD Validation: packageId must follow format com.domain.app (three parts)
  const packageIdRegex = /^[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+$/i;
  if (!packageIdRegex.test(packageId)) {
    return res.status(400).json({ success: false, error: 'packageId must follow the format com.domain.app' });
  }

  // PRD Validation: icon must be a PNG image
  if (iconUrl) {
    try {
      if (iconUrl.startsWith('data:')) {
        if (!iconUrl.includes('image/png') && !iconUrl.includes('image/jpeg')) {
          return res.status(400).json({ success: false, error: 'icon must be a PNG or JPEG image' });
        }
      } else {
        const parsedIconUrl = new URL(iconUrl);
        if (!parsedIconUrl.pathname.toLowerCase().endsWith('.png')) {
          const iconRes = await fetch(parsedIconUrl.href, { method: 'HEAD' }).catch(() => fetch(parsedIconUrl.href, { method: 'GET' }));
          const contentType = iconRes.headers.get('content-type') || '';
          if (!contentType.includes('image/png')) {
            return res.status(400).json({ success: false, error: 'icon must be a PNG image' });
          }
        }
      }
    } catch (err) {
      return res.status(400).json({ success: false, error: 'iconUrl is not reachable or invalid' });
    }
  }

  try {
    // Authenticate and check credits
    const authHeader = req.headers.authorization;
    console.log('[API] /build-apk authHeader received:', authHeader ? 'Present (starts with ' + authHeader.substring(0, 15) + '...)' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    console.log('[API] /build-apk Token extracted:', token ? 'Token exists (length ' + token.length + ')' : 'Token missing');

    let decoded: any;
    try {
      const secret = process.env.JWT_SECRET || 'fallback_secret';
      decoded = jwt.verify(token, secret);
    } catch (e: any) {
      decoded = jwt.decode(token);
    }
    console.log('[API] /build-apk decoded token:', decoded);
    
    const userId = decoded ? (decoded.id || decoded._id || decoded.sub) : null;
    console.log('[API] /build-apk extracted userId:', userId);
    let user = userId ? await User.findById(userId).catch(() => null) : null;
    
    const finalUserId = user ? user._id : userId;
    console.log('[API] /build-apk Build will be assigned to user ID:', finalUserId);
    
    // CHECK 0 - Moderation Check (Banned or Suspended)
    if (user && user.role !== 'admin') {
      if (user.status === 'banned') {
        return res.status(403).json({
          success: false,
          error: `Build Blocked: Your account has been permanently banned due to violation of platform terms. Reason: ${user.violation_reason || 'Terms violation'}.`
        });
      }
      if (user.status === 'suspended' && user.suspended_until) {
        if (new Date() < new Date(user.suspended_until)) {
          const remainingHours = Math.ceil((new Date(user.suspended_until).getTime() - Date.now()) / (1000 * 60 * 60));
          return res.status(403).json({
            success: false,
            error: `Build Blocked: Your account is temporarily suspended (approx ${remainingHours}h remaining) until ${new Date(user.suspended_until).toLocaleString()}. Reason: ${user.violation_reason || 'Administrative timeout'}.`
          });
        } else {
          // Auto-restore
          user.status = 'active';
          user.suspended_until = null;
          user.violation_reason = '';
          await user.save();
        }
      }

      // Automated Risk & Abuse Flag Detection
      const riskFlags: string[] = [];
      const suspiciousTerms = ['phish', 'login-fake', 'hack', 'free-crypto', 'free-recharge', 'scam', 'betting', 'casino'];
      const targetUrl = (url || '').toLowerCase();
      if (suspiciousTerms.some(term => targetUrl.includes(term))) {
        riskFlags.push(`⚠️ Suspicious URL: ${(url || '').substring(0, 30)}...`);
      }
      const pkg = (packageId || '').toLowerCase();
      if (pkg.startsWith('com.google.') || pkg.startsWith('com.whatsapp.') || pkg.startsWith('com.sbi.') || pkg.startsWith('com.paytm.')) {
        riskFlags.push(`⚠️ Spoofing Package: ${packageId}`);
      }

      if (riskFlags.length > 0) {
        user.violation_flags = Array.from(new Set([...(user.violation_flags || []), ...riskFlags]));
        await user.save();
      }
    }

    // CHECK 1 - Credit Check
    if (user && user.role !== 'admin' && user.credits_remaining <= 0) {
      return res.status(403).json({ success: false, error: 'Your APK Build Credits have been exhausted. Please wait for your Free Plan renewal or upgrade to a Premium Plan.' });
    }

    // CHECK 2 - History Limit Check
    if (user && user.role !== 'admin' && finalUserId) {
      const buildCount = await Build.countDocuments({ user_id: finalUserId });
      if (buildCount >= user.history_limit) {
        return res.status(403).json({ success: false, error: 'Storage is Full. Delete old APK History to continue.' });
      }
    }
    
    console.log(`[API] Received build request for ${appName}. Launching local native build...`);
    const jobId = `build_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    let userAbandoned = false;
    req.on('close', () => {
       if (!res.writableEnded) {
           userAbandoned = true;
       }
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    let lastSentProgress = 0;
    const sendProgress = (progress: number, stage: string, extra = {}) => {
      if (progress === 0) {
        res.write(JSON.stringify({ progress, stage, ...extra }) + '\n');
        return;
      }
      if (progress >= lastSentProgress) {
        lastSentProgress = progress;
        res.write(JSON.stringify({ progress, stage, ...extra }) + '\n');
      } else {
        res.write(JSON.stringify({ progress: lastSentProgress, stage, ...extra }) + '\n');
      }
    };

    sendProgress(5, "Starting local environment...");

    const isPremiumDB = (user && user.role === 'admin') ? true : (user ? !user.watermark_enabled : false);
    
    const buildRunner = process.env.GITHUB_TOKEN
      ? buildApkViaGitHubActions(jobId, url || '', appName, packageId, sendProgress, htmlCode, zipData, isPremiumDB, iconUrl)
      : buildApkLocally(jobId, url || '', appName, packageId, iconUrl, sendProgress, htmlCode, zipData, isPremiumDB);

    buildRunner
      .then(async (resultUrl) => {
        // Build successful, add to history
        if (finalUserId) {
          const apkFilename = `${appName.replace(/[^a-zA-Z0-9_]/g, '_')}.apk`;
          const finalDownloadUrl = (typeof resultUrl === 'string' && resultUrl.startsWith('http'))
            ? resultUrl
            : `/apks/${apkFilename}`;

          await Build.create({
            id: jobId,
            user_id: finalUserId,
            user_email: user ? user.email : (decoded?.email || ''),
            user_name: user ? user.fullName : '',
            apk_name: appName,
            status: 'Completed',
            downloadUrl: finalDownloadUrl
          }).catch((err) => console.error('[API] Failed to save build history:', err));
          
          if (user) {
            user.credits_remaining = Math.max(0, user.credits_remaining - 1);
            await user.save();
          }
        }
        if (!res.writableEnded) res.end();
      })
      .catch(async (err) => {
        console.error(`[API] Local build failed:`, err);
        sendProgress(0, "Build Failed", { success: false, error: err.message });
        if (!res.writableEnded) res.end();
      });

  } catch (err: any) {
    console.error('[API] Error in /api/build-apk:', err);
    res.status(500).json({ success: false, error: `Build failed: ${err.message}` });
  }
});

// GET /api/builds - Get user build history
app.get('/api/builds', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    let decoded: any;
    try { decoded = jwt.verify(token, secret); } catch (e) { decoded = jwt.decode(token); }
    if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });
    
    console.log('[API] /builds decoded token:', decoded);
    const userId = decoded.id || decoded._id || decoded.sub;
    console.log('[API] /builds extracted userId:', userId);
    const builds = await Build.find({ user_id: userId, user_deleted: { $ne: true }, status: { $ne: 'Deleted' } }).sort({ created_at: -1 });
    return res.status(200).json({ success: true, builds });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/builds - Clear user build history (Soft delete into 7-Day Admin Safety Vault)
app.delete('/api/builds', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    let decoded: any;
    try { decoded = jwt.verify(token, secret); } catch (e) { decoded = jwt.decode(token); }
    if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });
    
    const userId = decoded.id || decoded._id || decoded.sub;
    const { ids } = req.body || {};
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const buildsToDelete = await Build.find({ _id: { $in: ids }, user_id: userId });
      const vaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      for (const build of buildsToDelete) {
        // Soft delete: User cannot see it anymore, but file is retained for 7 days in Admin Safety Vault
        build.user_deleted = true;
        build.user_deleted_at = new Date();
        build.vault_expires_at = vaultExpiry;
        await build.save();
      }
      return res.status(200).json({ success: true, message: 'Selected history cleared' });
    } else {
      return res.status(400).json({ success: false, error: 'No IDs provided to delete' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/builds/:id - Clear specific build from user history (Soft delete into 7-Day Admin Safety Vault)
app.delete('/api/builds/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    let decoded: any;
    try { decoded = jwt.verify(token, secret); } catch (e) { decoded = jwt.decode(token); }
    if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });
    
    const build = await Build.findOne({ _id: req.params.id, user_id: decoded.id });
    if (!build) return res.status(404).json({ success: false, error: 'Build not found' });
    
    // Soft delete: User cannot see it anymore, but file is retained for 7 days in Admin Safety Vault
    build.user_deleted = true;
    build.user_deleted_at = new Date();
    build.vault_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await build.save();
    
    return res.status(200).json({ success: true, message: 'Build deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Auto-purge builds in Safety Vault after 7-day retention has passed
const purgeExpiredSafetyVaultBuilds = async () => {
  try {
    const now = new Date();
    const expiredBuilds = await Build.find({
      user_deleted: true,
      vault_expires_at: { $lte: now }
    });
    
    if (expiredBuilds.length > 0) {
      console.log('[SafetyVault] Auto-purging ' + expiredBuilds.length + ' expired vault builds...');
      for (const build of expiredBuilds) {
        if (build.downloadUrl) {
          const fileName = build.downloadUrl.replace('/apks/', '');
          const filePath = path.join(process.cwd(), 'apks', fileName);
          try {
            await fs.promises.unlink(filePath);
          } catch (_) {}
        }
        build.status = 'Expired';
        build.downloadUrl = '';
        await build.save();
      }
    }
  } catch (err) {
    console.error('[SafetyVault] Hourly purge error:', err);
  }
};
setInterval(purgeExpiredSafetyVaultBuilds, 60 * 60 * 1000);

// Final Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Vite middleware for development
async function startServer() {
  console.log('--- Starting APKify Builder Server ---');
  console.log('Node Env:', process.env.NODE_ENV);
  
  try {
    const hasFrontend = existsSync(path.join(process.cwd(), 'index.html'));
    if (hasFrontend && process.env.NODE_ENV !== 'production') {
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } catch (e: any) {
        console.warn('[Vite Dev Middleware] Skipped:', e.message);
      }
    } else if (hasFrontend && existsSync(path.join(process.cwd(), 'dist', 'index.html'))) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      app.get('/', (req, res) => {
        if (req.accepts('html')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.send(`<!DOCTYPE html>
<html>
<head>
  <title>APKify Backend - Live</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: #131b2e; padding: 2.5rem; border-radius: 1.25rem; border: 1px solid #1e293b; text-align: center; max-width: 480px; box-shadow: 0 20px 30px -10px rgba(0,0,0,0.6); }
    .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.4rem 0.9rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; margin-bottom: 1.25rem; border: 1px solid rgba(16, 185, 129, 0.3); }
    .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }
    h1 { font-size: 1.6rem; margin: 0 0 0.75rem 0; font-weight: 700; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.75rem 0; }
    a { display: inline-block; background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.6rem; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Service Status: Online</div>
    <h1>APKify Builder API</h1>
    <p>High-performance native Android APK builder service running Capacitor & Android SDK.</p>
    <a href="https://apkify-builder.vercel.app" target="_blank">Open APKify Builder Web App &rarr;</a>
  </div>
</body>
</html>`);
        } else {
          res.json({
            service: 'APKify Builder Backend API',
            status: 'online',
            endpoints: {
              health: '/api/health',
              auth: '/api/auth',
              build: '/api/build-apk'
            }
          });
        }
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);

      // Smart automated background cleaner for expired / broken builds
      const runSmartCleanup = async () => {
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const res = await Build.deleteMany({
            $or: [
              { status: 'expired' },
              { status: 'Failed' },
              { status: 'Deleted' },
              { downloadUrl: '' },
              { downloadUrl: null },
              { downloadUrl: '#' },
              { created_at: { $lt: thirtyDaysAgo } }
            ]
          });
          if (res.deletedCount > 0) {
            console.log(`[Auto-Cleanup Engine] Purged ${res.deletedCount} junk/expired build records.`);
          }
        } catch (err: any) {
          console.error('[Auto-Cleanup Engine Error]:', err.message);
        }
      };
      // Run 10s after startup and every 12 hours
      setTimeout(runSmartCleanup, 10000);
      setInterval(runSmartCleanup, 12 * 60 * 60 * 1000);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    // Emergency listen so the container doesn't immediately exit or time out
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Emergency server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();
