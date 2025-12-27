const express = require('express');
const router = express.Router();
const fs = require('fs');

const { getDevices, getDeviceDetails, updatedevice, listDeviceProfiles, listTenants, getTenantInfo, listApplication, adddevice, addDeviceFromCsv, deleteDevice, sendDownlink } = require('../chirpstack');
const { credentials } = require('@grpc/grpc-js');

// Get all devices
router.get('/getdevices', async (req, res) => {
    try {
        const devices = await getDevices();
        res.json({ success: true, devices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get devices by type
router.get('/getdevices/type/:type', async (req, res) => {
    const { type } = req.params;

    try {
        const devices = await getDevices();
        const filteredDevices = devices.filter(device => 
            device.deviceProfileName && device.deviceProfileName.toLowerCase() === type.toLowerCase()
        );

        res.json({ success: true, devices: filteredDevices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get details of a single device
router.get('/getdevice/:devEui', async (req, res) => {
    const { devEui } = req.params;

    try {
        const deviceDetails = await getDeviceDetails(devEui);
        if (!deviceDetails) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }
        res.json({ success: true, device: deviceDetails });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update a device
router.put('/updatedevice', async (req, res) => {
    const deviceData = req.body;

    if (!deviceData.devEui) {
        return res.status(400).json({ success: false, message: "Missing devEui in request body" });
    }

    try {
        const result = await updatedevice(deviceData);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// liste les device profiles
router.get('/getdeviceprofile', async (req, res) => {
    try {
        const deviceProfiles = await listDeviceProfiles();
        if (!deviceProfiles) {
            return res.status(404).json({ success: false, message: "Devices profiles not found" });
        }
        res.json({ success: true, deviceProfiles: deviceProfiles });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// liste les tenants
router.get('/gettenants', async (req, res) => {
    try {
        const tenants = await listTenants();
        if (!tenants) {
            return res.status(404).json({ success: false, message: "Tenants not found" });
        }
        res.json({ success: true, tenants: tenants });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Récupère les informations du tenant
router.get('/gettenantinfo', async (req, res) => {
    try {
        const tenant = await getTenantInfo();
        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }
        res.json({ success: true, tenant: tenant });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// liste les applications
router.get('/getapplications', async (req, res) => {
    try {
        const applications = await listApplication();
        if (!applications) {
            return res.status(404).json({ success: false, message: "Applications not found" });
        }
        res.json({ success: true, applications: applications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/testconnection', async (req, res) => {
    const credentials = req.body
    if (!credentials.tenantId) {
       try {
            const devices = await listTenants(credentials);
            res.json({ success: true, devices });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }else {
         try {
            const applications = await listApplication(credentials);
            if (!applications) {
                return res.status(404).json({ success: false, message: "applications not found" });
            }
            res.json({ success: true, applications: applications });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    
});

// add a device
router.post('/adddevice', async (req, res) => {
    const deviceData = req.body;

    if (!deviceData.deviceEUI || !deviceData.deviceName || !deviceData.deviceAppKey) {
        return res.status(400).json({ success: false, message: "Missing devEui, deviceName, or deviceAppKey in request body" });
    }

    try {
        const result = await adddevice(deviceData);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// add a device
router.post('/adddevicefromcsv', async (req, res) => {
    const csvString = req.body.csvData;

    try {
        const result = await addDeviceFromCsv(csvString);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/deletedevices', async (req, res) => {
    const devices = req.body; 
    
    if (!Array.isArray(devices) || devices.length === 0) {
        return res.status(400).json({
            success: false,
            message: "invalid request: a list of devices is required",
        });
    }

    try {
        const promises = devices.map((dev_eui) => 
            deleteDevice(dev_eui)
        );
        
        // Wait for all the promises to resolve (or reject)
        const ids = await Promise.all(promises);
        res.json({ success: true, ids });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/downlink', async (req, res) => {
    const devices = req.body; 
    
    if (!Array.isArray(devices) || devices.length === 0) {
        return res.status(400).json({
            success: false,
            message: "invalid request: a list of devices is required",
        });
    }

    try {
        const promises = devices.map(({ dev_eui, data, f_port, confirmed }) => 
            sendDownlink(dev_eui, data, f_port, confirmed)
        );
        
        // Wait for all the promises to resolve (or reject)
        const ids = await Promise.all(promises);
        res.json({ success: true, ids });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
