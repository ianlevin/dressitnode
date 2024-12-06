import { query } from "express";
import config from "../configs/db-config.js";
import sql from "mssql";

let poolPromise = sql.connect(config);

export default class WearRepository {
    
    getFilterAsync = async (filters) => {
        let { generos, precios, colores, prendas, offset, limit } = filters;
        let sqlquery = '1=1'; // Siempre verdadero para evitar problemas de WHERE vacío
        let request = new sql.Request(await poolPromise);

        if (generos && generos.length > 0) {
            if (generos.length > 1) {
                sqlquery += ' AND ('
                for (let i = 0; i < generos.length; i++) {
                    sqlquery += `Posts.idGender = @genero${i} OR `;
                    request.input(`genero${i}`, sql.Int, generos[i]);
                }
                sqlquery = sqlquery.slice(0, -4);
                sqlquery += ')';
            } else {
                sqlquery += ` AND Posts.idGender = @genero0 `;
                request.input('genero0', sql.Int, generos[0]);
            }
        }

        if (precios) {
            sqlquery += ` AND (Posts.price > @precioMin AND Posts.price < @precioMax)`;
            request.input('precioMin', sql.Decimal, precios[0]);
            request.input('precioMax', sql.Decimal, precios[1]);
        }

        if (colores && colores.length > 0) {
            if (colores.length > 1) {
                sqlquery += ' AND ('
                for (let i = 0; i < colores.length; i++) {
                    sqlquery += `Posts.idColor = @color${i} OR `;
                    request.input(`color${i}`, sql.Int, colores[i]);
                }
                sqlquery = sqlquery.slice(0, -4);
                sqlquery += ')';
            } else {
                sqlquery += ` AND Posts.idColor = @color0`;
                request.input('color0', sql.Int, colores[0]);
            }
        }

        if (prendas && prendas.length > 0) {
            if (prendas.length > 1) {
                sqlquery += ' AND ('
                for (let i = 0; i < prendas.length; i++) {
                    sqlquery += `Posts.wearType = @prenda${i} OR `;
                    request.input(`prenda${i}`, sql.Int, prendas[i]);
                }
                sqlquery = sqlquery.slice(0, -4);
                sqlquery += ')';
            } else {
                sqlquery += ` AND Posts.wearType = @prenda0 `;
                request.input('prenda0', sql.Int, prendas[0]);
            }
        }

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        let result = await request.query(`
            SELECT * FROM Posts
            WHERE ${sqlquery}
            ORDER BY Posts.id
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `);


        return result.recordset;
    }

    addSearchToHistory = async (idUser, searchTerm) => {
        const pool = await poolPromise;
        const request = new sql.Request(pool);
    
        try {
            // Definir las variables antes de cualquier consulta
            request.input('idUser', sql.Int, idUser);
            request.input('search', sql.NVarChar, searchTerm);
    
            // Validar si ya existe una búsqueda igual para el usuario
            const existingSearch = await request.query(`
                SELECT 1 FROM dbo.History
                WHERE idUser = @idUser AND search = @search
            `);
    
            if (existingSearch.recordset.length === 0) {
                // Insertar la nueva búsqueda si no existe
                await request.query(`
                    INSERT INTO dbo.History (idUser, search)
                    VALUES (@idUser, @search)
                `);
                return true;
            }
    
            return false; // No se insertó porque ya existía
        } catch (error) {
            console.error('Error al agregar búsqueda al historial:', error);
            throw error;
        }
    };
    
    

