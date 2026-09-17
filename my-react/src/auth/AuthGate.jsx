import { useEffect, useState } from 'react';
import { authService } from './authService.js';
import './auth.css';

// A single wrapper keeps authentication independent of the minigame components.
export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    authService.currentUser()
      .then((current) => { if (active) setUser(current); })
      .catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  // Re-check when returning to the tab so expired sessions show the login screen.
  useEffect(() => {
    if (!user) return;
    let active = true;
    const check = () => {
      authService.currentUser()
        .then((current) => { if (active) { setUser(current); setError(''); } })
        .catch((failure) => { if (active) setError(failure.message); });
    };
    window.addEventListener('focus', check);
    return () => { active = false; window.removeEventListener('focus', check); };
  }, [user]);

  async function logout() {
    setBusy(true);
    setError('');
    try { await authService.logout(); setUser(null); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="auth-shell"><p role="status">Checking your session…</p></main>;
  if (!user && error) return (
    <main className="auth-shell"><section className="auth-card">
      <h1>Unable to check your session</h1>
      <p role="alert">{error}</p>
      <button onClick={() => { setError(''); setLoading(true); setRetry(retry + 1); }}>Try again</button>
    </section></main>
  );
  if (!user) return <AuthForm onSuccess={setUser} />;
  return <>
    <header className="auth-toolbar">
      <span>Welcome, <strong>{user.name}</strong></span>
      <button disabled={busy} onClick={logout}>{busy ? 'Logging out…' : 'Log out'}</button>
      {error && <p role="alert">{error}</p>}
    </header>
    {children}
  </>;
}

function AuthForm({ onSuccess }) {
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const details = Object.fromEntries(new FormData(form));
    setError('');
    setBusy(true);
    try {
      const user = await (signup ? authService.signup(details) : authService.login(details));
      form.reset();
      onSuccess(user);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="auth-brand">Worksheets for children</p>
      <h1 id="auth-title">{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p>{signup ? 'Sign up to get started with your worksheets.' : 'Log in to continue to your worksheets.'}</p>
      <form key={signup ? 'signup' : 'login'} onSubmit={submit}>
        <fieldset disabled={busy}>
          {signup && <label htmlFor="auth-name">Name
            <input id="auth-name" name="name" autoComplete="name" maxLength={100} required />
          </label>}
          <label htmlFor="auth-email">Email
            <input id="auth-email" name="email" type="email" autoComplete="email" maxLength={254} required />
          </label>
          <label htmlFor="auth-password">Password
            <input id="auth-password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'}
              minLength={15} maxLength={128} aria-describedby="auth-password-help" required />
          </label>
          <small id="auth-password-help">Use 15–128 characters. A memorable phrase works well.</small>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit">{busy ? 'Please wait…' : signup ? 'Sign up' : 'Log in'}</button>
        </fieldset>
      </form>
      <button className="auth-switch" type="button" disabled={busy} onClick={() => { setSignup(!signup); setError(''); }}>
        {signup ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </section>
  </main>;
}
