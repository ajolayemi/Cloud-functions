import {QualitySurveyGoogleSheetData} from "../interfaces/quality_survey_interface_data";

/**
 * A class representation of quality survey data saved to Google Sheet
 */
export class QualitySurveyGoogleSheetResult {
  data: QualitySurveyGoogleSheetData;
  /**
   * @param {QualitySurveyGoogleSheetData} data
   */
  constructor(data: QualitySurveyGoogleSheetData) {
    this.data = data;
  }
  /**
   * Returns an array of data to be registered over to Google Sheet
   */
  get qualitySurveyResultForGoogleSheet(): Array<string | number> {
    const data = this.data;
    return [
      data.surveyCompleteCode,
      data.fQualitySurvey.beneficiary ?? "",
      data.varietyName,
      data.idVarieta,
      data.surveyShortCode,
      data.author,
      data.surveyDate,
      data.placeCode,
      data.fQualitySurvey.samples ?? "",
      data.fQualitySurvey.fruitState ?? "",
      data.fQualitySurvey.plantState ?? "",
      data.fQualitySurvey.arePlantsClose ?? "",
      data.fQualitySurvey.pigmentation ?? "",
      data.fQualitySurvey.areThereTraps ?? "",
      data.fQualitySurvey.foliageState ?? "",
      data.fQualitySurvey.roadState ?? "",
      data.fQualitySurvey.brix ?? 0,
      data.fQualitySurvey.areFruitsDamaged ?? "",
      data.fQualitySurvey.fruitDamagePercentage ?? 0,
      data.fQualitySurvey.isFarmLandClean ?? "",
      data.fQualitySurvey.farmlandPhotoPath ?? "",
      data.fQualitySurvey.arePlantsPruned ?? "",
      data.fQualitySurvey.plantPhotoPath ?? "",
      data.fQualitySurvey.notes ?? "",
    ];
  }
}
