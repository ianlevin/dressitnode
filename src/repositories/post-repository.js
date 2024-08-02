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

    getByIdAsync = async (table_name, id, id_user) => {
        let pool = await poolPromise;
        let result = await pool.request()
            .input('pid', sql.Int, id)
            .query(`SELECT * FROM ${table_name} WHERE id = @pid`);

        let marca = await pool.request().query(`
        select username from Users
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
            
            
            INSERT INTO dbo.History (idUser, search)
            VALUES (${id}, '${marca.recordset[0].username}'
        `);

        return result.recordset;
    }
    getSearchAsync = async (buscado,id) => {
        console.log(buscado)
        console.log(id)
        let pool = await poolPromise;
        let result;
        result = await pool.request().query(`select * from Posts where name like '% ${buscado} %' or name like '% ${buscado}' or name like '${buscado} %' or description like '% ${buscado} %' or description like '${buscado} %' or description like '% ${buscado}'`)
        console.log(result)
        if(result.recordset.length >0){
            result = await pool.request().query(`
            IF NOT EXISTS (
                SELECT 1
                FROM dbo.History
                WHERE idUser = ${id}
                AND search = '${buscado}'
            )
            BEGIN
                -- Si el número de registros es exactamente 20, actualiza el registro más antiguo
                IF (SELECT COUNT(*) FROM dbo.History WHERE idUser = ${id}) = 20
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
                    -- Si el número de registros es menor de 20, inserta un nuevo registro
                    INSERT INTO dbo.History (idUser, search)
                    VALUES (${id}, '${buscado}');
                END
            END
            `);
        }
        
            
        
        result = await pool.request().query(`select * from Posts where name like '%${buscado}%' OR description like '%${buscado}%'`);

        return result.recordset;
    }

    getPostByBrand = async (id) => {
        let pool = await poolPromise;
        let result = await pool.request().query(`select * from Posts where idBrand = ${id}`);

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
}
