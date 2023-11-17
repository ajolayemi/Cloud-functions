export interface QuantitySurveyGoogleSheetData {
  author: string;
  surveyShortCode: string;
  surveyCompleteCode: string;
  placeCode: string;
  variety: string;
  varietyId: string;
  quantitySurvey: FQuantitySurvey;
  surveyDate?: string;
}

export interface FQuantitySurvey {
  /** The beneficiary of the current survey. Eg: RiC */
  beneficiary: string;

  /** The unit of measurement (KG or CASSE) */
  unitOfMeasurement?: string;

  /** The quantity that was observed */
  surveyQuantity: number;

  /** The percentage of scarto crivello */
  scartoCrivelloPercent: number;

  /** The expected date of harvest */
  harvestDate: string;

  /** The calibres from the survey */
  calibreValues?: Array<FCalFromSurvey>;

  /** If there is need for ladder when harvest will be done */
  needsLadder?: string;

  /** The rate of harvest per man. i.e Casse ora uomo */
  harvestRate?: number;

  /** Extra notes from the survey */
  notes?: string;

  /** Mostly the firebase storage path
   * where the first photo from the form field is located */
  firstPhotoPath?: string;

  /** The name given automatically to the first photo while saving */
  firstPhotoFileName?: string;

  /** Note provided for the first photo */
  firstPhotoNote?: string;

  /** Mostly the firebase storage path
   * where the second photo from the form field is located */
  secondPhotoPath?: string;

  /** The name given automatically to the second photo while saving */
  secondPhotoFileName?: string;

  /** Note provided for the second photo */
  secondPhotoNote?: string;

  /** The average weight per box (peso medio a cassa) */
  averageWeight?: number;
}

export interface FCalFromSurvey {
  name: string;
  value: number;
}
