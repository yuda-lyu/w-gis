import get from 'lodash/get'
import each from 'lodash/each'
import map from 'lodash/map'
import sum from 'lodash/sum'
import size from 'lodash/size'
import isNumber from 'lodash/isNumber'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import haskey from 'wsemi/src/haskey.mjs'
import ptsXYtoArr from './ptsXYtoArr.mjs'
import ptsXYZtoArr from './ptsXYZtoArr.mjs'
import interp2Normalize from './interp2Normalize.mjs'
import getAreaPolygon from './getAreaPolygon.mjs'
import intersectPolygon from './intersectPolygon.mjs'
import { Delaunay } from 'd3-delaunay'


// function isPointInPolygon(polygon, point) {
//     let n = polygon.length
//     let p = polygon[n - 1]
//     let x = point[0]
//     let y = point[1]
//     let x0 = p[0]; let y0 = p[1]
//     let x1
//     let y1
//     let inside = false
//     for (let i = 0; i < n; ++i) {
//         p = polygon[i]
//         x1 = p[0]
//         y1 = p[1]
//         if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) {
//             inside = !inside
//         }
//         x0 = x1
//         y0 = y1
//     }
//     return inside
// }


/**
 * 自然鄰點內插法(Natural Neighbor Interpolation)內插點數值
 *
 * A Fast and Accurate Algorithm for Natural Neighbor Interpolation
 * https://gwlucastrig.github.io/TinfourDocs/NaturalNeighborTinfourAlgorithm/index.html
 *
 * An Introduction to Natural Neighbor Interpolation
 * https://gwlucastrig.github.io/TinfourDocs/NaturalNeighborIntro/index.html
 *
 * [wiki]Natural neighbor interpolation
 * https://en.wikipedia.org/wiki/Natural_neighbor_interpolation
 *
 * Natural neighbor interpolation
 * https://observablehq.com/@karlerss/natural-neighbor-interpolation
 *
 * d3-delaunay
 * https://github.com/d3/d3-delaunay
 *
 * Delaunator
 * https://github.com/mapbox/delaunator
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2NaturalNeighbor.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} psSrc 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列
 * @param {Array|Object} psTar 輸入點陣列或點物件，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或{x:x1,y:y1}點物件
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @param {Number} [opt.scale=1] 輸入正規化範圍數值，因polybooljs處理多邊形時有數值容許誤差，故須通過縮放值域來減少問題，預設1是正規化0至1之間，使用scaleXY則是正規化為0至scaleXY之間，預設1
 * @returns {Array|Object} 回傳點物件陣列或點物件，若發生錯誤則回傳錯誤訊息物件
 * @example
 *
 * let ps
 * let p
 * let r
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * r = interp2NaturalNeighbor(ps, p)
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.29447682486813 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 283,
 *     y: 207,
 * }
 * r = interp2NaturalNeighbor(ps, p)
 * console.log(r)
 * // => { x: 283, y: 207, z: 114.43040421951906 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 1160,
 *     y: 380,
 * }
 * r = interp2NaturalNeighbor(ps, p)
 * console.log(r)
 * // => { x: 1160, y: 380, z: null }
 *
 * ps = [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }, { a: 953, b: 28, c: 223 }, { a: 1092, b: 290, c: 39 }, { a: 744, b: 200, c: 191 }, { a: 174, b: 3, c: 22 }, { a: 537, b: 368, c: 249 }, { a: 1151, b: 371, c: 86 }, { a: 814, b: 252, c: 125 }]
 * p = {
 *     a: 243,
 *     b: 207,
 * }
 * r = interp2NaturalNeighbor(ps, p, { keyX: 'a', keyY: 'b', keyZ: 'c' })
 * console.log(r)
 * // => { a: 243, b: 207, c: 97.29447682486813 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = [
 *     {
 *         x: 243,
 *         y: 207,
 *     },
 *     {
 *         x: 283,
 *         y: 207,
 *     },
 * ]
 * r = interp2NaturalNeighbor(ps, p)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 207, z: 97.29447682486813 },
 * //   { x: 283, y: 207, z: 114.43040421951906 }
 * // ]
 *
 * ps = [{ x: 0.000243, y: 0.000206, z: 95 }, { x: 0.000233, y: 0.000225, z: 146 }, { x: 0.00021, y: 0.000325, z: 22 }, { x: 0.000953, y: 0.00028, z: 223 }, { x: 0.0001092, y: 0.000290, z: 39 }, { x: 0.000744, y: 0.000200, z: 191 }, { x: 0.000174, y: 0.0003, z: 22 }, { x: 0.000537, y: 0.000368, z: 249 }, { x: 0.0001151, y: 0.000371, z: 86 }, { x: 0.000814, y: 0.000252, z: 125 }]
 * p = {
 *     x: 0.000243,
 *     y: 0.000207,
 * }
 * r = interp2NaturalNeighbor(ps, p)
 * console.log(r)
 * // => { x: 0.000243, y: 0.000207, z: 97.29447682486834 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * r = interp2NaturalNeighbor(ps, p, { scale: 1000 })
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.29447682486855 }
 *
 */
