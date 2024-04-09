// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Order } from '../../../models/order';
import { getOrders, saveOrders } from '../../../lib/ordersStorage';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const orders = getOrders();
    res.status(200).json(orders);
  } else if (req.method === 'POST') {
    const newOrder: Order = req.body;
    const orders = getOrders();
    orders.push(newOrder); // In a real app, ensure you generate a unique ID
    saveOrders(orders);
    res.status(201).json(newOrder);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
