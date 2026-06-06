import { Delaunay } from 'd3-delaunay'
import fs from 'fs'
import intersectPolygon from '../src/intersectPolygon.mjs'
import getAreaPolygon from '../src/getAreaPolygon.mjs'

function mkRand(seed) {
    let s = seed >>> 0
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 4294967296
    }
}
function openRing(pts) {
    let n = pts.length
    if (n >= 2 && pts[0][0] === pts[n - 1][0] && pts[0][1] === pts[n - 1][1]) {
        return pts.slice(0, n - 1)
    }
    return pts
}
function polyArea(pts) {
    let n = pts.length
    if (n < 3) return 0
    let a = 0
    for (let i = 0; i < n; i++) {
        let p = pts[i], q = pts[(i + 1) % n]
        a += p[0] * q[1] - q[0] * p[1]
    }
    return Math.abs(a) / 2
}
function segIntersect(p1, p2, A, B) {
    let x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1], x3 = A[0], y3 = A[1], x4 = B[0], y4 = B[1]
    let den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if (den === 0) return [x2, y2]
    let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]
}
function convexClipArea(subject, clip) {
    subject = openRing(subject)
    clip = openRing(clip)
    if (subject.length < 3 || clip.length < 3) return 0
    let sa = 0, cn = clip.length
    for (let i = 0; i < cn; i++) {
        let p = clip[i], q = clip[(i + 1) % cn]
        sa += p[0] * q[1] - q[0] * p[1]
    }
    let ccw = (sa > 0)
    let output = subject
    for (let i = 0; i < cn; i++) {
        let A = clip[i], B = clip[(i + 1) % cn]
        let ex = B[0] - A[0], ey = B[1] - A[1], ax = A[0], ay = A[1]
        let input = output, len = input.length
        if (len === 0) break
        output = []
        for (let j = 0; j < len; j++) {
            let cur = input[j], prev = input[(j + len - 1) % len]
            let crossCur = ex * (cur[1] - ay) - ey * (cur[0] - ax)
            let crossPrev = ex * (prev[1] - ay) - ey * (prev[0] - ax)
            let curIn = ccw ? (crossCur >= 0) : (crossCur <= 0)
            let prevIn = ccw ? (crossPrev >= 0) : (crossPrev <= 0)
            if (curIn) {
                if (!prevIn) output.push(segIntersect(prev, cur, A, B))
                output.push(cur)
            }
            else if (prevIn) output.push(segIntersect(prev, cur, A, B))
        }
    }
    return polyArea(output)
}

//通用 point-in-polygon (ray casting, even-odd)
function pointInPoly(x, y, ring) {
    let inside = false
    let n = ring.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
        let xi = ring[i][0], yi = ring[i][1]
        let xj = ring[j][0], yj = ring[j][1]
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }
    return inside
}

//蒙地卡羅估交集面積 (獨立裁判)
function monteCarloIntersectArea(ringA, ringB, nSamples, rand) {
    //bbox = A 與 B 之交集 bbox (交集 ⊆ A 且 ⊆ B)
    let minX = Math.max(Math.min(...ringA.map(p => p[0])), Math.min(...ringB.map(p => p[0])))
    let maxX = Math.min(Math.max(...ringA.map(p => p[0])), Math.max(...ringB.map(p => p[0])))
    let minY = Math.max(Math.min(...ringA.map(p => p[1])), Math.min(...ringB.map(p => p[1])))
    let maxY = Math.min(Math.max(...ringA.map(p => p[1])), Math.max(...ringB.map(p => p[1])))
    if (maxX <= minX || maxY <= minY) {
        return 0
    }
    let bboxArea = (maxX - minX) * (maxY - minY)
    let hit = 0
    for (let i = 0; i < nSamples; i++) {
        let x = minX + rand() * (maxX - minX)
        let y = minY + rand() * (maxY - minY)
        if (pointInPoly(x, y, ringA) && pointInPoly(x, y, ringB)) {
            hit++
        }
    }
    return bboxArea * hit / nSamples
}

//重現 debug-clip 設定, 找 maxDiff 最大那對
let N = 50, M = 1000, scale = 1
let rand = mkRand(12345 + N * 31 + M)
let coords = new Float64Array(N * 2)
for (let i = 0; i < N; i++) {
    coords[2 * i] = rand()
    coords[2 * i + 1] = rand()
}
let vbox = [0, 0, scale, scale]
let qs = []
for (let i = 0; i < M; i++) qs.push([0.05 + rand() * 0.9, 0.05 + rand() * 0.9])

let iniVor = new Delaunay(coords).voronoi(vbox)
let iniCells = []
for (let i = 0; i < N; i++) iniCells.push(iniVor.cellPolygon(i))

let postCoords = new Float64Array((N + 1) * 2)
postCoords.set(coords, 0)

let best = null
for (let q of qs) {
    postCoords[2 * N] = q[0]
    postCoords[2 * N + 1] = q[1]
    let dny = new Delaunay(postCoords)
    let vor = dny.voronoi(vbox)
    let pgQuery = vor.cellPolygon(N)
    if (!pgQuery) continue
    let neighbors = []
    let sq = dny.neighbors(N)
    let nx = sq.next()
    while (!nx.done) { neighbors.push(nx.value); nx = sq.next() }
    for (let idx of neighbors) {
        let cell = iniCells[idx]
        if (!cell) continue
        let areaClip = convexClipArea(pgQuery, cell)
        let areaPoly = 0
        let pgsInts = []
        try { pgsInts = intersectPolygon([pgQuery], [cell]) } catch (e) {}
        if (pgsInts.length === 1) { try { areaPoly = getAreaPolygon(pgsInts[0]) } catch (e) {} }
        let diff = Math.abs(areaClip - areaPoly)
        if (!best || diff > best.diff) {
            best = { diff, areaClip, areaPoly, q, idx, pgQuery: openRing(pgQuery), cell: openRing(cell), neighbors: neighbors.slice() }
        }
    }
}

console.log('=== worst case (maxDiff) ===')
console.log('查詢點 q =', JSON.stringify(best.q))
console.log('鄰居 idx =', best.idx, ' 該查詢點鄰居數 =', best.neighbors.length)
console.log('')
console.log('pgQuery (查詢cell, 完整精度) =')
console.log(JSON.stringify(best.pgQuery))
console.log('')
console.log('cell (鄰居cell, 完整精度) =')
console.log(JSON.stringify(best.cell))
console.log('')
console.log('--- 三方交集面積 ---')
console.log('polybooljs     :', best.areaPoly)
console.log('convexClip     :', best.areaClip)

//蒙地卡羅 (多個獨立 seed, 各 5e7 點)
for (let s of [1, 2, 3]) {
    let mc = monteCarloIntersectArea(best.pgQuery, best.cell, 50000000, mkRand(s * 7919))
    console.log(`蒙地卡羅 seed=${s} (5e7點):`, mc)
}

//輸出 json 供後續 workflow agent 使用
fs.writeFileSync('./tmp/worst-case.json', JSON.stringify({
    q: best.q,
    idx: best.idx,
    pgQuery: best.pgQuery,
    cell: best.cell,
    areaPoly: best.areaPoly,
    areaClip: best.areaClip,
}, null, 2))
console.log('')
console.log('已寫出 ./tmp/worst-case.json')
