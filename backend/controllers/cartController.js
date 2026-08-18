import { supabase } from "../config/supabase.js";

const getUserCart = async (userId) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("cart_data")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return user.cart_data || {};
};

const saveUserCart = async (userId, cartData) => {
  const { error } = await supabase
    .from("users")
    .update({ cart_data: cartData })
    .eq("id", userId);

  if (error) throw error;
};

const addToCart = async (req, res) => {
  try {
    const cartData = await getUserCart(req.body.userId);
    const itemId = req.body.itemId;

    cartData[itemId] = (cartData[itemId] || 0) + 1;
    await saveUserCart(req.body.userId, cartData);

    res.json({ success: true, message: "Added to cart" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const cartData = await getUserCart(req.body.userId);
    const itemId = req.body.itemId;

    if (cartData[itemId] > 1) {
      cartData[itemId] -= 1;
    } else {
      delete cartData[itemId];
    }

    await saveUserCart(req.body.userId, cartData);

    res.json({ success: true, message: "Removed from cart" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const getCart = async (req, res) => {
  try {
    const cartData = await getUserCart(req.body.userId);
    res.json({ success: true, cartData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addToCart, removeFromCart, getCart };