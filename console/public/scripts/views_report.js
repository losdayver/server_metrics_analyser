var algorithmOptions = [
    { value: "none", text: "ничего" },
    { value: "linearRegression", text: "linearRegression" },
];

// data is an array of [xi, yi] values
// returns an array of [b1, b2] valeus (b2 is slope)
function getLinearRegressionCoefitients(data) {
    // get average of all the xi
    var x_avg = data.reduce((sum, item) => sum + item[0], 0) / data.length;
    var y_avg = data.reduce((sum, item) => sum + item[1], 0) / data.length;

    console.log(x_avg);

    var numeratior = data.reduce((sum, item) =>
        sum + (item[0] - x_avg) * (item[1] - y_avg), 0
    );

    var denominator = data.reduce((sum, item) =>
        sum + Math.pow(item[0] - x_avg, 2), 0
    );

    var b2 = numeratior / denominator;
    var b1 = y_avg - b2 * x_avg;

    return { b1: b1, b2: b2 };
}

// this code is insane
async function loadLinearRegression() {
    try {
        var clusterResponse = await fetch(CONTROLLER_API_URL + "clusters/");
        clusterResponse = await clusterResponse.json();
    } catch (err) {
        showMainModal(err.message);
        return;
    }

    // form of a full algorithm
    var form = $("<form>", {
        id: "linear-regression-form",
        class: "algorithm-form"
    });

    var clusterSelect = $("<select>", {
        id: "linear-regression-cluster-select",
        name: "linear-regression-cluster-select"
    });

    $(form).append($("<label>", {
        for: "linear-regression-cluster-select"
    })).html("Выберите кластер: ").append($(clusterSelect));

    $(clusterSelect).append($("<option>", {
        value: "none",
        text: "ничего"
    }));

    clusterResponse.forEach((cluster) => {
        $(clusterSelect).append($("<option>", {
            value: cluster.identifier,
            text: cluster.identifier
        }));
    });

    $("#algorithm-container").append($(form));

    // when cluster is selected
    $(clusterSelect).on("change", () => {
        // remove container of settings
        $(form).find("#linear-regression-settings-container").remove();
        $(form).find("#linear-regression-submit").remove();

        // this div contains all the settings
        var settingsContainer = $("<div>", {
            id: "linear-regression-settings-container"
        });

        // this is cluster whih was been created
        let cluster = clusterResponse.find((cluster) => cluster.identifier === $(clusterSelect).val())

        $(settingsContainer).append($("<label>").html("Отметьте необходимые хосты: "));

        // add all host checkboxes for hosts
        cluster.hosts.forEach((host) => {
            $(settingsContainer).append($("<label>").html(host.HostName)
                .append($("<input>", {
                    type: "checkbox",
                    class: "linear-regression-settings-host-checkbox",
                    value: host.HostName
                })));
        });

        $(settingsContainer).append($("<label>").html("Выберите метрики: "));

        // add all host checkboxes dials
        cluster.dials.forEach((dial) => {
            $(settingsContainer).append($("<label>").html(dial.Name)
                .append($("<input>", {
                    type: "checkbox",
                    class: "linear-regression-settings-dial-checkbox",
                    value: dial.Name
                })));
        });

        var dateStart = $("<input>", {
            type: "date",
            id: "linear-regression-settings-date-start"
        });
        $(settingsContainer).append($(dateStart));

        var dateEnd = $("<input>", {
            type: "date",
            id: "linear-regression-settings-date-start"
        });
        $(settingsContainer).append($(dateEnd));

        $(form).append($(settingsContainer));

        $(form).append($("<input>", {
            type: "submit",
            id: "linear-regression-submit"
        }).html("Create report"));

        // and here the magic happens
        $(form).submit(async function () {
            event.preventDefault();

            try {
                var incidetResponse = await fetch(CONTROLLER_API_URL + "incidents");
                incidetResponse = await incidetResponse.json();
            } catch (err) {
                showMainModal(err.message);
                return;
            }

            // this gets all checked hosts
            var checkedHosts = [];
            $(form).find(".linear-regression-settings-host-checkbox").each(function () {
                var isChecked = $(this).is(':checked');

                if (isChecked) {
                    checkedHosts.push($(this).val());
                }
            });

            // this gets all checked dials
            var checkedDials = [];
            $(form).find(".linear-regression-settings-dial-checkbox").each(function () {
                var isChecked = $(this).is(':checked');

                if (isChecked) {
                    checkedDials.push($(this).val());
                }
            });

            if (!$(dateStart).val() || !$(dateEnd).val() || !checkedHosts || !checkedDials) {
                showMainModal("Some of the fields empty. Check again.");
                return;
            }

            // filter by time the number of occurences
            var formFilteredIncidents = incidetResponse.filter(incident => {
                return checkedHosts.includes(incident.HostName) &&
                    checkedDials.includes(incident.Dial.Name) &&
                    incident.AdapterIdentifier === cluster.identifier &&
                    (new Date($(dateStart).val()) <= new Date(incident.DateTime) &&
                        new Date($(dateEnd).val()) >= new Date(incident.DateTime));
            });

            const incidentOccurrencesInTime = formFilteredIncidents.reduce((acc, obj) => {
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

            var readyForCalculation = [];
            for (let i = 0; i < Object.values(incidentOccurrencesInTime).length; i++) {
                readyForCalculation.push([i, Object.values(incidentOccurrencesInTime)[i]]);
            }

            // calculate linear regression and then show it on the modal
            var { b1, b2 } = getLinearRegressionCoefitients(readyForCalculation);

            console.log(b2);

            var chart_ctx = $("<canvas>");

            new Chart(chart_ctx, {
                type: "bar",
                data: {
                    labels: Object.keys(incidentOccurrencesInTime),
                    datasets: [
                        {
                            type: "line",
                            label: "Number of occurences",
                            data: Object.values(incidentOccurrencesInTime),
                            borderWidth: 1,
                        },
                        {
                            type: "line",
                            label: "Linear regression line",
                            data: readyForCalculation.map((item) => item[0] * b2 + b1),
                            pointRadius: 0,
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

            var modalContents = $("<div>");

            modalContents
                .append($("<h1>Прямая линейной регрессии по количеству инцидентов</h1>"))
                .append($(chart_ctx))
                .append($(`<h2>Начальная дата: ${$(dateStart).val()}</h2>`))
                .append($(`<h2>Конечная дата: ${$(dateEnd).val()}</h2>`))
                .append($("<h2>Хосты: </h2>"));

            checkedHosts.forEach((host) => {
                modalContents.append($(`<p>${host}</p>`))
            });

            modalContents
                .append($("<h2>Метрики: </h2>"))

            checkedDials.forEach((dial) => {
                modalContents.append($(`<p>${dial}</p>`))
            });

            modalContents
                .append($(`<h2>Коэффициент регрессии: ~${b2.toFixed(7)}</h2>`))

            showMainModal(modalContents);
        });
    });
}

function loadAlgorithm(algorithmName) {
    $("#algorithm-container").find("*").remove();

    if (algorithmName === "linearRegression") {
        loadLinearRegression();
    }
}

$(function () {
    algorithmOptions.forEach((option) => {
        $("#algorithm-select").append($("<option>", option));
    });

    $("#algorithm-select").on("change", () => {
        loadAlgorithm($("#algorithm-select").val());
    });
})
