import each from 'lodash/each'
import map from 'lodash/map'
import get from 'lodash/get'
import filter from 'lodash/filter'
import size from 'lodash/size'
import cloneDeep from 'lodash/cloneDeep'
import isernot from 'wsemi/src/isernot.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isWindow from 'wsemi/src/isWindow.mjs'
import proj4 from 'proj4'
import turfBrowser from './importTurfBrowser.mjs'
import turfNode from './importTurfNode.mjs'


let turf = null
if (isWindow()) {
    // console.log('use turfBrowser')
    turf = turfBrowser
}
else {
    // console.log('use turfNode')
    turf = turfNode
}
// console.log('turf', turf)


//turf function
let helpers = turf.helpers
let { polygon, multiPolygon, lineString } = helpers
let area = turf.area
let centroid = turf.centroid
let centerOfMass = turf.centerOfMass
let intersect = turf.intersect
let mask = turf.mask
let difference = turf.difference
let bezierSpline = turf.bezierSpline
let buffer = turf.buffer
let booleanPointInPolygon = turf.booleanPointInPolygon


//proj4 defs
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


//proj4 EPSG
let EPSG3826 = new proj4.Proj('EPSG:3826') //TWD97 TM2(121分帶)
let EPSG3828 = new proj4.Proj('EPSG:3828') //TWD67 TM2(121分帶)
let EPSG4326 = new proj4.Proj('EPSG:4326') //WGS84


/**
 * 4326轉3826(WGS84經緯度轉TWD97 TM2)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/cvWGS84toTWD97TM2.test.js Github}
 * @memberOf w-gis
 * @param {Array} ds 輸入經緯度座標陣列，第0個元素為經度，第1個元素緯度，單位deg
 * @returns {Array} 回傳x,y座標陣列，第0個元素為x，第1個元素y，單位m
 * @example
 */
function cvWGS84toTWD97TM2(ds) {
    return proj4(EPSG4326, EPSG3826, ds)
}


/**
 * 4326轉3828(WGS84經緯度轉TWD67 TM2)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/cvWGS84toTWD67TM2.test.js Github}
 * @memberOf w-gis
 * @param {Array} ds 輸入經緯度座標陣列，第0個元素為經度，第1個元素緯度，單位deg
 * @returns {Array} 回傳x,y座標陣列，第0個元素為x，第1個元素y，單位m
 * @example
 */
function cvWGS84toTWD67TM2(ds) {
    return proj4(EPSG4326, EPSG3828, ds)
}


/**
 * 3826轉4326(TWD97 TM2轉WGS84經緯度)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/cvTWD97TM2toWGS84.test.js Github}
 * @memberOf w-gis
 * @param {Array} ds 輸入x,y座標陣列，第0個元素為x，第1個元素y，單位m
 * @returns {Array} 回傳經緯度座標陣列，第0個元素為經度，第1個元素緯度，單位deg
 * @example
 */
function cvTWD97TM2toWGS84(ds) {
    return proj4(EPSG3826, EPSG4326, ds)
}


/**
 * 3828轉4326(TWD67 TM2轉WGS84經緯度)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/cvTWD67TM2toWGS84.test.js Github}
 * @memberOf w-gis
 * @param {Array} ds 輸入x,y座標陣列，第0個元素為x，第1個元素y，單位m
 * @returns {Array} 回傳經緯度座標陣列，第0個元素為經度，第1個元素緯度，單位deg
 * @example
 */
function cvTWD67TM2toWGS84(ds) {
    return proj4(EPSG3828, EPSG4326, ds)
}


function toMultiPolygon(v) {

    function pointDepth(v) {
        let ip1 = size(get(v, '0', null))
        let ip2 = size(get(v, '0.0', null))
        let ip3 = size(get(v, '0.0.0', null))
        if (ip3 === 2) {
            return 3
        }
        if (ip2 === 2) {
            return 2
        }
        if (ip1 === 2) {
            return 1
        }
        if (ip1 === 0) {
            return 0
        }
        console.log('invalid point depth', v)
        return null
    }

    let d = pointDepth(v)
    if (d === 3) {
        return v
    }
    if (d === 2) {
        //return [v]
        return map(v, (vv) => {
            return [vv]
        })
    }
    if (d === 1) {
        return [[v]]
    }
    if (d === 0) {
        return []
    }
    return v
}


function getCentroidMultiPolygon(pgs) {
    if (!isearr(pgs)) {
        return null
    }
    let r = centroid(multiPolygon(toMultiPolygon(pgs)))
    let pt = r.geometry.coordinates
    return pt
}


