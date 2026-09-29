const API_BASE_URL = "https://expense-tracker-abe2.onrender.com";

function apiUrl(url) {
    return `${API_BASE_URL}${url}`;
}

// ==============================
// LOGIN
// ==============================

document
    .getElementById("loginForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value;

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");

        try {

            // Get CSRF token
            const csrfResponse = await fetch(
                apiUrl("/api/auth/csrf"),
                {
                    credentials: "include"
                }
            );

            if (!csrfResponse.ok) {
                message.textContent =
                    "Unable to get security token.";
                return;
            }

            const csrfData =
                await csrfResponse.json();

            // Login with CSRF token
            const response = await fetch(
                apiUrl("/api/auth/login"),
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json",
                        "X-XSRF-TOKEN": csrfData.token
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            if (!response.ok) {

                const error =
                    await response.text();

                message.textContent = error;
                return;
            }

            await response.json();

            // Open dashboard
            window.location.href = "index.html";

        } catch (error) {

            console.error(error);

            message.textContent =
                "Unable to connect to server.";
        }

    });