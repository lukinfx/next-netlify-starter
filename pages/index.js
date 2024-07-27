// pages/orders.js
import { useEffect, useState } from 'react';
import supabase from '../data/supabaseClient'; // Make sure to adjust the path
import styles from '../styles/HomePage.module.css'; // Adjust the path according to your file structure
import OrderFormOverlay from '../pages/orderFromOverlay';

function HomePage() {
  const [orders, setOrders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleCreateNewOrder = () => {
    setCurrentOrder(null);
    setIsFormOpen(true);
  };

  const handleEditOrder = (order) => {
    setCurrentOrder(order);
    setIsFormOpen(true);
  };

  const handleSaveOrder = async (orderData, imageFile) => {
    setLoading(true);
  
    try {
      if (imageFile) {
        // Upload the image
        const filePath = await uploadImage(imageFile);
        orderData.image_path = filePath;
      }
  
      if (currentOrder) {
        // Edit existing order
        const { error } = await supabase
          .from('orders')
          .update(orderData)
          .match({ id: currentOrder.id });
  
        if (error) {
          throw error;
        } else {
          const updatedOrderIndex = orders.findIndex(order => order.id === currentOrder.id);
          if (updatedOrderIndex > -1) {
            const updatedOrders = [...orders];
            updatedOrders[updatedOrderIndex] = { ...orders[updatedOrderIndex], ...orderData };
            if (orderData.image_path) {
              updatedOrders[updatedOrderIndex].imageUrl = await getImageUrl(orderData.image_path);
            }
            setOrders(updatedOrders);
          }
        }
      } else {
        // Add new order
        const { data, error } = await supabase
          .from('orders')
          .insert([orderData]);
  
        if (error) {
          throw error;
        } else if (data && data.length > 0) {
          const imageUrl = await getImageUrl(data[0].image_path);
          setOrders([...orders, { ...data[0], imageUrl }]);
        } else {
          console.error('No data returned from insert query.');
        }
      }
    } catch (error) {
      console.error('Error saving order:', error.message);
    } finally {
      setIsFormOpen(false);
      setLoading(false);
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

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Orders</h1>
      <button onClick={handleCreateNewOrder} className={styles.button}>New Order</button>
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
                  <tr key={order.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles["col-thumbnail"]}`}>
                      {order.imageUrl && (
                        <img src={order.imageUrl} alt="Order Thumbnail" className={styles.thumbnail} />
                      )}
                    </td>
                    <td className={`${styles.td} ${styles["col-name"]}`}>{order.name}</td>
                    <td className={`${styles.td} ${styles["col-member"]}`}>{order.member}</td>
                    <td className={`${styles.td} ${styles["col-source"]}`}>{order.source}</td>
                    <td className={`${styles.td} ${styles["col-note"]}`}>{order.note}</td>
                    <td className={`${styles.td} ${styles["col-owner"]}`}>{order.owner}</td>
                    <td className={`${styles.td} ${styles["col-date"]}`}>{new Date(order.date).toLocaleDateString()}</td>
                    <td className={`${styles.td} ${styles["col-state"]}`}>{order.state}</td>
                    <td className={`${styles.td} ${styles["col-paid"]}`}>{order.paid ? 'Yes' : 'No'}</td>
                    <td className={`${styles.td} ${styles["col-actions"]}`}>
                      <button onClick={() => handleEditOrder(order)} className={styles.button}>Edit</button>
                      <button onClick={() => handleDelete(order.id)} className={styles.button}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <OrderFormOverlay
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveOrder}
        initialData={currentOrder}
      />
    </div>
  );
}

export default HomePage;
