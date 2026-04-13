import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth.api';
import { useAuthStore } from '../auth.store';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { setAuth, user } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword({ newPassword });
      setAuth(result);
      navigate(user?.role === 'ADMIN' ? '/dashboard' : '/leave-requests');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Password could not be changed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Change Your Password</h1>
        <p className="mt-1 text-sm text-slate-500">You must set a new password before continuing.</p>

        <div className="mt-5 space-y-3">
          <input
            type="password"
            className="input"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            className="input"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button disabled={loading} className="btn-primary mt-5 w-full">
          {loading ? 'Saving...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
