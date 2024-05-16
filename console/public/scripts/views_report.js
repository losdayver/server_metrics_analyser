var algorithmOptions = [
    { value: "none", text: "none" },
    { value: "linearRegression", text: "linearRegression" },
    { value: "option2", text: "Option 2" },
    { value: "option3", text: "Option 3" }
];

// this code is insane
async function loadLinearRegression() {
    function getLinearRegressionCoefitients() {

    }

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
    })).html("Select a cluster: ").append($(clusterSelect));

    $(clusterSelect).append($("<option>", {
        value: "none",
        text: "none"
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

        $(settingsContainer).append($("<label>").html("Select hosts: "));

        // add all host checkboxes for hosts
        cluster.hosts.forEach((host) => {
            $(settingsContainer).append($("<label>").html(host.HostName)
                .append($("<input>", {
                    type: "checkbox",
                    class: "linear-regression-settings-host-checkbox",
                    value: host.HostName
                })));
        });

        $(settingsContainer).append($("<label>").html("Select dials: "));

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

            // console.log($(dateStart).val());
            // console.log($(dateEnd).val());
            // console.log(checkedHosts);
            // console.log(checkedDials);


            if (!$(dateStart).val() || !$(dateEnd).val() || !checkedHosts || !checkedDials) {
                showMainModal("Some of the fields empty. Check again.");
                return;
            }

            var formFilteredIncidents = incidetResponse.filter(incident => {
                return checkedHosts.includes(incident.HostName) &&
                    checkedDials.includes(incident.Dial.Name) &&
                    (new Date($(dateStart).val()) <= new Date(incident.DateTime) &&
                        new Date($(dateEnd).val()) >= new Date(incident.DateTime));
            });

            const incidentOccurrencesInTime = formFilteredIncidents.reduce((acc, obj) => {
                const { DateTime } = obj;

                console.log(DateTime);

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

            console.log(formFilteredIncidents);
            console.log(incidentOccurrencesInTime);


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