function getCenterOfMassMultiPolygon(pgs) {
    if (!isearr(pgs)) {
        return null
    }
    let r = centerOfMass(multiPolygon(toMultiPolygon(pgs)))
    let pt = r.geometry.coordinates
    return pt
}


function getArea(pgs) {
    if (!isearr(pgs)) {
        return null
    }
    let r = area(multiPolygon(toMultiPolygon(pgs)))
    return r
}


function invCoordPolygon(pg) {
    //因為turf的point是先經再緯跟leaflet相反, 故需相反座標
    let r = map(pg, (v) => {
        return map(v, (vv) => {
            return [vv[1], vv[0]]
        })
    })
    return r
}


function invCoordMultiPolygon(pgs) {
    let r = map(pgs, (pg) => {
        return invCoordPolygon(pg)
    })
    return r
}


function isPointInPolygon(p, pgs) {
    let r = booleanPointInPolygon(p, multiPolygon(toMultiPolygon(pgs)))
    return r
}


function parseGeometryCollection(data) {
    let gs = get(data, 'geometry.geometries')
    let pgs = []
    each(gs, (v) => {
        if (v.type === 'Polygon') {
            pgs.push(v.coordinates)
        }
        else if (v.type === 'MultiPolygon') {
            each(v.coordinates, (vv) => {
                pgs.push(vv)
            })
        }
    })
    return pgs
}


function distilMultiPolygon(r) {
    //因turf計算後可能產生Polygon,MultiPolygon,LineString,GeometryCollection, 故將全部轉成MultiPolygon後回傳
    let type = get(r, 'geometry.type')
    let pgNew = get(r, 'geometry.coordinates')
    if (type === 'Polygon') {
        return [pgNew]
    }
    else if (type === 'MultiPolygon') {
        return pgNew
    }
    else if (type === 'GeometryCollection') {
        return parseGeometryCollection(r)
    }
    else {
        // console.log('type', type, r)
        return []
    }
}


function intersectMultiPolygon(pgs, pgsInter) {

    //pgNew
    let r = intersect(multiPolygon(toMultiPolygon(pgs)), multiPolygon(toMultiPolygon(pgsInter)))

    return distilMultiPolygon(r)
}


function maskMultiPolygon(pgs) {

    //pgNew
    let r = mask(multiPolygon(toMultiPolygon(pgs)))

    return distilMultiPolygon(r)
}


function clipMultiPolygon(pgs, pgsCut) {

    //difference
    let r = difference(multiPolygon(toMultiPolygon(pgs)), multiPolygon(toMultiPolygon(pgsCut)))

    return distilMultiPolygon(r)
}


function splineMultiPolygon(pgs, option) {
    //splineMultiPolygon(pgs, { resolution: 50000, sharpness: 0.05 })

    function core(pg, option) {

        //cloneDeep
        pg = cloneDeep(pg)

        //pgNew
        let pgNew = map(pg, (ps, k) => {
            let line = lineString(ps)
            let r = bezierSpline(line, option)
            let psNew = get(r, 'geometry.coordinates')
            return psNew
        })

        return pgNew
    }

    //cloneDeep
    pgs = cloneDeep(pgs)

    //core
    pgs = map(pgs, (pg) => {
        return core(pg, option)
    })

    return pgs
}


function fixGeometryMultiPolygon(pgs) {

    function core(pg) {

        //invCoordPolygon, 因為buffer需要輸入正確經緯度才有辦法運算
        pg = invCoordPolygon(pg)

        //pgt
        let pgt = polygon(pg)

        //buffer
        let bf = buffer(pgt, 1, { units: 'kilometers' })

        //distilMultiPolygon
        let pgsNew = distilMultiPolygon(bf)

        //invCoordMultiPolygon
        pgsNew = invCoordMultiPolygon(pgsNew)

        return pgsNew
    }

    //cloneDeep
    pgs = cloneDeep(pgs)

    //core
    let pgsNew = []
    each(pgs, (pg) => {
        let r = core(pg) //回傳是MultiPolygon
        each(r, (v) => {
            pgsNew.push(v)
        })
    })

    //filter
    pgsNew = filter(pgsNew, isernot)

    return pgsNew
}


let WGis = {
    toMultiPolygon,
    cvWGS84toTWD97TM2,
    cvWGS84toTWD67TM2,
    cvTWD97TM2toWGS84,
    cvTWD67TM2toWGS84,
    getCentroidMultiPolygon,
    getCenterOfMassMultiPolygon,
    getArea,
    isPointInPolygon,
    intersectMultiPolygon,
    clipMultiPolygon,
    maskMultiPolygon,
    splineMultiPolygon,
    fixGeometryMultiPolygon,
}


export default WGis
