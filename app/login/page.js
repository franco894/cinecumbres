'use client';
import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
    } else {
      let callbackUrl = searchParams.get('callbackUrl') || '/';
      // Only use the pathname to avoid redirecting to 0.0.0.0
      try {
        const url = new URL(callbackUrl, window.location.origin);
        callbackUrl = url.pathname;
      } catch {}
      window.location.href = callbackUrl;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="login-error">{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="email">Email</label>
        <input id="email" className="form-input" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="password">Contraseña</label>
        <input id="password" className="form-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🎬</div>
          <h1>CineCumbres</h1>
          <p>Cumbres de Santa María</p>
        </div>
        <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
