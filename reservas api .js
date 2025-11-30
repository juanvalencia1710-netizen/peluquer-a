import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ USA TU SERVICE ROLE KEY AQUÍ
const supabase = createClient(
  "https://xdoqjrxlhhpatxwkyapz.supabase.co",
  "SERVICE_ROLE_KEY_AQUI"
);

app.post("/crear-reserva", async (req, res) => {
  const datos = req.body;

  const { data, error } = await supabase
    .from("reservas")
    .insert(datos);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ ok: true, data });
});

app.listen(3000, () => console.log("API lista en puerto 3000"));
