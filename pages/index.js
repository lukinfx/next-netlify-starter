import { useEffect, useState } from 'react';
import supabase from '../data/supabaseClient'; // Make sure to adjust the path

function HomePage() {
  const [orders, setOrders] = useState([]);
  const [editOrderId, setEditOrderId] = useState(null);
  const [formData, setFormData] = useState({ name: '', owner: '' });
  const [loading, setLoading] = useState(false);

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      let { data: orders, error } = await supabase
        .from('orders')
        .select('*');
      if (error) console.error(error.message);
      else setOrders(orders);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (editOrderId) {
      // Editing an existing order
      const { data, error } = await supabase
        .from('orders')
        .update({ name: formData.name, owner: formData.owner })
        .match({ id: editOrderId });

      if (error) console.error(error.message);
      else setOrders(orders.map(order => order.id === editOrderId ? { ...order, ...formData } : order));
      setEditOrderId(null);
    } else {
      // Adding a new order
      const { data, error } = await supabase
        .from('orders')
        .insert([{ name: formData.name, owner: formData.owner, state: 'new', date: new Date().toISOString() }]);

      if (error) console.error(error.message);
      else setOrders([...orders, ...data]);
    }
    setFormData({ name: '', owner: '' }); // Reset form
    setLoading(false);
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
