import { Router } from 'express';
import multer from 'multer';
import ImageService from './../services/image-service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const diskStorage = multer.diskStorage({
    destination: path.join(__dirname, '../../public/images'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const fileUpload = multer({
    storage: diskStorage
}).fields([
    { name: 'background_url', maxCount: 1 },
    { name: 'garment_url', maxCount: 1 }
]);

const svc = new ImageService();

router.post("/post", fileUpload, async  (req, res) => {
    try {
        const garmentUrl = req.body.garment_url;
        const backgroundFile = req.files['background_url'][0];
        const backgroundFileName = backgroundFile.filename;
        console.log(backgroundFileName)
        // Realizar la petición fetch y esperar la respuesta
        const response = await fetch(`http://34.16.216.43:8000/?background_url=https://dressitnode-uq2eh73iia-uc.a.run.app/images/${backgroundFileName}&garment_url=${garmentUrl}`);

        // Verificar si la respuesta fue exitosa (código 200)
        if (response.ok) {
            // Obtener el contenido de la respuesta en formato JSON
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.set('Content-Type', 'image/png');
            res.send(buffer);

        } else {
            // Si la respuesta no es exitosa, manejar el error
            throw new Error(`Fetch failed with status ${response.status}`);
        }
    } catch (error) {
        // Capturar cualquier error y devolver un mensaje de error al cliente
        console.error('Error in fetch:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
