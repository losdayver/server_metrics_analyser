function createAdapterCard(adapter) {
    var adapterCardWrapper = $("<div>", { class: "contents-card-wrapper" });

    var infoLineDead = $("<div>", { class: "contents-card-info-line" }).html(`
        <div>Dead: </div>
        <div class="contents-card-info-line-status">
            <div>${adapter.dead}</div>
            <div 
                class="contents-card-info-line-indicator"
                style="background-color: ${adapter.dead ? "#F00" : "#0A0"};"
            >
            </div>
        </div>
    `);

    var infoLineHostName = $("<div>", { class: "contents-card-info-line" })
        .html(`
        <div>Host Name: </div>
        <div>${adapter.hostName}</div>
    `);

    var infoLinePort = $("<div>", { class: "contents-card-info-line" }).html(`
        <div>Port: </div>
        <div>${adapter.port}/TCP</div>
    `);

    $(adapterCardWrapper)
        .append(infoLineDead)
        .append(infoLineHostName)
        .append(infoLinePort);

    var card = createCard(
        `${adapter.hostName}:${adapter.port}`,
        adapterCardWrapper
    );

    return card;
}

function createClusterCard(cluster) {
    var modalContents = $("<div></div>").append(
        `<h2>${cluster.identifier}</h2>`
    );

    modalContents.append("<h3>Dials:</h3>");

    for (let dial of cluster.dials) {
        modalContents
            .append(`<h4>${dial.Name}</h4>`)
            .append(`<p>Unit: ${dial.Unit}</p>`)
            .append(`<p>Threshold: ${dial.Threshold}</p>`)
            .append(`<p>Run Count: ${dial.RunCount}</p>`);
    }

    modalContents.append("<h3>Hosts:</h3>");

    for (let host of cluster.hosts) {
        modalContents.append(`<h4>${host.HostName}</h4>`);
    }

    var card = createCard(cluster.identifier, null, modalContents, true);
    var cardContainer = $("<div>", { class: "card-container" });

    for (let adapter of cluster.adapters) {
        let adapterCard = createAdapterCard(adapter);

        $(cardContainer).append(adapterCard);
    }

    $(card).children(".card-contents").append(cardContainer);

    return card;
}

function createRegisterAdapterFormCard() {
    var form = $("<form>")
        .append(
            $("<label>Host Name: </label>", {
                for: "register-adapter-container-hostname",
            })
        )
        .append(
            $("<input>", {
                type: "text",
                name: "register-adapter-container-hostname",
                id: "register-adapter-container-hostname",
            })
        )
        .append(
            $("<label>Port: </label>", {
                for: "register-adapter-container-port",
            })
        )
        .append(
            $("<input>", {
                type: "text",
                name: "register-adapter-container-port",
                id: "register-adapter-container-port",
            })
        );

    var input = $("<input>", {
        type: "submit",
        name: "register-adapter-container-submit",
        id: "register-adapter-container-submit",
    });

    $(input).click(async function () {
        event.preventDefault();

        var body = {
            HostName: $("#register-adapter-container-hostname").val(),
            Port: $("#register-adapter-container-port").val(),
        };

        console.log(body);

        try {
            var response = await fetch(CONTROLLER_API_URL + "clusters/", {
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

    return createCard("Register New Adapter", form, null, false);
}

async function updateClusters() {
    $("#adapter-cards-container").find("*").remove();

    var response = await fetch(CONTROLLER_API_URL + "clusters", {
        mode: "cors",
    });

    var data = await response.json();

    // iterate through clusters
    for (let cluster of data) {
        $("#adapter-cards-container").append(createClusterCard(cluster));
    }
}

$(function () {
    updateClusters();
    $("#register-adapter-container").append(createRegisterAdapterFormCard());
});
