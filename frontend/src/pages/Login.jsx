import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body bg-background relative overflow-y-auto">
      <div className="grid-bg"></div>

      {/* Header */}
      <header className="bg-surface text-on-surface w-full top-0 sticky border-b border-outline-variant flex items-center justify-between px-6 py-4 z-30">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-sm tracking-[0.1em] uppercase text-on-surface">Promptly</h1>
        </div>
      </header>

      {/* Main Login Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative z-10">
        <div className="w-full bg-surface-container/90 backdrop-blur-md rounded-xl p-8 border border-outline-variant shadow-sm relative overflow-hidden transition-all">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-on-surface mb-2 tracking-tight">Sign In</h2>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Welcome Back</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2 relative group">
              <label className="text-xs text-secondary font-semibold uppercase tracking-wider block ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-on-surface-variant w-5 h-5 z-10" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant rounded-t-lg pl-12 pr-4 py-4 text-on-surface font-body text-base placeholder:text-on-surface-variant/40 focus:border-b-primary focus:bg-surface-container-high transition-all border-t-0 border-l-0 border-r-0 focus:ring-0"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2 relative group">
              <label className="text-xs text-secondary font-semibold uppercase tracking-wider block ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-on-surface-variant w-5 h-5 z-10" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant rounded-t-lg pl-12 pr-12 py-4 text-on-surface font-body text-base placeholder:text-on-surface-variant/40 focus:border-b-primary focus:bg-surface-container-high transition-all border-t-0 border-l-0 border-r-0 focus:ring-0"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-on-surface-variant hover:text-primary transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-lg py-4 px-6 font-bold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
          </form>

          <div className="my-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30"></div>
            </div>
            <span className="bg-surface-container px-4 text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold relative z-10">
              Or
            </span>
          </div>

          <div className="text-center">
            <p className="text-xs text-on-surface-variant">
              Don't have an account?{" "}
              <Link to="/signup" className="text-secondary font-bold hover:underline ml-1">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
