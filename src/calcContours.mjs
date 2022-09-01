import each from 'lodash/each'
import map from 'lodash/map'
import min from 'lodash/min'
import max from 'lodash/max'
import get from 'lodash/get'
import size from 'lodash/size'
import isearr from 'wsemi/src/isearr.mjs'
import { tricontour } from 'd3-tricontour'
import getAreaMultiPolygonSm from './getAreaMultiPolygonSm.mjs'
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

        //偵測最末多邊形
        let ub = size(contours) - 1
        let contourLast = contours[ub]
        let coordinates = get(contourLast, 'coordinates', []) //coordinates
        if (size(coordinates) === 0) {
            contours[ub].sepZone = 'top'
        }

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
            sepZone: get(v, 'sepZone', ''),
            latLngs: v.coordinates,
            level: v.value,
            effectArea: getAreaMultiPolygonSm(v.coordinates),
            effectAreaCentroid: getCentroidMultiPolygon(v.coordinates), //要先計算, 否則之後會被相減計算成真實等值區域, 就不是影響區域的中心了
        }
    })
    // console.log('polylines from contours', cloneDeep(polylines))

    //針對可能超出數據區添加polyline
    if (true) {

        //pmin, pmax
        let ls = map(polylines, 'level')
        let pmin = min(ls)
        let pmax = max(ls)
        // console.log('pmin', pmin, 'pmax', pmax)

        //實際數據有超出contours的最大值, 添加虛擬polyline
        if (pmax < valueMax) {
            console.log('非預期: pmax < valueMax', pmax < valueMax, pmax, valueMax)
            polylines.push({
                mode: 'virtualEnd',
                sepZone: '',
                latLngs: [],
                level: valueMax,
                effectArea: 0,
            })
        }

        //實際數據有低於contours的最小值, 添加虛擬polyline
        if (pmin > valueMin) {
            console.log('非預期: pmin > valueMin', pmin > valueMin, pmin, valueMin)
            let pl = {
                mode: 'virtualStart',
                sepZone: '',
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

        //p0, p1
        let p0 = polylines[i]
        let p1 = polylines[i + 1]
        // console.log(i, 'p0', p0, p0.level, 'p1', p1, p1.level)

        //ps0, ps1
        let ps0 = p0.latLngs
        let ps1 = p1.latLngs

        //range
        let range = {
            text: `${polylines[i].level} - ${polylines[i + 1].level}`,
            low: polylines[i].level,
            up: polylines[i + 1].level,
        }

        //clipMultiPolygon
        let latLngs = []
        latLngs = clipMultiPolygon(ps0, ps1)
        if (p0.mode === 'virtualStart') { //若為virtualStart, 則代表直接使用下1個polylines成為等值區域, 方能代表凹陷區
            latLngs = ps1 //因為既有屬性都是取前者, 故若virtualStart係使用後者p1, 就代表全部polygonSet都會有真實effectArea
        }
        else if (p1.sepZone === 'top') { //若後者sepZone為top, 代表無多邊形數據, 得要使用前者多邊形建構
            latLngs = ps0
        }
        else {
            latLngs = clipMultiPolygon(ps0, ps1)
        }

        polygonSets.push({
            ...p0,
            latLngs,
            range,
            // sepZone:get(ps1)
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
