//////////////////////////////////////////////   Functions  //////////////////////////////////////////

async function listDevices(e) {
    //////////////// Application is hardcoded for testing ////////////////
    //const applicationId = "4dad5b91-5f77-4219-a7a4-20d08fa46f1d"; //document.querySelector("#application").value;
    const applicationId = document.querySelector("#application").value;

    console.log("[Client] List devices REQ");
    try {
        const response = await axios.get("/api/list-devices", { params: { applicationId: applicationId } });
        console.log("[Client] List devices RESP :", response.data.deviceList.map(device => device.name));

        if (response.data.deviceList.length != 0) {
            document.querySelector(".devices-table tbody").innerHTML = "";
            response.data.deviceList.forEach(device => {
                const tr = document.createElement("tr");
                tr.classList.add("device-row");
                tr.innerHTML = `
              <td><input type="checkbox" class="checkbox" data-deveui="${device.devEui}"/></td>
              <td>${device.name}</td>
              <td>${device.tags.site || ""}</td>
              <td>${device.tags.building || device.tags.batiment || ""}</td>
              <td>${device.tags.room || device.tags.salle || ""}</td>
            `;
                document.querySelector(".devices-table tbody").appendChild(tr);
            });

        }
        else {
            document.querySelector(".devices-table tbody").innerHTML = "";
            const tr = document.createElement("tr");
            const td = document.createElement("td");

            td.colSpan = 5;
            td.textContent = "No devices found for this application.";
            td.classList.add("no-data");

            tr.appendChild(td);
            document.querySelector(".devices-table tbody").appendChild(tr);
        }
    }
    catch (err) {
        console.error(err.response.data.message);
    }
}

function selectedDevice(selectedDevEuis) {
    document.querySelectorAll(".checkbox:checked").forEach(device => { // 
        selectedDevEuis.push(device.dataset.deveui);
    });
    if (selectedDevEuis.length === 0) {
        alert("Please select at least one device.");
        return [];
    }
    return selectedDevEuis;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////  EventListeners Nav Bar  ////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".nav-links a").forEach(l => l.classList.remove("active"));
        e.target.classList.add("active");
    });
});

document
    .querySelector("#tenant")
    .addEventListener("change", async (e) => {
        console.log("[Client] Tenant change listener:", e.target.value);
        e.preventDefault();
        try {
            const response = await axios.get("/api/get-applications", { params: { tenantId: e.target.value } });
            console.log("[Client] Server RESP (list Applications):", response.data.applications.map(app => app.name));
            const applicationSelect = document.querySelector("#application");
            applicationSelect.innerHTML = "";
            const option = document.createElement("option");
            option.text = "Select an application...";
            option.disabled = true;
            option.selected = true;
            applicationSelect.appendChild(option);

            response.data.applications.forEach(app => {
                const option = document.createElement("option");
                option.value = app.id;
                option.text = app.name;
                applicationSelect.appendChild(option);
            });
        }
        catch (err) {
            console.error(err);
        }
    });

document.
    querySelector('#application')
    .addEventListener('change', async (e) => {
        console.log("[Client] Application change listener:", e.target.value);
        await listDevices(e);
    });

document
    .querySelector('a[href="#list-device"]')
    .addEventListener("click", async (e) => {
        e.preventDefault();
        document.querySelector(".content h1").textContent = "List / Delete devices";
        document.querySelectorAll(".page-sections > section").forEach(section => section.style.display = "none");
        document.querySelector(".device-section").style.display = "block";
        document.querySelector("#send-confirmed-action-btn").style.display = "none";
        document.querySelector("#delete-device-btn").style.display = "block";
        listDevices(e);
    });


document
    .querySelector('a[href="#add-device"]')
    .addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelector(".content h1").textContent = "Import devices";
        document.querySelectorAll(".page-sections > section").forEach(section => section.style.display = "none");
        //document.querySelector(".add-device-section").style.display = "block";
        document.querySelector(".add-device-from-csv-section").style.display = "block";
    });


document
    .querySelector('a[href="#micropelt-mlr003"]')
    .addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelector(".content h1").textContent = "Micropelt ML003 control";
        document.querySelectorAll(".page-sections > section").forEach(section => section.style.display = "none");
        document.querySelector(".action-section").style.display = "block";
        document.querySelector(".device-section").style.display = "block";

        document.querySelector("#send-confirmed-action-btn").style.display = "block";
        document.querySelector("#delete-device-btn").style.display = "none";
        listDevices(e);
    });



