const {Pool} = require('pg');

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    password: "camilo20",
    port: 5432,
    database: "skatepark",
});

async function nuevoUsuario(email, nombre, password, experiencia, especialidad, foto) {
    const result = await pool.query(
        `INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) values ('${email}', '${nombre}', '${password}', ${experiencia}, '${especialidad}', '${foto}', false) RETURNING *`
    );
    const usuario = result.rows[0];
    return usuario;
};

async function getUsuarios() {
    const result = await pool.query('SELECT * FROM skaters');
    return result.rows
};

async function setUsuarioStatus(id, estado) {
    const result = await pool.query(
        `UPDATE skaters SET estado = ${estado} WHERE id = ${id} RETURNING *`
    );
    const usuario = result.rows[0];
    return usuario;
};

async function getUsuario(email, password) {
    const result = await pool.query(
        `SELECT * FROM skaters WHERE email = '${email}' AND password = '${password}'`
    );
    return result.rows[0];
};

async function setUsuario(email, nombre, password, experiencia, especialidad, nuevoNombre) {
    const result = await pool.query(
        `UPDATE skaters SET password = '${password}', anos_experiencia = ${experiencia}, especialidad = '${especialidad}', nombre = '${nuevoNombre}' WHERE email = '${email}' AND nombre = '${nombre}' RETURNING *`
    );
    const usuario = result.rows[0];
    return usuario;
};

async function deleteUsuario (email) {

    const result = await pool.query(`DELETE FROM skaters WHERE email ='${email}'`);
    return result.rows[0];
};

module.exports = { nuevoUsuario, getUsuarios, setUsuarioStatus, getUsuario, setUsuario, deleteUsuario }