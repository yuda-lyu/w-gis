import get from 'lodash-es/get.js'
import map from 'lodash-es/map.js'
import isNumber from 'lodash-es/isNumber.js'
import isearr from 'wsemi/src/isearr.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import fixCloseMultiPolygon from './fixCloseMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'
// import polygonClipping from 'polygon-clipping'
import * as polyclip from 'polyclip-ts'


function flattenMultiPolygon(pgs) {
    if (!isearr(pgs) || pgs.length === 0) return null

    // -----------------------------
    // 1) 收集 rings，並轉成 [lng,lat]
    // -----------------------------
    let isSimple = isarr(pgs[0]) && isNumber(pgs[0][0])
    let ringsLngLat = []
    if (isSimple) {
        // 單環：[[lat,lng],...]
        ringsLngLat = [map(pgs, (ll) => [ll[1], ll[0]])]
    }
    else {
        // 多環：[[[lat,lng],...], ...]
        ringsLngLat = map(pgs, (ring) => map(ring, (ll) => [ll[1], ll[0]]))
    }

    // -----------------------------
    // 2) sanitize ring：過濾不合法點、去連續重複、閉合、點數/面積檢查
    // -----------------------------
    function ringSignedArea(ring) {
        // ring 預期已閉合
        let a = 0
        for (let i = 0; i < ring.length - 1; i++) {
            let x1 = ring[i][0]; let y1 = ring[i][1]
            let x2 = ring[i + 1][0]; let y2 = ring[i + 1][1]
            a += (x1 * y2 - x2 * y1)
        }
        return a / 2
    }

    function sanitizeRing(ring) {
        if (!Array.isArray(ring)) return null

        // 只保留有限數字點
        let pts = []
        for (let i = 0; i < ring.length; i++) {
            let p = ring[i]
            if (!Array.isArray(p) || p.length < 2) continue
            let x = Number(p[0])
            let y = Number(p[1])
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue
            pts.push([x, y])
        }

        // 移除連續重複點
        let dedup = []
        for (let i = 0; i < pts.length; i++) {
            let p = pts[i]
            let q = dedup[dedup.length - 1]
            if (!q || p[0] !== q[0] || p[1] !== q[1]) dedup.push(p)
        }
        pts = dedup

        // 閉合
        if (pts.length >= 1) {
            let a = pts[0]
            let b = pts[pts.length - 1]
            if (a[0] !== b[0] || a[1] !== b[1]) pts.push([a[0], a[1]])
        }

        // 合法 ring：閉合後至少 4 點
        if (pts.length < 4) return null

        // 避免退化面（面積 ~ 0）
        let area = ringSignedArea(pts)
        if (!Number.isFinite(area) || Math.abs(area) < 1e-14) return null

        return pts
    }

    let cleanRings = []
    for (let i = 0; i < ringsLngLat.length; i++) {
        let r = sanitizeRing(ringsLngLat[i])
        if (r) cleanRings.push(r)
    }
    if (cleanRings.length === 0) return null

    // -----------------------------
    // 3) even-odd = XOR reduce（polyclip-ts）
    //    ⚠️ polyclip-ts 的「Polygon」座標結構是 [ring]（不是 [[[ring]]]）
    // -----------------------------
    function ringToPoly(ring) {
        return [ring] // Polygon coords: [ outerRing ]
    }

    // 單 ring：直接 Polygon
    if (cleanRings.length === 1) {
        return { type: 'Polygon', coordinates: [cleanRings[0]] }
    }

    // 多 ring：XOR 疊加（等價 SVG/Leaflet even-odd）
    let acc = ringToPoly(cleanRings[0]) // 一開始是 Polygon coords
    for (let i = 1; i < cleanRings.length; i++) {
        acc = polyclip.xor(acc, ringToPoly(cleanRings[i]))
    }

    // polyclip-ts xor 結果通常是 MultiPolygon coords: number[][][][]
    if (!acc || acc.length === 0) return null
    if (acc.length === 1) {
        return { type: 'Polygon', coordinates: acc[0] }
    }
    return { type: 'MultiPolygon', coordinates: acc }
}


export default flattenMultiPolygon
