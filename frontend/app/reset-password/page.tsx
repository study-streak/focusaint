"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";



function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const handleReset = async () => {
    setLoading(true);
    setError("");
    try {
      if (password !== confirm) throw new Error("Passwords do not match");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forgot/reset-password-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 px-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
        animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, delay: 2 }}
      />
      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-indigo-700/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Card Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-700/30 rounded-full p-3 mb-2">
              <Lock className="w-8 h-8 text-indigo-300" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
            <p className="text-gray-300 text-sm text-center max-w-xs">Enter your new password below. Make sure it is strong and unique.</p>
          </div>
          {success ? (
            <p className="text-green-400 text-center font-semibold">Password reset! Redirecting to login...</p>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-1" htmlFor="new-password">New Password</label>
                  <Input id="new-password" className="bg-indigo-900/30 border-indigo-700/50 text-white placeholder:text-gray-400 focus:bg-indigo-900/50 focus:border-indigo-500 transition-all" type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-1" htmlFor="confirm-password">Confirm Password</label>
                  <Input id="confirm-password" className="bg-indigo-900/30 border-indigo-700/50 text-white placeholder:text-gray-400 focus:bg-indigo-900/50 focus:border-indigo-500 transition-all" type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
                </div>
                {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 text-lg mt-2" onClick={handleReset} disabled={loading || !token || !password || !confirm}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
