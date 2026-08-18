import { supabase } from "../config/supabase.js";

const requireAdmin = async (userId) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return user.role === "admin";
};

const formatOrder = (order) => ({
  ...order,
  _id: order.id,
  date: order.created_at,
});

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        items,
        amount,
        address,
        payment: true,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const { error: cartError } = await supabase
      .from("users")
      .update({ cart_data: {} })
      .eq("id", userId);

    if (cartError) throw cartError;

    res.json({
      success: true,
      message: "Order placed successfully",
      orderId: order.id,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const verifyOrder = async (_req, res) => {
  res.json({
    success: true,
    message: "Online payment verification is disabled",
  });
};

const userOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", req.body.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: orders.map(formatOrder) });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const listOrders = async (req, res) => {
  try {
    if (!(await requireAdmin(req.body.userId))) {
      return res.json({ success: false, message: "You are not admin" });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: orders.map(formatOrder) });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    if (!(await requireAdmin(req.body.userId))) {
      return res.json({ success: false, message: "You are not admin" });
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: req.body.status })
      .eq("id", req.body.orderId);

    if (error) throw error;

    res.json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };