"use strict";

function createCard(
    title,
    contents = null,
    modalContents = null,
    folded = false
) {
    // Create the main card div
    var card = $("<div>", { class: "card" });

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

function createAdapterCard(adapter) {
    var adapterCardWrapper = $("<div>", { class: "adapter-card-wrapper" });

    var infoLineDead = $("<div>", { class: "adapter-card-info-line" }).html(`
        <div>Dead: </div>
        <div class="adapter-card-info-line-status">
            <div>${adapter.dead}</div>
            <div 
                class="adapter-card-info-line-indicator"
                style="background-color: ${adapter.dead ? "#F00" : "#0A0"};"
            >
            </div>
        </div>
    `);

    var infoLineHostName = $("<div>", { class: "adapter-card-info-line" })
        .html(`
        <div>Host Name: </div>
        <div>${adapter.hostName}</div>
    `);

    var infoLinePort = $("<div>", { class: "adapter-card-info-line" }).html(`
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
            $("<label>", {
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

        //showMainModal("added new adaprer");
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

var clusterCard;

$(function () {
    updateClusters();
    $("#register-adapter-container").append(createRegisterAdapterFormCard());
});