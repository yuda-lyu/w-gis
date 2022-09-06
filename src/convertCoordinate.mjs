import size from 'lodash/size'
import isearr from 'wsemi/src/isearr.mjs'
import haskey from 'wsemi/src/haskey.mjs'
import proj4 from 'proj4'


//defs
proj4.defs([
    [
        'EPSG:4326',
        '+title=WGS84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
    ],
    [
        'EPSG:3824',
        '+title=TWD97 +proj=longlat +ellps=GRS80 +no_defs +type=crs'
    ],
    [
        'EPSG:3826',
        '+title=TWD97 TM2 +proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
    ],
    [
        'EPSG:3821',
        '+title=TWD67 +proj=longlat +towgs84=-752,-358,-179,-.0000011698,.0000018398,.0000009822,.00002329 +ellps=aust_SA +units=degrees +no_defs',
    ],
    [
        'EPSG:3828',
        '+title=TWD67 TM2 +proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=aust_SA +towgs84=-752,-358,-179,-0.0000011698,0.0000018398,0.0000009822,0.00002329 +units=m +no_defs'
    ],
])


/**
 * 座標轉換
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/convertCoordinate.test.js Github}
 * @memberOf w-gis
 * @param {String} cdFrom 輸入來源座標系統字串
 * @param {String} cdTo 輸入轉出座標系統字串
 * @param {Array} ps 輸入座標(x,y)陣列
 * @returns {Array} 回傳轉換之座標陣列
 * @example
 *
 * let ps
 * let r
 *
 * //from WGS84
 * ps = [121, 24]
 * r = convertCoordinate('WGS84', 'TWD97', ps)
 * console.log('WGS84', 'to', 'TWD97', r)
 * // => WGS84 to TWD97 [ 121, 24.000000000000004 ]
 *
 * ps = [121, 24]
 * r = convertCoordinate('WGS84', 'TWD67', ps)
 * console.log('WGS84', 'to', 'TWD67', r)
 * // => WGS84 to TWD67 [ 120.99185287062672, 24.001775588106096 ]
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
 * //from TWD97
 * ps = [121, 24.000000000000004]
 * r = convertCoordinate('TWD97', 'WGS84', ps)
 * console.log('TWD97', 'to', 'WGS84', r)
 * // => TWD97 to WGS84 [ 121, 24.000000000000004 ]
 *
 * ps = [121, 24.000000000000004]
 * r = convertCoordinate('TWD97', 'TWD67', ps)
 * console.log('TWD97', 'to', 'TWD67', r)
 * // => TWD97 to TWD67 [ 120.99185287062672, 24.001775588106103 ]
 *
 * ps = [121, 24.000000000000004]
 * r = convertCoordinate('TWD97', 'TWD97TM2', ps)
 * console.log('TWD97', 'to', 'TWD97TM2', r)
 * // => TWD97 to TWD97TM2 [ 250000, 2655023.124957118 ]
 *
 * ps = [121, 24.000000000000004]
 * r = convertCoordinate('TWD97', 'TWD67TM2', ps)
 * console.log('TWD97', 'to', 'TWD67TM2', r)
 * // => TWD97 to TWD67TM2 [ 249171.1063953548, 2655228.9690125366 ]
 *
 * //from TWD67
 * ps = [120.99185287062672, 24.001775588106103]
 * r = convertCoordinate('TWD67', 'WGS84', ps)
 * console.log('TWD67', 'to', 'WGS84', r)
 * // => TWD67 to WGS84 [ 120.99999996996448, 24.000000006583658 ]
 *
 * ps = [120.99185287062672, 24.001775588106103]
 * r = convertCoordinate('TWD67', 'TWD97', ps)
 * console.log('TWD67', 'to', 'TWD97', r)
 * // => TWD67 to TWD97 [ 120.99999996996448, 24.000000006583658 ]
 *
 * ps = [120.99185287062672, 24.001775588106103]
 * r = convertCoordinate('TWD67', 'TWD97TM2', ps)
 * console.log('TWD67', 'to', 'TWD97TM2', r)
 * // => TWD67 to TWD97TM2 [ 249999.99694413712, 2655023.125686239 ]
 *
 * ps = [120.99185287062672, 24.001775588106103]
 * r = convertCoordinate('TWD67', 'TWD67TM2', ps)
 * console.log('TWD67', 'to', 'TWD67TM2', r)
 * // => TWD67 to TWD67TM2 [ 249171.1063953548, 2655228.969012536 ]
 *
 * //from TWD97TM2
 * ps = [250000, 2655023.124957118]
 * r = convertCoordinate('TWD97TM2', 'WGS84', ps)
 * console.log('TWD97TM2', 'to', 'WGS84', r)
 * // => TWD97TM2 to WGS84 [ 121, 24.000000000000004 ]
 *
 * ps = [250000, 2655023.124957118]
 * r = convertCoordinate('TWD97TM2', 'TWD97', ps)
 * console.log('TWD97TM2', 'to', 'TWD97', r)
 * // => TWD97TM2 to TWD97 [ 121, 24.000000000000004 ]
 *
 * ps = [250000, 2655023.124957118]
 * r = convertCoordinate('TWD97TM2', 'TWD67', ps)
 * console.log('TWD97TM2', 'to', 'TWD67', r)
 * // => TWD97TM2 to TWD67 [ 120.99185287062672, 24.001775588106103 ]
 *
 * ps = [250000, 2655023.124957118]
 * r = convertCoordinate('TWD97TM2', 'TWD67TM2', ps)
 * console.log('TWD97TM2', 'to', 'TWD67TM2', r)
 * // => TWD97TM2 to TWD67TM2 [ 249171.1063953548, 2655228.9690125366 ]
 *
 * //from TWD67TM2
 * ps = [249171.1063953548, 2655228.969012536]
 * r = convertCoordinate('TWD67TM2', 'WGS84', ps)
 * console.log('TWD67TM2', 'to', 'WGS84', r)
 * // => TWD67TM2 to WGS84 [ 120.99999996996448, 24.000000006583658 ]
 *
 * ps = [249171.1063953548, 2655228.969012536]
 * r = convertCoordinate('TWD67TM2', 'TWD97', ps)
 * console.log('TWD67TM2', 'to', 'TWD97', r)
 * // => TWD67TM2 to TWD97 [ 120.99999996996448, 24.000000006583658 ]
 *
 * ps = [249171.1063953548, 2655228.969012536]
 * r = convertCoordinate('TWD67TM2', 'TWD67', ps)
 * console.log('TWD67TM2', 'to', 'TWD67', r)
 * // => TWD67TM2 to TWD67 [ 120.99185287062672, 24.001775588106096 ]
 *
 * ps = [249171.1063953548, 2655228.969012536]
 * r = convertCoordinate('TWD67TM2', 'TWD97TM2', ps)
 * console.log('TWD67TM2', 'to', 'TWD97TM2', r)
 * // => TWD67TM2 to TWD97TM2 [ 249999.99694413712, 2655023.125686239 ]
 *
 */
function convertCoordinate(cdFrom, cdTo, ps) {

    //check
    if (!isearr(ps) && size(ps) !== 2) {
        throw new Error('ps is not an array(length=2)')
    }

    //kp
    let kp = {
        'TWD97': 'EPSG:3824',
        'TWD97TM2': 'EPSG:3826',
        'TWD67': 'EPSG:3821',
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