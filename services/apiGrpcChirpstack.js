
const grpc = require("@grpc/grpc-js");
const device_pb = require("@chirpstack/chirpstack-api/api/device_pb");
const device_grpc = require("@chirpstack/chirpstack-api/api/device_grpc_pb");
const deviceProfile_pb = require("@chirpstack/chirpstack-api/api/device_profile_pb");
const deviceProfile_grpc = require("@chirpstack/chirpstack-api/api/device_profile_grpc_pb");
const deviceApplication_pb = require("@chirpstack/chirpstack-api/api/application_pb");
const deviceApplication_grpc = require("@chirpstack/chirpstack-api/api/application_grpc_pb");
const tenant_pb = require("@chirpstack/chirpstack-api/api/tenant_pb");
const tenant_grpc = require("@chirpstack/chirpstack-api/api/tenant_grpc_pb");
const { Struct } = require("google-protobuf/google/protobuf/struct_pb.js");
const { loadCredentials } = require('../utils/utils.js');


// Ou trouver les classes? Dans la doc de chripstack API :https://www.chirpstack.io/docs/chirpstack/api/api.html
// Ou trouver les méthodes de chaque classe? ici : https://www.npmjs.com/package/@chirpstack/chirpstack-api?activeTab=code
// >> /api/device_pb.js
// Create the client for the DeviceService. Le constructeur DeviceServiceClient est définie dans api/device_grpc_pb.js de la doc https://www.npmjs.com/package/@chirpstack/chirpstack-api?activeTab=code

function getGrpcCredentials(securedConnection) {
    if (securedConnection) {
        return grpc.credentials.createSsl();
    } else {
        return grpc.credentials.createInsecure();
    }
}

async function listApplications(tenantId) {
    let credentials = loadCredentials();

    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Bearer " + credentials.apiKey);

    const deviceServiceApplication = new deviceApplication_grpc.ApplicationServiceClient(
        credentials.networkServer + ":" + credentials.networkServerPort,
        getGrpcCredentials(credentials.securedConnection),
    );

    const req = new deviceApplication_pb.ListApplicationsRequest();
    req.setLimit(100);
    req.setOffset(0);
    req.setTenantId(tenantId);

    const applications = await new Promise((resolve, reject) => {
        deviceServiceApplication.list(req, metadata, (err, resp) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(resp.getResultList().map((app) => ({ name: app.getName(), id: app.getId() })));
        });
    });

    //console.log(applications);
    return applications;
}

async function listTenants() {
    let credentials = loadCredentials();

    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Bearer " + credentials.apiKey);

    const deviceServiceTenant = new tenant_grpc.TenantServiceClient(
        credentials.networkServer + ":" + credentials.networkServerPort,
        getGrpcCredentials(credentials.securedConnection),
    );

    //console.log(credentials)
    // If Tenant APIKEY, listTenants()
    let tenants = [];

    if (!credentials.isTenantApiKey) {
        const req = new tenant_pb.ListTenantsRequest();
        req.setLimit(100);
        req.setOffset(0);
        tenants = await new Promise((resolve, reject) => {
            deviceServiceTenant.list(req, metadata, (err, resp) => {
                if (err) {
                    reject(err);
                    console.error("[Server - GRPC] Error listing tenants:", err);
                    return;
                }
                resolve(resp.getResultList().map((tenant) => ({ name: tenant.getName(), id: tenant.getId() })));
            });
        });
    }
    else {
        // If Tenant APIKEY, getTenantDetails(tenantId)
        const req = new tenant_pb.GetTenantRequest();
        req.setId(credentials.tenantId);

        response = await new Promise((resolve, reject) => {
            deviceServiceTenant.get(req, metadata, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp.getTenant().toObject());
            });
        });
        tenants = [{ name: response.name, id: response.id }];
    }
    return tenants;
}

async function listAllDevices(applicationId) {
    let credentials = loadCredentials();

    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Bearer " + credentials.apiKey);

    const deviceService = new device_grpc.DeviceServiceClient(
        credentials.networkServer + ":" + credentials.networkServerPort,
        getGrpcCredentials(credentials.securedConnection),
    );

    const req = new device_pb.ListDevicesRequest();
    req.setApplicationId(applicationId);
    req.setLimit(1000);
    let devEuis = [];

    const resp = await new Promise((resolve, reject) => {
        deviceService.list(req, metadata, (err, resp) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(resp);
        });
    });
    devEuis = resp.getResultList().map(device => device.getDevEui());

    return devEuis;
}


