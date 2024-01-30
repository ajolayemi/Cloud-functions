import * as logger from "firebase-functions/logger";
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
  onDocumentWritten,
} from "firebase-functions/v2/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import {SurveyTypes} from "../shared/shared_enums";
import {
  handleSurveyInsertAndUpdate,
  processDeleteEvents,
  processQualitySurveyDataForGs,
  processQuantitySurveyDataForGs,
  processUpdateEvents,
} from "../shared/utils";
import {
  qualitySurveyResultSheet,
  quantitySurveyCalResultSheet,
  quantitySurveyGeneralResultSheet,
} from "../shared/configs";
import {
  deleteRowFromSheet,
  filterDocumentDataRange,
  readDataFromSpreadsheet,
} from "./google_sheet_utils";
import {SheetInfoImpl} from "../models/sheet_info_model";
import {getAuth} from "firebase-admin/auth";
import {initializeApp} from "firebase-admin/app";
import {UserRole} from "../interfaces/shared_interfaces";
import {firestore} from "firebase-admin";

// Set the maximum instances to 10 for all functions
setGlobalOptions({maxInstances: 10});

initializeApp();
/**
 * Responds to updates in user info collection
 */
exports.updateUserCustomClaims = onDocumentWritten(
  "users/{userId}",
  async (userInfoEvent) => {
    try {
      // const userDocData = userInfoEvent.data;
      const uid = userInfoEvent.params.userId;
      const docData = userInfoEvent.data?.after.data();
      let roleData: UserRole = {};

      if (docData == null) {
        return;
      }

      if (docData != null) {
        const roleDataFromFirestore = docData["role"];
        roleData = {
          isAdmin: roleDataFromFirestore["isAdmin"],
          isUser: roleDataFromFirestore["isUser"],
          isEditor: roleDataFromFirestore["isEditor"],
          isSuperUser: roleDataFromFirestore["isSuperUser"],
          isViewer: roleDataFromFirestore["isViewer"],
        };
      }

      // Set user custom claim
      await getAuth().setCustomUserClaims(uid, roleData);

      // write to Firestore so the client app knows it needs to update
      await firestore().doc(`metadata/${uid}`).set({
        refreshTime: firestore.FieldValue.serverTimestamp(),
      });
      logger.log(`Custom claim set for user with email: ${docData["email"]}`);
    } catch (error) {
      logger.error(
        `An error occurred while trying to handle user custom claims update: ${error}`
      );
    }
  }
);

/**
 * Responds to delete events on survey documents
 */
exports.onSurveyDeleted = onDocumentDeleted(
  "survey/{docId}",
  async (deleteEvent) => {
    try {
      const docId = deleteEvent.params.docId;
      const data = deleteEvent.data?.data();

      if (!data || !docId) {
        logger.info(
          `Was not able to access the data / doc id of the deleted doc with id: ${docId}`
        );
        return;
      }
      const deletedDocumentType: SurveyTypes = data.surveyType;
      if (deletedDocumentType == SurveyTypes.Quality) {
        await processDeleteEvents(qualitySurveyResultSheet, docId);

        return;
      }

      await processDeleteEvents(quantitySurveyCalResultSheet, docId);
      await processDeleteEvents(quantitySurveyGeneralResultSheet, docId);
      return;
    } catch (error) {
      logger.error(
        `An error occurred while trying to handle deletion event: ${error}`
      );
    }
  }
);

/**
 * Responds to update events on firestore documents from firebase
 * It mostly handles that passes over to google sheet the new data
 */
exports.onSurveyUpdated = onDocumentUpdated(
  "survey/{docId}",
  async (updateEvent) => {
    try {
      const updatedDocumentData = updateEvent.data?.after.data();

      if (!updatedDocumentData) {
        logger.info("Was not able to access updated doc data!");
        return;
      }

      // Access updated survey type
      const updatedSurveyType: SurveyTypes = updatedDocumentData.surveyType;
      const docId = updateEvent.params.docId;
      if (!docId) {
        logger.error("Was not able to access document id in update logic");
        return;
      }

      if (updatedSurveyType == SurveyTypes.Quality) {
        const dataForGs = processQualitySurveyDataForGs(updatedDocumentData);
        await processUpdateEvents(qualitySurveyResultSheet, docId, [dataForGs]);
        return;
      }

      const dataForGs = processQuantitySurveyDataForGs(updatedDocumentData);

      const allCalsFromGoogleSheet = await readDataFromSpreadsheet(
        SheetInfoImpl.getReadA1NotationRange(quantitySurveyCalResultSheet)
      );
      const calRanges = filterDocumentDataRange(allCalsFromGoogleSheet, docId);

      if (calRanges.firstRow > 0) {
        await deleteRowFromSheet(
          quantitySurveyCalResultSheet.id,
          calRanges.firstRow - 1,
          calRanges.lastRow
        );
      }
      await processUpdateEvents(
        quantitySurveyCalResultSheet,
        docId,
        dataForGs.calData,
        false
      );

      await processUpdateEvents(quantitySurveyGeneralResultSheet, docId, [
        dataForGs.generalData,
      ]);
      return;
    } catch (error) {
      logger.info(
        `An error occurred when trying to handle survey update event: ${error}`
      );
    }
  }
);

/**
 * Responds to events for when a new survey is stored on firestore
 * It mainly handles the logic that passes over survey data to Google Sheet
 */
exports.onNewSurveyCreated = onDocumentCreated(
  "survey/{docId}",
  async (docEvent) => {
    try {
      const newData = docEvent.data?.data();

      if (!newData) {
        logger.info("No data was found!");
        return;
      }
      // Check survey type here
      const surveyType: SurveyTypes = newData.surveyType;
      const docId = docEvent.params.docId;

      // Base on the current survey type, call on the helper function to
      // write data to google sheet
      if (surveyType == SurveyTypes.Quality) {
        const forGs = processQualitySurveyDataForGs(newData);
        await handleSurveyInsertAndUpdate(
          [forGs],
          qualitySurveyResultSheet,
          docId,
          true,
          true
        );

        return;
      }

      const forGs = processQuantitySurveyDataForGs(newData);
      await handleSurveyInsertAndUpdate(
        [forGs.generalData],
        quantitySurveyGeneralResultSheet,
        docId,
        true,
        true
      );

      await handleSurveyInsertAndUpdate(
        forGs.calData,
        quantitySurveyCalResultSheet,
        docId,
        false,
        true
      );
      return;
    } catch (error) {
      logger.info(
        `An error occurred when trying to handle survey creation event: ${error}`
      );
    }
  }
);
