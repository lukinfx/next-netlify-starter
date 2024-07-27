// pages/confirmationModal.js
import styles from '../styles/ConfirmationModal.module.css'; // Adjust the path according to your file structure

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p>{message}</p>
        <div className={styles.actions}>
          <button onClick={onConfirm} className={styles.button}>Confirm</button>
          <button onClick={onClose} className={styles.button}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
