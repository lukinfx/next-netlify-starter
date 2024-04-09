// components/AddOrderForm.jsx
import { useState } from 'react';

export default function AddOrderForm() {
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  // Add state hooks for date and state

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Simple validation
    if (!name || !owner) return;

    const order = { name, owner, date: new Date().toISOString(), state: 'new' };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    if (response.ok) {
      // Handle success
    } else {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Order Name" required />
      <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" required />
      {/* Inputs for date and state */}
      <button type="submit">Add Order</button>
    </form>
  );
}
``
