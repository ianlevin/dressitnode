import PostRepository from "../repositories/post-repository.js";

export default class WearService {
    getFilterAsync = async (generos, precios, colores, prendas, offset, limit) => {
        console.log(offset)
        offset = offset || 0;
        limit = limit || 30;
        let filters = {
            generos,
            precios,
            colores,
            prendas,
            offset,
            limit
        };

        const repo = new PostRepository();
        let returnArray = await repo.getFilterAsync(filters);
        return returnArray;
    }

    getByIdAsync = async (table_name,id,id_user) => {
        const repo = new PostRepository();
        let returnArray = await repo.getByIdAsync(table_name, id,id_user);
        return returnArray;
    }

    getSearchAsync = async (buscado,id,limit) => {
        const repo = new PostRepository();
        let returnArray = await repo.getSearchAsync(buscado,id,limit);
        return returnArray;
    }

    getPostByBrand = async (username,offset,limit) => {
        const repo = new PostRepository();
        let returnArray = await repo.getPostByBrand(username,offset,limit);
        return returnArray;
    }

    getRandomPostsAsync= async (iduser) => {
        const repo = new PostRepository();
        let returnArray = await repo.getRandomPostsAsync(iduser);
        return returnArray;
    }
    getOffsetAsync = async (buscado,offset,limit) => {
        const repo = new PostRepository();
        let returnArray = await repo.getOffsetAsync(buscado,offset,limit);
        return returnArray;
    }
    getUserHistory = async (idUser) => {
    const repo = new PostRepository();
    return await repo.getUserHistory(idUser);
};

    blockHistoryItem = async (id) => {
        const repo = new PostRepository();
        const result = await repo.blockHistoryItem(id);
        return result;
    };


}
