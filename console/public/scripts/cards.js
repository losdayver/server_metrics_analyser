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
