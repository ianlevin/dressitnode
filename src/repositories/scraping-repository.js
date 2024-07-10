import config from "../configs/db-config.js";
import sql from "mssql";

export default class ScrapingRepository {
    agregarNike = async (dataArray) => {
        let returnArray = null;
        let pool = await sql.connect(config);
        let transaction;  // Define la transacción fuera del bloque try-catch

        try {
            // Iniciar transacción
            transaction = new sql.Transaction(pool);
            await transaction.begin();

            const request = new sql.Request(transaction);

            let query = `INSERT INTO Posts 
                         (idCreator, description, price, creationDate, name, wearType, gender, imgPath, link) 
                         VALUES `;
            dataArray.forEach((data, index) => {
                // Ajustar el tamaño de las entradas si es necesario
                const description = data.description.substring(0, 100); // VARCHAR(100)
                const name = data.name.substring(0, 50); // VARCHAR(50)

                query += `(@idCreator${index}, @description${index}, @price${index}, @creationDate${index}, @name${index}, @wearType${index}, @gender${index}, @imgPath${index}, @link${index}),`;
                request.input(`idCreator${index}`, sql.Int, data.idCreator);
                request.input(`description${index}`, sql.VarChar, description);
                request.input(`price${index}`, sql.Float, data.price); // FLOAT
                request.input(`creationDate${index}`, sql.DateTime, data.creationDate); // DATETIME
                request.input(`name${index}`, sql.VarChar, name);
                request.input(`wearType${index}`, sql.Int, data.wearType); // INT
                request.input(`gender${index}`, sql.Int, data.gender); // INT
                request.input(`imgPath${index}`, sql.VarChar(sql.MAX), data.imgPath); // VARCHAR(MAX)
                request.input(`link${index}`, sql.VarChar(sql.MAX), data.link); // VARCHAR(MAX)
            });

            query = query.slice(0, -1); // Eliminar la última coma

            let result = await request.query(query);

            await transaction.commit();
            returnArray = result;
        } catch (error) {
            console.log(error);
            if (transaction) {
                await transaction.rollback();
            }
        } finally {
            pool.close(); // Cerrar la conexión al finalizar
        }
     
        return returnArray;
    }
}
