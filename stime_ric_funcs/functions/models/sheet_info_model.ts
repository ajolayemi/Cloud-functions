import {FilterSheetRangeInfo, SheetInfo} from "../interfaces/shared_interfaces";

/**
 * A class implementation of sheet info
 */
export class SheetInfoImpl {
  /**
   * @param {SheetInfo} sheetInfo An interface of information pertaining to a
   * Google Worksheet
   * @return {string} returns an A1 notation of a google sheet info
   * This info is mainly used when reading data from Google Worksheet
   */
  static getReadA1NotationRange(sheetInfo: SheetInfo): string {
    return `${sheetInfo.name}!${sheetInfo.firstColumn}:${sheetInfo.lastColumn}`;
  }

  /**
   *
   * @param {SheetInfo} sheetInfo The base sheet info
   * @param {FilterSheetRangeInfo} ranges The ranges to be updated
   * @return {string} An A1 notation range
   */
  static getUpdateA1NotionRange(
    sheetInfo: SheetInfo,
    ranges: FilterSheetRangeInfo
  ): string {
    return `${sheetInfo.name}!${sheetInfo.firstColumn}${ranges.firstRow}:${sheetInfo.lastColumn}${ranges.lastRow}`;
  }
}
