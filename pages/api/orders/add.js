// pages/api/orders/add.js
import supabase from '../../../supabaseClient';

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('orders')
    .insert([
      { name: req.body.name, owner: req.body.owner, state: req.body.state },
    ]);

  if (error) return res.status(401).json({ error: error.message });
  return res.status(200).json(data);
}
