import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, AlertTriangle, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
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
          Terms & Safety Policy
        </motion.h1>
        <p className="text-white/60">Last updated: {new Date().toLocaleDateString()} &bull; APKify Builder Compliance & Trust Standards</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-6 md:p-12 space-y-10 prose prose-invert max-w-none prose-blue"
      >
        {/* SECTION 1 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold m-0">1. Accounts, Identity & Email Rules</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            To preserve a secure and spam-free ecosystem, APKify Builder strictly verifies all user identities. Only users registering with authentic, verifiable email accounts from trusted providers (Gmail, Yahoo, Outlook, Hotmail) are permitted. Disposable, disposable aliases, temporary, or unverified email domains are automatically blocked by our mail firewall.
          </p>
          <p className="text-white/80 leading-relaxed mt-2">
            Each user must complete 6-digit OTP verification to activate their account and receive initial free build credits. Attempting to create duplicate or bot accounts from the same device or IP address to farm free credits is classified as abuse and triggers immediate suspension.
          </p>
        </section>

        {/* SECTION 2 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold m-0">2. Free Credit System & 15-Day Auto Refill</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            Upon successful registration and OTP confirmation, Free Tier users receive 3 APK build credits:
          </p>
          <ul className="text-white/80 space-y-2 mt-4 ml-6 list-disc">
            <li><strong>Automated 15-Day Refill:</strong> Free credits automatically refill back to 3 credits every 15 days from your last refill date. No manual ticket or admin intervention is required.</li>
            <li><strong>Non-Cumulative Quota:</strong> Unused credits do not roll over across refill cycles. The balance resets to a cap of 3.</li>
            <li><strong>Immediate Deduction:</strong> Credits are deducted when a build job is dispatched. If a build crashes due to system error, credits are automatically refunded to your balance.</li>
            <li><strong>Watermark Notice:</strong> All APKs generated on the Free Plan contain an unobtrusive APKify Builder launch badge to promote platform transparency.</li>
          </ul>
        </section>

        {/* SECTION 3 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl font-bold m-0">3. Premium Plans & Commercial Terms</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            Upgraded plans (Pro, Business, Enterprise) provide professional developer capabilities with 100% watermark removal and custom branding:
          </p>
          <ul className="text-white/80 space-y-2 mt-4 ml-6 list-disc">
            <li><strong>Permanent Watermark Removal:</strong> Your custom icons, splash screens, and package identities remain strictly your own.</li>
            <li><strong>Fixed Plan Quota:</strong> Premium plan credits are granted in full upon purchase and do not automatically refill. Additional packs may be purchased as needed.</li>
            <li><strong>Cloud Storage:</strong> Build history is retained in your private cloud dashboard for quick re-downloads according to tier limits.</li>
          </ul>
        </section>

        {/* SECTION 4 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold m-0">4. Prohibited Activities & Content Standards</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            APKify Builder employs automated security filters to prevent misuse. The following activities are strictly prohibited and will trigger immediate enforcement:
          </p>
          <ul className="text-white/80 space-y-2 mt-4 ml-6 list-disc">
            <li><strong>Phishing & Fraud:</strong> Creating APKs targeting banking, payment gateways, login portals, or fake social networks designed to steal credentials.</li>
            <li><strong>Brand Impersonation & Spoofing:</strong> Registering package identifiers that impersonate protected entities (e.g., <code>com.google.*</code>, <code>com.whatsapp.*</code>, <code>com.sbi.*</code>, <code>com.paytm.*</code>).</li>
            <li><strong>Malware & Malicious Payloads:</strong> Uploading ZIP packages containing trojans, ransomware, reverse shells, shell scripts (<code>.sh</code>), or spyware.</li>
            <li><strong>Denial of Service & Button Flooding:</strong> Using automated scripts, curl commands, or headless scrapers to bombard the build API.</li>
          </ul>
        </section>

        {/* SECTION 5 - MODERATION, 24H SUSPEND & PERMANENT BAN */}
        <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-rose-500" />
            <h2 className="text-2xl font-bold m-0 text-white">5. Account Moderation, 24-Hour Timeout & Ban Policy</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            We maintain a zero-tolerance policy against malicious actors while providing a fair, automated resolution process for unintentional errors. We operate a two-tier moderation framework:
          </p>
          
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h3 className="text-amber-400 font-bold text-base m-0 flex items-center gap-2">
                <span>🟡 Level 1: 24-Hour Cooling Suspension (Temporary Timeout)</span>
              </h3>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                Applied for non-malicious minor violations, such as rapid API spamming, repeated build submissions within seconds, or uploading corrupted packages that fail basic compilation.
              </p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc ml-5">
                <li>Account access and build initiation are frozen for exactly 24 hours.</li>
                <li><strong>Automatic Reactivation:</strong> Upon the expiration of the 24-hour window, the user account is automatically unfrozen and returned to active status without requiring any support ticket or manual approval.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <h3 className="text-rose-400 font-bold text-base m-0 flex items-center gap-2">
                <span>🔴 Level 2: Permanent Account Ban (Hard Ban)</span>
              </h3>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                Enforced for intentional, severe violations including fraudulent web wrappers, phishing targets, malware embedding, or attacking server infrastructure.
              </p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc ml-5">
                <li>Account is permanently barred from authentication and build dispatch.</li>
                <li>Audit logs and credentials remain securely preserved in our database to prevent abusive re-registration under the same identity.</li>
                <li><strong>Appeals & Administrative Review:</strong> The platform Super Admin retains sole discretion to review appeals and lift bans if an infraction was triggered erroneously.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 6 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold m-0">6. Storage Lifespan & Cloud Retention</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            Compiled APK binaries are stored securely in your dashboard for convenient download. Due to high cloud storage demands, users are encouraged to download and backup their APKs promptly. The platform reserves the right to archive builds older than 30 days.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
