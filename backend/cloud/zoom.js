/* global Parse */
// ^ for eslint

// TODO: Before delete: Prevent delete if still in use anywhere

const { validateRequest } = require("./utils");
const { isUserInRoles, configureDefaultProgramACLs } = require("./role");

// **** Zoom Room **** //

/**
 * @typedef {Object} ZoomRoomSpec
 * @property {string} url
 * @property {Pointer} conference
 */

const createZoomRoomSchema = {
    url: "string",
    conference: "string"
};

/**
 * Creates a Zoom Room.
 *
 * Note: You must perform authentication prior to calling this.
 *
 * @param {ZoomRoomSpec} data - The specification of the new Zoom Room.
 * @returns {Promise<Parse.Object>} - The new Zoom Room
 */
async function createZoomRoom(data) {
    const newObject = new Parse.Object("ZoomRoom", data);
    await configureDefaultProgramACLs(newObject);
    await newObject.save(null, { useMasterKey: true });
    return newObject;
}

/**
 * @param {Parse.Cloud.FunctionRequest} req
 */
async function handleCreateZoomRoom(req) {
    const { params, user } = req;

    const requestValidation = validateRequest(createZoomRoomSchema, params);
    if (requestValidation.ok) {
        const confId = params.conference;

        const authorized = !!user && await isUserInRoles(user.id, confId, ["admin", "manager"]);
        if (authorized) {
            const spec = params;
            spec.conference = new Parse.Object("Conference", { id: confId });
            const result = await createZoomRoom(spec);
            return result.id;
        }
        else {
            throw new Error("Permission denied");
        }
    }
    else {
        throw new Error(requestValidation.error);
    }
}
Parse.Cloud.define("zoomRoom-create", handleCreateZoomRoom);
