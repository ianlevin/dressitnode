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
                brand.push(historial[i].idBrand);
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
        let postsbusqueda = await pool.request().query(`select top ${(limit/4)} * from posts ${stringsqlsearch} ORDER BY NEWID()`);
        let busqueda_record = postsbusqueda.recordset;
        //setear en una variable los ids de las prendas para que no se repitan
        let stringprendas = "";
        for(let i = 0; i<(postsbusqueda.recordset.length); i++){
            stringprendas += ` and id != ${postsbusqueda.recordset[i].id}`

        }
        // prendas por historial de marcas
        let postsmarca = [];
        let resultmarca;
        // string con las marcas del historial
        let string_marcas = "";
        for(let i = 0;i<brand.length ;i++){
            string_marcas += `idCreator = ${brand[i]} or `
        }
        string_marcas = string_marcas.substring(0,(string_marcas.length-3))

        resultmarca = await pool.request().query(`select top ${limit/4} * from posts where ${string_marcas}${stringprendas} ORDER BY NEWID()`);
        postsmarca = resultmarca.recordset;
        //agregar los id en el string para que no se repitan los posts
        for(let i = 0; i<(postsmarca.length); i++){
            stringprendas += ` and id != ${postsbusqueda.recordset[i].id}`
        }

        console.log(`select top ${limit/2} * from posts where id != 1 ${stringprendas} ORDER BY NEWID()`)
        // prendas random que quedan
        let prendas_faltantes = await pool.request().query(`select top ${limit/2} * from posts where id != 1 ${stringprendas} ORDER BY NEWID()`)
        let faltantes_record = prendas_faltantes.recordset;

        // por busqueda: busqueda_record, por marca: postsmarca, faltantes random: faltantes_record

        let vector = [...busqueda_record, ...postsmarca,...faltantes_record]

        return vector;

    }
}