async function getDeviceDetails(devEui) {
    let credentials = loadCredentials();

    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Bearer " + credentials.apiKey);

    const deviceService = new device_grpc.DeviceServiceClient(
        credentials.networkServer + ":" + credentials.networkServerPort,
        getGrpcCredentials(credentials.securedConnection),
    );

    const req = new device_pb.GetDeviceRequest();
    req.setDevEui(devEui);

    const resp = await new Promise((resolve, reject) => {
        deviceService.get(req, metadata, (err, resp) => {
            if (err) {
                console.log(`[Server - GRPC] Error fetching device ${devEui} :`, err);
                reject(err);
                return;
            }
            resolve(resp);
        }
        )
    });

    const result = resp.getDevice();
    const tags = Object.fromEntries(result.getTagsMap().entries());

    const device = {
        devEui: result.getDevEui(),
        name: result.getName(),
        description: result.getDescription(),
        deviceProfileId: result.getDeviceProfileId(),
        tags,
    };
    // console.log(device);
    return device;
}

async function sendDownlinkToDevice(devEui, payloadArray, fPort, confirmed = false, flush = false) {
    let buf = Buffer.from(payloadArray);
    const base64String = buf.toString("base64");

    let credentials = loadCredentials();

    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Bearer " + credentials.apiKey);

    const deviceService = new device_grpc.DeviceServiceClient(
        credentials.networkServer + ":" + credentials.networkServerPort,
        getGrpcCredentials(credentials.securedConnection),
    );

    const itemToQueue = new device_pb.DeviceQueueItem();
    itemToQueue.setDevEui(devEui);
    itemToQueue.setFPort(fPort);
    itemToQueue.setConfirmed(confirmed);
    itemToQueue.setData(base64String);

    const enqueueReq = new device_pb.EnqueueDeviceQueueItemRequest();
    enqueueReq.setQueueItem(itemToQueue);
    enqueueReq.setFlushQueue(flush);

    const downlinkId = await new Promise((resolve, reject) => {
        deviceService.enqueue(enqueueReq, metadata, (err, resp) => {
            if (err) {
                console.log("[Server - GRPC] Error sending downlink:", err);
                reject(err);
                return;
            }
            resolve(resp.getId());
        });
    });

    return downlinkId;
}

async function sendDownlinkToApplication(applicationId, payloadArray, fPort, confirmed = false, flush = false) {
    console.log("[Server - GRPC] Sending downlink to all devices in application:", applicationId);
    let devEuis = await listAllDevices(applicationId);
    let downlinkId = [];
    for (let i = 0; i < devEuis.length; i++) {
        downlinkId.push(await sendDownlinkToDevice(devEuis[i], payloadArray, fPort, confirmed, flush));
    }
    //console.log(downlinkId);
    return downlinkId;
}

async function sendDownlinkToDevEuis(applicationId, selectedDevEuis, payloadArray, fPort, confirmed = false, flush = false) {
    console.log("[Server - GRPC] Sending downlink to selected devices :", selectedDevEuis);
    let downlinkId = [];
    for (let i = 0; i < selectedDevEuis.length; i++) {
        downlinkId.push(await sendDownlinkToDevice(selectedDevEuis[i], payloadArray, fPort, confirmed, flush));
    }
    //console.log(downlinkId);
    return downlinkId;
}

async function listDeviceProfiles(tenantId) {
    const req = new deviceProfile_pb.ListDeviceProfilesRequest();
    req.setTenantId(tenantId);
    req.setLimit(100);
    req.setOffset(0);

    const deviceProfiles = await new Promise((resolve, reject) => {
        deviceServiceProfile.list(req, metadata, (err, resp) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(resp.getResultList().map((profile) => ({ name: profile.getName(), id: profile.getId() })));
        });
    });
    console.log(deviceProfiles);
    return deviceProfiles;
}


