import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import { useAuthStore } from '../auth.store';

type LoginMode = 'admin' | 'employee';

export function LoginPage({ mode = 'employee' }: { mode?: LoginMode }) {
  const navigate = useNavigate();
  const { setAuth, accessToken, user } = useAuthStore();

  const defaultEmail = mode === 'admin' ? 'admin@smallbiz.local' : 'mert@smallbiz.local';
  const defaultPassword = mode === 'admin' ? 'App12345' : 'App12345';

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPassword);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken || !user) return;

    if (user.mustChangePassword) {
      navigate('/change-password', { replace: true });
      return;
    }

    navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/home', { replace: true });
  }, [accessToken, user, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      setAuth(result);
      if (result.user.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate(result.user.role === 'ADMIN' ? '/admin/dashboard' : '/home');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-brand-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">
          {mode === 'admin' ? 'Admin Panel Girişi' : 'Giriş'}
        </h1>
        <p className="mb-6 text-sm text-slate-500">OneDesk erişim ekranı</p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-posta</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Şifre</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
        </button>

        <p className="mt-4 text-xs text-slate-500">
          Admin: admin@smallbiz.local / App12345
          <br />
          Personel: mert@smallbiz.local / App12345
        </p>
      </form>
    </div>
  );
}
