function Modal({ title, onClose, children, size = 'md' }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-box modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
