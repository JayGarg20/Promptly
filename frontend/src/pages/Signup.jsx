import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Loader2 } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!terms) {
      setError("You must accept the terms of service and privacy policy");
      return;
    }

    setLoading(true);

    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed");
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

      {/* Main Signup Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative z-10">
        <div className="w-full bg-surface-container/90 backdrop-blur-md rounded-xl p-8 border border-outline-variant shadow-sm relative overflow-hidden transition-all">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-on-surface mb-2 tracking-tight">Sign Up</h2>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Create an account to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2 relative group">
              <label className="block text-xs uppercase tracking-wider font-semibold text-secondary" htmlFor="name">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 text-on-surface-variant w-4 h-4" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant rounded-t-lg pl-10 pr-4 py-3 text-on-surface font-body text-base placeholder:text-on-surface-variant/40 focus:border-b-primary focus:bg-surface-container-high transition-all border-t-0 border-l-0 border-r-0 focus:ring-0"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2 relative group">
              <label className="block text-xs uppercase tracking-wider font-semibold text-secondary" htmlFor="email">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-on-surface-variant w-4 h-4" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant rounded-t-lg pl-10 pr-4 py-3 text-on-surface font-body text-base placeholder:text-on-surface-variant/40 focus:border-b-primary focus:bg-surface-container-high transition-all border-t-0 border-l-0 border-r-0 focus:ring-0"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2 relative group">
              <label className="block text-xs uppercase tracking-wider font-semibold text-secondary" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-on-surface-variant w-4 h-4" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-outline-variant rounded-t-lg pl-10 pr-4 py-3 text-on-surface font-body text-base placeholder:text-on-surface-variant/40 focus:border-b-primary focus:bg-surface-container-high transition-all border-t-0 border-l-0 border-r-0 focus:ring-0"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 bg-surface border-outline-variant text-primary focus:ring-primary/30 focus:ring-offset-background rounded"
                required
              />
              <label className="text-xs text-on-surface-variant font-body" htmlFor="terms">
                I accept the{" "}
                <a className="text-secondary hover:underline transition-all font-semibold" href="#">
                  Terms of Service
                </a>{" "}
                &amp;{" "}
                <a className="text-secondary hover:underline transition-all font-semibold" href="#">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-lg py-4 px-6 font-bold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Register</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-outline-variant/30 pt-6">
            <p className="text-sm font-body text-on-surface-variant">
              Already registered?{" "}
              <Link to="/login" className="text-secondary font-semibold uppercase text-xs tracking-wider ml-1 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
