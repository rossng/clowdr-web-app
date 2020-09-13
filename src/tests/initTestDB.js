// Copied from WholeSchema.ts
const RelationsToTableNames = {
    AttachmentType: {
        conference: "Conference"
    },
    BondedChannel: {
        children: "TwilioChannelMirror"
    },
    BreakoutRoom: {
        conference: "Conference",
        conversation: "Conversation",
        members: "UserProfile",
        programItem: "ProgramItem",
        watchers: "UserProfile"
    },
    Conference: {
        loggedInText: "PrivilegedConferenceDetails",
    },
    ConferenceConfiguration: {
        conference: "Conference"
    },
    ConferencePermission: {
        action: "PrivilegedAction",
        conference: "Conference"
    },
    Conversation: {
        conference: "Conference",
        member1: "UserProfile",
        member2: "UserProfile",
    },
    Flair: {
    },
    LiveActivity: {
    },
    MeetingRegistration: {
        conference: "Conference"
    },
    PrivilegedAction: {
    },
    PrivilegedConferenceDetails: {
        conference: "Conference"
    },
    ProgramItem: {
        conference: "Conference",
        authors: "ProgramPerson",
        track: "ProgramTrack",
        attachments: "ProgramItemAttachment",
        breakoutRoom: "BreakoutRoom",
        events: "ProgramSessionEvent",
        programSession: "ProgramSession"
    },
    ProgramItemAttachment: {
        attachmentType: "AttachmentType",
        programItem: "ProgramItem"
    },
    ProgramPerson: {
        conference: "Conference",
        programItems: "ProgramItem",
        userProfile: "UserProfile",
    },
    ProgramRoom: {
        conference: "Conference",
        socialSpace: "SocialSpace",
        zoomRoom: "ZoomRoom"
    },
    ProgramSession: {
        conference: "Conference",
        events: "ProgramSessionEvent",
        items: "ProgramItem",
        programTrack: "ProgramTrack",
        room: "ProgramRoom"
    },
    ProgramSessionEvent: {
        conference: "Conference",
        programItem: "ProgramItem",
        programSession: "ProgramSession"
    },
    ProgramTrack: {
        conference: "Conference"
    },
    Registration: {
    },
    SocialSpace: {
        conference: "Conference"
    },
    TwilioChannelMirror: {
    },
    _User: {
        profiles: "UserProfile"
    },
    UserPresence: {
        socialSpace: "SocialSpace",
        user: "UserProfile"
    },
    UserProfile: {
        conference: "Conference",
        presence: "UserPresence",
        primaryFlair: "Flair",
        programPersons: "ProgramPerson",
        user: "_User",
        watchedRooms: "ProgramRoom"
    },
    ZoomHostAccount: {
    },
    ZoomRoom: {
        conference: "Conference",
        hostAccount: "ZoomHostAccount",
        programRoom: "ProgramRoom"
    }
};

function generateMockPassword(userId) {
    return "admin";
}

function generateAttachmentTypes() {
    let result = [];

    result.push({
        conference: "mockConference1",
        id: "mockAttachmentType1",
        createdAt: new Date(1),
        displayAsLink: true,
        isCoverImage: false,
        name: "Mock AttachmentType",
        ordinal: 0,
        supportsFile: false,
        updatedAt: new Date(1)
    });

    return result;
}

function generateConferences() {
    let result = [];

    result.push({
        adminEmail: "mockAdminEmail@mock.com",
        adminName: "mockAdminName",
        conferenceName: "Mock Conference Name",
        createdAt: new Date(),
        headerImage: null,
        id: "mockConference1",
        isInitialized: false,
        landingPage: "A mock landing page",
        loggedInText: "mockPrivilegedConferenceDetails1",
        updatedAt: new Date(),
        welcomeText: "Welcome to this mock conference!"
    });

    result.push({
        adminEmail: "mockAdminEmail2@mock.com",
        adminName: "mockAdminName2",
        conferenceName: "A Second Mock Conference",
        createdAt: new Date(),
        headerImage: null,
        id: "mockConference2",
        isInitialized: false,
        landingPage: "A mock landing page",
        loggedInText: "mockPrivilegedConferenceDetails2",
        updatedAt: new Date(),
        welcomeText: "Welcome to this second mock conference!"
    });

    return result;
}

function generateFlairs() {
    let result = [];

    result.push({
        createdAt: new Date(),
        id: "mockFlair1",
        updatedAt: new Date(),
        color: "#FF00FF",
        label: "mock flair label",
        tooltip: "mock flair tooltip",
        priority: 1
    });

    return result;
}

function generatePrivilegedConferenceDetails() {
    let result = [];

    result.push({
        conference: "mockConference1",
        createdAt: new Date(),
        id: "mockPrivilegedConferenceDetails1",
        key: "LOGGED_IN_TEXT",
        updatedAt: new Date(),
        value: "Welcome to this mock conference logged in text."
    });

    result.push({
        conference: "mockConference2",
        createdAt: new Date(),
        id: "mockPrivilegedConferenceDetails2",
        key: "LOGGED_IN_TEXT",
        updatedAt: new Date(),
        value: "Welcome to this mock conference logged in text."
    });

    return result;
}

function generateUsers() {
    let result = [];

    let userId = "mockUser1";
    result.push({
        email: "mock@mock.com",
        createdAt: new Date(),
        id: userId,
        isBanned: "No",
        loginKey: null,
        passwordSet: true,
        updatedAt: new Date(),
        username: "mockUser1",
        profiles: ["mockUserProfile1"],
        // admin
        _hashed_password: "$2b$10$U1dOIN.fger7QO4sS9kwSelJdQgrr7D2hUCX5G4oMNR7uAPFQeXS2"
    });

    return result;
}

