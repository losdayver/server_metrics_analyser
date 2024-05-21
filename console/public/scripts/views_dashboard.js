/* global Chart */

const number_of_incidents_in_time = document.getElementById(
    "number_of_incidents_in_time"
);
const total_incidents_by_cluster = document.getElementById(
    "total_incidents_by_cluster"
);

$(function () {
    updateDashboard();
});

async function updateDashboard() {
    var response = await fetch(CONTROLLER_API_URL + "incidents" + "?from=0&to=1000", {
        mode: "cors",
    });
    var incidents = await response.json();

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

    new Chart(number_of_incidents_in_time, {
        type: "line",
        data: {
            labels: Object.keys(incidentOccurrencesInTime),
            datasets: [
                {
                    label: "Инциденты (последние 1000)",
                    data: Object.values(incidentOccurrencesInTime),
                    borderWidth: 1,
                    pointRadius: 2,
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
            labels: Object.keys(incidentOccurrences),
            datasets: [
                {
                    label: "количество",
                    data: Object.values(incidentOccurrences),
                },
            ],
        },
    });

    const table_recent_incidents = $("#recent-incidents-table");

    response = await fetch(CONTROLLER_API_URL + "incidents" + "?from=0&to=10", {
        mode: "cors",
    });
    var incidents_table_list = await response.json();

    $(table_recent_incidents).append(`
    <thead>
        <tr>
            <th>Кластер</th>
            <th>Имя хоста</th>
            <th>Имя метрики</th>
            <th>Порог</th>
            <th>Измерение, Единица</th>
        </tr>
    </thead>
    `);

    incidents_table_list.forEach(incident => {
        $(table_recent_incidents).append(`
            <tr>
                <td>${incident.AdapterIdentifier}</td>
                <td>${incident.HostName}</td>
                <td>${incident.Dial.Name}</td>
                <td>${incident.Dial.Threshold}</td>
                <td>${incident.Value.toFixed(2)} ${incident.Dial.Unit}</td>
            </tr>
    
        `);
    });
}
