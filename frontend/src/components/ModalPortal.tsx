import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(<div className="modal-backdrop">{children}</div>, document.body);
}
