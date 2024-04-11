import { useEffect, useState } from 'react';
import supabase from '../data/supabaseClient'; // Make sure to adjust the path
import styles from '../styles/HomePage.module.css'; // Adjust the path according to your file structure


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
      const { error } = await supabase
        .from('orders')
        .update({ name: formData.name, owner: formData.owner, state: formData.state })
        .match({ id: editOrderId });
  
      if (error) console.error(error.message);
      else {
        const updatedOrderIndex = orders.findIndex(order => order.id === editOrderId);
        if (updatedOrderIndex > -1) {
          // Create a new orders array with the updated order
          const updatedOrders = [...orders];
          updatedOrders[updatedOrderIndex] = { ...orders[updatedOrderIndex], ...formData };
          setOrders(updatedOrders);
        }
      }
      setEditOrderId(null);
    } else {
      // Adding a new order
      const { error: insertError } = await supabase
        .from('orders')
        .insert([{ name: formData.name, owner: formData.owner, state: 'new', date: new Date().toISOString() }]);
  
      if (insertError) {
        console.error(insertError.message);
      } else {
        // Fetch all orders to update the state
        const { data: selectData, error: selectError } = await supabase
          .from('orders')
          .select('*');
  
        if (selectError) {
          console.error(selectError.message);
        } else {
          setOrders(selectData);
        }
      }
    }
    setFormData({ name: '', owner: '' }); // Reset form
    setLoading(false);
  };
  
  const handleEdit = (order) => {
    setEditOrderId(order.id);
    setFormData({ name: order.name, owner: order.owner, state: order.state });
  };

  const handleDelete = async (orderId) => {
    console.log('delete', orderId);
  
    try {
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .match({ id: orderId });
  
      if (error) throw error;
  
      console.log('Deleted data:', data);
      // Update the local state to reflect the deletion
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h1>Orders</h1>
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <>
           <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tr}>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Owner</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>State</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {orders.map((order) => (
                  <tr key={order.id} className={styles.tr}>
                    <td className={styles.td}>{order.name}</td>
                    <td className={styles.td}>{order.owner}</td>
                    <td className={styles.td}>{new Date(order.date).toLocaleDateString()}</td>
                    <td className={styles.td}>{order.state}</td>
                    <td className={styles.td}>
                      <button onClick={() => handleEdit(order)} className={styles.button}>Edit</button>
                      <button onClick={() => handleDelete(order.id)} className={styles.button}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>{editOrderId ? 'Edit Order' : 'Add a New Order'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
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
            {editOrderId &&
            (
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
                required
              />
            )}
            
            <button type="submit" className={styles.button}>{editOrderId ? 'Save Changes' : 'Add Order'}</button>
          </form>
        </>
      )}
    </div>
  );
}

export default HomePage;
