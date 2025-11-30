document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    // Puedes cambiar estos datos por los que quieras
    let validEmail = "admin@barbershop.com";
    let validPassword = "12345";

    if (email === validEmail && password === validPassword) {
        localStorage.setItem("accessGranted", "true");
        window.location.href = "index.html";
    } else {
        document.getElementById("loginError").style.display = "block";
    }
});
