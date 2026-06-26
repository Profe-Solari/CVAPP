
alert("JavaScript cargado");
// Buscamos el botón por su id
const boton = document.getElementById("login");

// Esperamos a que el usuario haga clic
boton.addEventListener("click", function() {

    // Leemos lo que escribió en el correo
    const correo = document.getElementById("gmail").value;

    // Si termina en @moron.gob.ar
    if (correo.endsWith("@moron.gob.ar")) {

        window.location.href = "../pagina municipio/municipio.html";

    }

    // Si termina en .edu.ar
    else if (correo.endsWith(".edu.ar")) {

        window.location.href = "escuela.html";

    }

    // Si no coincide con ninguno
    else {

        alert("Correo no autorizado.");

    }

});