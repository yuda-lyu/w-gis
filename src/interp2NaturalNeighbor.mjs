import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import map from 'lodash-es/map.js'
import sum from 'lodash-es/sum.js'
import size from 'lodash-es/size.js'
import isNumber from 'lodash-es/isNumber.js'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isfun from 'wsemi/src/isfun.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import haskey from 'wsemi/src/haskey.mjs'
import ptsXYtoArr from './ptsXYtoArr.mjs'
import ptsXYZtoArr from './ptsXYZtoArr.mjs'
import interp2Normalize from './interp2Normalize.mjs'
import _makeHullTester from './_makeHullTester.mjs'
import getAreaPolygon from './getAreaPolygon.mjs'
import intersectPolygon from './intersectPolygon.mjs'
import { Delaunay } from 'd3-delaunay'


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
 * online test
 * https://cartography-playground.gitlab.io/playgrounds/triangulation-delaunay-voronoi-diagram/
 *
 * 可內插範圍:
 * 自然鄰點內插僅對被原始點包圍之內插點有定義, 不支援外推(見上列Tinfour文件);
 * 本函數將原始點正規化至正方形(以x與y範圍之中點為中心, 邊長為x與y範圍較大者, 即interp2Normalize回傳之st; x與y範圍皆為0者不正規化), 並以該正方形裁切Voronoi區塊, 故:
 * (1)內插點位於該正方形外(x或y超出)者, 回傳z為null, 且不呼叫funInterpFragment與funInterpFragments;
 * (2)opt.limitInsideHull為true(預設)時, 另要求內插點位於原始點之凸包(convex hull, 含邊界)內, 凸包外者回傳z為null, 且不呼叫funInterpFragment與funInterpFragments(正方形檢查先於凸包檢查), 邊界容許距離為正方形邊長之1e-9倍(凸包外側距離在此內者視為在內); 原始點少於3個相異點或全部共線(無凸包面積, 凸包寬度不大於正方形邊長之1e-9倍者視為共線)時, 除與原始點座標相同者外, 所有內插點皆回傳z為null; 正規化後座標非有限數(原始座標範圍溢位)者無法判斷, 亦回傳z為null; 回呼函數若有狀態(依呼叫次數或順序而變), 因凸包外之點不再呼叫, 其呼叫次數與順序隨之改變;
 * (3)opt.limitInsideHull為false時, 位於凸包外而在正方形內之內插點仍會計算, 但屬外推: 其值取決於正方形之大小(即原始點x與y範圍較大者), 增減遠處之原始點可能改變結果, 不建議使用;
 * (4)凸包內之內插點若其Voronoi區塊延伸超出正方形(多見於靠近凸包邊界而原始點稀疏處), 該區塊亦被裁切, 其值可與未裁切之理論值有差異, 此與opt.limitInsideHull無關;
 * (5)內插點與原始點座標相同(正規化後浮點相等)者回傳該原始點之z(經正規化往返, 浮點可有極小誤差; 同座標有多個原始點者取最後一個)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2NaturalNeighbor.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} psSrc 輸入二維座標加觀測數據點陣列，為[{x:x1,y:y1,z:z1},{x:x2,y:y2,z:z2},...]點物件之陣列
 * @param {Array|Object} psTar 輸入二維座標點陣列或點物件，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或{x:x1,y:y1}點物件
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x欄位字串，為座標，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y欄位字串，為座標，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z欄位字串，為觀測值，預設'z'
 * @param {Number} [opt.scale=1] 輸入正規化範圍數值，因處理多邊形時有數值容許誤差，故須通過縮放值域來減少問題，預設1是正規化0至1之間，使用scaleXY則是正規化為0至scaleXY之間，預設1
 * @param {Boolean} [opt.limitInsideHull=true] 輸入是否只內插位於原始點凸包內(含邊界)之內插點布林值，true代表凸包外之內插點回傳z為null且不呼叫funInterpFragment與funInterpFragments，false代表凸包外而在正方形內之內插點仍計算(屬外推，值受正方形大小影響，詳見上列可內插範圍)，僅收true與false，其他值視為未給，預設true
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
 *     x: 1243,
 *     y: 1207,
 * }
 * r = interp2NaturalNeighbor(ps, p)
 * console.log(r)
 * // => { x: 1243, y: 1207, z: null }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: null, y: 201, z: 122 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * let funInterpFragment = (msg) => {
 *     // console.log('funInterpFragment', msg)
 *     return msg.v //預設回傳msg.v, 三角形三角點各點v為rA*z, 故三點之rA合為1, 指定內插值z為三角點v之總和(v1,v2,v3)
 * }
 * r = interp2NaturalNeighbor(ps, p, { funInterpFragment })
 * console.log(r)
 * // => { x: 243, y: 207, z: 97.29447682486813 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: null, y: 201, z: 122 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 1243,
 *     y: 1207,
 * }
 * let funInterpFragmentNoUse = (msg) => {
 *     // console.log('funInterpFragmentNoUse', msg)
 *     return msg.v //預設回傳msg.v, 此處因內插點於原始點範圍之正方形外(亦於原始點所形成最小凸多邊形之外), 故無法內插, 亦不會呼叫funInterpFragment
 * }
 * r = interp2NaturalNeighbor(ps, p, { funInterpFragment: funInterpFragmentNoUse })
 * console.log(r)
 * // => { x: 1243, y: 1207, z: null }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 600,
 *     y: 500,
 * }
 * r = interp2NaturalNeighbor(ps, p)
 * console.log(r)
 * // => { x: 600, y: 500, z: null } //預設limitInsideHull為true, 此處因內插點於原始點所形成最小凸多邊形之外(y最大之原始點為371), 故無法內插
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 600,
 *     y: 500,
 * }
 * r = interp2NaturalNeighbor(ps, p, { limitInsideHull: false })
 * console.log(r)
 * // => { x: 600, y: 500, z: 220.47540877342678 } //limitInsideHull為false, 內插點於凸包外但在正方形內(y範圍為-378至752), 故計算外推值, 此值受正方形大小影響
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: null, y: 201, z: 122 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 207,
 * }
 * let funInterpFragments = (msg) => {
 *     // console.log('funInterpFragments', msg)
 *     // let v = ps[0].v + ps[1].v + ps[2].v
 *     // let vv = msg.funInv(msg.v) //msg.v為正規化後之值, msg.funInv可將正規化值還原為原始z之尺度(僅供讀取, 如判斷或記錄), 回傳值仍須為正規化值, 若回傳msg.funInv(msg.v)會被再次還原而得錯誤之z
 *     return msg.v //預設回傳msg.v, 三角形三角點為msg.ps, 各點v為rA*z, 故三點之rA合為1, 指定內插值z為三角點v之總和(v1,v2,v3)
 * }
 * r = interp2NaturalNeighbor(ps, p, { funInterpFragments })
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
 * // => { x: 283, y: 207, z: 114.43040421951908 }
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
 * //   { x: 283, y: 207, z: 114.43040421951908 }
 * // ]
 *
 * ps = [{ x: 0.000243, y: 0.000206, z: 95 }, { x: 0.000233, y: 0.000225, z: 146 }, { x: 0.000021, y: 0.000325, z: 22 }, { x: 0.000953, y: 0.000028, z: 223 }, { x: 0.001092, y: 0.00029, z: 39 }, { x: 0.000744, y: 0.000200, z: 191 }, { x: 0.000174, y: 0.000003, z: 22 }, { x: 0.000537, y: 0.000368, z: 249 }, { x: 0.001151, y: 0.000371, z: 86 }, { x: 0.000814, y: 0.000252, z: 125 }]
 * p = {
 *     x: 0.000243,
 *     y: 0.000207,
 * }
 * r = interp2NaturalNeighbor(ps, p)
 * console.log(r)
 * // => { x: 0.000243, y: 0.000207, z: 97.2944768248678 }
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
            err: 'psSrc is not an effective array'
        }
    }

    //check psTar
    if (!iseobj(psTar) && !isearr(psTar)) {
        return {
            err: 'psTar is not an effective object or array'
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

    //limitInsideHull, 僅收布林值true與false(包裝物件與'true'、1等皆視為未給), 預設true
    let limitInsideHull = get(opt, 'limitInsideHull')
    if (typeof limitInsideHull !== 'boolean') {
        limitInsideHull = true
    }

    //funInterpFragment
    let funInterpFragment = get(opt, 'funInterpFragment')
    let useFunInterpFragment = isfun(funInterpFragment)

    //funInterpFragments
    let funInterpFragments = get(opt, 'funInterpFragments')
    let useFunInterpFragments = isfun(funInterpFragments)

    //keyInd
    let keyInd = 'ind'

    //ptsXYZtoArr
    psSrc = ptsXYZtoArr(psSrc, { keyX, keyY, keyZ, keyInd })

    //check psSrc
    if (size(psSrc) === 0) {
        return {
            err: 'psSrc has no effective data'
        }
    }
    // console.log('ptsXYZtoArr psSrc', psSrc)

    //ptsXYtoArr
    psTar = ptsXYtoArr(psTar, { keyX, keyY, keyInd })

    //check psTar
    if (size(psTar) === 0) {
        return {
            err: 'psTar has no effective data'
        }
    }
    // console.log('ptsXYtoArr psTar', psTar)

    //interp2Normalize
    let itnm = interp2Normalize(psSrc, { keyInd, scale })
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
        let k = `${v.x}-${v.y}` //x,y已經被正規化
        kpKnown[k] = v.z //x,y,z已經被正規化
    })

    //intDny
    let intDny = Delaunay.from(psSrcOri, d => d.x, d => d.y) //x,y已經被正規化

    //isInsideHull, 判斷已正規化之點是否位於原始點凸包內(含邊界), 僅limitInsideHull為true時建立, 容許距離為正規化範圍scale之1e-9倍
    let isInsideHull = null
    if (limitInsideHull) {
        isInsideHull = _makeHullTester(psSrc, 1e-9 * scale) //x,y已經被正規化
    }

    //vbox
    let vbox = [0, 0, scale, scale]

    //iniVor
    let iniVor = intDny.voronoi(vbox)
    // console.log('iniVor', iniVor)

    //addPointCore
    let addPointCore = (data, x, y, indTar) => {

        //psSrcTemp
        let psSrcTemp = [...psSrc]

        //newItem
        let newItem = { x, y, z: 0 } //x,y,z已經被正規化

        //push
        psSrcTemp.push(newItem)
        data.push(newItem)

        //postVor
        let postVor = Delaunay.from(psSrcTemp, d => d.x, d => d.y).voronoi(vbox) //x,y已經被正規化
        // console.log('postVor', postVor)

        //newIdx
        let newIdx = psSrcTemp.length - 1
        // console.log('newIdx', newIdx)

        //pgsQuery
        let pgsQuery = postVor.cellPolygon(newIdx)
        // console.log('pgsQuery', pgsQuery)

        //areaQuery
        let areaQuery = getAreaPolygon(pgsQuery)
        // console.log('areaQuery', areaQuery)

        //newPointVal
        let newPointVal = null
        if (true) {

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
                // console.log('idx', idx)

                //pgs1, pgs2
                let pgs1 = [pgsQuery]
                let pgs2 = [iniVor.cellPolygon(idx)]
                // console.log('pgs1', pgs1, 'pgs2', pgs2)

                //intersect
                let pgsInts = []
                try {
                    pgsInts = intersectPolygon(pgs1, pgs2)
                    // console.log('pgsInts', pgsInts)
                }
                catch (err) {
                    //console.log('pgs1', pgs1)
                    //console.log('pgs2', pgs2)
                    //console.log(err)
                }

                //areaInts
                let areaInts = 0
                if (size(pgsInts) === 1) {
                    try {
                        areaInts = getAreaPolygon(pgsInts[0])
                        //console.log('getAreaPolygon',d3.getAreaPolygon(is.regions[0]),getAreaPolygon(is.regions[0]))
                    }
                    catch (err) {
                        console.log('pgsInts', pgsInts)
                        console.log(err)
                    }
                }

                return {
                    ia: areaInts,
                    idx,
                }
            })
            // console.log('subValues', subValues)

            //check
            if (true) {

                //n
                let n = size(subValues)

                //ias
                let ias = map(subValues, 'ia')

                //r
                let r = sum(ias)

                //check
                if (r !== areaQuery) {
                    // console.log(`ia總和有時會不等於areaQuery`)
                    //ia總和有時會不等於areaQuery

                    if (areaQuery > 0 && r > 0) {
                        // console.log(`若ia總和與areaQuery都>0, 則調整各ia使其總和縮放至areaQuery`)
                        //若ia總和與areaQuery都>0, 則調整各ia使其總和縮放至areaQuery
                        let s = areaQuery / r
                        subValues = map(subValues, (sv) => {
                            sv.ia *= s
                            return sv
                        })
                    }
                    else if (areaQuery === 0 && r > 0) {
                        // console.log(`若areaQuery為0且ia總和>0, 則使用ia總和為areaQuery`)
                        //若areaQuery為0且ia總和>0, 則使用ia總和為areaQuery
                        areaQuery = r
                    }
                    else if (areaQuery > 0 && r === 0) {
                        // console.log(`若areaQuery>0且ia總和=0, 則假設各ia為平分areaQuery`)
                        //若areaQuery>0且ia總和=0, 則假設各ia為平分areaQuery
                        let s = areaQuery / n
                        subValues = map(subValues, (sv) => {
                            sv.ia = s
                            return sv
                        })
                    }
                    else {
                        console.log('areaQuery', areaQuery)
                        console.log('sum(ias)', r)
                        throw new Error('areaQuery!==sum(ias) && (areaQuery<0 or sum(ias)<0)')
                    }

                }
                else if (areaQuery === 0) {
                    // console.log(`若areaQuery=0且ia總和=0, 則假設areaQuery為1, 而各ia為平分1`)
                    //若areaQuery=ia總和=0, 則假設areaQuery為1, 而各ia為平分1
                    areaQuery = 1
                    let s = 1 / n
                    subValues = map(subValues, (sv) => {
                        sv.ia = s
                        return sv
                    })
                }
                else if (areaQuery < 0) {
                    // console.log(`若areaQuery=ia總和<0, 則報錯`)
                    //若areaQuery=ia總和<0, 則報錯
                    console.log('areaQuery', areaQuery)
                    console.log('sum(ias)', r)
                    throw new Error('areaQuery<0 && sum(ias)<0')
                }

            }

            //newPointVals
            let newPointVals = []
            each(subValues, (o) => {

                //rA, z, v
                let rA = (o.ia / areaQuery)
                let z = data[o.idx].z //x,y,z已經被正規化
                let v = rA * z
                // console.log('subValue', 'rA', rA, 'o.idx', o.idx, 'z', z, 'v', v)

                //useFunInterpFragment
                if (useFunInterpFragment) {
                    v = funInterpFragment({
                        v,
                        area: o.ia,
                        areaTotal: areaQuery,
                        areaRatio: rA,
                        z,
                        indSrc: o.idx,
                        indTar,
                        // data,
                    })
                }

                //p
                let p = {
                    v,
                    area: o.ia,
                    areaTotal: areaQuery,
                    areaRatio: rA,
                    z,
                    indSrc: o.idx,
                    indTar,
                }

                //push
                newPointVals.push(p)

            })

            //newPointVal
            let vt = sum(map(newPointVals, 'v'))
            if (useFunInterpFragments) {
                vt = funInterpFragments({
                    ps: newPointVals,
                    v: vt,
                    indTar,
                    funInv: (vv) => {
                        return inv(vv, 'z') //msg.v為正規化後之z, 以z軸還原; interp2Normalize之st以'x'、'y'、'z'為鍵(原以索引2呼叫, 於st改為鍵後漏改)
                    },
                })
            }
            newPointVal = vt

            // if (isNaN(newPointVal)) {
            //     console.log('isNaN(newPointVal)', subValues, 'areaQuery', areaQuery)
            // }
            // console.log(`areaQuery[${areaQuery}] > 0`, 'newPointVal', newPointVal)

        }

        //update newPointVal
        data[data.length - 1].z = newPointVal //x,y,z已經被正規化

        return newPointVal
    }

    //addPoint
    let addPoint = (data, x, y, indTar) => {

        //r
        let r
        try {
            r = addPointCore(data, x, y, indTar)
        }
        catch (err) {
            console.log(err)
            r = null
            data.pop()
        }

        return r
    }

    //getNz
    let getNz = (nx, ny, indTar) => {

        //check, limitInsideHull為true時正規化後座標非有限數(原始座標範圍溢位等)者無法判斷是否於凸包內, 視為無法內插, 且須先於已知點快取檢查(NaN-NaN等鍵會誤中快取)
        if (isInsideHull !== null && (!Number.isFinite(nx) || !Number.isFinite(ny))) {
            return null
        }

        //check
        let k = `${nx}-${ny}` //x,y已經被正規化
        if (haskey(kpKnown, k)) {
            return kpKnown[k]
        }

        //check
        if (nx < vbox[0] || nx > vbox[2] || ny < vbox[1] || ny > vbox[3]) {
            return null
        }

        //check, limitInsideHull為true時凸包外之點不內插, 亦不呼叫funInterpFragment與funInterpFragments
        if (isInsideHull !== null && !isInsideHull(nx, ny)) {
            return null
        }

        //predict
        let nz = addPoint(psSrcItr, nx, ny, indTar)

        //save
        kpKnown[k] = nz

        return nz
    }

    //itv
    let itv = (p, indTar) => {

        //x, nx
        let x = p.x
        let nx = nv(x, 'x')
        if (!isNumber(nx)) {
            throw new Error(`invalid nx[${nx}]`) //x,y預期都是有值
        }

        //y, ny
        let y = p.y
        let ny = nv(y, 'y')
        if (!isNumber(ny)) {
            throw new Error(`invalid ny[${ny}]`) //x,y預期都是有值
        }

        //nz, z
        let nz = getNz(nx, ny, indTar)
        let z = inv(nz, 'z')
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
        r = itv(p, 0)
    }
    else {
        r = []
        each(psTar, (p, indTar) => {
            r.push(itv(p, indTar))
        })
    }

    return r
}


export default interp2NaturalNeighbor
