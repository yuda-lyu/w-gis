import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import sortBy from 'lodash-es/sortBy.js'
import size from 'lodash-es/size.js'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isenum from 'wsemi/src/isenum.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import _interp1 from 'wsemi/src/interp1.mjs'


//有效數字則回Number(v)，否則回null
function toEnum(v) {
    if (isenum(v)) {
        return Number(v)
    }
    return null
}


//提取數據點成為[{x,y}]，x與y皆為有效數字(原始型別number且為有限數)者才保留
function getPtsXY(ps, keyX, keyY) {
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
        x = toEnum(x)
        y = toEnum(y)
        if (x !== null && y !== null) {
            rs.push({ x, y })
        }
    })
    return rs
}


//提取內插點成為[x]，x為有效數字(原始型別number且為有限數)者才保留
function getPtsX(ps, keyX) {
    let rs = []
    each(ps, (v) => {
        let x = null
        if (isenum(v)) {
            x = v
        }
        else if (isarr(v) && size(v) >= 1) {
            x = get(v, 0)
        }
        else {
            x = get(v, keyX, null)
        }
        x = toEnum(x)
        if (x !== null) {
            rs.push(x)
        }
    })
    return rs
}


/**
 * 針對不規則一維數據進行指定內插點數值
 *
 * 數據點與內插點之數值一律以「有效數字」判定後才取用：原始型別number且為有限數，或去頭尾空白後為十進位寫法之字串(可帶正負號、小數點、科學記號，如'12'、' 1.5 '、'-.5'、'2.83e2')，字串轉為數字後使用。
 * Infinity、-Infinity、NaN、'Infinity'、'0x10'、'0b11'、'0o7'、'1e400'(超出範圍)、'1e-400'(下溢)、包裝物件new Number(1)、布林、null、非數字字串皆為無效值。
 *
 * 無效值之處置：
 * 1. 數據點(ps)之x或y任一為無效值者，該點略過、不參與內插；若無任何有效數據點，回傳{ err: 'psSrc has no effective data' }。
 * 2. 內插點(x)為單值但無效(含Infinity、'0x10')，回傳{ err: 'psTar is not a number or an effective object or array' }。
 * 3. 內插點(x)為物件或陣列時，無效之內插點略過、不輸出於結果，結果只含有效內插點(依輸入順序)，每點為{ [keyX]: 有效數字, [keyY]: 內插值或null }；若無任何有效內插點，回傳{ err: 'psTar has no effective data' }。
 * 4. 本函數只把有效數字(原始型別number且為有限數)交給wsemi interp1，內插點亦以純數字陣列交付，故wsemi對無效值之處置不影響本函數之結果與回傳形狀。
 * 5. 上述錯誤皆以物件{ err }回傳(不論是否useSync)；有效內插點但落在數據範圍外或無法內插者，該點內插值為null。
 *
 * @memberOf w-gis
 * @param {Array} ps 輸入一維數據，格式可支援兩種，第一種各點為陣列[[x1,y1],[x2,y2],...]，例如[[0.1,5],[0.2,12],...]，第二種各點為物件，屬性至少要有x與y，格式為[{x:x1,y:y1},{x:x2,y:y2},...]，例如[{x:0.1,y:5},{x:0.2,y:12},...]，key值x與y可由opt更換，x與y須為有效數字，無效點略過
 * @param {Number|Object|Array} x 輸入要內插點的x值，可為有效數字，或物件{x}(key值可由opt更換)，或其陣列，例如283、{x:283}、[{x:243},{x:283}]、[243,283]、[[243],[283]]，無效值之處置詳見上述說明
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.method=''] 輸入內插方法，可選'linear'、'stairs'、'blocks'，預設'linear'
 * @param {String} [opt.keyX='x'] 輸入若數據為物件陣列，取物件x值時的key字串，預設為'x'
 * @param {String} [opt.keyY='y'] 輸入若數據為物件陣列，取物件y值時的key字串，預設為'y'
 * @param {Number} [opt.xMin=undefined] 輸入若mode='stairs'，更改x範圍下限值，預設為undefined
 * @param {Number} [opt.xMax=undefined] 輸入若mode='stairs'，更改x範圍上限值，預設為undefined
 * @returns {Number|Object} 回傳內插結果數值，或是無法內插時之錯誤訊息物件
 * @example
 *
 * let ps
 * let p
 * let r
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 * p = {
 *     x: 243,
 * }
 * r = await interp1(ps, p)
 * console.log(r)
 * // => { x: 243, y: 206 }
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 * p = {
 *     x: 283,
 * }
 * r = await interp1(ps, p)
 * console.log(r)
 * // => { x: 283, y: 228.0408163265306 }
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 * p = {
 *     x: 1160,
 * }
 * r = await interp1(ps, p)
 * console.log(r)
 * // => { x: 1160, y: null }
 *
 * ps = [{ a: 243, b: 206 }, { a: 233, b: 225 }, { a: 21, b: 325 }, { a: 953, b: 28 }, { a: 1092, b: 290 }, { a: 744, b: 200 }, { a: 174, b: 3 }, { a: 537, b: 368 }, { a: 1151, b: 371 }, { a: 814, b: 252 }]
 * p = {
 *     a: 243,
 * }
 * r = await interp1(ps, p, { keyX: 'a', keyY: 'b' })
 * console.log(r)
 * // => { a: 243, b: 206 }
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 * p = [
 *     {
 *         x: 243,
 *     },
 *     {
 *         x: 283,
 *     },
 * ]
 * r = await interp1(ps, p)
 * console.log(r)
 * // => [ { x: 243, y: 206 }, { x: 283, y: 228.0408163265306 } ]
 *
 * ps = [{ x: 0.000243, y: 0.000206 }, { x: 0.000233, y: 0.000225 }, { x: 0.000021, y: 0.000325 }, { x: 0.000953, y: 0.000028 }, { x: 0.001092, y: 0.00029 }, { x: 0.000744, y: 0.000200 }, { x: 0.000174, y: 0.000003 }, { x: 0.000537, y: 0.000368 }, { x: 0.001151, y: 0.000371 }, { x: 0.000814, y: 0.000252 }]
 * p = {
 *     x: 0.000243,
 * }
 * r = await interp1(ps, p)
 * console.log(r)
 * // => { x: 0.000243, y: 0.00020600000000000002 }
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 * p = {
 *     x: 243,
 * }
 * r = interp1(ps, p, { useSync: true }) //使用interp2.wk.umd.js則不支援sync模式
 * console.log(r)
 * // => { x: 243, y: 206 }
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 * p = [
 *     {
 *         x: 243,
 *     },
 *     {
 *         x: Infinity, //無效值略過
 *     },
 *     {
 *         x: '0x10', //無效值略過
 *     },
 *     {
 *         x: ' 283 ', //有效數字字串，轉為283
 *     },
 * ]
 * r = await interp1(ps, p)
 * console.log(r)
 * // => [ { x: 243, y: 206 }, { x: 283, y: 228.0408163265306 } ]
 *
 */
