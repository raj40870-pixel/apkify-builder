import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Link as LinkIcon, AlertTriangle, FileArchive, Smartphone, FileCode, Image as ImageIcon, Box, Code2, LogOut, LayoutDashboard, Loader2, CheckCircle2, XCircle, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import { logout, getStoredUser, getAuthToken, fetchMe } from '../lib/auth';
import { API_BASE_URL } from '../lib/api';

export default function BuilderPage() {
  const navigate = useNavigate();
  const [appName, setAppName] = useState('');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [packageId, setPackageId] = useState('com.stellar.app');
  const [url, setUrl] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [activeTab, setActiveTab] = useState<'zip' | 'url' | 'html'>('url');
  const [selectedZipName, setSelectedZipName] = useState('');
  const [selectedZipSize, setSelectedZipSize] = useState('');
  const [urlStatus, setUrlStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [urlError, setUrlError] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    fetchMe().then(() => forceUpdate({}));
  }, []);

  const buildSteps = [
    'Establishing secure connection to build cluster...',
    'Authenticating project credentials...',
    'Parsing project structure and dependencies...',
    'Optimizing assets and image resources...',
    'Coming soon - Full backend integration in progress!'
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert('File size exceeds 100MB. Maximum allowed limit is 100MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedZipName('');
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);
      const fileNames = Object.keys(zip.files).map(name => name.toLowerCase());

      const isFlutter = fileNames.some(name => name.includes('pubspec.yaml'));
      const isNativeAndroid = fileNames.some(name => name.includes('build.gradle') || name.includes('androidmanifest.xml') || name.includes('settings.gradle'));
      const isReactNative = fileNames.some(name => name.includes('react-native') || (name.includes('package.json') && !fileNames.some(f => f.endsWith('.html'))));
      const isBackend = fileNames.some(name => name.includes('manage.py') || name.includes('composer.json') || name.includes('pom.xml') || name.includes('gemfile') || name.includes('requirements.txt'));
      const hasHtml = fileNames.some(name => name.endsWith('.html'));

      if (isFlutter) {
        alert('Unsupported File: Flutter projects are not supported. Only frontend HTML, CSS & JavaScript web packages are supported.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedZipName('');
        return;
      }

      if (isNativeAndroid) {
        alert('Unsupported File: Native Android Studio (Java/Kotlin) projects are not supported. Only frontend HTML, CSS & JavaScript web packages are supported.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedZipName('');
        return;
      }

      if (isReactNative && !hasHtml) {
        alert('Unsupported File: React Native projects are not supported. Only frontend HTML, CSS & JavaScript web packages are supported.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedZipName('');
        return;
      }

      if (isBackend && !hasHtml) {
        alert('Unsupported File: Fullstack/backend projects (Python/Node/PHP) are not supported. Only frontend HTML, CSS & JavaScript web assets are supported.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedZipName('');
        return;
      }

      if (!hasHtml) {
        alert('Invalid ZIP: No HTML file (.html) found in this archive. Please upload a ZIP containing HTML, CSS & JavaScript web files.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedZipName('');
        return;
      }

      // Valid package!
      setSelectedZipName(file.name);
      setSelectedZipSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    } catch (err: any) {
      console.error('Error validating ZIP file:', err);
      alert('Corrupted or invalid ZIP file. Please upload a valid .zip archive.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedZipName('');
    }
  };

  const [buildProgress, setBuildProgress] = useState(0);
  const [buildStage, setBuildStage] = useState('');

  const checkUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) { setUrlError('Please enter a URL first.'); return; }
    // Basic URL format check
    let parsed: URL;
    try {
      parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      setUrlStatus('invalid');
      setUrlError('Invalid URL format. Use https://yoursite.com');
      return;
    }
    setUrlStatus('checking');
    setUrlError('');
    try {
      // Use a CORS-friendly proxy check via fetch with no-cors
      await fetch(parsed.href, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(6000) });
      setUrlStatus('valid');
      setUrlError('');
    } catch {
      // no-cors will always resolve (opaque response), timeout means truly unreachable
      setUrlStatus('invalid');
      setUrlError('Could not reach this URL. Make sure it is publicly accessible.');
    }
  };

  const startBuildSequence = async () => {
    // Basic validation
    if (activeTab === 'zip' && (!fileInputRef.current?.files || fileInputRef.current.files.length === 0 || !selectedZipName)) {
      alert('Please upload a valid ZIP file containing HTML, CSS & JavaScript first');
      return;
    }
    
    if (activeTab === 'url' && !url.trim()) {
      alert('Please enter a Website URL');
      return;
    }
    if (activeTab === 'url' && urlStatus === 'invalid') {
      alert('The URL you entered is invalid. Please check it and try again.');
      return;
    }
    if (activeTab === 'html' && !htmlCode.trim()) {
      alert('Please paste your HTML code first');
      return;
    }
    if (!appName.trim()) {
      alert('Please enter an App Name');
      return;
    }
    if (!packageId.trim()) {
      alert('Please enter a Package ID');
      return;
    }

    const currentUser = getStoredUser();
    if (!currentUser) {
      alert('You need to be logged in to build.');
      return;
    }



    setIsBuilding(true);
    setBuildProgress(0);
    setBuildStage('Initializing...');
    
    let buildId: string | undefined = undefined;
    const localBuildId = `local_build_${Date.now()}`;
    
    try {
      // Convert icon to base64 if any
      let uploadedIconUrl = '';
      if (iconInputRef.current?.files && iconInputRef.current.files.length > 0) {
        setBuildStage('Reading icon file...');
        try {
          const file = iconInputRef.current.files[0];
          uploadedIconUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });
        } catch (storageErr) {
          console.warn("Failed to read icon file as Base64, bypassing...", storageErr);
        }
      }



      // Trigger the build using chunked POST request
      let normalizedUrl = url.trim();
      if (normalizedUrl && !normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      const targetUrl = activeTab === 'url' ? normalizedUrl : 'https://stellar-internal-fallback.com';
      setBuildStage('Connecting to build server...');

      // Save build entry to history
      try {
        const localHistory = JSON.parse(localStorage.getItem('buildHistory') || '[]');
        const newBuild = {
          id: localBuildId,
          app_name: appName,
          app_version: appVersion || '1.0.0',
          created_at: new Date().toISOString(),
          status: 'Building',
          progress: 0,
        };
        localStorage.setItem('buildHistory', JSON.stringify([newBuild, ...localHistory]));
      } catch (err) {
        console.error('Failed to save build to history:', err);
      }
      let uploadedZipData = '';
      if (activeTab === 'zip' && fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
        setBuildStage('Reading ZIP file...');
        try {
          const zipFile = fileInputRef.current.files[0];
          uploadedZipData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(zipFile);
          });
        } catch (err) {
          console.error("Failed to read ZIP file", err);
          throw new Error("Could not read ZIP file");
        }
      }

      const isPremium = currentUser?.plan && currentUser.plan !== 'Free';
      const response = await fetch(`${API_BASE_URL}/api/build-apk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          url: activeTab === 'url' ? normalizedUrl : '',
          htmlCode: activeTab === 'html' ? htmlCode : '',
          zipData: uploadedZipData,
          appName,
          packageId,
          iconUrl: uploadedIconUrl
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Your session has expired or is invalid. You will be redirected to login.');
          await logout();
          navigate('/login');
          return;
        }
        const errorText = await response.text();
        let errorMsg = 'Build Failed';
        try {
          const errObj = JSON.parse(errorText);
          errorMsg = errObj.error || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('No response body received from server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.progress !== undefined) {
                setBuildProgress(data.progress);
              }
              if (data.stage !== undefined) {
                setBuildStage(data.stage);
              }
              if (data.progress === 100 && data.downloadUrl) {
                // Mark Completed in history
                try {
                  const h = JSON.parse(localStorage.getItem('buildHistory') || '[]');
                  const idx = h.findIndex((x: any) => x.id === localBuildId);
                  if (idx !== -1) { h[idx].status = 'Completed'; h[idx].progress = 100; h[idx].downloadUrl = data.downloadUrl; localStorage.setItem('buildHistory', JSON.stringify(h)); }
                } catch (_) {}
                // Trigger auto download
                fetchMe().catch(() => {});
                const fullDownloadUrl = data.downloadUrl.startsWith('http') ? data.downloadUrl : `${API_BASE_URL}${data.downloadUrl}`;
                window.location.href = fullDownloadUrl;
                setTimeout(() => { setIsBuilding(false); }, 2000);
                return;
              }
              if (data.progress === 0 || data.success === false) {
                throw new Error(data.error || 'Build failed on server.');
              }
            } catch (err: any) {
              console.error('Failed to parse progress chunk:', err);
              throw new Error(err.message || 'Error parsing build update.');
            }
          }
        }
      }

    } catch (e: any) {
      console.error('Error starting build:', e);
      // Mark Failed in history
      try {
        const h = JSON.parse(localStorage.getItem('buildHistory') || '[]');
        const idx = h.findIndex((x: any) => x.id === localBuildId);
        if (idx !== -1) { h[idx].status = 'Failed'; h[idx].progress = 0; localStorage.setItem('buildHistory', JSON.stringify(h)); }
      } catch (_) {}
      
      alert(e.message || 'Build Failed');
      setBuildStage('Build Failed');
      setIsBuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-[60] border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="container px-6 h-16 flex items-center justify-between mx-auto">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight italic">Stellar</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              to="/accounts/dashboard" 
              className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white flex items-center gap-2 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-400/80 hover:text-red-400 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Subtle Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="container px-4 pt-32 pb-20 max-w-3xl mx-auto relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
            Build Your Android App
          </h1>
          <p className="text-white/40 text-lg">Configure your project and generate a professional APK.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="flex flex-col h-full">
            {/* 1. Upload Source Code Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass border-white/5 rounded-[40px] overflow-hidden shadow-2xl h-full"
            >
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <FileCode className="w-6 h-6 text-blue-500" />
                  Upload Source Code
                </h2>
              </div>
              <div className="p-8 text-white/90">
                <div className="flex flex-col sm:flex-row p-1.5 bg-black/40 rounded-2xl mb-8 space-y-2 sm:space-y-0 sm:space-x-1 border border-white/5">
                  <button
                    onClick={() => setActiveTab('zip')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-medium text-sm ${
                      activeTab === 'zip' ? 'bg-white/10 text-white shadow-xl' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    ZIP File
                  </button>
                  <button
                    onClick={() => setActiveTab('url')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-medium text-sm ${
                      activeTab === 'url' ? 'bg-white/10 text-white shadow-xl' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    URL
                  </button>
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-medium text-sm ${
                      activeTab === 'html' ? 'bg-white/10 text-white shadow-xl' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    HTML Code
                  </button>
                </div>

                {activeTab === 'zip' ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-blue-500/40 hover:bg-blue-500/[0.02] transition-all cursor-pointer overflow-hidden min-h-[300px] flex flex-col justify-center"
                  >
                    <div className="relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                        {selectedZipName ? (
                          <Box className="w-10 h-10 text-green-400" />
                        ) : (
                          <Upload className="w-10 h-10 text-blue-500" />
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-1">
                        {selectedZipName ? selectedZipName : 'Click to upload ZIP'}
                      </h3>
                      <p className="text-white/30 text-sm">
                        {selectedZipName 
                          ? `${selectedZipSize} • Verified HTML/CSS/JS Package (Click to change)` 
                          : 'Max 100MB • HTML, CSS & JavaScript package'}
                      </p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleZipChange} className="hidden" accept=".zip" />
                  </div>
                ) : activeTab === 'url' ? (
                  <div className="space-y-4 min-h-[300px] flex flex-col justify-center">
                    <div className="flex items-center justify-between ml-1">
                      <Label className="text-white/60">Website URL</Label>
                      {urlStatus === 'valid' && (
                        <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> URL Reachable
                        </span>
                      )}
                      {urlStatus === 'invalid' && (
                        <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Invalid URL
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                      <Input 
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); setUrlStatus('idle'); setUrlError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && checkUrl()}
                        placeholder="https://yourwebsite.com" 
                        className={`h-16 pl-14 pr-4 bg-white/5 border-white/10 rounded-2xl focus:ring-blue-500/50 transition-all text-lg ${
                          urlStatus === 'valid' ? 'border-green-500/50' :
                          urlStatus === 'invalid' ? 'border-red-500/50' : ''
                        }`}
                      />
                    </div>
                    {urlError && (
                      <p className="text-xs text-red-400 ml-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {urlError}
                      </p>
                    )}
                    <button
                      onClick={checkUrl}
                      disabled={urlStatus === 'checking'}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 transition-all disabled:opacity-50"
                    >
                      {urlStatus === 'checking' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Checking URL...</>
                      ) : (
                        <><Globe className="w-4 h-4" /> Check URL
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-white/20">Enter your website URL and click <strong>Check URL</strong> to verify before building.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label className="text-white/60 ml-1">HTML Content</Label>
                    <textarea
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      placeholder="Paste your HTML code here..."
                      className="w-full h-[300px] p-6 bg-black/40 border border-white/10 rounded-3xl focus:ring-2 focus:ring-blue-500/50 outline-none font-mono text-sm leading-relaxed resize-y transition-all text-blue-100/90"
                    />
                    <p className="text-[10px] text-white/20 ml-2">Paste complete HTML code. Include &lt;!DOCTYPE html&gt; tag</p>
                  </div>
                )}
                <p className="mt-6 text-center text-xs text-white/20">Upload ZIP, paste URL, OR paste HTML code. Only one required.</p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col space-y-8">
            {/* 2. App Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass border-white/5 rounded-[40px] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Smartphone className="w-6 h-6 text-purple-500" />
                  App Details
                </h2>
              </div>
              <div className="p-8 grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <Label className="text-white/60 ml-1 font-medium">App Name</Label>
                  <Input 
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. My Stellar App" 
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/50 transition-all text-lg px-6"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-white/60 ml-1 font-medium">Package ID</Label>
                  <Input 
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    placeholder="e.g. com.mycompany.app" 
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/50 transition-all text-lg px-6"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-white/60 ml-1 font-medium">App Version</Label>
                  <Input 
                    value={appVersion}
                    onChange={(e) => setAppVersion(e.target.value)}
                    placeholder="1.0.0" 
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/50 transition-all text-lg px-6"
                  />
                </div>
              </div>
            </motion.div>

            {/* 3. App Icon Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass border-white/5 rounded-[40px] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-pink-500" />
                  App Icon
                </h2>
              </div>
              <div className="p-8">
                <div 
                  onClick={() => iconInputRef.current?.click()}
                  className="group w-full h-32 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center hover:border-pink-500/40 hover:bg-pink-500/[0.02] cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-pink-500" />
                  </div>
                  <p className="font-bold text-white/80 text-sm">Upload 512x512 PNG or JPG</p>
                  <input type="file" ref={iconInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Build Button Section (Full Width) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-12"
        >
          <Button 
            onClick={startBuildSequence}
            disabled={isBuilding}
            className="w-full h-20 rounded-[30px] font-display font-extrabold text-xl md:text-2xl tracking-tight transition-all duration-500 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              boxShadow: '0 20px 40px -10px rgba(37, 99, 235, 0.4)'
            }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <Box className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              {isBuilding ? 'Building...' : 'Build APK Now'}
            </div>
          </Button>

          {isBuilding && (
            <div className="mt-[50px] font-mono text-center text-blue-500 text-lg md:text-xl font-bold tracking-wider">
              {(() => {
                const totalBlocks = 16;
                const solidCount = Math.min(totalBlocks, Math.max(0, Math.round(buildProgress / 6.25)));
                const dashCount = totalBlocks - solidCount;
                const progressLine = `[${'█'.repeat(solidCount)}${'-'.repeat(dashCount)}] ${buildProgress}% ${buildStage}`;
                return progressLine;
              })()}
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
