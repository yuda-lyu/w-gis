import get from 'lodash-es/get.js'
import realInterp1 from 'wsemi/src/interp1.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isenum from 'wsemi/src/isenum.mjs'


/**
 * wsemi interp1「第3輪嚴格版」替身(測試用, 不隨套件發布)
 *
 * 契約(依派工提示詞〈背景〉):
 * 1. px為陣列時, 無效元素(非有效數字, 含Infinity、'Infinity'、'0x10'、null、非數字字串)原位輸出{ err: 'invalid px[<i>]: must be a valid number' }, 輸出長度恆等於px長度。
 * 2. px單值無效回{ err }。
 * 3. 資料點ps之無效點照現行濾除(交由真實wsemi處理)。
 * 有效元素之內插委由已安裝之真實wsemi interp1(傳入已轉為Number之有效數字)。
 *
 * 變體(環境變數W_GIS_WSEMI_STRICT):
 * - 'faithful'(預設): 元素取值同wsemi現行toArrayX(純量本身、陣列取[0]、物件取keyX), 取得之值再以isenum判定。
 * - 'numberOnly': 只收純量數字/數字字串, 物件與陣列元素一律視為無效(wsemi JSDoc載明px為「數值或數值陣列」, 此為最嚴解讀)。
 *
 * 偵測紀錄(供測試斷言「本套件交給wsemi之值皆已清理」): 寫入globalThis.__interp1Spy,
 * - calls: 呼叫次數
 * - badPx: px元素不是「原始型別number且為有限數」者, [{ call, i, type }]
 * - badPs: ps資料點之x或y不是「原始型別number且為有限數」者, [{ call, i, type }]
 * - optSeen: 每次呼叫收到之xMin、xMax(供對照, 不算違規)
 */
function getSpy() {
    if (!globalThis.__interp1Spy) {
        globalThis.__interp1Spy = { calls: 0, badPx: [], badPs: [], optSeen: [] }
    }
    return globalThis.__interp1Spy
}


function isFiniteNumber(v) {
    return typeof v === 'number' && Number.isFinite(v)
}


function typeOf(v) {
    if (v === null) {
        return 'null'
    }
    if (Array.isArray(v)) {
        return 'array'
    }
    if (typeof v === 'number') {
        return Number.isNaN(v) ? 'NaN' : (Number.isFinite(v) ? 'number' : String(v))
    }
    return typeof v
}


function interp1Strict(ps, px, opt = {}) {
    let variant = process.env.W_GIS_WSEMI_STRICT === 'numberOnly' ? 'numberOnly' : 'faithful'

    //spy
    let spy = getSpy()
    let call = spy.calls
    spy.calls++
    let keyX = get(opt, 'keyX', 'x')
    let keyY = get(opt, 'keyY', 'y')
    if (Array.isArray(ps)) {
        ps.forEach((p, i) => {
            let x = get(p, keyX)
            let y = get(p, keyY)
            if (!isFiniteNumber(x)) {
                spy.badPs.push({ call, i, type: 'x:' + typeOf(x) })
            }
            if (!isFiniteNumber(y)) {
                spy.badPs.push({ call, i, type: 'y:' + typeOf(y) })
            }
        })
    }
    if (Array.isArray(px)) {
        px.forEach((v, i) => {
            if (!isFiniteNumber(v)) {
                spy.badPx.push({ call, i, type: typeOf(v) })
            }
        })
    }
    else if (!isFiniteNumber(px)) {
        spy.badPx.push({ call, i: -1, type: typeOf(px) })
    }
    spy.optSeen.push({ xMin: get(opt, 'xMin'), xMax: get(opt, 'xMax') })

    //px單值
    if (!Array.isArray(px)) {
        if (!isenum(px)) {
            return { err: 'invalid px: must be a valid number' }
        }
        return realInterp1(ps, Number(px), opt)
    }

    //px陣列, 有效元素轉Number後交真實wsemi
    let idxs = []
    let xs = []
    px.forEach((el, i) => {
        let x = el
        if (variant === 'faithful' && !isnum(el)) {
            if (Array.isArray(el) && el.length >= 1) {
                x = el[0]
            }
            else {
                x = get(el, keyX, null)
            }
        }
        if (isenum(x)) {
            idxs.push(i)
            xs.push(Number(x))
        }
    })
    let r = realInterp1(ps, xs, opt)
    if (!Array.isArray(r)) {
        return r //ps整體無效等, 與現行相同回{ err }
    }

    //原位輸出
    let rs = []
    for (let i = 0; i < px.length; i++) {
        rs.push({ err: `invalid px[${i}]: must be a valid number` })
    }
    idxs.forEach((i, k) => {
        rs[i] = r[k]
    })
    return rs
}


export default interp1Strict
