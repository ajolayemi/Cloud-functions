import * as logger from "firebase-functions/logger";
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
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
// Set the maximum instances to 10 for all functions
setGlobalOptions({maxInstances: 10});

/**
 * Responds to delete events on survey documents
 */
exports.onSurveyDeleted = onDocumentDeleted(
  "survey/{docId}",
  async (deleteEvent) => {
    try {
      const docId = deleteEvent.data?.id;
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
      const docId = updateEvent.data?.after.id;
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
      await processUpdateEvents(quantitySurveyGeneralResultSheet, docId, [
        dataForGs.generalData,
      ]);

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
      const docId = docEvent.data?.id;

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
