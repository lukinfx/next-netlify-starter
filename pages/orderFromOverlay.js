// components/OrderFormOverlay.js
import { useState, useEffect } from 'react';
import styles from '../styles/OrderFormOverlay.module.css'; // Adjust the path according to your file structure

const OrderFormOverlay = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    member: '',
    source: '',
    note: '',
    owner: '',
    state: 'new',
    paid: false,
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setImageFile(null); // Reset image file when editing an order
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, imageFile);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayContent}>
        <h2>{initialData ? 'Edit Order' : 'New Order'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Group:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.input}
            />
          </label>
          <label>
            Member:
            <input
              type="text"
              name="member"
              value={formData.member}
              onChange={handleInputChange}
              className={styles.input}
            />
          </label>
          <label>
            Source:
            <input
              type="text"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              className={styles.input}
            />
          </label>
          <label>
            Note:
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              className={styles.textarea}
            />
          </label>
          <label>
            Owner:
            <input
              type="text"
              name="owner"
              value={formData.owner}
              onChange={handleInputChange}
              className={styles.input}
            />
          </label>
          <label>
            State:
            <select
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className={styles.input}
            >
              <option value="new">New</option>
              <option value="pending">Pending</option>
              <option value="otw">OTW</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            Paid:
            <input
              type="checkbox"
              name="paid"
              checked={formData.paid}
              onChange={handleInputChange}
              className={styles.checkbox}
            />
          </label>
          <label>
            Photo:
            <input
              type="file"
              onChange={handleFileChange}
              className={styles.input}
            />
          </label>
          <div className={styles.actions}>
            <button type="submit" className={styles.button}>Save</button>
            <button type="button" onClick={onClose} className={styles.button}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFormOverlay;
