import { supabase } from "../config/supabase.js";
import fs from "fs/promises";

const getUserRole = async (userId) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return user.role;
};

const addFood = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "Food image is required" });
    }

    if ((await getUserRole(req.body.userId)) !== "admin") {
      return res.json({ success: false, message: "You are not admin" });
    }

    const imagePath = `foods/${Date.now()}-${req.file.filename}`;
    const imageBuffer = await fs.readFile(req.file.path);

    const { error: uploadError } = await supabase.storage
      .from("food-images")
      .upload(imagePath, imageBuffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    await fs.unlink(req.file.path).catch(() => {});

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("food-images")
      .getPublicUrl(imagePath);

    const { error: insertError } = await supabase.from("foods").insert({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      image: publicUrlData.publicUrl,
    });

    if (insertError) throw insertError;

    res.json({ success: true, message: "Food added" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const listFood = async (_req, res) => {
  try {
    const { data: foods, error } = await supabase
      .from("foods")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const compatibleFoods = foods.map((food) => ({
      ...food,
      _id: food.id,
    }));

    res.json({ success: true, data: compatibleFoods });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error", error: error });
  }
};

const removeFood = async (req, res) => {
  try {
    if ((await getUserRole(req.body.userId)) !== "admin") {
      return res.json({ success: false, message: "You are not admin" });
    }

    const { data: food, error: findError } = await supabase
      .from("foods")
      .select("image")
      .eq("id", req.body.id)
      .single();

    if (findError) throw findError;

    const imagePath = food.image.split("/food-images/")[1];

    if (imagePath) {
      const { error: storageError } = await supabase.storage
        .from("food-images")
        .remove([imagePath]);

      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from("foods")
      .delete()
      .eq("id", req.body.id);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: "Food removed" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addFood, listFood, removeFood };