import isestr from 'wsemi/src/isestr.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isobj from 'wsemi/src/isobj.mjs'
import JSON5 from 'json5'


let nonArealTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString']


let allTypes = ['FeatureCollection', 'Feature', 'GeometryCollection', 'Polygon', 'MultiPolygon', ...nonArealTypes]


//本函數自行判定而拋出之錯誤, 用於與讀取輸入時之非預期錯誤(存取器拋錯、已撤銷之Proxy、循環參照等)區分
class ErrInvalid extends Error {}


let fail = (msg) => {
    throw new ErrInvalid(msg)
}


//GeoJSON之座標須為JSON數字(RFC 7946), 故判定為原始number且有限; 不用wsemi isenum因其收數字字串, 收了就須轉換使輸出與輸入型別不同
let isCoord = (v) => {
    return typeof v === 'number' && Number.isFinite(v)
}


//讀取opt之鍵, 存取器拋錯視為未給(dspec V11: 讀取拋錯即無效, K3: 無效之opt鍵改用預設)
let pickOpt = (opt, key) => {
    try {
        return opt[key]
    }
    catch (err) {
        return undefined
    }
}


//位置之複本, 無效回傳null; 位置為2個以上之有限數字(第3個起為高程等), 長度不限於2
//先複製再驗證複本, 使檢測之值即使用之值(輸入為存取器或Proxy時, 驗證與取值不會讀到不同內容)
let cpPos = (p) => {
    if (!isarr(p)) {
        return null
    }
    let c = p.slice()
    if (c.length < 2) {
        return null
    }
    for (let i = 0; i < c.length; i++) {
        if (!isCoord(c[i])) {
            return null
        }
    }
    return c
}


//環(位置之陣列)之複本, 須至少含1個位置(空環下游函數會拋原生錯誤), 不檢查封閉與是否足以成面之點數
let cpRing = (rs, where) => {
    if (!isarr(rs) || rs.length === 0) {
        fail(`invalid ${where}: must be a non-empty array of positions`)
    }
    let r = []
    for (let i = 0; i < rs.length; i++) {
        let c = cpPos(rs[i])
        if (c === null) {
            fail(`invalid ${where}[${i}]: must be an array of two or more finite numbers`)
        }
        r.push(c)
    }
    return r
}


//polygon(環之陣列, 第1環為外環、其後為內環)之複本
let cpPolygon = (pg, where) => {
    if (!isarr(pg)) {
        fail(`invalid ${where}: must be an array of rings`)
    }
    let r = []
    for (let i = 0; i < pg.length; i++) {
        r.push(cpRing(pg[i], `${where}[${i}]`))
    }
    return r
}


/**
 * 依GeoJSON之type(而非座標深度)轉換成MultiPolygon，Polygon之第1環為外環、其後為內環(洞)，內環保留為洞
 *
 * toMultiPolygon、isPointInPolygons等函數以座標深度推定型別，GeoJSON之Polygon座標(環之陣列)於預設supposeType('polygons')下會被視為多個獨立polygon，使內環成為實心；讀GeoJSON時請先以本函數轉換，再將回傳值交給其他函數
 *
 * 轉換依type：Polygon包一層成為1塊polygon，MultiPolygon原樣，FeatureCollection與GeometryCollection依序合併，Feature取其geometry，geometry為null或未給者略過，空座標(Polygon之[]、MultiPolygon內之[])略過；各層皆依其type遞迴處理，故FeatureCollection內放裸geometry、GeometryCollection內放Feature亦收
 *
 * 只檢查結構(type、陣列層次、環須含至少1個位置、位置為2個以上之有限數字，含NaN與Infinity者視為無效)，不檢查環之封閉、是否足以成面之點數、方向與自交，也不改寫環之方向(依GeoJSON位置判別，第1環為外環)；環之封閉可交fixCloseMultiPolygon處理(isPointInPolygons內已含)
 *
 * 位置保留原長度(含高程)，但toMultiPolygon、isPointInPolygons等以座標深度判斷之函數只收[x,y]位置，含高程者交給它們會拋錯，須先自行去除高程
 *
 * 回傳為複本，不與輸入共用陣列，輸入不被改動；無有效幾何時回傳[]，而toMultiPolygon、fixCloseMultiPolygon等收到[]會拋錯，交給它們前須先判斷長度
 *
 * 輸入無法讀取(存取器拋錯、已撤銷之Proxy、循環參照或巢狀過深)時一律拋固定訊息，不帶出輸入內之錯誤內容
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/geojsonToMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Object|String} geojson 輸入GeoJSON物件或其JSON字串(可含JSON5寫法)，可為FeatureCollection、Feature、Polygon、MultiPolygon、GeometryCollection，必給，無效(非物件、字串無法解析、type不支援、座標結構不符)時拋錯，錯誤訊息只指出位置與應有種類，不含輸入值
 * @param {Object} [opt={}] 輸入設定物件，非物件視為未給，各鍵之值非預期或讀取拋錯者視為該鍵未給，預設{}
 * @param {String} [opt.nonAreal='throw'] 輸入遇點或線類幾何(Point、MultiPoint、LineString、MultiLineString)之處置字串，'throw'為拋錯，'skip'為略過，其他值視為未給，預設'throw'
 * @param {Boolean} [opt.debug=false] 輸入opt之值無效而改用預設時是否以console.warn提示(提示不含輸入值)，只收true與false，其他值視為false，預設false
 * @returns {Array} 回傳MultiPolygon陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列(每塊polygon之第1環為外環、其後為內環)；皆無有效幾何時回傳[]
 * @example
 *
 * let geojson
 * let r
 *
 * geojson = { //polygon含1內環
 *     type: 'Polygon',
 *     coordinates: [
 *         [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
 *         [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
 *     ],
 * }
 * r = geojsonToMultiPolygon(geojson)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]]
 *
 * geojson = {
 *     type: 'FeatureCollection',
 *     features: [
 *         { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
 *         { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: [[[[2, 0], [3, 0], [3, 1], [2, 0]]]] } },
 *         { type: 'Feature', properties: {}, geometry: null },
 *     ],
 * }
 * r = geojsonToMultiPolygon(geojson)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[1,0],[1,1],[0,0]]],[[[2,0],[3,0],[3,1],[2,0]]]]
 *
 * geojson = { type: 'Point', coordinates: [1, 1] }
 * try {
 *     r = geojsonToMultiPolygon(geojson)
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => invalid geojson: must be Polygon or MultiPolygon (use opt.nonAreal 'skip' to skip Point, MultiPoint, LineString and MultiLineString)
 *
 * r = geojsonToMultiPolygon(geojson, { nonAreal: 'skip' })
 * console.log(JSON.stringify(r))
 * // => []
 *
 */
