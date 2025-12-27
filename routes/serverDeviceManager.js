const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const papa = require("papaparse");
const apiGrpcChirpstack = require("../services/apiGrpcChirpstack");
const { default: axios } = require("axios");


console.log("[Server] /routes/serverDeviceManager routes loaded");

// When devices table needs to appear
router.get("/list-devices", async (req, res) => {
    console.log("[Server] GET /api/list-devices");
    const applicationId = req.query.applicationId;
    console.log("[Server] Application ID:", applicationId);
    try {
        const deviceList = await apiGrpcChirpstack.listAllDevicesWithDetails(applicationId);
        console.log("[Server] Devices fetched:", deviceList);
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

    let deviceInfo = {};
    for (const device of csvParsed.data) {
        deviceInfo.devEui = device.dev_eui;
        deviceInfo.appEui = device.join_eui;
        deviceInfo.name = device.name;
        deviceInfo.appKey = device.app_key;
        deviceInfo.profileId = device.profile_id;
        deviceInfo.applicationId = applicationId;
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
});


module.exports = router;    