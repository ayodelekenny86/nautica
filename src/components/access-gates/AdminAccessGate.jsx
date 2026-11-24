import { useState } from 'react';
import GoogleSignInButton from '../GoogleSignInButton';
import MetaSignInButton from '../MetaSignInButton';

export function AdminAccessGate({ onSignIn, error, onGoogle, onMeta, showNotice }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await onSignIn(identifier, password);
    if (result?.ok) setPassword('');
  }

  return (
    <section className="access-gate panel admin-gate">
      <span className="access-lock">?</span>
      <p className="eyebrow">Restricted admin area</p>
      <h1>Operations data needs a verified admin.</h1>
      <p>Sign in with the account registered for ops. The identifier is matched against the account registry and the password is checked against a salted PBKDF2 hash.</p>
      <form onSubmit={handleSubmit}>
        <input aria-label="Admin account" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Admin email or phone" autoComplete="username" />
        <input aria-label="Admin password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete="current-password" />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit">Open admin console</button>
      </form>
      <small>Five failed attempts lock the account for five minutes. The operations account is created once from your deployment environment and its password is never displayed here.</small>
      <GoogleSignInButton role="ops" onVerified={onGoogle} showNotice={showNotice} />
      <MetaSignInButton role="ops" onVerified={onMeta} showNotice={showNotice} />
    </section>
  );
}
