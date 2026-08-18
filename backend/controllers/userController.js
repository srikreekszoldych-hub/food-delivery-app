import { supabase } from "../config/supabase.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      token: createToken(user.id),
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a password with at least 8 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.SALT)
    );

    const { data: user, error } = await supabase
      .from("users")
      .insert({ name, email, password: hashedPassword })
      .select("id, role")
      .single();

    if (error) throw error;

    res.json({
      success: true,
      token: createToken(user.id),
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

export { loginUser, registerUser };