async function addDevice(deviceInfo) {
    console.log("[Server - GRPC] deviceInfo:", deviceInfo);
    let credentials = loadCredentials();

    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Bearer " + credentials.apiKey);

    const deviceService = new device_grpc.DeviceServiceClient(
        credentials.networkServer + ":" + credentials.networkServerPort,
        getGrpcCredentials(credentials.securedConnection),
    );

    const device = new device_pb.Device();
    device.setDevEui(deviceInfo.devEui.toLowerCase());
    device.setJoinEui(deviceInfo.appEui.toLowerCase());
    device.setName(deviceInfo.name);
    device.setDeviceProfileId(deviceInfo.profileId.toLowerCase());
    device.setApplicationId(deviceInfo.applicationId.toLowerCase());

    if (deviceInfo.tags && typeof deviceInfo.tags === "object") {
        const tagsMap = device.getTagsMap();
        tagsMap.clear();
        for (const [key, value] of Object.entries(deviceInfo.tags)) {
            console.log(`[Server - GRPC] Adding tag: ${key} = ${value}`);
            tagsMap.set(key, value);
        }
    }

    const keys = new device_pb.DeviceKeys();
    keys.setNwkKey(deviceInfo.appKey.toLowerCase);
    keys.setDevEui(deviceInfo.devEui.toLowerCase());

    const req = new device_pb.CreateDeviceRequest();
    req.setDevice(device);
    const req2 = new device_pb.CreateDeviceKeysRequest();
    req2.setDeviceKeys(keys);

    console.log(`[Server - GRPC] Creating device with DevEUI: ${deviceInfo.devEui}`);

    const response = await new Promise((resolve, reject) => {
        deviceService.create(req, metadata, (err, resp) => {
            if (err) {
                console.error(`[Server - GRPC] Error creating device: ${deviceInfo.devEui}`, err);
                reject(err);
                return;
            }

            deviceService.createKeys(req2, metadata, (err, resp) => {
                if (err) {
                    console.error(`[Server - GRPC] Error creating device keys for  ${deviceInfo.devEui}`, err);
                    reject(err);
                    return;
                }
                resolve({ success: true, message: `[Server - GRPC] Device and keys were created successfully for ${deviceInfo.devEui}` });
            });
        });
    });
    //console.log(response);
    return response;
}


async function deleteDevice(devEui) {
    let credentials = loadCredentials();

    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Bearer " + credentials.apiKey);

    const deviceService = new device_grpc.DeviceServiceClient(
        credentials.networkServer + ":" + credentials.networkServerPort,
        getGrpcCredentials(credentials.securedConnection),
    );
    const deleteReq = new device_pb.DeleteDeviceRequest();
    deleteReq.setDevEui(devEui);

    const response = await new Promise((resolve, reject) => {
        deviceService.delete(deleteReq, metadata, (err, resp) => {
            if (err) {
                console.error(`[Server - GRPC] Error deleting device ${devEui}:`, err);
                reject(err);
                return;
            }
            resolve({ success: true, message: `[Server - GRPC] Device ${devEui} deleted successfully` });
        });

    });
    // console.log(response);
}

async function deleteDeviceFromDevEuis(devEuis) {
    console.log("[Server - GRPC] Deleting devices:", devEuis);
    for (let i = 0; i < devEuis.length; i++) {
        await deleteDevice(devEuis[i]);
    }
}


async function getTenantDetails(tenantId) {
    const req = new tenant_pb.GetTenantRequest();
    req.setId(tenantId);

    response = await new Promise((resolve, reject) => {
        deviceServiceTenant.get(req, metadata, (err, resp) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(resp.getTenant().toObject());
        });
    });
    console.log(response);
    return response;

}

async function listAllDevicesWithDetails(applicationId) {
    const devEuis = await listAllDevices(applicationId);
    //console.log(devEuis);
    const allDevicesDetails = [];
    for (let i = 0; i < devEuis.length; i++) {
        const details = await getDeviceDetails(devEuis[i]);
        allDevicesDetails.push(details);
    }
    // console.log(allDevicesDetails);
    return allDevicesDetails;
}



module.exports = {
    listAllDevices,
    getDeviceDetails,
    listAllDevicesWithDetails,
    sendDownlinkToDevice,
    sendDownlinkToApplication,
    sendDownlinkToDevEuis,
    addDevice,
    deleteDevice,
    deleteDeviceFromDevEuis,
    listDeviceProfiles,
    listApplications,
    listTenants,
    getTenantDetails
};