function interp2NaturalNeighbor(psSrc, psTar, opt = {}) {

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

    //isOne
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
    let keyZ = get(opt, 'keyZ')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //scale
    let scale = get(opt, 'scale')
    if (!isnum(scale)) {
        scale = 1
    }
    scale = cdbl(scale)

    //ptsXYZtoArr
    psSrc = ptsXYZtoArr(psSrc, opt)

    //check psSrc
    if (size(psSrc) === 0) {
        return {
            err: 'psSrc has no effective data'
        }
    }
    // console.log('ptsXYZtoArr psSrc', psSrc)

    //ptsXYtoArr
    psTar = ptsXYtoArr(psTar, opt)

    //check psTar
    if (size(psTar) === 0) {
        return {
            err: 'psTar has no effective data'
        }
    }
    // console.log('ptsXYtoArr psTar', psTar)

    //interp2Normalize
    let itnm = interp2Normalize(psSrc, { scale })
    // console.log('itnm.st', itnm.st)
    // console.log('itnm.psMinMax', itnm.psMinMax)
    psSrc = itnm.ps //複寫正規化數據
    let nv = itnm.nv
    let inv = itnm.inv
    // console.log('interp2Normalize psSrc', psSrc)

    //psSrcItr
    let psSrcItr = [...psSrc]

    //psSrcOri
    let psSrcOri = [...psSrc]

    //kpKnown
    let kpKnown = {}
    each(psSrc, (v) => {
        let k = `${v.x}-${v.y}` //已經被正規化至x,y
        kpKnown[k] = v.z //已經被正規化至x,y,z
    })

    //intDny
    let intDny = Delaunay.from(psSrcOri, d => d.x, d => d.y) //已經被正規化至x,y

    // //hpg, 原始數據形成最外框邊界
    // let hpg = intDny.hullPolygon()
    // // console.log('intDny.hullPolygon', hpg)

    //vbox
    let vbox = [0, 0, scale, scale]

    //iniVor
    let iniVor = intDny.voronoi(vbox)
    // console.log('iniVor', iniVor)

    //addPointCore
    let addPointCore = (data, x, y) => {

        //psSrcTemp
        let psSrcTemp = [...psSrc]

        //newItem
        let newItem = { x, y, z: 0 } //已經被正規化至x,y,z

        //push
        psSrcTemp.push(newItem)
        data.push(newItem)

        //postVor
        let postVor = Delaunay.from(psSrcTemp, d => d.x, d => d.y).voronoi(vbox) //已經被正規化至x,y
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
            // console.log('neighborIndices', neighborIndices)

            //subValues
            let subValues = map(neighborIndices, (idx) => {

                //pgs1, pgs2
                let pgs1 = [queryPoly]
                let pgs2 = [iniVor.cellPolygon(idx)]
                // console.log('pgs1', pgs1, 'pgs2', pgs2)

                //intersect
                let ints = []
                try {
                    ints = intersectPolygon(pgs1, pgs2)
                    // console.log('ints', ints)
                }
                catch (err) {
                    console.log('pgs1', pgs1)
                    console.log('pgs2', pgs2)
                    console.log(err)
                }

                //intersectA
                let intersectA = 0
                if (size(ints) === 1) {
                    try {
                        intersectA = getAreaPolygon(ints[0])
                        //console.log('getAreaPolygon',d3.getAreaPolygon(is.regions[0]),getAreaPolygon(is.regions[0]))
                    }
                    catch (err) {
                        console.log('ints', ints)
                        console.log(err)
                    }
                }

                return {
                    ia: intersectA,
                    idx: idx,
                }
            })
            // console.log('subValues', subValues)

            //newPointVal
            newPointVal = map(subValues, (o) => {
                let rA = (o.ia / queryA)
                let z = data[o.idx].z //已經被正規化至x,y,z
                // console.log('subValue', 'rA', rA, 'o.idx', o.idx, 'z', z)
                return rA * z
            })
            newPointVal = sum(newPointVal)
            // if (isNaN(newPointVal)) {
            //     console.log('isNaN(newPointVal)', subValues, 'queryA', queryA)
            // }
            // console.log(`queryA[${queryA}] > 0`, 'newPointVal', newPointVal)

        }

        //update newPointVal
        data[data.length - 1].z = newPointVal //已經被正規化至x,y,z

        return newPointVal
    }

    //addPoint
    let addPoint = (data, x, y) => {

        //r
        let r
        try {
            r = addPointCore(data, x, y)
        }
        catch (err) {
            console.log(err)
            r = null
            data.pop()
        }

        return r
    }

    //kpdt
    let kpdt = (nx, ny) => {

        //check
        let k = `${nx}-${ny}` //已經被正規化至x,y
        if (haskey(kpKnown, k)) {
            return kpKnown[k]
        }

        //isPointInPolygon
        // if (!isPointInPolygon(hpg, [nx, ny])) {
        //     return null
        // }
        if (nx < vbox[0] || nx > vbox[2] || ny < vbox[1] || ny > vbox[3]) {
            return null
        }

        //predict
        let nz = addPoint(psSrcItr, nx, ny)

        //save
        kpKnown[k] = nz

        return nz
    }

    //itv
    let itv = (p) => {

        //x, nx
        let x = p.x //已經被正規化至x,y
        let nx = nv(x, 0)
        if (!isNumber(nx)) {
            throw new Error(`invalid nx[${nx}]`) //x,y預期都是有值
        }

        //y, ny
        let y = p.y //已經被正規化至x,y
        let ny = nv(y, 1)
        if (!isNumber(ny)) {
            throw new Error(`invalid ny[${ny}]`) //x,y預期都是有值
        }

        //nz, z
        let nz = kpdt(nx, ny)
        let z = inv(nz, 2)
        if (!isNumber(z)) {
            z = null //z須支援可能無法內插
        }

        // console.log('x', x, 'y', y, 'z', z)
        // console.log('nx', nx, 'ny', ny, 'nz', nz)

        //r
        let r = {
            [keyX]: x,
            [keyY]: y,
            [keyZ]: z,
        }

        return r
    }

    //r
    let r
    if (isOne) {
        let p = psTar[0]
        r = itv(p)
    }
    else {
        r = []
        each(psTar, (p) => {
            r.push(itv(p))
        })
    }

    return r
}


export default interp2NaturalNeighbor