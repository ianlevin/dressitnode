import ScrapingRepository from '../repositories/scraping-repository.js'
export default class ScrapingService {
    agregarNike = async (data) => {
        const repo = new ScrapingRepository();
        let returnArray = await repo.agregarNike(data);
        return returnArray;
    }
}
