document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const credentials = btoa(`${username}:${password}`);

    try {
        const response = await fetch("https://01.kood.tech/api/auth/signin", {
            method: "POST",
            headers: {
                Authorization: `Basic ${credentials}`,
            },
        });

        if (!response.ok) {
            throw new Error("Invalid credentials");
        }

        const data = await response.json();
        const jwtToken = data;

        localStorage.setItem("jwtToken", jwtToken);

        window.location.href = "profile.html";
    } catch (error) {
        document.getElementById("error-message").textContent = error.message;
    }
});
