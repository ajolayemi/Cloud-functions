import {QuantitySurveyGoogleSheetData} from "../interfaces/quantity_survey_interfaces";

/**
 * A representation of data saved to Google Sheet for quantity
 * surveys
 */
export class QuantitySurveyGoogleSheetResult {
  data: QuantitySurveyGoogleSheetData;
  /**
   * @param {QuantitySurveyGoogleSheetData} data
   */
  constructor(data: QuantitySurveyGoogleSheetData) {
    this.data = data;
  }

  /**
   * Returns an Array of data to be saved to google sheet later on
   */
  get regForSheet(): Array<string | number | undefined> {
    const data = this.data;
    return [
      data.surveyCompleteCode,
      data.author,
      "",
      data.quantitySurvey.unitOfMeasurement,
      data.quantitySurvey.surveyQuantity,
      data.quantitySurvey.scartoCrivelloPercent / 100,
      data.surveyShortCode,
      data.surveyDate,
      data.placeCode,
      data.variety,
      data.quantitySurvey.beneficiary,
      data.quantitySurvey.harvestDate,
      data.quantitySurvey.harvestRate,
      data.quantitySurvey.notes,
      data.quantitySurvey.needsLadder,
      data.quantitySurvey.firstPhotoPath ?? "",
      data.quantitySurvey.firstPhotoNote ?? "",
      data.quantitySurvey.secondPhotoPath ?? "",
      data.quantitySurvey.secondPhotoNote,
      data.varietyId,
      data.quantitySurvey.averageWeight,
    ];
  }
}
