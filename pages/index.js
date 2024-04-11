import { useEffect, useState } from 'react';
import supabase from '../data/supabaseClient'; // Make sure to adjust the path
import styles from '../styles/HomePage.module.css'; // Adjust the path according to your file structure


function HomePage() {
  const [orders, setOrders] = useState([]);
  const [editOrderId, setEditOrderId] = useState(null);
  const [formData, setFormData] = useState({ name: '', owner: '' });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      let { data: orders, error } = await supabase.from('orders').select('*');
    
      if (error) {
        console.error(error.message);
      } else {
        // Get URLs for each order's image
        const ordersWithImages = await Promise.all(orders.map(async (order) => {
          if (order.image_path) {
            order.imageUrl = await getImageUrl(order.image_path);
            console.log(order.imageUrl)
          }
          return order;
        }));
    
        setOrders(ordersWithImages);
      }
      setLoading(false);
    };
    

    fetchOrders();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
  
    let imagePath = '';
  
    if (imageFile) { // This now applies to both new orders and edits that include changing the image
      try {
        imagePath = await uploadImage(imageFile);
      } catch (error) {
        console.error('Error uploading image:', error.message);
        setLoading(false);
        return; // Stop the form submission if the image upload fails
      }
    }
  
    if (editOrderId) {
      // If editing an existing order and there's a new image, include the imagePath in the update
      const updatedData = { name: formData.name, owner: formData.owner, state: formData.state };
      if (imagePath) updatedData.image_path = imagePath;
  
      const { error } = await supabase
        .from('orders')
        .update(updatedData)
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
      // Adding a new order, include the image path only if there is one
      const newOrderData = {
        name: formData.name,
        owner: formData.owner,
        state: 'new',
        date: new Date().toISOString(),
      };
      if (imagePath) newOrderData.image_path = imagePath;
  
      const { error: insertError } = await supabase
        .from('orders')
        .insert([newOrderData]);
  
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
  
    // Reset form and image file state after submission
    setFormData({ name: '', owner: '', state: '' });
    setImageFile(null);
    setLoading(false);
  };

  const getImageUrl = async (path) => {
    console.log('path', path);

    const { publicURL, error } = supabase
      .storage
      .from('images')
      .getPublicUrl(path); // Use the fullPath variable here
   
    if (error) {
      console.error('Error getting image URL:', error.message);
      return null;
    }
    
    console.log('publicURL', publicURL);
    return publicURL;
  };
  
  const handleEdit = (order) => {
    setEditOrderId(order.id);
    setFormData({ name: order.name, owner: order.owner, state: order.state });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      setImageFile(e.target.files[0]);
    }
  };

  async function uploadImage(file) {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExtension}`;
    const filePath = `orders/${fileName}`;
  
    const { data, error } = await supabase.storage
      .from('images') // Make sure this bucket exists in your Supabase project
      .upload(filePath, file);
  
    if (error) {
      throw new Error(error.message);
    }
  
    // Return the file path if you want to save the path in the database
    // This path is how you will reference the image in your Supabase Storage
    return filePath;
  }
  
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
                  <th className={styles.th}>Thumbnail</th>
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
                    <td className={styles.td}>
                      {order.imageUrl && (
                        <img src={order.imageUrl} alt="Order Thumbnail" className={styles.thumbnail} />
                      )}
                    </td>
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
            <input
              type="file"
              name="image"
              onChange={handleFileChange}
              accept="image/*"
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
