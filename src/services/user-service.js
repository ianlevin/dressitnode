import UserRepository from "../repositories/user-repository.js";
import crypto from 'crypto'

export default class UserService{
    getAllSync = async () => {
        const repo = new UserRepository();
        let returnArray = await repo.getAllSync();
        return returnArray;
    }
    createAsync = async (entity) => {
        const repo = new UserRepository();
        entity.password = crypto.createHash('sha256').update(entity.password).digest('hex');
        let returnArray = await repo.createAsync(entity);
        return returnArray;
    }
}