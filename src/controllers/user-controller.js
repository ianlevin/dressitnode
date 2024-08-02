import {Router} from 'express';
import UserService from './../services/user-service.js';
import User from '../entities/user.js'
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto'
const router = Router();
const svc = new UserService();
const googleClient = new OAuth2Client("YOUR_GOOGLE_CLIENT_ID");
function isValidEmail(email) {
    // Implementación básica de validación de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
router.post('/login', async (req, res) => {
    let respuesta;
    const user = req.body
    const userIngresado = await svc.userExist(user.username)
    if (userIngresado.length<1) {
        return res.status(401).json({ message: 'Usuario no existente' });
    }
    const hashedPassword = crypto.createHash('sha256').update(user.pass).digest('hex');
    if(hashedPassword != userIngresado[0].password) {
        return res.status(400).json({message: "Contraseña incorrecta"})
    } else {
        user.pass = hashedPassword
    }
    const returnArray = await svc.Login(user);
    if (returnArray != null){
        respuesta = res.status(200).json(returnArray);
    }
    else {
        respuesta = res.status(500).json({message:'Error interno.'});
    }
    return respuesta;
});

router.post('/register', async (req, res) => {
    let respuesta;
    const user = req.body;
    if (!user.email || !user.username || !user.pass) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    if (!isValidEmail(user.email)) {
        return res.status(400).json({ message: 'Debe ser un correo electrónico válido' });
    }
    if (user.username.length < 3) {
        return res.status(400).json({ message: 'El usuario debe tener al menos 3 caracteres' });
    }
    if (user.pass.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }
    if((await svc.userExist(user.username)).length>0){
        return res.status(400).json({ message: 'Ya hay un user con ese nombre' });
    }
    const returnArray = await svc.Register(user);
    if(returnArray.length == 1){
        respuesta = res.status(200).json({ message:'Se ha creado correctamente'});
    }else{
        respuesta = res.status(500).json({ message:'Error interno.'});
    }
})
router.post('/google-login', async (req, res) => {
    const { tokenId, googleId, email, name, imageUrl } = req.body;

    // Verificar el token de Google
    const ticket = await googleClient.verifyIdToken({
        idToken: tokenId,
        audience: "612029047571-54dp6o7o757atf598qjj7il1mt030nan.apps.googleusercontent.com",
    });

    if (!ticket) {
        return res.status(400).json({ message: 'Invalid Google token' });
    }

    // Buscar al usuario por Google ID o email
    let user = await svc.findUserByGoogleIdOrEmail(googleId, email);

    if (!user) {
        // Registrar nuevo usuario
        user = {
            googleId,
            email,
            name,
            imageUrl,
            // Aquí podrías generar una contraseña aleatoria o dejar este campo vacío
            password: crypto.randomBytes(20).toString('hex')
        };
        await svc.registerGoogleUser(user);
    }

    // Aquí puedes generar y devolver un token JWT para la sesión, si es necesario
    res.status(200).json({ message: 'Login successful', user });
});
export default router;