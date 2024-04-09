import { useEffect, useState } from 'react';

function Home() {
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch orders on component mount
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
    const newOrder = { name, owner, date: new Date().toISOString(), state: 'new' };
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
      setName('');
      setOwner('');
      // Optionally, clear other form fields
    } else {
      // Handle error
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Orders</h1>
      {orders.map((order) => (
        <div key={order.id}>
          <p>Name: {order.name}</p>
          <p>Owner: {order.owner}</p>
          <p>Date: {order.date}</p>
          <p>State: {order.state}</p>
          {/* Add edit and delete button here */}
        </div>
      ))}

      <h2>Add a New Order</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Order Name" required />
        <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" required />
        {/* Add fields for date and state if needed */}
        <button type="submit">Add Order</button>
      </form>
    </div>
  );
}

export default Home;
