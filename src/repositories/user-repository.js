import config from "../configs/db-config.js";
import sql from "mssql";

export default class UserRepository{
    getAllSync = async () => {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM Users");
        return result.recordset
        console.log(result.recordset.length);
    }
    createAsync = async (entity) => {
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('pusername'  , sql.VarChar, entity.username )
        .input('ppassword'  , sql.VarChar, entity.password )
        .input('pemail'     , sql.VarChar, entity.email )
        .input('ppfp'       , sql.VarChar, entity.pfp )
        .input('pgender'    , sql.VarChar, entity.gender )
        .query("INSERT INTO users (username,password,email,pfp,gender) VALUES (@pusername, @ppassword, @pemail, @ppfp, @pgender)");
        console.log(result.recordsets[5])
        return result.recordsets
    }
}