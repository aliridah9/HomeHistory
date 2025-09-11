import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useState } from 'react';

export default function EmailEntry() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.lookup({
        email: email || undefined,
        phone: phone || undefined,
      });
      const exists = res.data?.data?.exists ?? false;
      const dest = exists ? '/auth/login' : '/auth/register';
      const query = email ? `?email=${encodeURIComponent(email)}` : '';
      navigate(dest + query);
    } catch {
      setError('Unable to check account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 border rounded-lg focus:ring-2  outline-none"
      />

      <input
        type="tel"
        placeholder="Phone number (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-4 py-3 border rounded-lg focus:ring-2  outline-none"
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        disabled={loading || (!email && !phone)}
        className={`w-full h-12 rounded-xl bg-blue-600 text-white transition
            disabled:bg-gray-300 disabled:pointer-events-none`}
      >
        {loading ? 'Checking...' : 'Continue'}
      </button>
    </form>
  );
}
