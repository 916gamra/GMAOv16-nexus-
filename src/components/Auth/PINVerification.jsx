import {  useState  } from 'react';
import { Lock } from 'lucide-react';

export default function PINVerification({ onVerify, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onVerify(pin);
    if (!success) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Verification PIN Requise</h3>
          <p className="text-slate-500 text-xs">Veuillez entrer votre code PIN pour valider cette action sensible.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="••••••"
            className={`w-full text-center tracking-widest text-lg py-2.5 rounded-xl border ${error ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50'} focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
            autoFocus
          />
          {error && <p className="text-red-600 text-xs text-center font-medium">Code PIN incorrect.</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition shadow-xs"
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
