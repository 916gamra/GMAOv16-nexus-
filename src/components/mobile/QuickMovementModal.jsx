import { useState } from 'react';
import { X, Check } from 'lucide-react';

/**
 * نموذج حركة سريعة للهاتف - مبسط وسهل اللمس
 */
export default function QuickMovementModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    quantity: '1',
    type: 'OUT', // OUT أو IN
    notes: '',
  });
  const [error, setError] = useState('');

  if (!item) return null;

  const currentAvailable = Number(item.stockActuel ?? item.quantity ?? 0);

  const handleSubmit = async () => {
    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('يرجى إدخال كمية صحيحة أكبر من صفر');
      return;
    }

    if (formData.type === 'OUT' && qty > currentAvailable) {
      setError(`الرصيد المتاح غير كافٍ. المتاح حالياً: ${currentAvailable}`);
      return;
    }

    try {
      if (typeof onSave === 'function') {
        await onSave({
          stockCode: item.ref || item.code,
          ref: item.ref || item.code,
          designation: item.designation || '',
          quantity: qty,
          quantite: qty,
          type: formData.type === 'OUT' ? 'SORTIE' : 'ENTREE',
          notes: formData.notes,
          date: new Date().toISOString(),
        });
      }

      setError('');
      onClose();
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء حفظ الحركة');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50 p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-zinc-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">{item.ref || item.code}</h2>
            <p className="text-xs text-zinc-500 line-clamp-1">{item.designation}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 active:scale-95 transition"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Type Selection */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, type: 'OUT' });
              setError('');
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5 active:scale-98 ${
              formData.type === 'OUT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <span>📤</span>
            <span>صرف (Sortie)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, type: 'IN' });
              setError('');
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5 active:scale-98 ${
              formData.type === 'IN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <span>📥</span>
            <span>دخول (Entrée)</span>
          </button>
        </div>

        {/* Quantity Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-zinc-700">الكمية (Quantité)</label>
            <span className="text-xs text-zinc-500 font-medium">
              المتاح: <strong className="text-zinc-900">{currentAvailable}</strong> {item.unit || item.unite || 'U'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const cur = Math.max(1, (Number(formData.quantity) || 1) - 1);
                setFormData({ ...formData, quantity: String(cur) });
              }}
              className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-800 font-bold text-lg active:scale-95 transition"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="flex-1 h-12 px-4 border border-zinc-300 rounded-xl text-center text-lg font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                const cur = (Number(formData.quantity) || 0) + 1;
                setFormData({ ...formData, quantity: String(cur) });
              }}
              className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-800 font-bold text-lg active:scale-95 transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">ملاحظات / الوجهة (اختياري)</label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="مثال: صرف لماكينة الغزل 02"
            className="w-full h-11 px-3 border border-zinc-300 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl mb-4 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold text-sm active:scale-98 transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition"
          >
            <Check size={16} />
            تأكيد وحفظ
          </button>
        </div>
      </div>
    </div>
  );
}
