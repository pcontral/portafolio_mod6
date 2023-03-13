const express = require('express');
const app = express();
const { create } = require('express-handlebars'); //npm i express-handlebars
const { v4: uuid } = require('uuid');
const fs = require('fs');
const moment = require('moment')

//CONNFIGURACIONES Y MIDDLEWARES

app.use(express.json());
app.use(express.urlencoded({extended:false}));
const hbs = create({
    partialsDir: ["views/partials"]
})

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./views");


//publicar una carpeta o archivo - SE PUBLICA CARPETA DE IMÁGENES
//al poner /imagenes asignando ruta dinamica, dirname es el directoyio raiz donde se ejecuta la aplicacion
app.use("/imagenes", express.static(__dirname+"/public/imagenes")); 
app.use("/css", express.static(__dirname+"/public/css")); 

//MÉTODO LISTEN PARA LEVANTAR SERVIDOR
app.listen(3000, () => console.log("http://localhost:3000"))

//RUTAS PARA LAS VISTAS
app.get("/", (req, res) =>{
    res.render("home");
})
app.get("/inventario", (req, res) =>{
    res.render("inventario");
})
app.get("/carrito", (req, res) =>{
    res.render("carrito");
})

app.get("/ventas", (req, res) =>{
    res.render("ventas");
})

app.get("/productos/:id", (req, res) => {
    let id = req.params.id;
    let productosTienda = JSON.parse(fs.readFileSync("productos.json", "utf-8"));
    let productoBuscado = productosTienda.productos.find(producto => producto.id == id);
    res.render("producto", {
        producto: productoBuscado
    });
})

//RUTAS / ENDPOINTS PRODUCTOS
app.route("/api/productos")
    .get((req, res) =>{
        fs.readFile("productos.json", "utf8", (error, data)=> {
            if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
            let productos = JSON.parse(data);
            res.json(productos);
        })
    })
    .post((req, res) =>{
        let nuevoProducto = req.body;
        nuevoProducto.id = uuid().slice(0,6);
        fs.readFile("productos.json", "utf8", (error, data)=> {
            if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
            let productos = JSON.parse(data);

            productos.productos.push(nuevoProducto);

            fs.writeFile("productos.json", JSON.stringify(productos, null, 4), "utf8", (error) => {
                if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
                res.json(productos);
            })

        })
    })
    .put((req, res) =>{
        fs.readFile("productos.json", "utf8", (error, data)=> {
            if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
            let productos = JSON.parse(data);
            let productoActulizado = req.body;

            productos.productos = productos.productos.map(producto => {
                if(producto.id == productoActulizado.id){
                    producto = productoActulizado;
                }
                console.log(producto);
                return producto;
            })

            fs.writeFile("productos.json", JSON.stringify(productos, null, 4), "utf8", (error) => {
                if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
                res.json({code: 201, message:"Producto actualizado correctamente."})
            })

        })
    })
    .delete((req, res) =>{
        let {id} = req.query || false;//obtenemos el id del producto enviado mediante la url

        if(id){
            fs.readFile("productos.json", "utf8", (error, data)=> {
                if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
                let productos = JSON.parse(data);
    
                productos.productos = productos.productos.filter(producto => producto.id != id)

                fs.writeFile("productos.json", JSON.stringify(productos, null, 4), "utf8", (error) => {
                    if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
                    res.json(productos);
                })
    
            })
        }else {
            res.status(400).send({code: 400, message: "debe proporcionar el id del producto a eliminar."})
        }
    })

    //RUTA QUE PERMITIRÁ FILTRAR POR ID
app.route("/api/productos/:id")
    .get((req, res) =>{
        let { id } = req.params;
        fs.readFile("productos.json", "utf8", (error, data)=> {
            if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
            let productos = JSON.parse(data);

            let productoBuscado = productos.productos.find(producto => producto.id == id);
            res.json(productoBuscado);
        })
    })

app.route("/api/productos/filter/:ids")
    .get((req, res) =>{
        let { ids } = req.params;
        fs.readFile("productos.json", "utf8", (error, data)=> {
            if(error) return res.status(500).end({code: 500, message: "No se ha podido acceder al listado de productos"});
            let productos = JSON.parse(data);

            let productosFiltrados = productos.productos.filter(producto => ids.includes(producto.id));
            res.json(productosFiltrados);
        })
 })


//RUTAS / ENDPOINTS VENTAS
app.route("/api/ventas")
    .get((req, res) =>{
        leerArchivo("ventas.json").then(respuesta => {
            res.json(respuesta)
        }).catch(error => {
            return res.status(500).json({code: 500, message: error})
        })
    })
    .post((req, res) =>{
        let productos = req.body;
        let nuevaVenta = {
            id:  uuid().slice(0,6),
            fecha: moment().format('DD-MM-YYYY'),
            productos,
            total: 0
        }
        let productosTienda = JSON.parse(fs.readFileSync("productos.json", "utf-8"));

            nuevaVenta.productos.forEach(producto => {
            let productoEncontrado = productosTienda.productos.find(element => element.id == producto.id)
            console.log(productoEncontrado)
            nuevaVenta.total += productoEncontrado.precio * producto.cantidad;
            
        })

        leerArchivo("ventas.json")
            .then(ventas => {
                ventas.ventas.push(nuevaVenta);
                return ventas;
            })
            .then(data => {
                actualizarArchivo("ventas.json", data)
                    .then(respuesta => {
                    
                        return res.status(201).json({code: 201, message: respuesta})

                    }).catch(error => {
                        return res.status(500).json({code: 500, message: error})
                    })

            })
            .catch(error => {
                return res.status(500).send({code:500, message: error})
            }).finally(() => {
                descontarProductos(nuevaVenta).then(respuesta => {
                    console.log(respuesta)
                }).catch(error => {
                    console.log("error: ", error)
                })
            })
    })

    //funciones para reutilizar

    function leerArchivo(nombre) {
        return new Promise((resolve, reject) => {
            fs.readFile(nombre, "utf8", (error, data )=> {
                if(error) reject("Error al leer los datos.")
                data = JSON.parse(data);
                resolve(data);
            })
        })
    }
    
    function actualizarArchivo(nombre, data){
        return new Promise((resolve, reject) => {
            fs.writeFile(nombre, JSON.stringify(data, null, 4), "utf8", (error) => {
                if(error) reject("Error al registrar los datos.");
                resolve("Proceso se ha completado con éxito.");
            })
        })
    
    }

    function descontarProductos(productosADescontar){
        return new Promise((resolve, reject) => {
            leerArchivo("productos.json").then(data => {
                productosADescontar.productos.forEach(producto => {
                    let productoDescontado = data.productos.find(element => element.id == producto.id)
                    productoDescontado.stock = productoDescontado.stock - producto.cantidad;
                });
                actualizarArchivo("productos.json", data).then(respuesta => {
                    resolve(respuesta)
                }).catch(error => {
                    reject(error)
                })
            }).catch(error => {
                reject(error)
            })
        })
    }


