import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import map from 'lodash-es/map.js'
import isEqual from 'lodash-es/isEqual.js'
import size from 'lodash-es/size.js'
import cloneDeep from 'lodash-es/cloneDeep.js'
import isearr from 'wsemi/src/isearr.mjs'
import isobj from 'wsemi/src/isobj.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import flattenMultiPolygon from './flattenMultiPolygon.mjs'


/**
 * 建立空的分類結果物件
 *
 * @returns {Object} 回傳包含 points、lines、polygons 三個空 FeatureCollection 的物件
 */
function createEmptyResult() {
    return {
        points: { type: 'FeatureCollection', features: [] },
        lines: { type: 'FeatureCollection', features: [] },
        polygons: { type: 'FeatureCollection', features: [] },
    }
}


/**
 * 修復 Polygon ring 閉合（首尾座標相同）
 *
 * @param {Array} ring 輸入 ring 座標陣列
 * @returns {Array} 回傳已閉合的 ring 座標陣列
 */
function ensureRingClosed(ring) {
    if (!isearr(ring)) {
        return ring
    }
    let n = size(ring)
    if (n < 2) {
        return ring
    }
    let first = ring[0]
    let last = ring[n - 1]
    if (!isEqual(first, last)) {
        ring = [...ring, first]
    }
    return ring
}


/**
 * 修復 Polygon 的所有 ring 閉合
 *
 * @param {Array} coordinates Polygon 的 coordinates（二維陣列，每個元素為一個 ring）
 * @returns {Array} 回傳已修復閉合的 coordinates
 */
function fixClosePolygonCoords(coordinates) {
    return map(coordinates, (ring) => ensureRingClosed(ring))
}


/**
 * 修復 MultiPolygon 的所有 ring 閉合
 *
 * @param {Array} coordinates MultiPolygon 的 coordinates（三維陣列）
 * @returns {Array} 回傳已修復閉合的 coordinates
 */
function fixCloseMultiPolygonCoords(coordinates) {
    return map(coordinates, (polygon) => fixClosePolygonCoords(polygon))
}


/**
 * 將單一 Feature 依幾何類型分類到結果物件中
 *
 * @param {Object} feature 輸入 GeoJSON Feature
 * @param {Object} result 輸入分類結果物件（包含 points、lines、polygons）
 */
function classifyFeature(feature, result) {

    // 安全取得 geometry
    let geometry = get(feature, 'geometry')
    if (!iseobj(geometry)) {
        return
    }

    let type = get(geometry, 'type', '')
    let properties = get(feature, 'properties', {}) || {}
    let id = get(feature, 'id')

    // GeometryCollection：遞迴拆解為多個獨立 Feature，各自繼承原始 properties
    if (type === 'GeometryCollection') {
        let geometries = get(geometry, 'geometries', [])
        each(geometries, (subGeom) => {
            let subFeature = {
                type: 'Feature',
                properties: cloneDeep(properties),
                geometry: cloneDeep(subGeom),
            }
            if (id !== undefined) {
                subFeature.id = id
            }
            classifyFeature(subFeature, result)
        })
        return
    }

    // 建立輸出 Feature（深拷貝以避免汙染原始資料）
    let outFeature = {
        type: 'Feature',
        properties: cloneDeep(properties),
        geometry: cloneDeep(geometry),
    }
    if (id !== undefined) {
        outFeature.id = id
    }

    // 依幾何類型分類
    switch (type) {

    case 'Point':
    case 'MultiPoint':
        result.points.features.push(outFeature)
        break

    case 'LineString':
    case 'MultiLineString':
        result.lines.features.push(outFeature)
        break

    case 'Polygon':
        // 修復 ring 閉合
        outFeature.geometry.coordinates = fixClosePolygonCoords(outFeature.geometry.coordinates)
        result.polygons.features.push(outFeature)
        break

    case 'MultiPolygon':
        // 修復 ring 閉合
        outFeature.geometry.coordinates = fixCloseMultiPolygonCoords(outFeature.geometry.coordinates)
        result.polygons.features.push(outFeature)
        break

    default:
        // 未知幾何類型跳過
        break
    }
}


