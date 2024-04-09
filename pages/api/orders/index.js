// pages/api/orders/index.js
import { getOrders, saveOrders } from '../../../lib/ordersStorage';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const orders = getOrders();
    res.status(200).json(orders);
  } else if (req.method === 'POST') {
    const newOrder = req.body;
    const orders = getOrders();
    orders.push(newOrder); // In a real app, ensure you generate a unique ID
    saveOrders(orders);
    res.status(201).json(newOrder);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