function generateUserPresences() {
    let result = [];

    result.push({
        createdAt: new Date(),
        id: "mockUserPresence1",
        updatedAt: new Date(),
        isAvailable: false,
        isDND: false,
        isDNT: false,
        isLookingForConversation: false,
        isOnline: false,
        isOpenToConversation: false,
        status: "mock user presence status",
        socialSpace: null,
        user: "mockUser1",
    });

    return result;
}

function generateUserProfiles() {
    let result = [];

    result.push({
        id: "mockUserProfile1",
        createdAt: new Date(),
        updatedAt: new Date(),
        affiliation: "mock affiliation",
        bio: "mock bio",
        country: "mock country",
        displayName: "mock display name",
        position: "mock position",
        profilePhoto: null, // TODO: Mock profile photo file
        pronouns: "test pronouns",
        realName: "mock real name",
        tags: [
            {
                alwaysShow: true,
                label: "mock tag label 1",
                priority: 1,
                tooltip: "mock tag tooltip 1"
            }, {
                alwaysShow: false,
                label: "mock tag label 2",
                priority: 2,
                tooltip: "mock tag tooltip 2"
            }
        ],
        webpage: "http://mock.webpage.com/someurl?queryparams=somequery!",
        welcomeModalShown: false,
        conference: "mockConference1",
        primaryFlair: "mockFlair1",
        presence: "mockUserPresence1",
        programPersons: [], // TODO: Mock program persons
        user: "mockUser1",
        watchedRooms: [] // TODO: Mock watched rooms
    });

    return result;
}

function convertObjectToMongoJSON(tableName, item, result) {
    let RelationFields = RelationsToTableNames[tableName];
    let object = {
    };
    for (let fieldName in item) {
        let fieldValue = item[fieldName];
        if (fieldName === "id") {
            object["_id"] = fieldValue;
        }
        else {
            if (fieldName in RelationFields) {
                let relatedTableName = RelationFields[fieldName];
                if (Array.isArray(fieldValue)) {
                    let ids = fieldValue;
                    if (ids.length > 0) {
                        let relationName = `_Join:${fieldName}:${tableName}`;
                        if (!result[relationName]) {
                            result[relationName] = [];
                        }

                        let finalValue = ids.map(id => ({
                            relatedId: id,
                            owningId: item.id
                        }));

                        result[relationName] = result[relationName].concat(finalValue);
                    }
                }
                else if (fieldValue) {
                    object[`_p_${fieldName}`] = `${relatedTableName}$${fieldValue}`;
                }
            }
            else {
                if (fieldValue !== null && fieldValue !== undefined) {
                    if (fieldValue instanceof Date) {

                        if (fieldName === "updatedAt") {
                            fieldName = "_updated_at";
                        }
                        else if (fieldName === "createdAt") {
                            fieldName = "_created_at";
                        }

                        object[fieldName] = fieldValue;
                    }
                    else if (fieldValue instanceof Array) {
                        object[fieldName] = fieldValue.map(x => convertObjectToMongoJSON(tableName, x, result));
                    }
                    else if (typeof fieldValue === "number") {
                        object[fieldName] = fieldValue.toString();
                    }
                    else if (typeof fieldValue === "string") {
                        object[fieldName] = fieldValue;
                    }
                    else if (typeof fieldValue === "boolean") {
                        object[fieldName] = fieldValue;
                    }
                    else if (typeof fieldValue === "object") {
                        object[fieldName] = convertObjectToMongoJSON(tableName, fieldValue, result);
                    }
                    else {
                        throw new Error(`Unhandled field type! ${typeof fieldValue}`);
                    }
                }
            }
        }
    }
    return object;
}

function convertToMongoJSON(tableName, items, result) {
    // TODO

    result[tableName] = items.map(item => {
        return convertObjectToMongoJSON(tableName, item, result);
    });
}

module.exports = {
    generateTestData: () => {
        let result = {
            AttachmentType: [],
            BondedChannel: [],
            BreakoutRoom: [],
            Conference: [],
            ConferenceConfiguration: [],
            ConferencePermission: [],
            Conversation: [],
            Flair: [],
            LiveActivity: [],
            MeetingRegistration: [],
            PrivilegedAction: [],
            PrivilegedConferenceDetails: [],
            ProgramItem: [],
            ProgramItemAttachment: [],
            ProgramPerson: [],
            ProgramRoom: [],
            ProgramSession: [],
            ProgramSessionEvent: [],
            ProgramTrack: [],
            Registration: [],
            SocialSpace: [],
            TwilioChannelMirror: [],
            _User: [],
            UserPresence: [],
            UserProfile: [],
            ZoomHostAccount: [],
            ZoomRoom: []
        };

        let allItems = {};

        result.AttachmentType = generateAttachmentTypes();
        convertToMongoJSON("AttachmentType", result.AttachmentType, allItems);

        result.Conference = generateConferences();
        convertToMongoJSON("Conference", result.Conference, allItems);

        result.Flair = generateFlairs();
        convertToMongoJSON("Flair", result.Flair, allItems);

        result.PrivilegedConferenceDetails = generatePrivilegedConferenceDetails();
        convertToMongoJSON("PrivilegedConferenceDetails", result.PrivilegedConferenceDetails, allItems);

        result._User = generateUsers();
        convertToMongoJSON("_User", result._User, allItems);

        result.UserPresence = generateUserPresences();
        convertToMongoJSON("UserPresence", result.UserPresence, allItems);

        result.UserProfile = generateUserProfiles();
        convertToMongoJSON("UserProfile", result.UserProfile, allItems);

        return {
            data: result,
            json: allItems
        };
    },
    generateMockPassword: generateMockPassword
}