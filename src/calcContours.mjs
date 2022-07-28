import each from 'lodash/each'
import map from 'lodash/map'
import min from 'lodash/min'
import max from 'lodash/max'
import get from 'lodash/get'
import size from 'lodash/size'
import isearr from 'wsemi/src/isearr.mjs'
import { tricontour } from 'd3-tricontour'
import getArea from './getArea.mjs'
import getCentroidMultiPolygon from './getCentroidMultiPolygon.mjs'
import clipMultiPolygon from './clipMultiPolygon.mjs'
import intersectMultiPolygon from './intersectMultiPolygon.mjs'


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


export default calcContours