//////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////  EventListeners Sections ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
document
    .querySelector('#action-type-select')
    .addEventListener("change", (e) => {
        console.log("[Client] Action changed:", e.target.value);
        e.preventDefault();

        switch (e.target.value) {
            case "emergency":
                document.querySelector("#emergency-label").style.display = "block";
                document.querySelector("#emmergency-temp").style.display = "block";
                break;
            case "off":
                document.querySelector("#emergency-label").style.display = "none";
                document.querySelector("#emmergency-temp").style.display = "none";
                break;
            default:
        }
    });

document.querySelector("#select-all-devices").addEventListener("change", (e) => {
    const checkboxes = document.querySelectorAll(".checkbox");
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
});


document
    .querySelector('#send-confirmed-action-btn')
    .addEventListener("click", async (e) => {
        e.preventDefault();

        const selectedDevEuis = selectedDevice([]);
        if (selectedDevEuis.length === 0) {
            return;
        }
        switch (document.querySelector('#action-type-select').value) {
            case "emergency":
                console.log("[Client] Emergency setpoint action");

                const downlinkParamsEm = {

                    //////////////// Application is hardcoded for testing ////////////////
                    //applicationId: "4dad5b91-5f77-4219-a7a4-20d08fa46f1d",
                    applicationId: document.querySelector("#application").value,
                    selectedDevEuis: selectedDevEuis,
                    payloadArray: [document.querySelector("#emmergency-temp").value * 2, 0x00, 0x26, 0x08, 0x00, 0x00],
                    fPort: 1,
                    confirmed: true,
                    flush: true
                };
                const responseDown = await axios.post("/api/send-downlink", downlinkParamsEm);
                console.log("[Client] Response from Server :", responseDown.data);
                alert(`Emergency setpoint sent to :  ${selectedDevEuis.length} device(s).`);
                break;

            case "off":
                console.log("[Client] Sending turn off action");
                const downlinkParamsOff = {

                    //////////////// Application is hardcoded for testing ////////////////
                    //applicationId: "4dad5b91-5f77-4219-a7a4-20d08fa46f1d",
                    applicationId: document.querySelector("#application").value,
                    selectedDevEuis: selectedDevEuis,
                    payloadArray: [0x01],
                    fPort: 15,
                    confirmed: true,
                    flush: true
                };
                const responseOff = await axios.post("/api/send-downlink", downlinkParamsOff);
                console.log("[Client] Response from Server :", responseOff.data);
                alert(`Turn off command sent to ${selectedDevEuis.length} device(s).`);
                break;
        }
    });

document
    .querySelector('#delete-device-btn')
    .addEventListener("click", async (e) => {
        e.preventDefault();
        const selectedDevEuis = selectedDevice([]);

        try {
            if (selectedDevEuis.length === 0) {
                return;
            }
            if (!confirm("Selected device will be deleted. Are you sure?")) {
                return;
            }
            console.log("[Client] Delete devices REQ:", selectedDevEuis);
            const response = await axios.post("/api/delete-devices", selectedDevEuis);
            console.log("[Client] Delete devices RESP :", response.data.message);
            await listDevices(e);
        }
        catch (err) {
            alert("Failed to delete device(s).");
        }
    });


document
    .querySelector(".add-device-from-csv-form")
    .addEventListener("submit", async (e) => {
        e.preventDefault();
        const fileInput = document.querySelector(".file-input");
        const file = fileInput.files[0];

        try {
            if (!file) {
                throw new Error("Please select a CSV file to upload.");
            }

            const csvString = await file.text();
            const response = await axios.post("/api/adddevicefromcsv", {
                csvString: csvString,
                applicationId: document.querySelector("#application").value
                //applicationId: "4dad5b91-5f77-4219-a7a4-20d08fa46f1d"
            });

            if (response.data.status === "success") {
                alert("Device added successfully!");
                document.querySelector('a[href="#list-device"]').click();

            } else {
                alert("Error: " + (response.data.message || "Unable to add device"));
            }
        } catch (error) {
            console.error("[Client] Error adding device:", error.response.data.message || error.message);
            alert("Error adding device: " + (error.response.data.message || error.message));
        }
    });


