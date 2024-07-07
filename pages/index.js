import { useEffect, useState } from 'react';
import supabase from '../data/supabaseClient'; // Make sure to adjust the path
import styles from '../styles/HomePage.module.css'; // Adjust the path according to your file structure

function HomePage() {
  const [orders, setOrders] = useState([]);
  const [editOrderId, setEditOrderId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    member: '',
    source: '',
    note: '',
    owner: '',
    state: 'new',
    paid: false,
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      let { data: orders, error } = await supabase.from('orders').select('*').order('date');
    
      if (error) {
        console.error(error.message);
      } else {
        // Get URLs for each order's image
        const ordersWithImages = await Promise.all(orders.map(async (order) => {
          if (order.image_path) {
            order.imageUrl = await getImageUrl(order.image_path);
          }
          return order;
        }));
    
        setOrders(ordersWithImages);
      }
      setLoading(false);
    };
    
    fetchOrders();
  }, []);

  const handleEdit = (order) => {
    setEditOrderId(order.id);
    setEditFormData({
      name: order.name,
      member: order.member,
      source: order.source,
      note: order.note,
      owner: order.owner,
      state: order.state,
      paid: order.paid
    });
  };

  const handleSave = async (orderId) => {
    setLoading(true);

    const updatedData = { ...editFormData };

    const { error } = await supabase
      .from('orders')
      .update(updatedData)
      .match({ id: orderId });

    if (error) {
      console.error(error.message);
    } else {
      const updatedOrderIndex = orders.findIndex(order => order.id === orderId);
      if (updatedOrderIndex > -1) {
        // Create a new orders array with the updated order
        const updatedOrders = [...orders];
        updatedOrders[updatedOrderIndex] = { ...orders[updatedOrderIndex], ...editFormData };
        setOrders(updatedOrders);
      }
    }
    setEditOrderId(null);
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditOrderId(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDelete = async (orderId) => {
    console.log('delete', orderId);
  
    try {
      // Get the image path before deleting the order
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('image_path')
        .eq('id', orderId)
        .single();
  
      if (fetchError) {
        throw fetchError;
      }
  
      // Delete the order
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .match({ id: orderId });
      
      if (deleteError) {
        throw deleteError;
      }
  
      // Delete the image from storage if it exists
      if (orderData && orderData.image_path) {
        const { error: storageError } = await supabase
          .storage
          .from('images')
          .remove([orderData.image_path]);
  
        if (storageError) {
          throw storageError;
        }
      }
  
      // Update the local state to reflect the deletion
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const getImageUrl = async (path) => {
    try {
      const { publicURL, error } = await supabase
        .storage
        .from('images')
        .getPublicUrl(path);

      if (error) {
        console.error('Error getting image URL:', error.message);
        return null;
      }

      console.log('publicURL', publicURL);
      //return publicURL;
      let a = "https://fgfgtmxgucfwtmzsfahz.supabase.co/storage/v1/object/public/images/"+path;
      console.log(a);
      return a;
    } catch (error) {
      console.error('Error with getting public URL:', error.message);
      return null;
    }
  };

  async function uploadImage(file) {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExtension}`;
    const filePath = `${fileName}`;
  
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

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Orders</h1>
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tr}>
                  <th className={`${styles.th} ${styles["col-thumbnail"]}`}>Thumbnail</th>
                  <th className={`${styles.th} ${styles["col-name"]}`}>Group</th>
                  <th className={`${styles.th} ${styles["col-member"]}`}>Member</th>
                  <th className={`${styles.th} ${styles["col-source"]}`}>Source</th>
                  <th className={`${styles.th} ${styles["col-note"]}`}>Note</th>
                  <th className={`${styles.th} ${styles["col-owner"]}`}>Owner</th>
                  <th className={`${styles.th} ${styles["col-date"]}`}>Date</th>
                  <th className={`${styles.th} ${styles["col-state"]}`}>State</th>
                  <th className={`${styles.th} ${styles["col-paid"]}`}>Paid</th>
                  <th className={`${styles.th} ${styles["col-actions"]}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {orders.map((order) => (
                  <tr key={order.id} className={editOrderId === order.id ? styles["tr--editing"] : styles.tr}>
                    <td className={`${styles.td} ${styles["col-thumbnail"]}`}>
                      {order.imageUrl && (
                        <img src={order.imageUrl} alt="Order Thumbnail" className={styles.thumbnail} />
                      )}
                    </td>
                    {editOrderId === order.id ? (
                      <>
                        <td className={`${styles.td} ${styles["col-name"]}`}>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </td>
                        <td className={`${styles.td} ${styles["col-member"]}`}>
                          <input
                            type="text"
                            name="member"
                            value={editFormData.member}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </td>
                        <td className={`${styles.td} ${styles["col-source"]}`}>
                          <input
                            type="text"
                            name="source"
                            value={editFormData.source}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </td>
                        <td className={`${styles.td} ${styles["col-note"]}`}>
                          <input
                            type="text"
                            name="note"
                            value={editFormData.note}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </td>
                        <td className={`${styles.td} ${styles["col-owner"]}`}>
                          <input
                            type="text"
                            name="owner"
                            value={editFormData.owner}
                            onChange={handleInputChange}
                            className={styles.input}
                          />
                        </td>
                        <td className={`${styles.td} ${styles["col-date"]}`}>
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className={`${styles.td} ${styles["col-state"]}`}>
                          <select
                            name="state"
                            value={editFormData.state}
                            onChange={handleInputChange}
                            className={styles.input}
                          >
                            <option value="new">New</option>
                            <option value="pending">Pending</option>
                            <option value="otw">OTW</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td className={`${styles.td} ${styles["col-paid"]}`}>
                          <input
                            type="checkbox"
                            name="paid"
                            checked={editFormData.paid}
                            onChange={handleInputChange}
                            className={styles.checkbox}
                          />
                        </td>
                        <td className={`${styles.td} ${styles["col-actions"]}`}>
                          <button onClick={() => handleSave(order.id)} className={`${styles.button} ${styles["button--save"]}`}>Save</button>
                          <button onClick={handleCancelEdit} className={`${styles.button} ${styles["button--discard"]}`}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={`${styles.td} ${styles["col-name"]}`}>{order.name}</td>
                        <td className={`${styles.td} ${styles["col-member"]}`}>{order.member}</td>
                        <td className={`${styles.td} ${styles["col-source"]}`}>{order.source}</td>
                        <td className={`${styles.td} ${styles["col-note"]}`}>{order.note}</td>
                        <td className={`${styles.td} ${styles["col-owner"]}`}>{order.owner}</td>
                        <td className={`${styles.td} ${styles["col-date"]}`}>{new Date(order.date).toLocaleDateString()}</td>
                        <td className={`${styles.td} ${styles["col-state"]}`}>{order.state}</td>
                        <td className={`${styles.td} ${styles["col-paid"]}`}>{order.paid ? 'Yes' : 'No'}</td>
                        <td className={`${styles.td} ${styles["col-actions"]}`}>
                          <button onClick={() => handleEdit(order)} className={styles.button}>Edit</button>
                          <button onClick={() => handleDelete(order.id)} className={styles.button}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
  
}

export default HomePage;
