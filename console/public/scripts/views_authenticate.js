$(function () {
    const form = $("#authenticate-form");

    $(form).submit(async function () {
        event.preventDefault();

        var body = {
            username: $("#authenticate-form-username").val(),
            password: $("#authenticate-form-password").val(),
        };

        console.log(body);

        try {
            var response = await fetch(CONTROLLER_AUTH, {
                method: "POST",
                mode: "cors",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (response.status != "200") {
                showMainModal(await response.text());
                return;
            }

            var obj = await response.json();

            document.cookie = `auth = ${obj.sessionToken}; expires = Thu, 18 Dec 2025 12:00:00 UTC; path = /`;

            showMainModal("Success!");

            await new Promise(r => setTimeout(r, 1000));

            window.location.href = CONSOLE_URL + "dashboard";
        } catch (err) {
            showMainModal(err.message);
            return;
        }
    });
});