import get from 'lodash/get'
import each from 'lodash/each'
import size from 'lodash/size'
import isNumber from 'lodash/isNumber'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import haskey from 'wsemi/src/haskey.mjs'
import ptsXYtoArr from './ptsXYtoArr.mjs'
import ptsXYZtoArr from './ptsXYZtoArr.mjs'
import interp2Normalize from './interp2Normalize.mjs'
import kriging from './kriging.mjs'


/**
 * 克利金(Kriging)內插點數值
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2Kriging.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} psSrc 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列
 * @param {Array|Object} psTar 輸入點陣列或點物件，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或{x:x1,y:y1}點物件
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @param {Number} [opt.scaleXY=1] 輸入正規化範圍數值，預設1是正規化0至1之間，使用scaleXY則是正規化為0至scaleXY之間，預設1
 * @param {String} [opt.model='exponential'] 輸入擬合模式字串，可選'exponential'、'gaussian'、'spherical'，預設'exponential'
 * @param {Number} [opt.sigma2=0] 輸入自動擬合參數sigma2數值，預設0
 * @param {Number} [opt.alpha=100] 輸入自動擬合參數alpha數值，預設100
 * @param {Boolean} [opt.returnWithVariogram=false] 輸入是否回傳擬合半變異數結果布林值，預設false
 * @returns {Array|Object} 回傳點物件陣列或點物件，若使用returnWithVariogram=true則回傳物件資訊
 * @example
 *
 * let ps
 * let p
 * let r
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 205,
 * }
 * r = interp2Kriging(ps, p)
 * console.log(r)
 * // => { x: 243, y: 205, z: 94.88479948418727 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 283,
 *     y: 205,
 * }
 * r = interp2Kriging(ps, p)
 * console.log(r)
 * // => { x: 283, y: 205, z: 116.32333499687815 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 1160,
 *     y: 380,
 * }
 * r = interp2Kriging(ps, p)
 * console.log(r)
 * // => { x: 1160, y: 380, z: 87.27045807621896 }
 *
 * ps = [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }, { a: 953, b: 28, c: 223 }, { a: 1092, b: 290, c: 39 }, { a: 744, b: 200, c: 191 }, { a: 174, b: 3, c: 22 }, { a: 537, b: 368, c: 249 }, { a: 1151, b: 371, c: 86 }, { a: 814, b: 252, c: 125 }]
 * p = {
 *     a: 243,
 *     b: 205,
 * }
 * r = interp2Kriging(ps, p, { keyX: 'a', keyY: 'b', keyZ: 'c' })
 * console.log(r)
 * // => { a: 243, b: 205, c: 94.88479948418727 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = [
 *     {
 *         x: 243,
 *         y: 205,
 *     },
 *     {
 *         x: 283,
 *         y: 205,
 *     },
 * ]
 * r = interp2Kriging(ps, p)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 205, z: 94.88479948418727 },
 * //   { x: 283, y: 205, z: 116.32333499687815 }
 * // ]
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 205,
 * }
 * r = interp2Kriging(ps, p, { scaleXY: 1000 })
 * console.log(r)
 * // => { x: 243, y: 205, z: 94.88479948418826 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 205,
 * }
 * r = interp2Kriging(ps, p, { model: 'gaussian' })
 * console.log(r)
 * // => { x: 243, y: 205, z: 92.39124140708736 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 205,
 * }
 * r = interp2Kriging(ps, p, { sigma2: 0.001, alpha: 70 })
 * console.log(r)
 * // => { x: 243, y: 205, z: 90.88702949276379 }
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * p = {
 *     x: 243,
 *     y: 205,
 * }
 * r = interp2Kriging(ps, p, { returnWithVariogram: true })
 * console.log(r)
 * // => {
 * //   result: { x: 243, y: 205, z: 94.88479948418727 },
 * //   variogram: {
 * //     t: [
 * //       0.32158590308370044,
 * //       0.5462555066079295,
 * //       0,
 * //       0.8854625550660793,
 * //       0.07488986784140969,
 * //       0.7444933920704846,
 * //       0,
 * //       1,
 * //       0.28193832599118945,
 * //       0.45374449339207046
 * //     ],
 * //     x: [
 * //       0.20905923344947736,
 * //       0.20034843205574912,
 * //       0.0156794425087108,
 * //       0.8275261324041812,
 * //       0.9486062717770035,
 * //       0.6454703832752613,
 * //       0.1489547038327526,
 * //       0.4651567944250871,
 * //       1,
 * //       0.7064459930313589
 * //     ],
 * //     y: [
 * //       0.17682926829268292,
 * //       0.19337979094076654,
 * //       0.2804878048780488,
 * //       0.02177700348432056,
 * //       0.25,
 * //       0.171602787456446,
 * //       0,
 * //       0.31794425087108014,
 * //       0.3205574912891986,
 * //       0.21689895470383275
 * //     ],
 * //     nugget: 0.3352853492342814,
 * //     range: 0.9664329138202223,
 * //     sill: 0.45652675432516066,
 * //     A: 0.3333333333333333,
 * //     n: 10,
 * //     model: [Function: kriging_variogram_exponential],
 * //     svpd: { data: [Array], bars: [Array] },
 * //     K: [
 * //          -75.85170041752461,     67.92572292348414, -0.16335841036969692,
 * //         0.24131518978271652,  -0.04234246865054588,   0.8770518396329141,
 * //           5.616960362170287,     1.621659637440229,  0.02788800165194478,
 * //        -0.21415853416653916,     67.92572292348414,   -75.61786478824882,
 * //           5.413232079727116,  0.049069434383856164,  0.03679113229352314,
 * //        -0.11847139352699987,    0.3142012767297748,   1.9531078854429942,
 * //         0.14216377854052373, -0.026503104672520067,  -0.1633584103696629,
 * //           5.413232079727084,   -10.341088741602485,   0.7076902564152013,
 * //          0.2717259477481396, -0.032751338327812955,   2.4021510467734464,
 * //          1.1039529303205011,    0.9343241199626735,  0.17593910677198668,
 * //          0.2413151897827085,   0.04906943438386374,   0.7076902564152016,
 * //         -11.195895809332823,    3.6318326767168245,      3.0935386508887,
 * //           1.045155349956814,   0.07681115159025333,   0.5500520981253356,
 * //           2.176928207710061,  -0.04234246865058671,  0.03679113229356136,
 * //         0.27172594774814596,     3.631832676716827,   -21.83399183339756,
 * //        -0.37035445670314004,    0.1631940797086947,  0.14784852853020494,
 * //          14.592661153646377,    3.5296407596609107,   0.8770518396328766,
 * //        -0.11847139352696667,  -0.03275133832781456,    3.093538650888696,
 * //        -0.37035445670313066,   -23.428385057803684,   0.8346909075985001,
 * //           3.683800415485762,  -0.07094528659970148,   15.630834782735695,
 * //           5.616960362170222,    0.3142012767298379,   2.4021510467734473,
 * //          1.0451553499568167,   0.16319407970869468,   0.8346909075984896,
 * //          -11.15967643574728,   0.47980505727624445,   0.7525119639869366,
 * //        -0.03990202162613798,    1.6216596374402723,   1.9531078854429453,
 * //          1.1039529303205011,   0.07681115159025047,  0.14784852853020047,
 * //           3.683800415485773,    0.4798050572762466,  -11.594555930753838,
 * //          0.9237284214140162,    1.8947859772223594,  0.02788800165198713,
 * //         0.14216377854048556,    0.9343241199626655,   0.5500520981253338,
 * //          14.592661153646382,  -0.07094528659970313,   0.7525119639869372,
 * //          0.9237284214140105,   -18.251230245653346,   0.8379596933918424,
 * //         -0.2141585341665283, -0.026503104672522343,  0.17593910677198843,
 * //          2.1769282077100636,      3.52964075966091,   15.630834782735695,
 * //       -0.039902021626148254,    1.8947859772223656,   0.8379596933918344,
 * //          -23.89204017145281
 * //     ],
 * //     M: [
 * //       15.107775528173876,
 * //       -17.523553164024435,
 * //       4.974279767668836,
 * //       -6.014370838628366,
 * //       7.175095294789429,
 * //       -3.7572657339807423,
 * //       4.210920521157789,
 * //       -6.064323143863025,
 * //       -2.228072445295278,
 * //       5.035785385549147
 * //     ]
 * //   }
 * // }
 *
 */
