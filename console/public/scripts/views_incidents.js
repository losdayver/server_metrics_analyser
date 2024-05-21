function generateColorBetweenGreenAndRed(min, max, value) {
    // Validate input
    if (value < min) value = min;
    if (value > max) value = max;

    // Calculate the ratio between the value and the range
    const ratio = (value - min) / (max - min);

    // Calculate the red and green components based on the ratio
    const red = Math.round(255 * ratio);
    const green = Math.round(255 * (1 - ratio));

    // Convert the red and green components to hexadecimal strings
    const redHex = red.toString(16).padStart(2, "0");
    const greenHex = green.toString(16).padStart(2, "0");

    // Combine the red and green components into a hexadecimal color code
    const hexColor = `#${redHex}${greenHex}00`;

    return hexColor;
}

function createIncident(incident) {
    const date = new Date(incident.DateTime);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const timeString = `${hours}:${minutes}:${seconds}`;

    var incidentNode = $(`
        <div class="incident">
            <div class="incident-header">
                <div class="incident-date-time">
                    <div class="incident-time">${timeString}</div>
                    <div class="incident-date">${dateString}</div>
                </div>
                <div class="incident-identifier">Adapter-Stub-1</div>
            </div>
            <div class="incident-contents">
                <div class="incident-hostname">${incident.HostName}</div>
                <div class="incident-dial">${incident.Dial.Name}</div>
            </div>
            <div class="incident-footer">
                <div class="incident-value">${incident.Value.toFixed(2)}</div>
                <div class="incident-unit">${incident.Dial.Unit}</div>
            </div>
        </div>
    `);

    var color = generateColorBetweenGreenAndRed(
        incident.Dial.Threshold * 0.75,
        incident.Dial.Threshold * 1.5,
        incident.Value
    );

    $(incidentNode).children(".incident-footer").css("background-color", color);

    return incidentNode;
}

async function updateIncidents() {
    $("#incident-list-container").find("*").remove();

    var response = await fetch(CONTROLLER_API_URL + "incidents" + window.location.search);

    var data = await response.json();

    // iterate through clusters
    for (let incident of data.reverse()) {
        $("#incident-list-container").append(createIncident(incident));
    }
}

async function setupIncidentsPageNumberForm() {
    const response = await fetch(CONTROLLER_API_URL + "incidents/length/");

    const length = (await response.json()).length;

    const pagesNum = Math.floor(length / 20);

    const form = $("#incident-page-form");
    const pageInput = $("#incident-page-form-number");

    $(pageInput).attr("placeholder", "Всего страниц: " + pagesNum);

    $(form).on("submit", function () {
        event.preventDefault();
        var pageNum = $(pageInput).val() ? ($(pageInput).val() === 0 ? 1 : $(pageInput).val()) : 1;
        window.location.href = CONSOLE_URL + "views-incidents?" +
            `from=${(pageNum - 1) * 20}` + `&to=${(pageNum - 1) * 20 + 20}`;
    });
}

$(function () {
    updateIncidents();
    setupIncidentsPageNumberForm();
});