/**
 * 將 GeoJSON 資料拆分成依幾何類型分類的多個 FeatureCollection
 *
 * 此函數的設計目的是針對 MapLibre GL JS 的 layer type 限制，
 * 將混合不同幾何類型的 GeoJSON 資料預先拆分成：
 *   - points：包含 Point / MultiPoint 的 FeatureCollection
 *   - lines：包含 LineString / MultiLineString 的 FeatureCollection
 *   - polygons：包含 Polygon / MultiPolygon 的 FeatureCollection
 *
 * 額外處理：
 *   1. GeometryCollection 會被遞迴拆解成獨立的 Feature，properties 繼承父 Feature
 *   2. Polygon / MultiPolygon 的 ring 自動修復閉合（首尾座標相同）
 *   3. 支援多種輸入格式：FeatureCollection、Feature、裸 Geometry、JSON 字串
 *   4. 深拷貝輸出，不汙染原始資料
 *   5. 空輸入 / 無效輸入回傳空的分類結果
 *
 * @param {Object|String|null} geoIn 輸入 GeoJSON 資料，可為 FeatureCollection、Feature、裸 Geometry 物件或 JSON 字串
 * @returns {Object} 回傳分類結果物件，結構為 { points: FeatureCollection, lines: FeatureCollection, polygons: FeatureCollection }
 *
 * @example
 *
 * // 混合類型 FeatureCollection
 * let input = {
 *     type: 'FeatureCollection',
 *     features: [
 *         { type: 'Feature', properties: { name: 'pt' }, geometry: { type: 'Point', coordinates: [121, 25] } },
 *         { type: 'Feature', properties: { name: 'ls' }, geometry: { type: 'LineString', coordinates: [[121, 25], [122, 26]] } },
 *         { type: 'Feature', properties: { name: 'pg' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]] } },
 *     ],
 * }
 * let result = splitGeoJSON(input)
 * console.log(result.points.features.length)   // 1
 * console.log(result.lines.features.length)    // 1
 * console.log(result.polygons.features.length) // 1
 *
 */
function splitGeoJSON(geoIn) {

    // 建立空的分類結果
    let result = createEmptyResult()

    // 空值 / 未定義 / 無效類型直接回傳空結果
    if (geoIn === null || geoIn === undefined) {
        return result
    }

    // 支援 JSON 字串輸入
    if (isestr(geoIn)) {
        try {
            geoIn = JSON.parse(geoIn)
        }
        catch (e) {
            return result
        }
    }

    // 非物件直接回傳空結果
    if (!isobj(geoIn)) {
        return result
    }

    let type = get(geoIn, 'type', '')

    // 輸入為 FeatureCollection
    if (type === 'FeatureCollection') {
        let features = get(geoIn, 'features', [])
        if (!isearr(features)) {
            return result
        }
        each(features, (feature) => {
            classifyFeature(feature, result)
        })
        return result
    }

    // 輸入為 Feature
    if (type === 'Feature') {
        classifyFeature(geoIn, result)
        return result
    }

    // 輸入為裸 Geometry（Point、LineString、Polygon 等）
    let geometryTypes = [
        'Point', 'MultiPoint',
        'LineString', 'MultiLineString',
        'Polygon', 'MultiPolygon',
        'GeometryCollection',
    ]
    if (geometryTypes.indexOf(type) >= 0) {
        // 包裝成 Feature 後分類
        let feature = {
            type: 'Feature',
            properties: {},
            geometry: geoIn,
        }
        classifyFeature(feature, result)
        return result
    }

    // 不認得的類型，回傳空結果
    return result
}


