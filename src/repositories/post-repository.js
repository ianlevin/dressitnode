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

    getByIdAsync = async (table_name, id) => {
        let pool = await poolPromise;
        let result = await pool.request()
            .input('pid', sql.Int, id)
            .query(`SELECT * FROM ${table_name} WHERE id = @pid`);
        return result.recordset;
    }
    getSearchAsync = async (buscado) => {
        let pool = await poolPromise;
        let result = await pool.request().query(`select * from Posts where name like '%${buscado}%' OR description like '%${buscado}%'`);

        return result.recordset;
    }

    getPostByBrand = async (id) => {
        let pool = await poolPromise;
        let result = await pool.request().query(`select * from Posts where idBrand = ${id}`);

        return result.recordset;
    }
    getRandomPostsAsync = async (iduser,limit) => {
        let postsfinal = [];
        let pool = await poolPromise;
        let historial = await pool.request().query(`select * from History where iduser = ${iduser}`);
        let brand = [];
        historial = historial.recordset;
        let search = [];
        for(let i = 0; i<historial.length; i++){
            if(historial[i].idBrand == null){
                search.push(historial[i].search);
            }else{
                brand.push(historial[i].search);
            }
        }
        // prendas por historial de busqueda
        let stringsqlsearch = "where ";
        for(let i = 0; i<search.length; i++){
            stringsqlsearch += `description like '%${search[i]}%' or `
        }
        if(stringsqlsearch.length == 6){
            stringsqlsearch = "";
        }else{
            stringsqlsearch = stringsqlsearch.substring(0,(stringsqlsearch.length-4))
        }
        console.log(limit)
        let postsbusqueda = await pool.request().query(`select top ${(limit/4)} * from posts ${stringsqlsearch}`);
        
        //setear en una variable los ids de las prendas para que no se repitan
        let idprendas = [];
        for(let i = 0; i<(postsbusqueda.recordset.length); i++){
            idprendas.push(postsbusqueda.recordset[i].id)
        }
        console.log("aaa",idprendas)

        // prendas por historial de marcas
        let postsmarca = [];
        let resultmarca;
        for(let i = 0;i<(limit/4) ;i++){
            resultmarca = await pool.request().query(`select top 1 * from posts where idCreator = ${brand[i]}`);
            postsmarca.push(resultmarca.recordset)
            idprendas.push(resultmarca.recordset.id)
        }


        return result.recordset;
    }
}
