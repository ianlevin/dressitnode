import UserRepository from "../repositories/user-repository.js";
import crypto from 'crypto'

export default class UserService{
    Login = async (user) => {
        const repo = new UserRepository();
        let returnArray = await repo.Login(user);
        return returnArray;
    }
    Register = async (user) => {
        const repo = new UserRepository();
        user.pass = crypto.createHash('sha256').update(user.pass).digest('hex');
        let returnArray = await repo.Register(user);
        return returnArray;
    }
    userExist =async (username) => {
        const repo = new UserRepository();
        let returnArray = await repo.userExist(username);
        return returnArray;
    }
    findUserByGoogleId = async (googleId) => {
        const repo = new UserRepository();
        let returnArray = await repo.findUserByGoogleId(googleId);
        return returnArray;
    }
    findUserByNameOrEmail = async (name,email) => {
        const repo = new UserRepository();
        let returnArray = await repo.findUserByNameOrEmail(name,email);
        return returnArray;
    }
    registerGoogleUser = async (user) => {
        const repo = new UserRepository();
        let returnArray = await repo.registerGoogleUser(user);
        return returnArray;
    }
    getUser = async (iduser) => {
        const repo = new UserRepository();
        let returnArray = await repo.getUser(iduser);
        return returnArray;
    }
}