/**
 * 處理特殊 Polygon 數據，讓 MapLibre GL JS 可正確渲染
 *
 * 此函數的設計目的是處理 splitGeoJSON 回傳的 polygons FeatureCollection 中，
 * 含有「多層套疊 ring」的 Polygon / MultiPolygon 數據。
 *
 * Leaflet 利用 SVG 的 evenodd fill rule 可直接繪製多層套疊的 ring，
 * 但 MapLibre GL JS 僅依賴 winding order（外環 CCW、洞環 CW）來決定填色/挖洞。
 * 因此，必須將多層套疊結構轉換為符合 RFC 7946 的標準 MultiPolygon 格式。
 *
 * 處理邏輯：
 *   1. 遍歷所有 Feature
 *   2. 對於 Polygon 類型：
 *      - ring 數量 <= 2 時，使用 flattenMultiPolygon 修正 winding order
 *      - ring 數量 > 2 時（可能為多層套疊），使用 flattenMultiPolygon 搭配
 *        supposeType='ringStrings' 模式，透過 XOR 運算將套疊結構轉為標準 MultiPolygon
 *   3. 對於 MultiPolygon 類型：
 *      - 將每個子 polygon 各自透過 flattenMultiPolygon 處理後合併
 *   4. 處理完畢後，若 MultiPolygon 只含一個 polygon，降級為 Polygon 類型
 *   5. 深拷貝輸出，不汙染原始資料
 *   6. 保留所有 properties
 *
 * @param {Object|null} polygonsFC 輸入 polygons FeatureCollection（來自 splitGeoJSON 的 polygons 欄位）
 * @returns {Object} 回傳處理後的 FeatureCollection
 *
 * @example
 *
 * // 三層套疊 Polygon
 * let input = {
 *     type: 'FeatureCollection',
 *     features: [{
 *         type: 'Feature',
 *         properties: { name: '三層' },
 *         geometry: {
 *             type: 'Polygon',
 *             coordinates: [
 *                 [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
 *                 [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
 *                 [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
 *             ],
 *         },
 *     }],
 * }
 * let result = procSpecPolygon(input)
 * console.log(result.features[0].geometry.type) // 'MultiPolygon'
 *
 */
function procSpecPolygon(polygonsFC) {

    // 建立空結果
    let emptyResult = { type: 'FeatureCollection', features: [] }

    // 無效輸入
    if (polygonsFC === null || polygonsFC === undefined) {
        return emptyResult
    }
    if (!iseobj(polygonsFC)) {
        return emptyResult
    }

    let features = get(polygonsFC, 'features')
    if (!isearr(features)) {
        return { type: 'FeatureCollection', features: [] }
    }

    let outFeatures = []

    each(features, (feature) => {

        // 深拷貝避免汙染原始資料
        let feat = cloneDeep(feature)

        let geometry = get(feat, 'geometry')
        if (!iseobj(geometry)) {
            // 無 geometry 的 Feature 直接保留
            outFeatures.push(feat)
            return
        }

        let type = get(geometry, 'type', '')
        let coordinates = get(geometry, 'coordinates', [])

        if (type === 'Polygon') {
            // 處理 Polygon
            let processed = processPolygonCoords(coordinates)
            feat.geometry = processed
        }
        else if (type === 'MultiPolygon') {
            // 處理 MultiPolygon：每個子 polygon 各自處理後合併
            let allPolygons = []
            each(coordinates, (polygonCoords) => {
                let processed = processPolygonCoords(polygonCoords)
                if (processed.type === 'MultiPolygon') {
                    each(processed.coordinates, (pg) => {
                        allPolygons.push(pg)
                    })
                }
                else if (processed.type === 'Polygon') {
                    allPolygons.push(processed.coordinates)
                }
            })

            // 依結果數量決定類型
            if (size(allPolygons) === 1) {
                feat.geometry = { type: 'Polygon', coordinates: allPolygons[0] }
            }
            else if (size(allPolygons) > 1) {
                feat.geometry = { type: 'MultiPolygon', coordinates: allPolygons }
            }
        }

        outFeatures.push(feat)
    })

    return { type: 'FeatureCollection', features: outFeatures }
}


/**
 * 處理單一 Polygon 的 coordinates
 *
 * @param {Array} coordinates Polygon 的 coordinates（二維陣列，每個元素為一個 ring）
 * @returns {Object} 回傳 GeoJSON Geometry 物件（Polygon 或 MultiPolygon）
 */
