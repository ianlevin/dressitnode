import express from "express";
import cors from "cors";
import UserRouter from "./src/controllers/user-controller.js";
import WearRouter from "./src/controllers/post-controller.js";
import wearScraping from "./src/controllers/scraping-controller.js";
import MarcaRouter from './src/controllers/marca-controller.js';
import imageController from './src/controllers/image-controller.js';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar JSON en las solicitudes
app.use(express.json());

// Rutas de los controladores
app.use("/api/users", UserRouter);
app.use("/api/wear", WearRouter);
app.use("/api/scraping", wearScraping);
app.use("/api/brand", MarcaRouter);
app.use("/api/image", imageController);

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