function interp2Kriging(psSrc, psTar, opt = {}) {

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

    //scaleXY
    let scaleXY = get(opt, 'scaleXY')

    //krigingModel
    let krigingModel = get(opt, 'model')
    if (krigingModel !== 'exponential' && krigingModel !== 'gaussian' && krigingModel !== 'spherical') {
        krigingModel = 'exponential'
    }

    //krigingSigma2
    let krigingSigma2 = get(opt, 'sigma2')
    if (!isnum(krigingSigma2)) {
        krigingSigma2 = 0
    }
    krigingSigma2 = cdbl(krigingSigma2)

    //krigingAlpha
    let krigingAlpha = get(opt, 'alpha')
    if (!isnum(krigingAlpha)) {
        krigingAlpha = 100
    }
    krigingAlpha = cdbl(krigingAlpha)

    //returnWithVariogram
    let returnWithVariogram = get(opt, 'returnWithVariogram')
    if (!isbol(returnWithVariogram)) {
        returnWithVariogram = false
    }
    // console.log('returnWithVariogram', returnWithVariogram)

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
    let itnm = interp2Normalize(psSrc, { scaleXY })
    psSrc = itnm.psSrc //複寫正規化數據
    let nv = itnm.nv
    let inv = itnm.inv

    //kpKnown
    let kpKnown = {}
    each(psSrc, (v) => {
        let k = `${v.x}-${v.y}` //已經被正規化至x,y
        kpKnown[k] = v.z //已經被正規化至x,y,z
    })

    //x, y, t
    let x = []
    let y = []
    let t = []
    each(psSrc, (v) => {
        x.push(v.x)
        y.push(v.y)
        t.push(v.z)
    })

    //variogram
    let variogram = kriging.train(
        t,
        x,
        y,
        krigingModel,
        krigingSigma2,
        krigingAlpha
    )
    // console.log('variogram', variogram)

    //kpdt
    let kpdt = (nx, ny) => {

        //check
        let k = `${nx}-${ny}` //已經被正規化至x,y
        if (haskey(kpKnown, k)) {
            return kpKnown[k]
        }

        //predict
        let nz = kriging.predict(nx, ny, variogram)

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

    //returnWithVariogram
    if (returnWithVariogram) {
        r = {
            result: r,
            variogram,
        }
    }

    return r
}


export default interp2Kriging
