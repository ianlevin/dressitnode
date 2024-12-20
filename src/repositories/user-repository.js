import config from "../configs/db-config.js";
import sql from "mssql";

export default class UserRepository{
    Login = async (user)=> {
        console.log(user)
        let pool = await sql.connect(config)
        let result = await pool.request()
        .input("pusername",sql.VarChar,user.username)
        .input("ppassword",sql.VarChar,user.pass)
        .query("SELECT id,username,email,pfp from USERS where username = @pusername and password = @ppassword")
        return result.recordset
    }
    Register = async (user) => {
        let pool = await sql.connect(config);
        console.log(user)
        let result = await pool.request()
        .input('pusername'  , sql.VarChar, user.username )
        .input('ppassword'  , sql.VarChar, user.pass )
        .input('pemail'     , sql.VarChar, user.email )
        .query("INSERT INTO users (username,password,email,pfp) VALUES (@pusername, @ppassword, @pemail,null)");
        return result.rowsAffected
    }
    userExist = async (username) => {
        let pool = await sql.connect(config);
        let result = await pool.request().input("pusername",sql.VarChar,username).query("SELECT * FROM Users where username = @pusername");
        return result.recordset
    }
    findUserByGoogleId = async (googleId) => {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('googleId', sql.VarChar, googleId)
            .query("SELECT * FROM Users WHERE googleId = @googleId");
        return result.recordset[0];
    };
    findUserByNameOrEmail = async(name,email)=> {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('name', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .query("SELECT * FROM Users WHERE username = @name or email = @email");
        return result.recordset[0];
    }

    registerGoogleUser = async (user) => {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('googleId', sql.VarChar, user.googleId)
            .input('email', sql.VarChar, user.email)
            .input('name', sql.VarChar, user.name)
            .input('imageUrl', sql.VarChar, user.imageUrl)
            .input('password', sql.VarChar, user.password)
            .query("INSERT INTO Users (googleId, email, username, pfp, password) VALUES (@googleId, @email, @name, @imageUrl, @password)");
        return result.recordset;
    };
    getUser = async (username) => {
        let pool = await sql.connect(config);
        let result = await pool.request().input('username',sql.VarChar,username).query(`SELECT username,pfp FROM Users WHERE username = @username`);
        return result.recordset[0];
    };
    postToHistory = async (idPost, idUser) => {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('idUser', sql.Int, idUser)
            .input('idPost', sql.Int, idPost)
            .query('INSERT INTO PostsXUser (idUser, idPost) VALUES (@idUser, @idPost)');
        return result.rowsAffected;
    }
}