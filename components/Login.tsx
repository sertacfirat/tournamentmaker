import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../src/services/firebase";
import { TRANSLATIONS } from "../constants";
import { Language } from "../types";
import { LogIn, UserPlus, AlertCircle } from "lucide-react";

interface LoginProps {
  lang: Language;
}

const Login: React.FC<LoginProps> = ({ lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  // Custom text for login since it might not be in constants yet
  const loginText = {
    en: {
      title: isLogin ? "Sign In" : "Create Account",
      email: "Email",
      password: "Password",
      submit: isLogin ? "Sign In" : "Sign Up",
      toggle: isLogin
        ? "Don't have an account? Sign Up"
        : "Already have an account? Sign In",
      error: "Authentication failed. Please check your credentials.",
      desc: "Sign in to access your tournaments from any device.",
    },
    tr: {
      title: isLogin ? "Giriş Yap" : "Hesap Oluştur",
      email: "E-posta",
      password: "Şifre",
      submit: isLogin ? "Giriş Yap" : "Kayıt Ol",
      toggle: isLogin
        ? "Hesabın yok mu? Kayıt Ol"
        : "Zaten hesabın var mı? Giriş Yap",
      error: "Kimlik doğrulama başarısız. Lütfen bilgilerinizi kontrol edin.",
      desc: "Turnuvalarınıza her yerden erişmek için giriş yapın.",
    },
  };

  const activeText = loginText[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(activeText.error + " (" + err.message + ")");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-brand-500/30">
            {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {activeText.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {activeText.desc}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {activeText.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {activeText.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-lg shadow-brand-500/30 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "..." : activeText.submit}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium"
          >
            {activeText.toggle}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
