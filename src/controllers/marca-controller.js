import {Router} from 'express';
import CommonService from '../services/common-service.js';
import Wear from '../entities/user.js'
const router = Router();
const svcc = new CommonService();

router.get('', async (req, res) => {
    let respuesta;
    const returnArray = await svcc.getAllSync('Users');
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
});

router.get('/:id', async (req, res) => {
    let respuesta;
    const returnArray = await svcc.getByIdAsync("Posts",req.params.id);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).send('Error interno.');
    }
    return respuesta;
});


export default router;