import size from 'lodash/size'
import isearr from 'wsemi/src/isearr.mjs'
import haskey from 'wsemi/src/haskey.mjs'
import proj4 from 'proj4'


//defs
proj4.defs([
    [
        'EPSG:4326',
        '+title=WGS84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
    [
        'EPSG:3826',
        '+title=TWD97 TM2 +proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
    ],
    [
        'EPSG:3828',
        '+title=TWD67 TM2 +proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=aust_SA +towgs84=-752,-358,-179,-0.0000011698,0.0000018398,0.0000009822,0.00002329 +units=m +no_defs'
    ]
])

// function core() {

//     //EPSG
//     let EPSG3826 = new proj4.Proj('EPSG:3826') //TWD97 TM2(121分帶)
//     let EPSG3828 = new proj4.Proj('EPSG:3828') //TWD67 TM2(121分帶)
//     let EPSG4326 = new proj4.Proj('EPSG:4326') //WGS84

//     function cvWGS84toTWD97TM2(ps) {
//         //4326轉3826(WGS84經緯度轉TWD97 TM2)

//         //check
//         if (!isearr(ps) && size(ps) !== 2) {
//             throw new Error('ps is not an array(length=2)')
//         }

//         return proj4(EPSG4326, EPSG3826, ps)
//     }

//     function cvWGS84toTWD67TM2(ps) {
//         //4326轉3828(WGS84經緯度轉TWD67 TM2)

//         //check
//         if (!isearr(ps) && size(ps) !== 2) {
//             throw new Error('ps is not an array(length=2)')
//         }

//         return proj4(EPSG4326, EPSG3828, ps)
//     }

//     function cvTWD97TM2toWGS84(ps) {
//         //3826轉4326(TWD97 TM2轉WGS84經緯度)

//         //check
//         if (!isearr(ps) && size(ps) !== 2) {
//             throw new Error('ps is not an array(length=2)')
//         }

//         return proj4(EPSG3826, EPSG4326, ps)
//     }

//     function cvTWD67TM2toWGS84(ps) {
//         //3828轉4326(TWD67 TM2轉WGS84經緯度)

//         //check
//         if (!isearr(ps) && size(ps) !== 2) {
//             throw new Error('ps is not an array(length=2)')
//         }

//         return proj4(EPSG3828, EPSG4326, ps)
//     }

//     return {
//         proj4,
//         cvWGS84toTWD97TM2,
//         cvWGS84toTWD67TM2,
//         cvTWD97TM2toWGS84,
//         cvTWD67TM2toWGS84,
//     }
// }


/**
 * 座標轉換
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-geo/blob/master/test/convertCoordinate.test.js Github}
 * @memberOf w-geo
 * @param {String} cdFrom 輸入來源座標系統字串
 * @param {String} cdTo 輸入轉出座標系統字串
 * @param {Array} ps 輸入座標(x,y)陣列
 * @returns {Array} 回傳轉出座標陣列
 * @example
 *
 * let ps
 * let r
 *
 * ps = [121, 24]
 * r = convertCoordinate('WGS84', 'TWD97TM2', ps)
 * console.log('WGS84', 'to', 'TWD97TM2', r)
 * // => WGS84 to TWD97TM2 [ 250000, 2655023.124957118 ]
 *
 * ps = [121, 24]
 * r = convertCoordinate('WGS84', 'TWD67TM2', ps)
 * console.log('WGS84', 'to', 'TWD67TM2', r)
 * // => WGS84 to TWD67TM2 [ 249171.1063953548, 2655228.969012536 ]
 *
 * ps = [250000, 2655023]
 * r = convertCoordinate('TWD97TM2', 'TWD67TM2', ps)
 * console.log('TWD97TM2', 'to', 'TWD67TM2', r)
 * // => TWD97TM2 to TWD67TM2 [ 249171.10639535502, 2655228.8440549527 ]
 *
 */
function convertCoordinate(cdFrom, cdTo, ps) {

    //check
    if (!isearr(ps) && size(ps) !== 2) {
        throw new Error('ps is not an array(length=2)')
    }

    //core
    // let cc = core()
    // cvWGS84toTWD97TM2,
    // cvWGS84toTWD67TM2,
    // cvTWD97TM2toWGS84,
    // cvTWD67TM2toWGS84,

    //kp
    let kp = {
        'TWD97TM2': 'EPSG:3826',
        'TWD67TM2': 'EPSG:3828',
        'WGS84': 'EPSG:4326',
    }

    //check cdFrom
    if (haskey(kp, cdFrom)) {
        cdFrom = kp[cdFrom]
    }

    //check cdTo
    if (haskey(kp, cdTo)) {
        cdTo = kp[cdTo]
    }

    //proj4
    // let EPSG3826 = new proj4.Proj('EPSG:3826') //TWD97 TM2(121分帶)
    // let EPSG3828 = new proj4.Proj('EPSG:3828') //TWD67 TM2(121分帶)
    // let EPSG4326 = new proj4.Proj('EPSG:4326') //WGS84
    // proj4(EPSG4326, EPSG3826, ps)
    let pj4From = new proj4.Proj(cdFrom)
    let pj4To = new proj4.Proj(cdTo)
    let r = proj4(pj4From, pj4To, ps)

    return r
}


export default convertCoordinate
