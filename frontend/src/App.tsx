import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import BotControl from "@/pages/BotControl";
import TradeHistory from "@/pages/TradeHistory";
import PositionMonitor from "@/pages/PositionMonitor";
import HistoricalTesting from "@/pages/HistoricalTesting";

const ADMIN_EMAIL = "admin";
const ADMIN_PASSWORD = "kunal";

function RabbitIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M19 17c-3 0-5 2-5 6 0 3 1 5 2 7l-5 1c-4 1-5 5-3 8l3 5c2 3 5 5 9 5h6l2-5-4-10 8-4 14 2 5 8 4 5h9c4 0 7-3 7-7 0-2-1-4-3-5l-7-5-2-8c-1-4-4-7-8-8l-11-3-7 4-2-5c-1-2-3-4-6-4h-5z" fill="#2d1b52"/>
      <circle cx="27" cy="26" r="4" fill="#f6efe7"/>
      <circle cx="41" cy="26" r="4" fill="#f6efe7"/>
      <circle cx="28" cy="26" r="1.6" fill="#1f2937"/>
      <circle cx="40" cy="26" r="1.6" fill="#1f2937"/>
      <path d="M31 35c2 2 5 2 8 0" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M37 13l8-8m-18 0l-8 8" stroke="#2d1b52" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function RabbitArtwork() {
  return (
    <svg viewBox="0 0 700 720" role="img" aria-label="Vanta mascot illustration" style={{ width: "100%", height: "100%" }}>
      <path d="M120 550c70-140 120-194 197-216 76-22 148-16 193 8 116 60 164 169 200 265H120z" fill="#f2c0b5" opacity="0.22"/>
      <path d="M470 75c53 8 102 37 134 86 46 70 44 158 8 234-28 59-80 100-149 109-63 8-123-21-169-69-60-61-90-158-68-245 22-90 103-127 244-115z" fill="#2b1a53"/>
      <path d="M350 92c62-6 102 19 111 64 9 45-7 71-45 98-38 27-88 31-142 18-53-14-77-42-75-80 2-38 33-89 151-100z" fill="#2b1a53"/>
      <path d="M303 64c18-36 70-53 120-43 63 13 110 52 123 107 14 58-8 113-60 147-39 26-82 36-128 29-64-10-98-60-100-128-2-42 9-80 45-112z" fill="#2b1a53"/>
      <path d="M429 168c19-13 35-14 53 1 18 15 18 35 10 55-10 25-40 39-66 31-27-8-38-32-31-57 7-23 24-30 34-30z" fill="#f8efe9"/>
      <path d="M274 168c18-16 35-15 53-2 18 12 25 31 19 52-7 28-31 46-60 47-29 0-54-20-57-51-2-20 15-40 45-46z" fill="#f8efe9"/>
      <circle cx="353" cy="228" r="16" fill="#f8efe9"/>
      <circle cx="448" cy="228" r="16" fill="#f8efe9"/>
      <circle cx="354" cy="228" r="5" fill="#24163d"/>
      <circle cx="449" cy="228" r="5" fill="#24163d"/>
      <path d="M392 261c12 9 26 9 39 0" stroke="#24163d" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M390 249c-15 21-39 29-60 28" stroke="#24163d" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M443 250c19 15 41 23 66 19" stroke="#24163d" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <ellipse cx="395" cy="322" rx="101" ry="92" fill="#2b1a53"/>
      <ellipse cx="400" cy="405" rx="113" ry="140" fill="#2b1a53"/>
      <path d="M309 383c-10 22-16 47-15 74 1 44 32 81 76 93 43 12 89-2 121-40 32-38 42-90 26-136-17-48-62-82-109-79-59 3-92 35-99 88z" fill="#2b1a53"/>
      <path d="M343 512c-54 39-101 97-94 164 9 87 119 144 216 135 72-7 149-61 174-129 26-70-10-143-84-182-59-31-147-17-212 12z" fill="#f3efe9"/>
      <path d="M371 549c18 16 37 27 61 30 28 4 52-6 72-25 21-19 28-44 31-75 2 33 5 69-16 99-25 35-61 52-102 52-49 0-91-31-101-77-8-35 6-69 26-97 16 25 20 53 29 93z" fill="#f3efe9"/>
      <circle cx="457" cy="571" r="42" fill="#f3efe9"/>
      <path d="M486 571c15 6 34 17 46 34" stroke="#2b1a53" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M357 595c-34 1-62 21-76 52" stroke="#2b1a53" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d="M433 594c19 88 91 155 170 175" stroke="#2b1a53" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M423 621c19 64 48 122 111 163" stroke="#2b1a53" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M232 229c-50 0-96 28-127 74-39 57-44 132-12 192 30 58 90 98 157 102 85 6 165-50 201-134 14-33 20-68 18-103-3-62-29-118-75-154-53-42-116-52-162-15z" fill="#2b1a53" opacity="0.92"/>
      <ellipse cx="310" cy="427" rx="110" ry="117" fill="#f3efe9"/>
      <path d="M278 418c-18 5-31 23-31 42 1 32 28 58 60 58 36 0 63-30 62-69-1-15-9-31-22-41-8-6-23-10-35-9-12 1-24 7-34 19z" fill="#f3efe9"/>
      <path d="M302 383c0-25 20-45 45-45s46 20 46 45v18c0 5-4 10-9 10h-74c-6 0-8-5-8-10v-18z" fill="#2b1a53"/>
      <path d="M293 430c25 8 48 8 76 0" stroke="#24163d" strokeWidth="6" strokeLinecap="round" fill="none"/>
      <circle cx="305" cy="462" r="4" fill="#24163d"/>
      <circle cx="369" cy="462" r="4" fill="#24163d"/>
      <path d="M286 480c17 16 38 25 57 24 18 0 38-7 55-24" stroke="#24163d" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <circle cx="409" cy="204" r="25" fill="#f3efe9"/>
      <circle cx="267" cy="204" r="25" fill="#f3efe9"/>
    </svg>
  );
}

