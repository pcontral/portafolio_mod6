const fs = require('fs');
let descuento = [ { id: 'f9ff02', cantidad: 1 } ]

function leerArchivo(nombre) {
    return new Promise((resolve, reject) => {
        fs.readFile(nombre, "utf8", (error, data )=> {
            if(error) reject("Error al leer los datos.")
            let data = JSON.parse(data);
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
            productosADescontar.forEach(producto => {
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
descontarProductos(descuento);