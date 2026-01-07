const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const papa = require("papaparse");
const apiGrpcChirpstack = require("../services/apiGrpcChirpstack");
const { default: axios } = require("axios");


console.log("[Server] /routes/serverDeviceManager routes loaded");


//////////////////////////////////////////////   Functions  //////////////////////////////////////////
function validateAndNormalizeEui(eui) {
    if (!eui || typeof eui !== 'string') {
        throw new Error('EUI is required and must be a string');
    }
    
    // Removes dashes and spaces
    let normalized = eui.trim().replace(/[-\s]/g, '');
   // Check that it's exactly 32 hexadecimal characters in hexadecimal
    const hexRegex = /^[0-9a-fA-F]{16}$/;
    
    if (!hexRegex.test(normalized)) {
        throw new Error(
            `Invalid EUI format: "${eui}". ` +
            'Expected 16 hexadecimal characters (e.g., 383331916D328014 or 38-33-31-91-6D-32-80-14)'
        );
    }
    return normalized.toLowerCase();
}

function validateAndNormalizeKey(key) {
    if (!key || typeof key !== 'string') {
        throw new Error('Key is required and must be a string');
    }
    // Removes dashes and spaces
    let normalized = key.trim().replace(/[-\s]/g, '');  

    // Check that it's exactly 32 hexadecimal characters in hexadecimal
    const hexRegex = /^[0-9a-fA-F]{32}$/;

    if (!hexRegex.test(normalized)) {
        throw new Error(
            `Invalid Key format: "${key}". ` +
            'Expected 32 hexadecimal characters (e.g., 1e9be71a2c0336716360a47621de28db or 1e-9b-e7-1a-2c-03-36-71-63-60-a4-76-21-de-28-db)'
        );
    }
    return normalized.toLowerCase();
}

function validateUuid(uuid) {
    if (!uuid || typeof uuid !== 'string') {
        throw new Error('UUID is required and must be a string');
    }
    // Check that it's a valid UUID
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (!uuidRegex.test(uuid)) {
        throw new Error(
            `Invalid UUID format: "${uuid}". ` +
            'Expected a valid UUID (e.g., 690cf144-b2c5-4bac-a36d-9413d674f5fa)'
        );
    }
    return uuid;
}


//////////////////////////////////////////////   Routes  //////////////////////////////////////////
router.get("/list-devices", async (req, res) => {
    console.log("[Server] GET /api/list-devices");
    const applicationId = req.query.applicationId;
    //console.log("[Server] Application ID:", applicationId);
    try {
        const deviceList = await apiGrpcChirpstack.listAllDevicesWithDetails(applicationId);
        console.log("[Server] Devices fetched:", deviceList.map(device => device.name));
        res.json({ status: "success", deviceList });
    } catch (err) {
        console.error("[Server] Fetching devices failed:", err);
        res.status(500).json({ status: "error", message: "Failed to fetch devices" });
    }
});


router.post("/send-downlink", async (req, res) => {
    console.log("[Server] POST /api/send-downlink");
    try {
        const { applicationId, selectedDevEuis, payloadArray, fPort, confirmed, flush } = req.body;
        const response = await apiGrpcChirpstack.sendDownlinkToDevEuis(applicationId, selectedDevEuis, payloadArray, fPort, confirmed, flush);
        console.log("[Server] Downlink ID:", response);
        res.json({ status: "success", message: "Downlink sent" });
    }
    catch (err) {
        console.error("[Server] Sending downlink failed:", err);
        res.status(500).json({ status: "error", message: "Failed to send downlink" });
    }
});

router.post("/delete-devices", async (req, res) => {
    console.log("[Server] POST /api/delete-devices");
    console.log("[Server] Devices to delete:", req.body);
    try {
        await apiGrpcChirpstack.deleteDeviceFromDevEuis(req.body);
        res.json({ status: "success", message: "Devices deleted" });
    }
    catch (err) {
        console.error("[Server] Deleting devices failed:", err);
        res.status(500).json({ status: "error", message: "Failed to delete devices" });
    }
});

router.post("/adddevicefromcsv", async (req, res) => {
    console.log("[Server] POST /api/adddevicefromcsv");
    const { applicationId, csvString } = req.body;
    console.log("[Server] CSV String:", csvString);
    const csvParsed = papa.parse(csvString, {
        header: true,
        delimiter: ";"
    });
    console.log("[Server] Parsed CSV:", csvParsed.data);

    try {
    let deviceInfo = {};
    for (const device of csvParsed.data) {
        deviceInfo.devEui = validateAndNormalizeEui(device.dev_eui);
        deviceInfo.appEui = validateAndNormalizeEui(device.join_eui);
        deviceInfo.name = device.name;
        deviceInfo.appKey = validateAndNormalizeKey(device.app_key);
        deviceInfo.profileId = validateUuid(device.profile_id);
        deviceInfo.applicationId = validateUuid(applicationId);
        deviceInfo.tags = {};
        // Collect tags
        if (device.tag_site) {
            deviceInfo.tags.site = device.tag_site;
        }
        if (device.tag_building) {
            deviceInfo.tags.building = device.tag_building;
        }
        if (device.tag_room) {
            deviceInfo.tags.room = device.tag_room;
        }

        const response = await apiGrpcChirpstack.addDevice(deviceInfo);
     
    }

    res.json({ status: "success", message: "Devices added from CSV" });
}
    catch (err) {
        console.error("[Server] Adding devices from CSV failed:", err.message);
        res.status(500).json({ status: "error", message: err.message });
    }   
});


module.exports = router;    