import { Router } from 'express';
import multer from 'multer';
import ImageService from '../services/image-service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configuración de almacenamiento en disco con Multer
const diskStorage = multer.diskStorage({
    destination: path.join(__dirname, '../../public/images'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// Middleware de Multer para subir archivos con validación de tipo y tamaño
const fileUpload = multer({
    storage: diskStorage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxFileSize = 20 * 1024 * 1024; // 20 MB en bytes

        // Verificar si el tipo MIME es permitido
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(new Error('El archivo de fondo no es una imagen válida'));
        }

        // Verificar el tamaño del archivo
        if (file.size > maxFileSize) {
            return cb(new Error('El tamaño del archivo de fondo excede el límite permitido de 20 MB'));
        }

        // Si pasa la validación, permitir el almacenamiento
        cb(null, true);
    }
}).fields([
    { name: 'background_url', maxCount: 1 },
    { name: 'garment_url', maxCount: 1 }
]);

const svc = new ImageService();

// Ruta POST para manejar la carga de imágenes
router.post("/post", fileUpload, async (req, res) => {
    try {
        const garmentUrl = req.body.garment_url;

        // Verificar si 'background_url' está presente en req.files
        if (!req.files || !req.files['background_url']) {
            return res.status(400).json({ error: 'No se ha adjuntado ningún archivo de fondo' });
        }

        const backgroundFile = req.files['background_url'][0];
        const backgroundFileName = backgroundFile.filename;

        // Lógica para procesar la imagen, por ejemplo, enviarla a otro servicio
        console.log(`http://34.16.216.43:8000/?background_url=https://example.com/images/${backgroundFileName}&garment_url=${garmentUrl}`)
        const response = await fetch(`http://34.16.216.43:8000/?background_url=https://example.com/images/${backgroundFileName}&garment_url=${garmentUrl}`);

        if (response.ok) {
            const contentType = response.headers.get('content-type');
            res.setHeader('Content-Type', contentType);
            const buffer = await response.arrayBuffer();
            res.end(Buffer.from(buffer));
        } else {
            throw new Error(`Fetch failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error in fetch:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;