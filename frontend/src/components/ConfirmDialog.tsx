import type { ReactNode } from 'react';
import { ModalPortal } from './ModalPortal';

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Sil',
  cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
  children
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <ModalPortal>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        {children ? <div className="mt-3">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
