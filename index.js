// Importaciones dependencias
const express = require('express');
const app = express();
const { engine } = require('express-handlebars');
const expressFileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const secretKey = 'Mi llave secreta';
const Handlebars = require("handlebars");

const {nuevoUsuario, getUsuarios, setUsuarioStatus, getUsuario, setUsuario, deleteUsuario} = require('./consultas');
// const send = require("./correo")

//Server
app.listen(3000, () => console.log('Server ON'));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(
    expressFileUpload({
        limits:{ fileSize: 5000000 },
        abortOnLimit: true,
        responseOnLimit: 'El tamaño de la imagen supera el límite permitido',
    })
);
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

Handlebars.registerHelper("inc", function(value, options)
{
return parseInt(value) + 1;
});

app.engine(
    'handlebars',
    engine({
        defaultLayout: 'main',
        layoutsDir: `${__dirname}/views/mainLayout`,
    })
);
app.set('view engine', 'handlebars');


//Rutas
app.get('/', async (req, res) => {
    try{
        const usuarios = await getUsuarios();
        res.render('index', { usuarios });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    }; 
});

app.get('/Login', function (req, res) {
    res.render('Login');
});

app.get('/Registro', function (req, res) {
    res.render('Registro');
});

app.get('/Admin', async (req, res) => {
    try{
        const usuarios = await getUsuarios();
        res.render('Admin', { usuarios });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    }; 
});

app.get("/Datos", function (req, res) {
    const {token} = req.query;
    jwt.verify(token, secretKey, async (err, decoded) => {
        const { data } = decoded
        const {nombre, email, anos_experiencia, especialidad} = data
        err
            ? res.status(401).send(
                res.send({
                    error: "401 Unauthorized",
                    message: "Usted no está autorizado para estar aquí",
                    token_error: err.mesagge,
                })
            )
            : res.render("Datos", {nombre, email, anos_experiencia, especialidad});
    });
});

app.post("/registrar", (req, res) => {
    const {foto} = req.files;
    const {name} = foto;
    const {email, nombre, password, repassword, experiencia, especialidad} = req.body;
    try{

        foto.mv(`${__dirname}/public/imagenes/${name}`, async (err) => {
            if(err) return res.status(500).send({
                error: `Algo salió mal... ${err}`,
                code: 500
            })

            if(password !== repassword) return res.status(401).send({
                error: `Verifique su password`,
                code: 401
            })
            else {
                const usuario = await nuevoUsuario(email, nombre, password, experiencia, especialidad, name)
                .then(() => {
                    res.status(201).render("Login")
                })
                .catch((e) => {
                    res.status(500).send({
                        error: `Algo salió mal... ${e}`,
                        code: 500
                    })
                })
            }
        });

    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.post("/verify", async function (req, res) {
    const {email, password} = req.body;
    const user = await getUsuario(email, password);
    if(user){
        if(user.estado) {
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 180,
                    data: user,
                },
                secretKey
            );
            res.send(token)
        } else {
            res.status(401).send({
                error: "Este usuario aún no ha sido validado para ingresar",
                code: 401,
            });
        }
    } else {
        res.status(404).send({
            error: "Este usuario no está registrado en la base de datos",
            code: 404,
        });
    }
});

app.put('/usuarios', async (req, res) => {
    const {id, estado} = req.body;
    try {
        const usuario = await setUsuarioStatus(id, estado);
        res.status(200).send(usuario);
        
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.put('/usuario', async (req, res) => {
    const { email, nombre, password, experiencia, especialidad, nuevoNombre } = req.body;
    try {
        const usuario = await setUsuario(email, nombre, password, experiencia, especialidad, nuevoNombre);
        res.status(200).send(usuario);
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.delete("/usuario/:email", async (req, res) => {

    const {email} = req.params;
    try{
        const usuario = await deleteUsuario(email);
        res.status(200).send(usuario);
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});