function interp1(psSrc, psTar, opt = {}) {

    //check psSrc
    if (!isearr(psSrc)) {
        return {
            err: 'psSrc is not an effective array'
        }
    }

    //check psTar
    if (!isenum(psTar) && !iseobj(psTar) && !isearr(psTar)) {
        return {
            err: 'psTar is not a number or an effective object or array'
        }
    }

    //isOne
    let isOne = isenum(psTar) || iseobj(psTar)
    if (isenum(psTar)) {
        psTar = [Number(psTar)]
    }
    else if (iseobj(psTar)) {
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

    //method
    let method = get(opt, 'method')
    if (method !== 'linear' && method !== 'stairs' && method !== 'blocks') {
        method = 'linear'
    }

    //useSync
    let useSync = get(opt, 'useSync')
    if (!isbol(useSync)) {
        useSync = false
    }

    //getPtsXY, 僅保留x與y皆為有效數字之數據點
    psSrc = getPtsXY(psSrc, keyX, keyY)

    //check psSrc
    if (size(psSrc) === 0) {
        return {
            err: 'psSrc has no effective data'
        }
    }
    // console.log('getPtsXY psSrc', psSrc)

    //sortBy
    psSrc = sortBy(psSrc, 'x')
    // console.log('psSrc', psSrc)

    //getPtsX, 僅保留有效數字之內插點, 為純數字陣列, 故ts與psTar逐點對位
    psTar = getPtsX(psTar, keyX)
    // console.log('psTar', psTar)

    //check psTar
    if (size(psTar) === 0) {
        return {
            err: 'psTar has no effective data'
        }
    }
    // console.log('getPtsX psTar', psTar)

    //_sync
    let _sync = () => {

        //_interp1
        let ts = _interp1(psSrc, psTar, {
            ...opt,
            mode: method,
            keyX: 'x', //已正規化至'x'
            keyY: 'y', //已正規化至'y'
        })
        // console.log('_interp1 ts', ts)

        //rs
        let rs = []
        each(psTar, (x, k) => {
            let v = ts[k]
            if (isnum(v)) {
                v = cdbl(v)
            }
            else {
                v = null
            }
            let r = {
                [keyX]: x,
                [keyY]: v,
            }
            rs.push(r)
        })
        // console.log('rs', rs)

        //r
        let r
        if (isOne) {
            r = rs[0]
        }
        else {
            r = rs
        }
        // console.log('isOne', isOne, r)

        return r
    }

    //_async
    let _async = async () => {
        let r = null
        try {
            r = _sync()
            let err = get(r, 'err')
            if (isestr(err)) {
                return Promise.reject(err)
            }
            else {
                return r
            }
        }
        catch (err) {
            console.log(err)
            return Promise.reject(err.toString())
        }
    }

    if (useSync) {
        return _sync()
    }
    else {
        return _async()
    }
}


export default interp1
