/* global Chart */

const number_of_incidents_in_time = document.getElementById(
    "number_of_incidents_in_time"
);
const total_incidents_by_cluster = document.getElementById(
    "total_incidents_by_cluster"
);

("use strict");

$(document).ready(function () {
    updateDashboard();
});

function updateDashboard() {
    new Chart(number_of_incidents_in_time, {
        type: "line",
        data: {
            labels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
            datasets: [
                {
                    label: "Cluster 1",
                    data: [12, 19, 3, 5, 2, 3],
                    borderWidth: 2.5,
                },
                {
                    label: "Cluster 2",
                    data: [5, 18, 5, 6, 3, 2],
                    borderWidth: 2.5,
                },
                {
                    label: "Cluster 3",
                    data: [7, 12, 4, 8, 23, 3],
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
            labels: ["Cluster 1", "Cluster 2", "Cluster 3"],
            datasets: [
                {
                    label: "Cluster 1",
                    data: [12, 10, 4],
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
