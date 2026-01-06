const express = require("express");
const router = express.Router();
const fs = require("fs");
const apiGrpcChirpstack = require("../services/apiGrpcChirpstack");
const { getFilePath } = require('../utils/utils.js');

console.log("[Server] /routes/credentials routes loaded");


router.get("/credentials", (req, res) => {
  fs.readFile(getFilePath('credentials.json'), "utf8", (err, data) => {
    if (err) {
      console.error("[Server] Error reading credentials:", err);
      return;
    }

    const credentials = JSON.parse(data);

    console.log("[Server] Credentials fetched on startup :", credentials);
    res.json(credentials);
  });
});

// When "Save Credentials" button is clicked
router.post("/credentials", (req, res) => {
  console.log("[Server] POST /api/credentials");
  const { networkServer, apiKey, networkServerPort, isTenantApiKey, tenantId } = req.body;
  const credentials = { networkServer, apiKey, networkServerPort, isTenantApiKey, tenantId };

  fs.writeFile(getFilePath('credentials.json'), JSON.stringify(credentials, null, 2), (err) => {
    if (err) {
      console.error("[Server] Error writing credentials:", err);
      return res.status(500).json({ status: "error", message: "Failed to save credentials" });
    }
    console.log("[Server] Credentials saved :", credentials);
    res.json({ status: "success", message: "Credentials saved" });
  });
});

// When "Test Connection" button is clicked
router.get("/test-connection", async (req, res) => {
  console.log("[Server] GET /api/test-connection");
  const info = {}
  try {
    //console.log("[Server] Fetching tenant(s) ...");
    info.tenants = await apiGrpcChirpstack.listTenants();
    console.log("[Server] Connection to ChirpStack successful");
    console.log("[Server] List Tenants :", info.tenants.map(tenant => tenant.name));
    res.json({ status: "success", message: "Connection successful", info });
  } catch (err) {
    console.error("[Server] Connection to chirpstack failed:", err);
    res.status(500).json({ status: "error", message: "Connection failed" });
  }
});

// When tenant is selected, fetch applications for that tenant
router.get("/get-applications", async (req, res) => {
  console.log("[Server] GET /api/get-applications");
  const tenantId = req.query.tenantId;
  //console.log("[Server]  Tenant ID :", tenantId);
  try {
    const applications = await apiGrpcChirpstack.listApplications(tenantId);
    console.log("[Server] List Applications :", applications.map(app => app.name));
    res.json({ status: "success", applications });
  } catch (err) {
    console.error("[Server] Fetching applications failed:", err);
    res.status(500).json({ status: "error", message: "Failed to fetch applications" });
  }
});


module.exports = router;
