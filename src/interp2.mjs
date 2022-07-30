import get from 'lodash/get'
import each from 'lodash/each'
import map from 'lodash/map'
import sum from 'lodash/sum'
import size from 'lodash/size'
import toNumber from 'lodash/toNumber'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import getAreaPolygon from './getAreaPolygon.mjs'
import intersectPolygon from './intersectPolygon.mjs'
import { Delaunay } from 'd3-delaunay'


function toArrayXY(ps, opt = {}) {

    //若無數據回傳空陣列
    if (size(ps) <= 0) {
        return []
    }

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //rs
    let rs = []
    each(ps, (v) => {
        let x = null
        let y = null
        if (isarr(v) && size(v) >= 2) {
            x = get(v, 0)
            y = get(v, 1)
        }
        else {
            x = get(v, keyX, null)
            y = get(v, keyY, null)
        }
        if (isnum(x) && isnum(y)) {
            x = toNumber(x)
            y = toNumber(y)
            rs.push({
                x,
                y,
            })
        }
    })

    return rs
}


function toArrayXYZ(ps, opt = {}) {

    //若無數據回傳空陣列
    if (size(ps) <= 0) {
        return []
    }

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //keyZ
    let keyZ = get(opt, 'keyZ', '')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //rs
    let rs = []
    each(ps, (v) => {
        let x = null
        let y = null
        let z = null
        if (isarr(v) && size(v) >= 3) {
            x = get(v, 0)
            y = get(v, 1)
            z = get(v, 2)
        }
        else {
            x = get(v, keyX, null)
            y = get(v, keyY, null)
            z = get(v, keyZ, null)
        }
        if (isnum(x) && isnum(y) && isnum(z)) {
            x = toNumber(x)
            y = toNumber(y)
            z = toNumber(z)
            rs.push({
                x,
                y,
                z,
            })
        }
    })

    return rs
}


/**
 * 基於三角網格與自然鄰點內插法(Natural Neighbor Interpolation)計算指定內插點數值
 *
 * A Fast and Accurate Algorithm for Natural Neighbor Interpolation
 * https://gwlucastrig.github.io/TinfourDocs/NaturalNeighborTinfourAlgorithm/index.html
 *
 * Natural neighbor interpolation
 * https://observablehq.com/@karlerss/natural-neighbor-interpolation
 *
 * An Introduction to Natural Neighbor Interpolation
 * https://gwlucastrig.github.io/TinfourDocs/NaturalNeighborIntro/index.html
 *
 * d3-delaunay
 * https://github.com/d3/d3-delaunay
 *
 * Delaunator
 * https://github.com/mapbox/delaunator
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} psSrc 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列
 * @param {Array|Object} psTar 輸入點陣列或點物件，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或{x:x1,y:y1}點物件
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @returns {Array|Object} 回傳點物件陣列或點物件
 * @example
 *
 * let ps = [{ 'x': 243, 'y': 206, 'z': 95 }, { 'x': 233, 'y': 225, 'z': 146 }, { 'x': 21, 'y': 325, 'z': 22 }, { 'x': 953, 'y': 28, 'z': 223 }, { 'x': 1092, 'y': 290, 'z': 39 }, { 'x': 744, 'y': 200, 'z': 191 }, { 'x': 174, 'y': 3, 'z': 22 }, { 'x': 537, 'y': 368, 'z': 249 }, { 'x': 1151, 'y': 371, 'z': 86 }, { 'x': 814, 'y': 252, 'z': 125 }]
 * let p
 * let r
 *
 * p = {
 *     x: 243,
 *     y: 205,
 * }
 * r = interp2(ps, p)
 * console.log(r)
 * // => { x: 243, y: 205, z: 94.93541171916787 }
 *
 * p = {
 *     x: 283,
 *     y: 205,
 * }
 * r = interp2(ps, p)
 * console.log(r)
 * // => { x: 283, y: 205, z: 115.17591167501384 }
 *
 * p = {
 *     x: 1160,
 *     y: 380,
 * }
 * r = interp2(ps, p)
 * console.log(r)
 * // => { x: 1160, y: 380, z: null }
 *
 */
