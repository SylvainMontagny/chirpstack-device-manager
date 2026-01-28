//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////   Functions  //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

function isValidUuid(uuid) {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    // Check that it's a valid UUID
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (!uuidRegex.test(uuid)) {
        return false;
    }
    return true;
}

function looksLikeJWT(token) {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}


function testCredentials() {
    if (isNaN(document.querySelector("#network-server-port").value) || document.querySelector("#network-server-port").value <= 0 || document.querySelector("#network-server-port").value > 65535) {
        document.querySelector(".portValidation-message").textContent = "Invalid Port";
        document.querySelector(".portValidation-message").style.display = "block";
        document.querySelector(".portValidation-message").style.color = "red";
    }
    else if(document.querySelector("#tenant-key-checkbox").checked && !isValidUuid(document.querySelector("#tenant-id").value)) {
        document.querySelector(".uuidValidation-message").textContent = "Invalid UUID";
        document.querySelector(".uuidValidation-message").style.display = "block";
        document.querySelector(".uuidValidation-message").style.color = "red";
    }
    else if (document.querySelector("#api-key").value.trim() === "") {
        document.querySelector(".apiKeyValidation-message").textContent = "API Key cannot be empty";
        document.querySelector(".apiKeyValidation-message").style.display = "block";
        document.querySelector(".apiKeyValidation-message").style.color = "red";
    }
    else if (!looksLikeJWT(document.querySelector("#api-key").value.trim())) {
        document.querySelector(".apiKeyValidation-message").textContent = "API Key does not look like a valid JWT";
        document.querySelector(".apiKeyValidation-message").style.display = "block";
        document.querySelector(".apiKeyValidation-message").style.color = "red";
    }
    else {
        document.querySelector(".uuidValidation-message").style.display = "none";
        document.querySelector(".portValidation-message").style.display = "none";
        document.querySelector(".apiKeyValidation-message").style.display = "none";
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////      EventListeners      ////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

document
    .querySelector("#tenant-key-checkbox")
    .addEventListener("change", (e) => {
        if (e.target.checked) {
            console.log("Tenant API key will be used");
            document.querySelector("#tenant-id-label").style.display = "block";
            document.querySelector("#tenant-id").style.display = "block";
        } else {
            console.log("Admin API key will be used");
            document.querySelector("#tenant-id-label").style.display = "none";
            document.querySelector("#tenant-id").style.display = "none";
        }
    });


document
    .querySelector("#save-credentials")
    .addEventListener("click", async (e) => {
        e.preventDefault();
        testCredentials();
        const messageAlert = document.querySelector(".settings-message");

        const credentials = {
            networkServer: document.querySelector("#network-server").value,
            apiKey: document.querySelector("#api-key").value,
            networkServerPort: document.querySelector("#network-server-port").value,
            isTenantApiKey: document.querySelector("#tenant-key-checkbox").checked,
            tenantId: document.querySelector("#tenant-id").value,
            securedConnection: document.querySelector("#secured-connection-checkbox").checked
        };

        console.log("[Client] Credentials to save REQ :", credentials);

        try {
            const response = await axios.post("/api/credentials", credentials);
            console.log("[Client] Credentials to save RESP :", response.data);
            messageAlert.textContent = "Wait for ChirpStack connection...";
            messageAlert.style.color = "green";

        } catch (err) {
            console.error(err);
            messageAlert.textContent = "[Client] Failed to save credentials";
            messageAlert.style.color = "red";
        }

        console.log("[Client] Test connection REQ");

        try {
            const response = await axios.get("/api/test-connection");
            messageAlert.textContent = "Connection successful";
            messageAlert.style.color = "green";
            document.querySelector("#connexion-status").textContent = "✅";
            console.log("[Client] Test connection RESP (list Tenants) :", response.data.info.tenants.map(tenant => tenant.name));
            const tenantSelect = document.querySelector("#tenant");
            tenantSelect.innerHTML = "";
            const option = document.createElement("option");
            option.text = "Select a tenant...";
            option.disabled = true;
            if (response.data.info.tenants.length === 1) {
                option.selected = false;
            } else {
                option.selected = true;
            }
            tenantSelect.appendChild(option);

            response.data.info.tenants.forEach(tenant => {
                const option = document.createElement("option");
                option.value = tenant.id;
                option.text = tenant.name;
                tenantSelect.appendChild(option);
            });

            // Case Tenant API Key with only one tenant
            if (response.data.info.tenants.length === 1) {
                document.querySelector("#tenant").dispatchEvent(new Event("change"));
            }
        }
        catch (err) {
            const { status, code, message } = err.response.data;
            console.error(`[Client] Test connection error Status : ${status}, Code : ${code}, Message :${message}`);
            messageAlert.textContent = "Connection failed : " + code;
            messageAlert.style.color = "red";
            document.querySelector("#connexion-status").textContent = "❌";
        }

    });

document
    .querySelector('a[href="#settings"]')
    .addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelector(".content h1").textContent = "Settings";
        document.querySelectorAll(".page-sections > section").forEach(section => section.style.display = "none");
        document.querySelector(".settings-section").style.display = "block";
    });


document.addEventListener("DOMContentLoaded", async () => {

    try {
        const response = await axios.get("/api/credentials");
        console.log("[Client] Credentials fetched on startup:", response.data);
        document.querySelector("#network-server").value = response.data.networkServer;
        document.querySelector("#api-key").value = response.data.apiKey;
        document.querySelector("#network-server-port").value = response.data.networkServerPort;
        document.querySelector("#tenant-key-checkbox").checked = response.data.isTenantApiKey;
        document.querySelector("#secured-connection-checkbox").checked = response.data.securedConnection || false;
        if (response.data.isTenantApiKey) {
            document.querySelector("#tenant-id-label").style.display = "block";
            document.querySelector("#tenant-id").style.display = "block";
            document.querySelector("#tenant-id").value = response.data.tenantId;
        } else {
            document.querySelector("#tenant-id-label").style.display = "none";
            document.querySelector("#tenant-id").style.display = "none";

        }

    } catch (err) {
        console.error("Error when fetching credentials:", err);
    }
});
