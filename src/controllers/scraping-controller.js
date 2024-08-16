import fs from 'fs'
import {Router} from 'express';
import ScrapingService from "../services/scraping-service.js"
const svc = new ScrapingService();
const router = Router();
router.get('', (req, res) => {
    // Obtener offset y límite de la consulta
    const offset = parseInt(req.query.offset) || 0;
    const limite = parseInt(req.query.limit) || 30;
    // Cargar el archivo JSON
    const archivoJSON = './src/remerasNike.json';
    let data = JSON.parse(fs.readFileSync(archivoJSON, 'utf8'));
    data = data.filter(element => !(element==null));
    res.json(data);
});
router.get("/agregarNike",async (req,res)=> {
    let respuesta;
    const archivoJSON = './src/remerasNike.json';
    let data = JSON.parse(fs.readFileSync(archivoJSON, 'utf8'));
    data = data.filter(element => !(element==null));
    data = data.map(element=> {
        return {
            idCreator: 1,
            description : element.descripcion,
            price : parseInt(element.precio),
            creationDate : new Date(),
            name : element.title,
            wearType: 1,
            gender: 1,
            imgPath: element.img,
            link: element.link
        }
    })
    const returnArray = await svc.agregarNike(data);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
})
export default router