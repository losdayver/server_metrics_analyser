async function updateWorkers() {
    $("#worker-cards-container").find("*").remove();

    var response = await fetch(CONTROLLER_API_URL + "workers", {
        mode: "cors",
    });

    var data = await response.json();

    // iterate through clusters
    for (let worker of data) {
        $("#worker-cards-container").append(createWorkerCard(worker));
    }
}

function createRegisterWorkerFormCard() {
    var form = $("<form>")
        .append(
            $("<label>Host Name: </label>", {
                for: "register-worker-container-hostname",
            })
        )
        .append(
            $("<input>", {
                type: "text",
                name: "register-worker-container-hostname",
                id: "register-worker-container-hostname",
            })
        )
        .append(
            $("<label>Port: </label>", {
                for: "register-worker-container-port",
            })
        )
        .append(
            $("<input>", {
                type: "text",
                name: "register-worker-container-port",
                id: "register-worker-container-port",
            })
        );

    var input = $("<input>", {
        type: "submit",
        name: "register-worker-container-submit",
        id: "register-worker-container-submit",
    });

    $(input).click(async function () {
        event.preventDefault();

        var body = {
            HostName: $("#register-worker-container-hostname").val(),
            Port: $("#register-worker-container-port").val(),
        };

        console.log(body);

        try {
            var response = await fetch(CONTROLLER_API_URL + "workers/", {
                method: "POST",
                mode: "cors",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
        } catch (err) {
            showMainModal(err.message);
            return;
        }

        showMainModal(await response.text());

        updateClusters();
    });

    $(form).append(input);

    return createCard("Register New Worker", form, null, false);
}

function createWorkerCard(worker) {
    var workerCardWrapper = $("<div>", { class: "contents-card-wrapper" });

    var infoLineDead = $("<div>", { class: "contents-card-info-line" }).html(`
        <div>Dead: </div>
        <div class="contents-card-info-line-status">
            <div>${worker.dead}</div>
            <div 
                class="contents-card-info-line-indicator"
                style="background-color: ${worker.dead ? "#F00" : "#0A0"};"
            >
            </div>
        </div>
    `);

    var infoLineHostName = $("<div>", { class: "contents-card-info-line" })
        .html(`
        <div>Host Name: </div>
        <div>${worker.hostName}</div>
    `);

    var infoLinePort = $("<div>", { class: "contents-card-info-line" }).html(`
        <div>Port: </div>
        <div>${worker.port}/TCP</div>
    `);

    var infoLineIdentifier = $("<div>", { class: "contents-card-info-line" })
        .html(`
        <div>Identifier: </div>
        <div>${worker.identifier}</div>
    `);

    $(workerCardWrapper)
        .append(infoLineDead)
        .append(infoLineHostName)
        .append(infoLinePort)
        .append(infoLineIdentifier);

    var card = createCard(
        `${worker.hostName}:${worker.port}`,
        workerCardWrapper,
        null,
        true
    );

    return card;
}

$(function () {
    updateWorkers();
    $("#register-worker-container").append(createRegisterWorkerFormCard());
});
