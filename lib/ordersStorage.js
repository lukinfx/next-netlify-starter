// lib/ordersStorage.js
import fs from 'fs';
import path from 'path';

const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json');

// Ensure the data directory exists
if (!fs.existsSync(path.dirname(ordersFilePath))) {
  fs.mkdirSync(path.dirname(ordersFilePath));
}

export const getOrders = () => {
  try {
    const jsonData = fs.readFileSync(ordersFilePath, 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    return [];
  }
};

export const saveOrders = (orders) => {
  fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
};
