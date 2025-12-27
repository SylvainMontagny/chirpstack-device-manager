document
    .querySelector("#tenant-key-checkbox")
    .addEventListener("change", (e) => {
        if (e.target.checked){
            console.log("Tenant API key will be used");
            document.querySelector("#tenant-id-label").style.display = "block";
            document.querySelector("#tenant-id").style.display = "block";
        }else{
            console.log("Admin API key will be used");
            document.querySelector("#tenant-id-label").style.display = "none";
            document.querySelector("#tenant-id").style.display = "none";
        }
    });


document
    .querySelector("#save-credentials")
    .addEventListener("click", async (e) => {
        e.preventDefault();
        const messageAlert = document.querySelector(".settings-message");

        const credentials = {
            networkServer: document.querySelector("#network-server").value,
            apiKey: document.querySelector("#api-key").value,
            networkServerPort: document.querySelector("#network-server-port").value,
            isTenantApiKey: document.querySelector("#tenant-key-checkbox").checked,
            tenantId: document.querySelector("#tenant-id").value
        };

        console.log("[Client] Credentials to save:", credentials);

        try {
            const response = await axios.post("/api/credentials", credentials);
            console.log("[Client] Server response:", response.data);
            messageAlert.textContent = response.data.message;
            messageAlert.style.color = "green";

        } catch (err) {
            console.error(err);
            messageAlert.textContent = "Failed to save credentials";
            messageAlert.style.color = "red";
        }

           console.log("[Client] Testing connection...");

        try {
            const response = await axios.get("/api/test-connection");
            messageAlert.textContent = "Connection successful";
            messageAlert.style.color = "green";
            console.log("[Client] Server response:", response.data);
            const tenantSelect = document.querySelector("#tenant");
            tenantSelect.innerHTML = "";
            const option = document.createElement("option");
            option.text = "Select a tenant...";
            option.disabled = true;
            if( response.data.info.tenants.length === 1){
                option.selected = false;
            }else{
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
            if( response.data.info.tenants.length === 1){
                 document.querySelector("#tenant").dispatchEvent(new Event("change"));
            }
        }
        catch (err) {
            console.error(err);
            messageAlert.textContent = "Connection failed";
            messageAlert.style.color = "red";
        }

    });


document
    .querySelector("#test-connection")
    .addEventListener("click", async (e) => {
        e.preventDefault();
        console.log("[Client] Testing connection...");
        const messageAlert = document.querySelector(".settings-message");
        try {
            const response = await axios.get("/api/test-connection");
            messageAlert.textContent = "Connection successful";
            messageAlert.style.color = "green";
            console.log("[Client] Server response:", response.data);
            const tenantSelect = document.querySelector("#tenant");
            tenantSelect.innerHTML = "";
            const option = document.createElement("option");
            option.text = "Select a tenant...";
            option.disabled = true;
            if( response.data.info.tenants.length === 1){
                option.selected = false;
            }else{
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
            if( response.data.info.tenants.length === 1){
                 document.querySelector("#tenant").dispatchEvent(new Event("change"));
            }
        }
        catch (err) {
            console.error(err);
            messageAlert.textContent = "Connection failed";
            messageAlert.style.color = "red";
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
        console.log("[Client] Saved credentials fetched on Server:", response.data);
        document.querySelector("#network-server").value = response.data.networkServer;
        document.querySelector("#api-key").value = response.data.apiKey;
        document.querySelector("#network-server-port").value = response.data.networkServerPort;
        document.querySelector("#tenant-key-checkbox").checked = response.data.isTenantApiKey;
        if (response.data.isTenantApiKey){
            document.querySelector("#tenant-id-label").style.display = "block";
            document.querySelector("#tenant-id").style.display = "block";
            document.querySelector("#tenant-id").value = response.data.tenantId;
        }else{
            document.querySelector("#tenant-id-label").style.display = "none";
            document.querySelector("#tenant-id").style.display = "none";   
        } 
    } catch (err) {
        console.error("Erreur lors de la récupération des credentials :", err);
    }
});
