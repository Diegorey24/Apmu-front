import { useEffect, useState } from 'react';
import Modal from './Modal';

let trigger = null;

export function confirmDialog(message, options = {}) {
  return new Promise((resolve) => {
    if (!trigger) {
      resolve(window.confirm(message));
      return;
    }
    trigger({ message, ...options, resolve });
  });
}

function ConfirmDialogHost() {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    trigger = (req) => setRequest(req);
    return () => { trigger = null; };
  }, []);

  if (!request) return null;

  const responder = (result) => {
    request.resolve(result);
    setRequest(null);
  };

  return (
    <Modal title={request.title || 'Confirmar'} onClose={() => responder(false)}>
      <p style={{ margin: 0 }}>{request.message}</p>
      <div className="modal-footer">
        <button type="button" className="btn-sm btn-cancel" onClick={() => responder(false)}>
          {request.cancelText || 'Cancelar'}
        </button>
        <button type="button" className="btn-primary btn-inline" onClick={() => responder(true)} autoFocus>
          {request.confirmText || 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialogHost;
