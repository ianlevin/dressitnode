import CommonRepository from "../repositories/common-repository.js";

export default class CommonService{
    getAllSync = async (table_name) => {
        const repo = new CommonRepository();
        let returnArray = await repo.getAllSync(table_name);
        return returnArray;
    }
    getByIdAsync = async (table_name, id) => {
        const repo = new CommonRepository();
        let returnArray = await repo.getByIdAsync(table_name, id);
        return returnArray;
    }
}