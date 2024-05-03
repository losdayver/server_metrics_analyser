function showMainModal(content) {
    $("#main-modal-contents").html(content);
    $("#main-modal").show();
}

$(document).ready(function () {
    // Close modal
    $("#main-modal-close").click(function () {
        $("#main-modal").hide();
    });
});
