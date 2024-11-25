import {Router} from 'express';
import PostService from '../services/post-service.js';
import CommonService from '../services/common-service.js';
import Wear from '../entities/user.js'
const router = Router();
const svcw = new PostService();
const svcc = new CommonService();

router.get('/history/:iduser', async (req, res) => {
    let respuesta;
    try {
        // Obtener el ID del usuario desde los parámetros
        const iduser = req.params.iduser;

        // Llamada al servicio para obtener el historial
        const returnArray = await svcw.getUserHistory(iduser);

        if (returnArray != null) {
            respuesta = res.status(200).json(returnArray);
        } else {
            respuesta = res.status(404).send('No se encontró historial para el usuario especificado.');
        }
    } catch (error) {
        console.error('Error al obtener historial:', error);
        respuesta = res.status(500).send('Error interno.');
    }

    return respuesta;
});

router.put('/history/blocked/:id', async (req, res) => {
    let respuesta;
    try {
        const id = req.params.id;

        if (isNaN(id)) {
            return res.status(400).send('El parámetro id debe ser un número válido.');
        }

        const wasBlocked = await svcw.blockHistoryItem(id);

        if (wasBlocked) {
            respuesta = res.status(200).send('Ítem bloqueado correctamente.');
        } else {
            respuesta = res.status(404).send('Ítem no encontrado o ya bloqueado.');
        }
    } catch (error) {
        console.error('Error al bloquear el ítem:', error);
        respuesta = res.status(500).send('Error interno al bloquear el ítem.');
    }

    return respuesta;
});

router.get('/random/:iduser', async (req, res) => {
    let respuesta;
    const returnArray = await svcw.getRandomPostsAsync(req.params.iduser);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
});


router.get('', async (req, res) => {
    let respuesta;
    const returnArray = await svcw.getFilterAsync(req.query.generos,req.query.precios,req.query.colores,req.query.prendas,req.query.offset,req.query.limit);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
});

router.get('/brand/:username/:offset/:limit', async (req, res) => {
    let respuesta;
    const returnArray = await svcw.getPostByBrand(req.params.username,req.params.offset,req.params.limit);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
});

router.get('/:id/:iduser', async (req, res) => {
    let respuesta;
    console.log("iduser",req.params.iduser)
    const returnArray = await svcw.getByIdAsync("Posts",req.params.id,req.params.iduser);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
});



router.post('', async (req, res) => {
    let respuesta;
    let user = new User(undefined,req.body.username, req.body.password, req.body.email, req.body.pfp, req.body.gender)
    const returnArray = await svc.createAsync(user);
    if(returnArray == 1){
        respuesta = res.status(200).send('Se ha creado correctamente');
    }else{
        respuesta = res.status(500).send('Error interno.');
    }
})

router.get('/search/:buscado/:id/:limit', async (req, res) => {
    let respuesta;
    const returnArray = await svcw.getSearchAsync(req.params.buscado,req.params.id,req.params.limit);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
});
router.get('/:buscado/:offset/:limit', async (req, res) => {
    let respuesta;
    const returnArray = await svcw.getOffsetAsync(req.params.buscado,req.params.offset,req.params.limit);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
});

export default router;