function geojsonToMultiPolygon(geojson, opt = {}) {

    //opt, 非一般物件視為未給(isobj對任何輸入皆不拋錯)
    if (!isobj(opt)) {
        opt = {}
    }

    //debug
    let debug = pickOpt(opt, 'debug') === true

    //nonAreal
    let nonAreal = pickOpt(opt, 'nonAreal')
    if (nonAreal !== 'throw' && nonAreal !== 'skip') {
        if (debug && nonAreal !== undefined && nonAreal !== null) {
            console.warn(`[w-gis geojsonToMultiPolygon] invalid opt.nonAreal: must be one of 'throw', 'skip', using default 'throw'`)
        }
        nonAreal = 'throw'
    }

    //geojson為字串時解析, 與getBoxFromGeojson、getKpFeatureFromGeojson同用JSON5解析(wsemi j2o只收嚴格JSON, 且失敗時回{}而無法與合法之{}區分)
    if (isestr(geojson)) {
        try {
            geojson = JSON5.parse(geojson)
        }
        catch (err) {
            fail('invalid geojson: must be a valid JSON text')
        }
    }

    //check
    if (!isobj(geojson)) {
        fail('invalid geojson: must be an object or a JSON text')
    }

    //conv, 依type遞迴處理
    let r = []
    let conv = (g, where) => {
        if (!isobj(g)) {
            fail(`invalid ${where}: must be an object`)
        }
        let t = g.type
        if (t === 'FeatureCollection') {
            let fs = g.features
            if (!isarr(fs)) {
                fail(`invalid ${where}.features: must be an array`)
            }
            for (let i = 0; i < fs.length; i++) {
                conv(fs[i], `${where}.features[${i}]`)
            }
            return
        }
        if (t === 'Feature') {
            let gm = g.geometry
            if (gm === undefined || gm === null) {
                return //GeoJSON允許之無幾何feature, 略過
            }
            conv(gm, `${where}.geometry`)
            return
        }
        if (t === 'GeometryCollection') {
            let gs = g.geometries
            if (!isarr(gs)) {
                fail(`invalid ${where}.geometries: must be an array`)
            }
            for (let i = 0; i < gs.length; i++) {
                conv(gs[i], `${where}.geometries[${i}]`)
            }
            return
        }
        if (t === 'Polygon') {
            let cs = g.coordinates
            if (!isarr(cs)) {
                fail(`invalid ${where}.coordinates: must be an array`)
            }
            if (cs.length > 0) { //空座標略過
                r.push(cpPolygon(cs, `${where}.coordinates`)) //Polygon包一層成為1塊polygon, 其內環仍為同一塊之洞
            }
            return
        }
        if (t === 'MultiPolygon') {
            let cs = g.coordinates
            if (!isarr(cs)) {
                fail(`invalid ${where}.coordinates: must be an array`)
            }
            for (let i = 0; i < cs.length; i++) {
                if (isarr(cs[i]) && cs[i].length === 0) {
                    continue //空polygon略過
                }
                r.push(cpPolygon(cs[i], `${where}.coordinates[${i}]`))
            }
            return
        }
        if (nonArealTypes.includes(t)) {
            if (nonAreal === 'skip') {
                return
            }
            fail(`invalid ${where}: must be Polygon or MultiPolygon (use opt.nonAreal 'skip' to skip ${nonArealTypes.slice(0, -1).join(', ')} and ${nonArealTypes[nonArealTypes.length - 1]})`)
        }
        fail(`invalid ${where}.type: must be one of ${allTypes.map((v) => `'${v}'`).join(', ')}`)
    }

    //讀取輸入時之非預期錯誤(存取器拋錯、已撤銷之Proxy、循環參照等)改為固定訊息, 不帶出原錯誤內容
    try {
        conv(geojson, 'geojson')
    }
    catch (err) {
        if (err instanceof ErrInvalid) {
            throw err
        }
        throw new Error('invalid geojson: must be a readable object')
    }

    return r
}


export default geojsonToMultiPolygon
