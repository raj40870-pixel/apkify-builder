import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Shield, Sparkles, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="container px-4 py-12 md:py-24 max-w-4xl mx-auto">
      <div className="mb-12">
        <Link to="/" className="text-white/40 hover:text-white transition-colors text-sm mb-6 inline-block">
          &larr; Back to Home
        </Link>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-bold mb-4"
        >
          About APKify Builder
        </motion.h1>
        <p className="text-white/60">An all-in-one web-to-APK converter application.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-6 md:p-12 space-y-8 prose prose-invert max-w-none prose-blue"
      >
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold m-0">What is APKify Builder?</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            APKify Builder is a lightweight, efficient platform designed to transform web applications, static sites, or customized HTML pages into fully functional, signed Android APK files in seconds. By removing the need for local Android SDK installations or complex configurations, we bring mobile app packaging straight to your browser.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold m-0">Three Powerful Build Modes</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            Whether you have a live website, raw source code, or customized HTML documents, APKify Builder supports your workflow:
          </p>
          <ul className="text-white/80 space-y-2 mt-4 ml-6 list-disc">
            <li><strong>Website URL Mode:</strong> Paste any responsive URL to instantly package it into a high-performance Capacitor WebView wrapper.</li>
            <li><strong>ZIP Upload Mode:</strong> Upload a zip archive containing your web project (index.html, JS, CSS) to compile it locally into a native Android app.</li>
            <li><strong>HTML Code Mode:</strong> Paste raw HTML and CSS stylesheets directly into the editor for instant mobile packaging.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-6 h-6 text-pink-500" />
            <h2 className="text-2xl font-bold m-0">Tech Stack & Architecture</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            APKify Builder is designed with modern technologies to ensure reliability and speed:
          </p>
          <ul className="text-white/80 space-y-2 mt-4 ml-6 list-disc">
            <li><strong>Frontend:</strong> React, Tailwind CSS, Vite, and Lucide React.</li>
            <li><strong>Backend Server:</strong> Node.js, Express, and TSX.</li>
            <li><strong>Database:</strong> MongoDB Atlas (used for secure account authentication, credit limits, and build history records).</li>
            <li><strong>APK Compiler:</strong> Native integration with Capacitor Android, Gradle Wrapper, and Windows-hosted Android SDK toolchains.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold m-0">Security First</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            We value your code's security. All uploaded ZIP archives, HTML codes, and assets are handled in secure, isolated build directories (`worker-temp`) and automatically cleaned up from the storage system immediately following compilation.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
