"use strict";

function createCard(
    title,
    contents = null,
    modalContents = null,
    folded = false
) {
    // Create the main card div
    var card = $("<div>", { class: "card" });
    $(card).addClass("fade-in");

    if (folded) {
        $(card).addClass("folded");
    }

    // Create the card heading
    var cardHeading = $("<div>", { class: "card-heading" });
    var h3 = $("<h3>").text(title);
    cardHeading.append(h3);

    // Create the card heading buttons
    var cardHeadingButtons = $("<div>", { class: "card-heading-buttons" });

    if (modalContents) {
        var buttonInfo = $("<img>", {
            class: "card-button-info",
            src: "media/svg/info-lg.svg",
        });
        buttonInfo.click(function () {
            showMainModal(modalContents);
        });
        cardHeadingButtons.append(buttonInfo);
    }

    var buttonFold = $("<img>", {
        class: "card-button-fold",
        src: "media/svg/caret-down.svg",
    });
    buttonFold.click(function () {
        if ($(card).hasClass("folded")) {
            $(card).removeClass("folded");
        } else {
            $(card).addClass("folded");
        }
    });
    cardHeadingButtons.append(buttonFold);

    cardHeading.append(cardHeadingButtons);

    // Create the card contents
    var cardContents = $("<div>", {
        class: "card-contents",
    });
    cardContents.append(contents);

    // Append all elements to the card
    card.append(cardHeading, cardContents);

    return card;
}

async function updateWorkers() {
    $("#worker-cards-container").find("*").remove();

    var response = await fetch(CONTROLLER_API_URL + "workers/", {
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

function createDialCard(dial) {
    var dialCardWrapper = $("<div>", { class: "contents-card-wrapper" });

    var infoLineName = $("<div>", { class: "contents-card-info-line" }).html(`
        <div>Name: </div>
        <div>${dial.Name}</div>
    `);

    var infoLineUnit = $("<div>", { class: "contents-card-info-line" }).html(`
        <div>Unit: </div>
        <div>${dial.Unit}</div>
    `);

    var infoLineThreshold = $("<div>", { class: "contents-card-info-line" })
        .html(`
        <div>Threshold: </div>
        <div>${dial.Threshold}</div>
    `);

    var infoLineRunCount = $("<div>", { class: "contents-card-info-line" })
        .html(`
        <div>RunCount: </div>
        <div>${dial.RunCount}</div>
    `);

    $(dialCardWrapper)
        .append(infoLineName)
        .append(infoLineUnit)
        .append(infoLineThreshold)
        .append(infoLineRunCount);

    var card = createCard(`${dial.Name}`, dialCardWrapper, null, true);

    return card;
}

function createDialsCard(dials) {
    var dialsCardWrapper = $("<div>", { class: "contents-card-wrapper" });

    for (let dial of dials) {
        $(dialsCardWrapper).append(createDialCard(dial));
    }

    var card = createCard("List of Dials", dialsCardWrapper, null, true);

    return card;
}
