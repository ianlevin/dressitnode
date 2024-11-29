import config from "../configs/db-config.js";
import sql from "mssql";

export default class CommonRepository{
    getAllSync = async (table_name) => {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`SELECT * FROM ${table_name}`);
        console.log(result.recordset.length);
        return result.recordset;
    }
    getByIdAsync = async (table_name, id) => {
        if (id != null && !isNaN(Number(id))) {
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('pid', sql.Int, id)
                .query(`SELECT * FROM ${table_name} WHERE id = @pid`);
            console.log('Resultados:', result.recordset.length);
            return result.recordset;
        } else {
            console.error('ID inválido o no definido:', id);
            return [];
        }
    };    
    
}