function interp2(psSrc, psTar, opt = {}) {

    //check psSrc
    if (!isearr(psSrc)) {
        return {
            err: 'psSrc is not an array'
        }
    }

    //check psTar
    if (!iseobj(psTar) && !isearr(psTar)) {
        return {
            err: 'psTar is not an object or array'
        }
    }
    let isOne = iseobj(psTar)
    if (isOne) {
        psTar = [psTar]
    }

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //keyZ
    let keyZ = get(opt, 'keyZ', '')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //toArrayXYZ
    psSrc = toArrayXYZ(psSrc, opt)

    //check psSrc
    if (size(psSrc) === 0) {
        return {
            err: 'psSrc has no effective data'
        }
    }
    // console.log('psSrc', psSrc)

    //toArrayXY
    psTar = toArrayXY(psTar, opt)

    //check psTar
    if (size(psTar) === 0) {
        return {
            err: 'psTar has no effective data'
        }
    }
    // console.log('psTar', psTar)

    //psSrcItr
    let psSrcItr = [...psSrc]

    //psSrcOri
    let psSrcOri = [...psSrc]

    //initialVor
    let initialVor = Delaunay.from(psSrcOri, d => d[keyX], d => d[keyY]).voronoi()

    function addPoint(data, x, y) {
        let r
        try {
            r = addPointCore(data, x, y)
        }
        catch (err) {
            r = null
            data.pop()
        }
        return r
    }

    function addPointCore(data, x, y) {

        //psSrcTemp
        let psSrcTemp = [...psSrc]

        //newItem
        let newItem = { [keyX]: x, [keyY]: y, [keyZ]: 0 }

        //push
        psSrcTemp.push(newItem)
        data.push(newItem)

        //postVor
        let postVor = Delaunay.from(psSrcTemp, d => d[keyX], d => d[keyY]).voronoi()
        // console.log('postVor', postVor)

        //newIdx
        let newIdx = psSrcTemp.length - 1
        // console.log('newIdx', newIdx)

        //queryPoly
        let queryPoly = postVor.cellPolygon(newIdx)
        // console.log('queryPoly', queryPoly)

        //queryA
        let queryA = getAreaPolygon(queryPoly)
        // console.log('queryA', queryA)

        //newPointVal
        let newPointVal = null
        if (queryA > 0) {

            //neighborIndices
            let neighborIndices = []
            // for (let i of postVor.delaunay.neighbors(newIdx)) { //因為postVor.delaunay.neighbors是generator, 考慮要支援ie11得使用while與next讀取
            //     neighborIndices.push(i)
            // }
            let sq = postVor.delaunay.neighbors(newIdx)
            // console.log(`sq`, sq)
            let next = sq.next()
            while (!next.done) {
                let v = next.value
                neighborIndices.push(v)
                next = sq.next()
            }

            //subValues
            let subValues = map(neighborIndices, (idx) => {

                //pgs1, pgs2
                let pgs1 = [queryPoly]
                let pgs2 = [initialVor.cellPolygon(idx)]
                //console.log('pgs1',pgs1,'pgs2',pgs2)

                //intersect
                let ints = intersectPolygon(pgs1, pgs2)
                //console.log('ints',ints)

                //intersectA
                let intersectA = 0
                if (size(ints) === 1) {
                    try {
                        intersectA = getAreaPolygon(ints[0])
                    //console.log('getAreaPolygon',d3.getAreaPolygon(is.regions[0]),getAreaPolygon(is.regions[0]))
                    }
                    catch (err) {}
                }

                return {
                    ia: intersectA,
                    idx: idx,
                }
            })

            //newPointVal
            newPointVal = map(subValues, (o) => {
                return (o.ia / queryA) * data[o.idx][keyZ]
            })
            newPointVal = sum(newPointVal)
            // if (isNaN(newPointVal)) {
            //     console.log('isNaN(newPointVal)', subValues, 'queryA', queryA)
            // }

        }

        //update newPointVal
        data[data.length - 1][keyZ] = newPointVal

        return newPointVal
    }

    //r
    let r
    if (isOne) {
        let p = psTar[0]
        let x = p[keyX]
        let y = p[keyY]
        // console.log('psSrcItr', psSrcItr, 'x', x, 'y', y)
        let z = addPoint(psSrcItr, x, y)
        r = {
            [keyX]: x,
            [keyY]: y,
            [keyZ]: z,
        }
    }
    else {
        r = []
        each(psTar, (p) => {
            let x = p[keyX]
            let y = p[keyY]
            let z = addPoint(psSrcItr, x, y)
            r.push({
                [keyX]: x,
                [keyY]: y,
                [keyZ]: z,
            })
        })
    }

    return r
}


export default interp2
