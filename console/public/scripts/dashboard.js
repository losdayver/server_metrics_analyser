/* global Chart */

const number_of_incidents_in_time = document.getElementById(
    "number_of_incidents_in_time"
);
const total_incidents_by_cluster = document.getElementById(
    "total_incidents_by_cluster"
);

("use strict");

$(function () {
    updateDashboard();
});

async function updateDashboard() {
    var response = await fetch(CONTROLLER_API_URL + "incidents", {
        mode: "cors",
    });
    var incidents = await response.json();

    var response = await fetch(CONTROLLER_API_URL + "clusters", {
        mode: "cors",
    });
    var clusters = await response.json();

    const incidentOccurrences = incidents.reduce((acc, obj) => {
        const { AdapterIdentifier } = obj;
        acc[AdapterIdentifier] = (acc[AdapterIdentifier] || 0) + 1;
        return acc;
    }, {});

    const incidentOccurrencesInTime = incidents.reduce((acc, obj) => {
        const { DateTime } = obj;

        // Create a new Date object from the input string
        const date = new Date(DateTime);

        // Format the date part
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;

        // Format the time part
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        //const seconds = String(date.getSeconds()).padStart(2, "0");
        const timeString = `${hours}:${minutes}`;

        var dateTimeString = `${dateString} ${hours}:${minutes}`;

        acc[dateTimeString] = (acc[dateTimeString] || 0) + 1;
        return acc;
    }, {});

    console.log(incidentOccurrencesInTime);

    new Chart(number_of_incidents_in_time, {
        type: "line",
        data: {
            labels: Object.entries(incidentOccurrencesInTime).map(
                (entrie) => entrie[0]
            ),
            datasets: [
                {
                    label: "incidents",
                    data: Object.entries(incidentOccurrencesInTime).map(
                        (entrie) => entrie[1]
                    ),
                    borderWidth: 2.5,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });

    new Chart(total_incidents_by_cluster, {
        type: "pie",
        data: {
            labels: Object.entries(incidentOccurrences).map(
                (entrie) => entrie[0]
            ),
            datasets: [
                {
                    label: "data1",
                    data: Object.entries(incidentOccurrences).map(
                        (entrie) => entrie[1]
                    ),
                },
            ],
        },
    });
}

const ctx4 = document.getElementById("myChart4");
const ctx5 = document.getElementById("myChart5");

for (let c of [ctx4, ctx5]) {
    new Chart(c, {
        type: "line",
        data: {
            labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
            datasets: [
                {
                    label: "# of Votes",
                    data: [12, 19, 3, 5, 2, 3],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}
