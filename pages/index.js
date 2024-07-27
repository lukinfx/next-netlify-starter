// Updated JSX structure for the table
import { useEffect, useState } from 'react';
import supabase from '../data/supabaseClient'; // Adjust the path according to your file structure
import styles from '../styles/HomePage.module.css'; // Adjust the path according to your file structure
import OrderFormOverlay from '../components/orderFromOverlay';
import ConfirmationModal from '../components/confirmationModal';

function HomePage() {
  const [orders, setOrders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Fetch orders from Supabase
  useEffect(() => {
    fetchOrders();
  }, []);

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
          const newOrder = data[0];
          const imageUrl = await getImageUrl(newOrder.image_path);
          setOrders([...orders, { ...newOrder, imageUrl }]);
        } else {
          console.error('No data returned from insert query.');
        }
      }
    } catch (error) {
      console.error('Error saving order:', error.message);
    } finally {
      setIsFormOpen(false);
      setLoading(false);
      fetchOrders(); // Fetch the orders again after saving
    }
  };

  const handleDelete = async (orderId) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = (orderId) => {
    setOrderToDelete(orderId);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      handleDelete(orderToDelete);
      setOrderToDelete(null);
    }
    setIsConfirmOpen(false);
  };

  const cancelDelete = () => {
    setOrderToDelete(null);
    setIsConfirmOpen(false);
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
      let a = "https://fgfgtmxgucfwtmzsfahz.supabase.co/storage/v1/object/public/images/" + path;
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
                      <button onClick={() => handleConfirmDelete(order.id)} className={styles.button}>Delete</button>
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
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this order?"
      />
    </div>
  );
}

export default HomePage;
