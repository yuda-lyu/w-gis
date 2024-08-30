import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import cloneDeep from 'lodash-es/cloneDeep.js'
import isestr from 'wsemi/src/isestr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import ptsXYtoArr from './ptsXYtoArr.mjs'
import { Delaunay } from 'd3-delaunay'


/**
 * 計算Delaunay三角網格
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/calcDelaunay.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} points 輸入二維座標加觀測數據點陣列，為[{x:x1,y:y1,z:z1},{x:x2,y:y2,z:z2},...]點物件之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x欄位字串，為座標，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y欄位字串，為座標，預設'y'
 * @param {Boolean} [opt.withFinder=false] 輸入是否多回傳查詢x,y座標所在網格函數布林值，預設false
 * @param {Boolean} [opt.withInst=false] 輸入是否多回傳D3的Delaunay建構物件布林值，預設false
 * @returns {Object} 回傳三角網格資訊物件，triangles為三角網格之節點指標，若發生錯誤則回傳錯誤訊息物件
 * @example
 *
 * let ps
 * let o
 * let r
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }]
 * r = calcDelaunay(ps)
 * console.log(r)
 * // => {
 * //   triangles: [
 * //     { n0: 5, n1: 9, n2: 3 },
 * //     { n0: 9, n1: 4, n2: 3 },
 * //     { n0: 9, n1: 8, n2: 4 },
 * //     { n0: 4, n1: 8, n2: 3 },
 * //     { n0: 5, n1: 7, n2: 9 },
 * //     { n0: 9, n1: 7, n2: 8 },
 * //     { n0: 0, n1: 7, n2: 5 },
 * //     { n0: 6, n1: 0, n2: 5 },
 * //     { n0: 0, n1: 1, n2: 7 },
 * //     { n0: 3, n1: 6, n2: 5 }
 * //   ]
 * // }
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }]
 * o = calcDelaunay(ps, { withFinder: true })
 * r = o.funFindIn({ x: 1151, y: 371 })
 * console.log(r)
 * // => 8
 * r = o.funFindIn({ x: 1071, y: 371 }, { returnPoint: true })
 * console.log(r)
 * // => { x: 1151, y: 371, ext: 'abc' }
 * r = o.funFindIn({ x: 1061, y: 371 })
 * console.log(r)
 * // => 4
 *
 */
function calcDelaunay(points, opt = {}) {

    //check points
    if (!isearr(points)) {
        return {
            err: 'points is not an effective array'
        }
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

    //withFinder
    let withFinder = get(opt, 'withFinder')
    if (!isbol(withFinder)) {
        withFinder = false
    }

    //withInst
    let withInst = get(opt, 'withInst')
    if (!isbol(withInst)) {
        withInst = false
    }

    //pointsOri
    let pointsOri = cloneDeep(points)

    //keyInd
    let keyInd = 'ind'

    //ptsXYtoArr
    points = ptsXYtoArr(points, { keyX, keyY, keyInd })

    //check points
    if (size(points) === 0) {
        return {
            err: 'points has no effective data'
        }
    }
    // console.log('ptsXYtoArr points', points)

    //intDny
    let intDny = Delaunay.from(points, d => d.x, d => d.y)
    // console.log('intDny', intDny)

    //vtriangles, 各三角網格之節點指標
    let vtriangles = []
    for (let i = 0; i < size(points); i++) {
        let n0 = intDny.triangles[i * 3 + 0]
        let n1 = intDny.triangles[i * 3 + 1]
        let n2 = intDny.triangles[i * 3 + 2]
        // console.log('n0', n0, 'n1', n1, 'n2', n2)
        vtriangles.push({ n0, n1, n2, })
    }

    //funFindIn
    let funFindIn = (p, opt = {}) => {
        if (!iseobj(p)) {
            throw new Error(`p[${p}] is not an effective object`)
        }
        let x = get(p, 'x')
        if (!isnum(x)) {
            throw new Error(`x[${x}] is not a number`)
        }
        let y = get(p, 'y')
        if (!isnum(y)) {
            throw new Error(`y[${y}] is not a number`)
        }
        let returnPoint = get(opt, 'returnPoint')
        if (!isbol(returnPoint)) {
            returnPoint = false
        }
        let r = intDny.find(x, y) //基於Delaunay查找最近點
        if (returnPoint) {
            r = get(pointsOri, r)
        }
        return r
    }

    //r
    let r = {
        triangles: vtriangles,
    }

    if (withFinder) {
        r.funFindIn = funFindIn
    }
    if (withInst) {
        r.inst = intDny
    }

    return r
}


export default calcDelaunay