function processPolygonCoords(coordinates) {

    if (!isearr(coordinates)) {
        return { type: 'Polygon', coordinates }
    }

    let ringCount = size(coordinates)

    if (ringCount === 0) {
        return { type: 'Polygon', coordinates }
    }

    // 使用 flattenMultiPolygon 處理
    // ring 數量 > 2 時可能為多層套疊（Leaflet evenodd 風格）
    // 使用 ringStrings 模式讓 polybooljs 做 XOR 運算
    let supposeType = ringCount > 2 ? 'ringStrings' : 'ringStrings'
    let pgsResult

    try {
        pgsResult = flattenMultiPolygon(coordinates, { supposeType })
    }
    catch (e) {
        // fallback：若 flattenMultiPolygon 失敗，原樣回傳
        return { type: 'Polygon', coordinates }
    }

    // flattenMultiPolygon 回傳的是 MultiPolygon coordinates（depth=3）
    if (!isearr(pgsResult)) {
        return { type: 'Polygon', coordinates }
    }

    let pgCount = size(pgsResult)
    if (pgCount === 0) {
        return { type: 'Polygon', coordinates }
    }
    else if (pgCount === 1) {
        return { type: 'Polygon', coordinates: pgsResult[0] }
    }
    else {
        return { type: 'MultiPolygon', coordinates: pgsResult }
    }
}


/**
 * 將任意 GeoJSON 資料拆分為依幾何類型分類的多個 FeatureCollection，
 * 並對其中的 Polygon 數據進行特殊處理（多層套疊 ring 轉換為標準 MultiPolygon）
 *
 * 此函數結合了 splitGeoJSON 與 procSpecPolygon 的功能：
 *   1. splitGeoJSON：將混合幾何類型的 GeoJSON 拆分為 points / lines / polygons
 *   2. procSpecPolygon：將 polygons 中含有多層套疊 ring 的 Polygon/MultiPolygon
 *      轉換為符合 RFC 7946 規範的標準格式，確保 winding order 正確
 *
 * 此函數設計為方便日後 MapLibre GL JS 渲染使用的一站式前處理函數。
 *
 * @param {Object|String|null} geoIn 輸入 GeoJSON 資料，可為 FeatureCollection、Feature、裸 Geometry 物件或 JSON 字串
 * @returns {Object} 回傳分類結果物件，結構為 { points: FeatureCollection, lines: FeatureCollection, polygons: FeatureCollection }
 *
 * @example
 *
 * let input = {
 *     type: 'FeatureCollection',
 *     features: [
 *         { type: 'Feature', properties: { name: 'pt' }, geometry: { type: 'Point', coordinates: [121, 25] } },
 *         { type: 'Feature', properties: { name: 'ls' }, geometry: { type: 'LineString', coordinates: [[121, 25], [122, 26]] } },
 *         {
 *             type: 'Feature',
 *             properties: { name: '三層' },
 *             geometry: {
 *                 type: 'Polygon',
 *                 coordinates: [
 *                     [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
 *                     [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
 *                     [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
 *                 ],
 *             },
 *         },
 *     ],
 * }
 * let result = splitAndProcGeoJSON(input)
 * console.log(result.points.features.length)   // 1
 * console.log(result.lines.features.length)    // 1
 * console.log(result.polygons.features.length) // 1（polygon 已被處理為 MultiPolygon）
 *
 */
function splitAndProcGeoJSON(geoIn) {

    // 步驟一：使用 splitGeoJSON 拆分幾何類型
    let splitted = splitGeoJSON(geoIn)

    // 步驟二：使用 procSpecPolygon 處理 polygon 數據
    let processedPolygons = procSpecPolygon(splitted.polygons)

    // 回傳結果，points 與 lines 不需特殊處理
    return {
        points: splitted.points,
        lines: splitted.lines,
        polygons: processedPolygons,
    }
}


export default splitAndProcGeoJSON
