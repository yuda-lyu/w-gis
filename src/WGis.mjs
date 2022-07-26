import each from 'lodash/each'
import map from 'lodash/map'
import min from 'lodash/min'
import max from 'lodash/max'
import get from 'lodash/get'
import filter from 'lodash/filter'
import size from 'lodash/size'
import cloneDeep from 'lodash/cloneDeep'
import isernot from 'wsemi/src/isernot.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isWindow from 'wsemi/src/isWindow.mjs'
import { tricontour } from 'd3-tricontour'
import turfBrowser from './importTurfBrowser.mjs'
import turfNode from './importTurfNode.mjs'
import convertCoordinate from './convertCoordinate.mjs'


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


function calcContours(points, opt = {}) {

    function getContours(pts) {

        //tricontour
        let tric = tricontour()

        //calc
        let contours = tric(pts)
        // console.log('calcContours contours1', contours)
        // contours = [contours[0], contours[1], contours[2], contours[3]]
        // console.log('calcContours contours2', contours)

        return contours
    }

    //containInner
    let containInner = get(opt, 'containInner', null)

    //clipInner
    let clipInner = get(opt, 'clipInner', null)

    //clipOuter
    let clipOuter = get(opt, 'clipOuter', null)

    //valueMin, valueMax
    let valueMin = points[0][2]
    let valueMax = points[0][2]
    for (let i = 1; i < size(points); i++) {
        let value = points[i][2]
        if (valueMin > value) {
            valueMin = value
        }
        if (valueMax < value) {
            valueMax = value
        }
    }
    // console.log('valueMin', valueMin, 'valueMax', valueMax)

    //contours
    let contours = getContours(points)
    // console.log('contours', cloneDeep(contours))

    //check
    if (!isearr(contours)) {
        // console.log('can not calculate contours', contours)
        return []
    }
    // console.log('contours.length', contours.length)

    //polylines
    let polylines = map(contours, (v, k) => {

        return {
            latLngs: v.coordinates,
            level: v.value,
            effectArea: getArea(v.coordinates),
            effectAreaCentroid: getCentroidMultiPolygon(v.coordinates), //要先計算, 否則之後會被相減計算成真實等值區域, 就不是影響區域的中心了
        }
    })
    // console.log('polylines from contours', cloneDeep(polylines))

    //針對可能超出數據區添加polyline
    if (true) {

        //pmin, pmax
        let pmin = min(map(polylines, 'level'))
        let pmax = max(map(polylines, 'level'))
        // console.log('pmin', pmin, 'pmax', pmax)

        //實際數據有超出contours的最大值, 添加虛擬polyline
        if (pmax < valueMax) {
            polylines.push({
                mode: 'virtualEnd',
                latLngs: [],
                level: valueMax,
                effectArea: 0,
            })
        }

        //實際數據有低於contours的最小值, 添加虛擬polyline
        if (pmin > valueMin) {
            let pl = {
                mode: 'virtualStart',
                latLngs: [],
                level: valueMin,
                effectArea: 0,
            }
            polylines = [pl, ...polylines]
        }

    }
    // console.log('polylines for vartual level', cloneDeep(polylines))

    //若不是於超出數據區新增虛擬polyline, 因tricontour會給出繪圖間距而不是實際資料間距, 故會出現level值大於或小於原數據上下限
    if (true) {
        each(polylines, (v, k) => {
            v.level = Math.min(v.level, valueMax)
            v.level = Math.max(v.level, valueMin)
        })
    }
    // console.log('polylines for limit level', cloneDeep(polylines))

    //polygonSets, 剔除下1個多邊形區域, 為實際需繪製的等值區
    let polygonSets = []
    for (let i = 0; i <= polylines.length - 2; i++) {

        //p0,p1,range
        let p0 = polylines[i].latLngs
        let p1 = polylines[i + 1].latLngs
        let range = {
            text: `${polylines[i].level} - ${polylines[i + 1].level}`,
            low: polylines[i].level,
            up: polylines[i + 1].level,
        }

        //clipMultiPolygon
        let latLngs = []
        latLngs = clipMultiPolygon(p0, p1)
        if (get(polylines[i], 'mode' === 'virtualStart')) { //若為virtualStart, 則代表直接使用下1個polylines成為等值區域, 方能代表凹陷區
            latLngs = p1 //因為既有屬性都是取前者, 故若virtualStart係使用後者p1, 就代表全部polygonSet都會有真實effectArea
        }
        else {
            latLngs = clipMultiPolygon(p0, p1)
        }

        polygonSets.push({
            ...polylines[i],
            latLngs,
            range,
        })
    }
    // console.log('polygonSets from polylines', cloneDeep(polygonSets))

    //polygonsContainInner, 保留指定多polygon以內區域
    if (true) {
        let t = []
        each(polygonSets, (polygonSet, k) => {

            //latLngs
            let latLngs = null
            if (isearr(containInner)) {

                //intersectMultiPolygon
                latLngs = intersectMultiPolygon(polygonSet.latLngs, containInner)

            }
            else {
                latLngs = polygonSet.latLngs
            }

            //check
            if (size(latLngs) > 0) {
                t.push({
                    ...polygonSet,
                    latLngs,
                })
            }

        })
        polygonSets = t
    }
    // console.log('polygonSets for polygonsContainInner', cloneDeep(polygonSets))

    //polygonsClipInner, 剔除指定多polygon以內區域
    if (true) {
        let t = []
        each(polygonSets, (polygonSet, k) => {

            //latLngs
            let latLngs = null
            if (isearr(clipInner)) {

                //clipMultiPolygon
                latLngs = clipMultiPolygon(polygonSet.latLngs, clipInner)

            }
            else {
                latLngs = polygonSet.latLngs
            }

            //check
            if (size(latLngs) > 0) {
                t.push({
                    ...polygonSet,
                    latLngs,
                })
            }

        })
        polygonSets = t
    }
    // console.log('polygonSets for polygonsClipInner', cloneDeep(polygonSets))

    //polygonClipOuter, 剔除指定polygon以外區域
    if (true) {
        let t = []
        each(polygonSets, (polygonSet) => {

            //latLngs
            let latLngs = null
            if (isearr(clipOuter)) {

                //intersectMultiPolygon
                latLngs = intersectMultiPolygon(polygonSet.latLngs, clipOuter)

            }
            else {
                latLngs = polygonSet.latLngs
            }

            //check
            if (size(latLngs) > 0) {
                t.push({
                    ...polygonSet,
                    latLngs,
                })
            }

        })
        polygonSets = t
    }
    // console.log('polygonSets for polygonClipOuter', cloneDeep(polygonSets))

    //center
    if (true) {
        let areaMax = 0
        let areaInd = null
        let areaCentroid = null
        each(polygonSets, (polygonSet, k) => {
            if (areaMax < polygonSet.effectArea) {
                areaInd = k
                areaMax = polygonSet.effectArea
                areaCentroid = polygonSet.effectAreaCentroid
            }
        })
        if (areaInd === null) {
            // console.log('can not calculate centroid of contour', polygonSets)
            return []
        }

        //add center
        each(polygonSets, (polygonSet, k) => {
            polygonSets[k].center = areaCentroid
        })

    }

    return polygonSets
}


let WGis = {

    turf,

    toMultiPolygon,
    getCentroidMultiPolygon,
    getCenterOfMassMultiPolygon,
    getArea,
    isPointInPolygon,
    intersectMultiPolygon,
    clipMultiPolygon,
    maskMultiPolygon,
    splineMultiPolygon,
    fixGeometryMultiPolygon,
    calcContours,

    invCoordPolygon,
    invCoordMultiPolygon,
    convertCoordinate,

}


export default WGis
