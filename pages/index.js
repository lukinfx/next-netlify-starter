import { useEffect, useState } from 'react';

function HomePage() {
  const [orders, setOrders] = useState([]);
  const [editOrderId, setEditOrderId] = useState(null);
  const [formData, setFormData] = useState({ name: '', owner: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Check if we're adding or editing
    if (editOrderId) {
      const response = await fetch(`/api/orders/${editOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(orders.map(order => order.id === editOrderId ? updatedOrder : order));
        setEditOrderId(null);
      }
    } else {
      const newOrder = { ...formData, date: new Date().toISOString(), state: 'new' };
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      });

      if (response.ok) {
        const addedOrder = await response.json();
        setOrders([...orders, addedOrder]);
      }
    }

    setFormData({ name: '', owner: '' }); // Reset form
  };

  const handleEdit = (order) => {
    setEditOrderId(order.id);
    setFormData({ name: order.name, owner: order.owner });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Orders</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Date</th>
            <th>State</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.name}</td>
              <td>{order.owner}</td>
              <td>{order.date}</td>
              <td>{order.state}</td>
              <td>
                <button onClick={() => handleEdit(order)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>{editOrderId ? 'Edit Order' : 'Add a New Order'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Order Name"
          required
        />
        <input
          type="text"
          name="owner"
          value={formData.owner}
          onChange={handleInputChange}
          placeholder="Owner"
          required
        />
        <button type="submit">{editOrderId ? 'Save Changes' : 'Add Order'}</button>
      </form>
    </div>
  );
}

export default HomePage;