function LoginPage() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (trimmedEmail === ADMIN_EMAIL && trimmedPassword === ADMIN_PASSWORD) {
      localStorage.setItem("scalp_admin_logged_in", "true");
      window.location.assign("/");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      localStorage.setItem("scalp_admin_logged_in", "true");
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          background: #f5f4f2;
          color: #1f1b2e;
          font-family: "Inter", "Segoe UI", sans-serif;
        }

        .login-left {
          padding: 28px 0 0 52px;
          display: flex;
          flex-direction: column;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 20px;
          margin-bottom: 66px;
        }

        .login-content {
          margin-left: 110px;
          max-width: 530px;
        }

        .login-card {
          background: rgba(255,255,255,0.62);
          border: 1px solid rgba(32, 24, 48, 0.14);
          border-radius: 16px;
          box-shadow: 0 12px 36px rgba(41, 24, 62, 0.08);
          padding: 22px 20px 18px;
          max-width: 470px;
        }

        .login-form {
          display: grid;
          gap: 14px;
        }

        .login-input {
          width: 100%;
          border: 1px solid rgba(33, 27, 49, 0.18);
          background: rgba(255,255,255,0.75);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 18px;
          color: #1f1b2e;
          outline: none;
          box-sizing: border-box;
        }

        .login-right {
          position: relative;
          overflow: hidden;
          background: #f36a5d;
        }

        .login-right::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.02));
        }

        .login-right::after {
          content: "";
          position: absolute;
          inset: 0 0 0 0;
          clip-path: polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%);
          background: rgba(255,255,255,0.06);
        }

        .login-illustration-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .login-illustration {
          width: min(76vw, 720px);
          height: min(90vh, 750px);
        }

        @media (max-width: 768px) {
          .login-shell {
            grid-template-columns: 1fr;
          }

          .login-left {
            padding: 20px 16px 0;
          }

          .login-brand {
            margin-bottom: 28px;
            justify-content: center;
          }

          .login-content {
            margin-left: 0;
            max-width: none;
          }

          .login-card {
            max-width: none;
            padding: 18px 14px 16px;
          }

          .login-right {
            min-height: 260px;
            max-height: 300px;
          }

          .login-illustration-wrap {
            padding: 20px;
          }

          .login-illustration {
            width: min(82vw, 420px);
            height: min(36vh, 260px);
          }

          .login-form button {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="login-shell">
        <div className="login-left">
          <div className="login-brand">
            <RabbitIcon />
            <span>Minnu Services</span>
          </div>

          <div className="login-content">
            <h1 style={{ margin: "0 0 38px", fontSize: "clamp(2.6rem, 6vw, 5rem)", lineHeight: 0.95, letterSpacing: "-0.06em", fontWeight: 800 }}>
              Welcome back!
            </h1>

            <div className="login-card">
              <form onSubmit={handleSubmit} className="login-form">
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1c1830" }}>Sign in to Minnu Services</h2>

                <label style={{ display: "grid", gap: 10 }}>
                  <span style={{ fontSize: 14, color: "#2c2a3d", fontWeight: 600 }}>Enter your email address</span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin"
                    autoFocus
                    className="login-input"
                  />
                </label>

                <label style={{ display: "grid", gap: 10 }}>
                  <span style={{ fontSize: 14, color: "#2c2a3d", fontWeight: 600 }}>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                  />
                </label>

                {error ? <div style={{ color: "#b91c1c", fontSize: 14 }}>{error}</div> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    marginTop: 6,
                    border: "none",
                    borderRadius: 10,
                    padding: "14px 16px",
                    background: "linear-gradient(135deg, #7e4dd7, #5a3ab9)",
                    color: "white",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.8 : 1,
                    boxShadow: "0 10px 18px rgba(103, 81, 170, 0.25)",
                  }}
                >
                  {isSubmitting ? "Signing in..." : "Continue with email"}
                </button>
              </form>

              <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, color: "#433d58" }}>
                <span>Don’t have an account? <a href="#" style={{ color: "#2d1b52", textDecoration: "none", fontWeight: 700 }}>Contact us.</a></span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(36, 29, 50, 0.15)", borderRadius: 8, padding: "8px 12px", background: "rgba(255,255,255,0.52)" }}>
                  <span aria-hidden="true">🌐</span>
                  <span>US</span>
                  <span>▾</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-illustration-wrap">
            <div className="login-illustration">
              <RabbitArtwork />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProtectedRoutes() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("scalp_admin_logged_in") === "true";
    setReady(true);
    if (!isLoggedIn) {
      window.location.assign("/login");
    }
  }, []);

  if (!ready) return null;

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bot" element={<BotControl />} />
        <Route path="/history" element={<TradeHistory />} />
        <Route path="/position" element={<PositionMonitor />} />
        <Route path="/testing" element={<HistoricalTesting />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export default function App() {
  const loggedIn = localStorage.getItem("scalp_admin_logged_in") === "true";

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={loggedIn ? <ProtectedRoutes /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
