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
    findUserByGoogleIdOrEmail = async (googleId,email) => {
        const repo = new UserRepository();
        let returnArray = await repo.findUserByGoogleIdOrEmail(googleId,email);
        return returnArray;
    }
    registerGoogleUser = async (user) => {
        const repo = new UserRepository();
        let returnArray = await repo.registerGoogleUser(user);
        return returnArray;
    }
}