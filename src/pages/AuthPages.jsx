import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Notice } from "../components/UI";

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <div className="auth-decoration"><span className="auth-orbit" /><span className="auth-decoration-label">A BETTER WAY<br />TO GET THERE.</span><span className="auth-decoration-star">✳</span></div>
      <section className="auth-card">
        <Link className="brand auth-brand" to="/"><span className="brand-mark">c</span> cabby<span className="brand-period">.</span></Link>
        <span className="eyebrow">WELCOME ABOARD</span><h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>
        {children}
        <p className="auth-switch">{footer}</p>
      </section>
    </main>
  );
}

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === "ROLE_ADMIN" ? "/admin" : "/dashboard"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const account = await signIn(form);
      navigate(location.state?.from?.pathname || (account.role === "ROLE_ADMIN" ? "/admin" : "/dashboard"), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={<>Good to see<br /><em>you again.</em></>} subtitle="Your next great ride is just around the corner." footer={<>New around here? <Link to="/register">Create an account</Link></>}>
      <form className="auth-form" onSubmit={submit}>
        <Notice>{error}</Notice>
        <Field label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Field label="Password" type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button type="submit" className="full-button" disabled={busy}>{busy ? "Logging you in..." : "Log in"} <span>↗</span></Button>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === "ROLE_ADMIN" ? "/admin" : "/dashboard"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={<>Good things<br /><em>start here.</em></>} subtitle="A few details, and you're ready for wherever." footer={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form className="auth-form" onSubmit={submit}>
        <Notice>{error}</Notice>
        <Field label="Your name" autoComplete="name" placeholder="Full name" maxLength={100} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        <Field label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Field label="Phone number" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <Field label="Create a password" type="password" autoComplete="new-password" minLength={8} maxLength={72} placeholder="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button type="submit" className="full-button" disabled={busy}>{busy ? "Creating your account..." : "Create account"} <span>↗</span></Button>
      </form>
    </AuthLayout>
  );
}