    getByIdAsync = async (table_name, id, id_user) => {
        let pool = await poolPromise;
        let result = await pool.request()
            .input('pid', sql.Int, id)
            .query(`SELECT * FROM ${table_name} WHERE id = @pid`);

        let marca = await pool.request().query(`
        select Users.id from Users
        left join Posts on Users.id = posts.idCreator
        where posts.id = ${id}
        `)

        let historia = await pool.request().query(`
        IF (SELECT COUNT(*) FROM dbo.History WHERE idUser = ${id_user}) >= 20
            BEGIN
                
                DELETE FROM dbo.History
                WHERE idUser = ${id_user}
                AND (id) = (
                    SELECT TOP 1 id FROM dbo.History 
                    WHERE idUser = ${id_user}
                    ORDER BY id ASC 
                );
            END
            
            
            INSERT INTO dbo.History (idUser, idBrand)
            VALUES (${id_user}, ${marca.recordset[0].id})
        `);
        return result.recordset;
    }
    getSearchAsync = async (buscado,id,limit) => {

        console.log("search?");

        let pool = await poolPromise;
        let result;
        var query1=`select * from Posts where name like '% ${buscado} %' or name like '% ${buscado}' or name like '${buscado} %' or description like '% ${buscado} %' or description like '${buscado} %' or description like '% ${buscado}'`;
        console.log(query1);

        result = await pool.request().query(query1)
        if(result.recordset.length >0){

            const query=`
            IF NOT EXISTS (
                SELECT 1
                FROM dbo.History
                WHERE idUser = ${id}
                AND search = '${buscado}'
            )
            BEGIN
                IF (SELECT COUNT(*) FROM dbo.History WHERE idUser = ${id}) = 20 AND (SELECT TOP 1 idBrand FROM dbo.History WHERE idUser = 2 ORDER BY id ASC) IS NULL
                BEGIN
                    UPDATE dbo.History
                    SET search = '${buscado}'
                    WHERE idUser = ${id}
                    AND id = (
                        SELECT TOP 1 id
                        FROM dbo.History
                        WHERE idUser = ${id}
                        ORDER BY id ASC
                    );
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.History (idUser, search)
                    VALUES (${id}, '${buscado}');
                END
            END
            `;
            console.log(query);

            result = await pool.request().query(query);
        }



        const queryPrendas= `SELECT TOP ${limit} Posts.*
        FROM Posts
        LEFT JOIN ColorTag ON Posts.id = ColorTag.idPost
        LEFT JOIN Colors ON ColorTag.idColor = Colors.id
        WHERE 
            Posts.name LIKE '%${buscado}%' OR 
            Posts.description LIKE '%${buscado}%' OR 
            Colors.nombre LIKE '%${buscado}%';
`;

console.log(queryPrendas);

        const prendas = await pool.request().query(
           queryPrendas);
        const marcas = await pool.request().query(`select top 5 * from Users where username like '%${buscado}%'`)

        const resultado ={
            prendas: prendas.recordset,
            marcas: marcas.recordsets
        }
        return resultado;
    }

    getPostByBrand = async (username,offset,limit) => {
        console.log(username,offset,limit)
        let pool = await poolPromise;
        let result = await pool.request().query(`
        SELECT * FROM Posts 
        WHERE idCreator = (
            SELECT id FROM Users WHERE username = '${username}'
        )
        ORDER BY id DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY;
    `);

        return result.recordset;
    }
    getRandomPostsAsync = async (iduser) => {
        let pool = await poolPromise;
        let result = await pool.request().query(`WITH Historial AS (
                SELECT * FROM History WHERE iduser = ${iduser}
            ),
            SearchTerms AS (
                SELECT DISTINCT search FROM Historial WHERE idBrand IS NULL
            ),
            BrandTerms AS (
                SELECT DISTINCT idBrand FROM Historial WHERE idBrand IS NOT NULL
            ),
            PostsBusqueda AS (
                SELECT TOP (20 / 4) * 
                FROM posts
                WHERE EXISTS (SELECT 1 FROM SearchTerms WHERE posts.description LIKE '%' + search + '%' or posts.name LIKE '%' + search + '%')
                ORDER BY NEWID()
            ),
            PostsMarca AS (
                SELECT TOP (20 / 4) *
                FROM posts
                WHERE EXISTS (SELECT 1 FROM BrandTerms WHERE posts.idCreator = idBrand)
                AND posts.id NOT IN (SELECT id FROM PostsBusqueda)
                ORDER BY NEWID()
            ),
            PostsFaltantes AS (
                SELECT TOP (20 / 2) *
                FROM posts
                WHERE posts.id NOT IN (SELECT id FROM PostsBusqueda)
                AND posts.id NOT IN (SELECT id FROM PostsMarca)
                ORDER BY NEWID()
            )
            SELECT *
            FROM (
                SELECT * FROM PostsBusqueda
                UNION ALL
                SELECT * FROM PostsMarca
                UNION ALL
                SELECT * FROM PostsFaltantes
            ) AS CombinedPosts
            ORDER BY NEWID();`);
            return result.recordset;
    }
    getOffsetAsync = async (buscado,offset,limit) => {
        let pool = await poolPromise;
        let result = await pool.request().query(`SELECT * FROM Posts where name like '%${buscado}%' OR description like '%${buscado}%' ORDER BY id OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`);

        return result.recordset;
    }
    getUserHistory = async (idUser) => {
        let pool = await poolPromise;
        let result = await pool.request()
            .input('idUser', sql.Int, idUser)
            .query(`
                SELECT TOP 5 *
                FROM History
                WHERE idUser = @idUser
                ORDER BY id DESC
            `);
        return result.recordset;
    };

    blockHistoryItem = async (id) => {
        let pool = await poolPromise;
        const request = new sql.Request(pool);

        request.input('id', sql.Int, id);

        const result = await request.query(`
        DELETE FROM dbo.History
        WHERE id = @id;
        `);

        return result.rowsAffected[0] > 0;
    };
    
    getUserPosts = async (iduser) => {
        let pool = await poolPromise;
        let result = await pool.request()
            .input('idUser', sql.Int, iduser)
            .query(`
                SELECT * FROM Posts p
                JOIN PostsXUser pu ON p.id = pu.idPost
                WHERE pu.idUser = @idUser;
            `);
        return result.recordset;
    }
}