async function createRegisterRoutineFormCard() {
    {
        var form = $("<form>")
            .append(
                $("<label>Cluster Identifier: </label>", {
                    for: "register-routine-container-identifier",
                })
            )
            .append(
                $("<select>", {
                    name: "register-routine-container-identifier",
                    id: "register-routine-container-identifier",
                })
            )
            .append(
                $("<label>Dial: </label>", {
                    for: "register-routine-container-dial",
                })
            )
            .append(
                $("<select>", {
                    name: "register-routine-container-dial",
                    id: "register-routine-container-dial",
                })
            )
            .append(
                $("<label>Host: </label>", {
                    for: "register-routine-container-host",
                })
            )
            .append(
                $("<select>", {
                    name: "register-routine-container-host",
                    id: "register-routine-container-host",
                })
            )
            .append(
                $("<label>Worker: </label>", {
                    for: "register-routine-container-worker",
                })
            )
            .append(
                $("<select>", {
                    name: "register-routine-container-worker",
                    id: "register-routine-container-worker",
                })
            )
            .append(
                $("<input>", {
                    type: "submit",
                    name: "register-routine-container-submit",
                    id: "register-routine-container-submit",
                })
            );
    }

    function updateForm(clusterIdentifier) {
        let dialSelect = $(form).children("#register-routine-container-dial");

        let hostSelect = $(form).children("#register-routine-container-host");

        $(dialSelect).find("*").remove();
        $(hostSelect).find("*").remove();

        let dials = clusters.find(
            (cluster) => cluster.identifier === clusterIdentifier
        ).dials;

        let hosts = clusters.find(
            (cluster) => cluster.identifier === clusterIdentifier
        ).hosts;

        dials.forEach((dial) => {
            $(dialSelect).append(
                $(`<option>${dial.Name}</option>`, {
                    value: dial.Name,
                })
            );
        });

        hosts.forEach((host) => {
            $(hostSelect).append(
                $(`<option>${host.HostName}</option>`, {
                    value: host.HostName,
                })
            );
        });
    }

    try {
        var clustersResponse = await fetch(CONTROLLER_API_URL + "clusters");
        var clusters = await clustersResponse.json();
        if (!clusters) showMainModal("<h3>No clusters found</h3>");
    } catch (err) {
        showMainModal(err.message);
        return null;
    }

    try {
        var workersResponse = await fetch(CONTROLLER_API_URL + "workers");
        var workers = await workersResponse.json();
        if (!workers) showMainModal("<h3>No workers found</h3>");
    } catch (err) {
        showMainModal(err.message);
        return null;
    }

    for (cluster of clusters) {
        $(form)
            .children("#register-routine-container-identifier")
            .append($(`<option>${cluster.identifier}</option>`));
    }

    for (worker of workers) {
        $(form)
            .children("#register-routine-container-worker")
            .append(
                $(`<option>${worker.hostName}:${worker.port}
                        ${worker.identifier}</option>`)
            );
    }

    updateForm(clusters[0].identifier);

    $(form)
        .children("#register-routine-container-identifier")
        .on("change", function (e) {
            updateForm(this.value);
        });

    $(form)
        .children("#register-routine-container-submit")
        .click(async function () {
            event.preventDefault();

            var body = {
                ClusterIdentifier: $(
                    "#register-routine-container-identifier"
                ).val(),
                WorkerHostName: $("#register-routine-container-worker")
                    .val()
                    .split(":")[0],
                WorkerPort: $("#register-routine-container-worker")
                    .val()
                    .split(":")[1]
                    .split(" ")[0],
                // TODO allow to select multiple dial names
                DialNames: [$("#register-routine-container-dial").val()],
                ClusterHostName: $("#register-routine-container-host").val(),
            };

            try {
                var response = await fetch(CONTROLLER_API_URL + "routines/", {
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

            updateRoutines();
        });

    return createCard("Register New Routine", form, null, false);
}

function createRoutineCard(routine) {
    var routineCardWrapper = $("<div>", { class: "contents-card-wrapper" });
    var workerCard = createWorkerCard(routine.worker);

    var infoLineEnabled = $("<div>", { class: "contents-card-info-line" })
        .html(`
        <div>Enabled: </div>
        <div class="contents-card-info-line-status">
            <div>${routine.enabled}</div>
            <div 
                class="contents-card-info-line-indicator"
                style="background-color: ${routine.enabled ? "#0A0" : "#F00"};"
            >
            </div>
        </div>
    `);

    var infoLineBroken = $("<div>", { class: "contents-card-info-line" }).html(`
        <div>Broken: </div>
        <div class="contents-card-info-line-status">
            <div>${routine.broken}</div>
            <div 
                class="contents-card-info-line-indicator"
                style="background-color: ${routine.broken ? "#F00" : "#0A0"};"
            >
            </div>
        </div>
    `);

    var infoLineIdentifier = $("<div>", { class: "contents-card-info-line" })
        .html(`
        <div>Cluster Identifier: </div>
        <div>${routine.clusterIdentifier}</div>
    `);

    var infoLineWorker = $("<div>", { class: "contents-card-info-line" }).html(
        "<div>Worker: </div>"
    );

    var infoLineDials = $("<div>", { class: "contents-card-info-line" }).html(
        "<div>Dials: </div>"
    );

    var infoLineSessionID = $("<div>", {
        class: "contents-card-info-line",
    }).html(`
        <div>sessionID: </div>
        <div>${routine.sessionID}</div>
    `);

    $(routineCardWrapper)
        .append(infoLineBroken)
        .append(infoLineEnabled)
        .append(infoLineSessionID)
        .append(infoLineIdentifier)
        .append(infoLineWorker)
        .append(
            $("<div>", {
                html: workerCard,
            })
        )
        .append(infoLineDials)
        .append(
            $("<div>", {
                html: createDialsCard(routine.dials),
            })
        );

    var card = createCard(
        `${routine.sessionID}`,
        routineCardWrapper,
        null,
        true
    );

    return card;
}

async function updateRoutines() {
    $("#routine-cards-container").find("*").remove();

    var response = await fetch(CONTROLLER_API_URL + "routines", {
        mode: "cors",
    });

    var data = await response.json();

    // iterate through clusters
    for (let routine of data) {
        $("#routine-cards-container").append(createRoutineCard(routine));
    }
}

$(async function () {
    $("#register-routine-container").append(
        await createRegisterRoutineFormCard()
    );
    updateRoutines();
});
