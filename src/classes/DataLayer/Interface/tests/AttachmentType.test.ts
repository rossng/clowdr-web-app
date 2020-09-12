import { AttachmentType } from "..";
import { TestDataT } from "../../../../tests/initTestDB";
import { testData } from "../../../../tests/setupTests";
import Caches from "../../Cache";

let testAttachmentTypeData: TestDataT<"AttachmentType">;
let testObject: AttachmentType;

describe("AttachmentType", () => {
    beforeAll(() => {
        testAttachmentTypeData = testData.AttachmentType[0];
        testObject = new AttachmentType(
            testData.Conference[0].id,
            testAttachmentTypeData);
    });

    it("returns the displayAsLink", () => {
        expect(testObject.displayAsLink).toEqual(testAttachmentTypeData.displayAsLink);
    });

    it("returns the isCoverImage", () => {
        expect(testObject.isCoverImage).toEqual(testAttachmentTypeData.isCoverImage);
    });

    it("returns the name", () => {
        expect(testObject.name).toEqual(testAttachmentTypeData.name);
    });

    it("returns the ordinal", () => {
        expect(testObject.ordinal).toEqual(testAttachmentTypeData.ordinal);
    });

    it("returns the supportsFile", () => {
        expect(testObject.supportsFile).toEqual(testAttachmentTypeData.supportsFile);
    });

    // it("returns the conference", async () => {
    //     // TODO: Why does this test just hang? Yet under debug, it proceeds fine.
    //     // Ed: I think the mock has some kind of race condition
    //     let cache = await Caches.get(testData.Conference[0].id);
    //     jest.runAllTimers();
    //     await cache.Ready;

    //     let confP = testObject.conference;
    //     jest.runAllTimers();
    //     let conf = await confP;
    //     expect(conf).toBeTruthy();
    //     expect(conf.id).toBe(testAttachmentTypeData.conference);
    // });

    it("returns the id", () => {
        expect(testObject.id).toEqual(testAttachmentTypeData.id);
    });
});
