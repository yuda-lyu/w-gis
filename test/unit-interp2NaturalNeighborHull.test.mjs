import assert from 'assert'
import path from 'path'
import { pathToFileURL } from 'url'
import { convex, featureCollection, point, booleanPointInPolygon } from '@turf/turf'


//規則帳本: sgud/rule/rulebook.md R-NN1(interp2NaturalNeighbor 之可內插範圍與 opt.limitInsideHull); 改以Liang & Hale算法後, 凸包內之值、凸包邊上與凸包外(false)之行為改變, 帳本須同步更新(見JSDoc可內插範圍)
//環境變數 W_GIS_SRC_DIR 可指定含 interp2NaturalNeighbor.mjs 等檔之資料夾(對照修前碼或變異碼), 預設為本套件 src
let dirSrc = process.env.W_GIS_SRC_DIR ? path.resolve(process.env.W_GIS_SRC_DIR) : path.resolve('src')
let load = async(name) => {
    return (await import(pathToFileURL(path.join(dirSrc, name)).href)).default
}
let interp2NaturalNeighbor = await load('interp2NaturalNeighbor.mjs')
let interp2 = await load('interp2.mjs')
let interp2Kriging = await load('interp2Kriging.mjs')


//原始點: x範圍21~1151(1130), y範圍3~371(368); 正規化之正方形為x:[21,1151], y:[187-565,187+565]=[-378,752]; 凸包頂點為(21,325),(174,3),(953,28),(1151,371),(537,368)
let ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]

//凸包內之期望值: 有理數精確解(以原始輸入計算: z=Σai·zi/Σai, ai為test/tools/sibsonExactRef.mjs之有理數被奪面積; 非本函數之輸出); 以相對1e-12比對
//1.1.27之值(新、舊Voronoi區塊裁切於正方形且以多邊形交集計算)與之差: (243,207)1.4e-14, (283,207)7.1e-14, (600,250)8.5e-14, (900,200)1.4e-13, (1050,201)35.4(裁切), (400,300)0.0169, (700,330)6.27, (1000,330)8.18
let goldInHull = [
    { x: 243, y: 207, z: 97.29447682486817 },
    { x: 283, y: 207, z: 114.43040421951916 },
    { x: 600, y: 250, z: 193.6150805720753 },
    { x: 900, y: 200, z: 136.2866717607253 },
    { x: 1050, y: 201, z: 141.56369998885117 }, //距凸包邊約2.5, 1.1.27之Voronoi區塊伸出正方形被裁切而得106.116
    { x: 400, y: 300, z: 184.61233114301996 },
    { x: 700, y: 330, z: 192.32382244912733 },
    { x: 1000, y: 330, z: 104.73228619274097 },
]
let ptsOutHull = [{ x: 600, y: 500 }, { x: 600, y: 380 }, { x: 100, y: 340 }, { x: 600, y: 752 }, { x: 1100, y: -300 }, { x: 21, y: 100 }] //凸包外而在正方形內
let pOutSquare = [{ x: 1243, y: 1207 }, { x: 1160, y: 380 }, { x: 20, y: 100 }, { x: 600, y: 752.001 }, { x: 600, y: -378.001 }, { x: 1151.001, y: 300 }]
let hullIdx = [2, 6, 3, 8, 7] //凸包頂點(逆時針)之指標: (21,325),(174,3),(953,28),(1151,371),(537,368)

let xy = (p) => ({ x: p.x, y: p.y })
let nul = (p) => ({ x: p.x, y: p.y, z: null })

//near, 點物件陣列之z以相對tol比對(座標逐字相同, null須相同)
let near = (r, rr, tol = 1e-12) => {
    assert.strict.equal(r.length, rr.length)
    for (let i = 0; i < rr.length; i++) {
        assert.strict.deepStrictEqual(Object.keys(r[i]), Object.keys(rr[i]))
        assert.strict.equal(r[i].x, rr[i].x)
        assert.strict.equal(r[i].y, rr[i].y)
        if (rr[i].z === null) {
            assert.strict.equal(r[i].z, null, `i=${i}`)
        }
        else {
            assert.strict.equal(typeof r[i].z, 'number', `i=${i}`)
            assert.ok(Math.abs(r[i].z - rr[i].z) <= tol * Math.max(1, Math.abs(rr[i].z)), `i=${i}: ${r[i].z} vs ${rr[i].z}`)
        }
    }
}

//projZ, 投影至最近凸包邊(線段)之兩端點線性之期望值(獨立計算)
let projZ = (src, hull, q) => {
    let best = null
    for (let i = 0; i < hull.length; i++) {
        let a = src[hull[i]]
        let b = src[hull[(i + 1) % hull.length]]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let t = ((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy)
        t = Math.min(1, Math.max(0, t))
        let d = Math.hypot(a.x + t * dx - q.x, a.y + t * dy - q.y)
        if (best === null || d < best.d) {
            best = { d, z: (1 - t) * a.z + t * b.z }
        }
    }
    return best.z
}

//簡易偽隨機, 固定種子
let mkRnd = (seed) => {
    let s = seed
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296
        return s / 4294967296
    }
}


describe(`interp2NaturalNeighbor opt.limitInsideHull(R-NN1)`, function() {

    describe(`R-NN1-a 凸包內之值不受選項影響且為Sibson精確值`, function() {
        //spec: JSDoc 可內插範圍(1): 凸包內為未裁切之Sibson權重; 選項只影響凸包外
        it(`預設、limitInsideHull為true、false三者, 凸包內各點之結果逐字相同, 且等於精確值(相對1e-12)`, function() {
            let pts = goldInHull.map(xy)
            let r0 = interp2NaturalNeighbor(ps, pts)
            near(r0, goldInHull)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts, { limitInsideHull: true }), r0)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts, { limitInsideHull: false }), r0)
        })
        it(`單一點物件輸入之結果同陣列輸入`, function() {
            let r0 = interp2NaturalNeighbor(ps, [{ x: 243, y: 207 }])[0]
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, { x: 243, y: 207 }), r0)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, { x: 243, y: 207 }, { limitInsideHull: false }), r0)
        })
    })

    describe(`R-NN1-b 凸包外而在正方形內之點`, function() {
        //spec: JSDoc 可內插範圍(3)
        it(`預設與limitInsideHull為true: z為null`, function() {
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, ptsOutHull), ptsOutHull.map(nul))
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, ptsOutHull, { limitInsideHull: true }), ptsOutHull.map(nul))
        })
        it(`limitInsideHull為false: 投影至最近凸包邊, 值為該邊兩端點之線性(1.1.27為裁切於正方形之外推值)`, function() {
            near(interp2NaturalNeighbor(ps, ptsOutHull, { limitInsideHull: false }), ptsOutHull.map((q) => ({ ...q, z: projZ(ps, hullIdx, q) })), 1e-9)
        })
        it(`limitInsideHull為false時外推值不受正方形大小影響: 於下方遠處加1點(正方形放大, 上緣凸包邊不變), (600,500)之值不變`, function() {
            let psFar = [...ps, { x: 600, y: -20000, z: 100 }]
            let r0 = interp2NaturalNeighbor(ps, { x: 600, y: 500 }, { limitInsideHull: false })
            let r1 = interp2NaturalNeighbor(psFar, { x: 600, y: 500 }, { limitInsideHull: false })
            assert.strict.equal(typeof r0.z, 'number')
            assert.ok(Math.abs(r0.z - r1.z) <= 1e-9, `${r0.z} vs ${r1.z}`)
        })
    })

    describe(`R-NN1-c 正方形外之點`, function() {
        //spec: JSDoc 可內插範圍(3): false時不受正規化正方形之限制
        it(`預設、true為null; false時投影至最近凸包邊而有值(1.1.27為null)`, function() {
            let pts = pOutSquare
            let rr = pts.map(nul)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts), rr)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts, { limitInsideHull: true }), rr)
            near(interp2NaturalNeighbor(ps, pts, { limitInsideHull: false }), pts.map((q) => ({ ...q, z: projZ(ps, hullIdx, q) })), 1e-9)
        })
    })

    describe(`R-NN1-d 凸包邊界(含邊界視為在內)與原始點`, function() {
        //spec: JSDoc 可內插範圍(2)凸包邊上取兩端點線性; 可內插範圍(4)與原始點座標相同者回傳該原始點之z
        it(`凸包邊(21,325)-(537,368)上之點(279,346.5)為兩端點平均135.5, 內側(279,346.4)為Sibson精確值, 外側(279,346.6)為null`, function() {
            let r = interp2NaturalNeighbor(ps, [{ x: 279, y: 346.5 }, { x: 279, y: 346.4 }, { x: 279, y: 346.6 }])
            near(r, [
                { x: 279, y: 346.5, z: 135.5 }, //1.1.27為143.5609466673654(裁切之區塊面積比)
                { x: 279, y: 346.4, z: 135.52284617326166 }, //有理數精確解; 1.1.27為143.56458297183678
                { x: 279, y: 346.6, z: null },
            ])
        })
        it(`凸包外側(279,346.6), limitInsideHull為false時為投影至該邊之線性`, function() {
            let r = interp2NaturalNeighbor(ps, { x: 279, y: 346.6 }, { limitInsideHull: false })
            near([r], [{ x: 279, y: 346.6, z: projZ(ps, hullIdx, { x: 279, y: 346.6 }) }], 1e-9)
        })
        it(`凸包各邊上之點(十進位小數, 正規化之浮點誤差會使其略偏外側)仍視為在內, 值為該邊兩端點之線性`, function() {
            //4點分別位於凸包四條邊(皆與兩端點共線), 容許距離內者取兩端點線性(1.1.27為裁切之Voronoi面積比: 73.02、206.50、178.34、98.53)
            let pts = [{ x: 330.579, y: 8.025 }, { x: 433.8, y: 359.4 }, { x: 992.798, y: 96.943 }, { x: 1026.358, y: 370.391 }]
            near(interp2NaturalNeighbor(ps, pts), pts.map((q) => ({ ...q, z: projZ(ps, hullIdx, q) })), 1e-9)
        })
        it(`凸包頂點(即原始點)回傳該原始點之z`, function() {
            let r = interp2NaturalNeighbor(ps, [{ x: 537, y: 368 }, { x: 21, y: 325 }, { x: 1151, y: 371 }, { x: 174, y: 3 }, { x: 953, y: 28 }])
            assert.strict.deepStrictEqual(r.map(v => v.z), [249, 22, 86, 22, 223])
        })
        it(`非凸包頂點之原始點(1092,290)位於凸包內, 回傳其z`, function() {
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, { x: 1092, y: 290 }), { x: 1092, y: 290, z: 39 })
        })
    })

    describe(`R-NN1-e 回呼函數(凸包外之點於預設時不呼叫funInterpFragment與funInterpFragments)`, function() {
        //spec: JSDoc 可內插範圍(1)(3): 無法內插者不呼叫funInterpFragment與funInterpFragments; false時凸包外之點(含正方形外)皆計算
        let pts = [{ x: 243, y: 207 }, { x: 600, y: 500 }, { x: 1243, y: 1207 }, { x: 283, y: 207 }]
        let run = (opt) => {
            let indFrag = new Set()
            let indFrags = []
            let o = {
                ...opt,
                funInterpFragment: (msg) => {
                    indFrag.add(msg.indTar)
                    return msg.v
                },
                funInterpFragments: (msg) => {
                    indFrags.push(msg.indTar)
                    return msg.v
                },
            }
            let r = interp2NaturalNeighbor(ps, pts, o)
            return { r, indFrag: [...indFrag].sort(), indFrags }
        }
        it(`預設與true: 兩個回呼皆只對凸包內之點(indTar 0與3)被呼叫`, function() {
            for (let opt of [{}, { limitInsideHull: true }]) {
                let o = run(opt)
                assert.strict.deepStrictEqual(o.indFrag, [0, 3])
                assert.strict.deepStrictEqual(o.indFrags, [0, 3])
                assert.strict.deepStrictEqual(o.r.map(v => v.z === null), [false, true, true, false])
            }
        })
        it(`false: 凸包外之點(indTar 1)與正方形外之點(indTar 2)皆被呼叫(1.1.27不呼叫indTar 2)`, function() {
            let o = run({ limitInsideHull: false })
            assert.strict.deepStrictEqual(o.indFrag, [0, 1, 2, 3])
            assert.strict.deepStrictEqual(o.indFrags, [0, 1, 2, 3])
            assert.strict.deepStrictEqual(o.r.map(v => v.z === null), [false, false, false, false])
        })
        it(`凸包內之點加回傳msg.v之回呼, 結果與未傳回呼者相同`, function() {
            let o = run({})
            assert.strict.deepStrictEqual(o.r[0], interp2NaturalNeighbor(ps, pts[0]))
            assert.strict.deepStrictEqual(o.r[3], interp2NaturalNeighbor(ps, pts[3]))
        })
    })

    describe(`R-NN1-f 非布林值視為未給(採預設true)`, function() {
        //spec: 輸入參數之檢測機制 K3(非預期之輸入視為未給)與 B1(只收true與false, 'true'、1、包裝物件皆無效)
        it(`'true'、'false'、1、0、null、undefined、''、NaN、[]、{}、new Boolean(false)、new Boolean(true)、函數: 凸包外之點皆為null(同預設)`, function() {
            // eslint-disable-next-line no-new-wrappers
            let vs = ['true', 'false', 1, 0, null, undefined, '', NaN, [], {}, new Boolean(false), new Boolean(true), () => false] //包裝物件為刻意測試之輸入
            let r0 = interp2NaturalNeighbor(ps, { x: 243, y: 207 })
            for (let v of vs) {
                let r = interp2NaturalNeighbor(ps, [{ x: 600, y: 500 }, { x: 243, y: 207 }], { limitInsideHull: v })
                assert.strict.deepStrictEqual(r, [{ x: 600, y: 500, z: null }, r0], `limitInsideHull=${String(typeof v === 'function' ? 'fn' : (v && typeof v === 'object' ? JSON.stringify(v) + '(obj)' : v))}`)
            }
        })
        it(`opt本身為null、undefined、非物件時用預設(凸包外為null)`, function() {
            for (let opt of [null, undefined, 'x', 1, []]) {
                let r = interp2NaturalNeighbor(ps, { x: 600, y: 500 }, opt)
                assert.strict.deepStrictEqual(r, { x: 600, y: 500, z: null })
            }
        })
        it(`不改寫呼叫端之opt`, function() {
            let opt = { limitInsideHull: false, scale: 1 }
            let snap = JSON.stringify(opt)
            interp2NaturalNeighbor(ps, { x: 600, y: 500 }, opt)
            assert.strict.equal(JSON.stringify(opt), snap)
        })
    })

    describe(`R-NN1-g 原始點不足3個相異點或全部共線(無凸包面積)`, function() {
        //spec: JSDoc 可內插範圍(6): true時除與原始點座標相同者外皆null; false時沿原始點所在直線線性內插(1.1.27為退化輸入之副產物數字)
        let cases = [
            {
                tag: '3點水平共線',
                src: [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 2 }, { x: 2, y: 0, z: 3 }],
                pts: [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.0000001 }],
                same: [{ x: 1, y: 0, z: 2 }, { x: 0, y: 0, z: 1 }],
                line: [1.5, 1.5], //1.1.27: 1.4962207522327484, 1.5714285577316676
            },
            {
                tag: '4點垂直共線',
                src: [{ x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 2 }, { x: 0, y: 3, z: 4 }, { x: 0, y: 4, z: 9 }],
                pts: [{ x: 0, y: 0.5 }, { x: 0.2, y: 0.5 }],
                same: [{ x: 0, y: 3, z: 4 }],
                line: [1.5, 1.5], //1.1.27: 1.5, 1.5730576582503741
            },
            {
                tag: '5點斜線共線',
                src: [{ x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 2 }, { x: 2, y: 2, z: 3 }, { x: 3, y: 3, z: 7 }, { x: 4, y: 4, z: 8 }],
                pts: [{ x: 1.5, y: 1.5 }, { x: 1.5, y: 1.6 }],
                same: [{ x: 2, y: 2, z: 3 }],
                line: [2.5, 2.55], //(1.5,1.6)投影至直線為(1.55,1.55); 1.1.27: 2.541666704191204, 2.605879347920783
            },
            {
                tag: '2點',
                src: [{ x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 2 }],
                pts: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.4 }],
                same: [{ x: 1, y: 1, z: 2 }],
                line: [1.5, 1.45], //1.1.27: 1.5000000167638068, 1.4662255385048575
            },
            {
                tag: '1點',
                src: [{ x: 5, y: 5, z: 7 }],
                pts: [{ x: 5.1, y: 5 }],
                same: [{ x: 5, y: 5, z: 7 }],
                line: [7], //1.1.27: null
            },
            {
                tag: '3個重複點(1個相異點)',
                src: [{ x: 5, y: 5, z: 7 }, { x: 5, y: 5, z: 7 }, { x: 5, y: 5, z: 7 }],
                pts: [{ x: 5.1, y: 5 }],
                same: [{ x: 5, y: 5, z: 7 }],
                line: [7], //1.1.27: null
            },
        ]
        for (let c of cases) {
            it(`${c.tag}: 預設與true時非原始點座標之內插點皆為null, 原始點座標回傳其z`, function() {
                for (let opt of [{}, { limitInsideHull: true }]) {
                    assert.strict.deepStrictEqual(interp2NaturalNeighbor(c.src, c.pts, opt), c.pts.map(nul))
                    assert.strict.deepStrictEqual(interp2NaturalNeighbor(c.src, c.same.map(xy), opt), c.same)
                }
            })
            it(`${c.tag}: false時沿直線線性內插`, function() {
                let pts = c.pts.slice(0, c.line.length)
                near(interp2NaturalNeighbor(c.src, pts, { limitInsideHull: false }), pts.map((q, i) => ({ ...q, z: c.line[i] })))
            })
        }
        it(`近似共線(各點距直線之寬度遠大於容許距離): 有凸包面積, 線上與凸包內之點有值`, function() {
            //寬度約0.01, 為x範圍2之0.5%, 遠大於容許距離(正規化範圍之1e-9倍)
            let src = [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0.01, z: 2 }, { x: 2, y: 0, z: 3 }]
            let r = interp2NaturalNeighbor(src, [{ x: 1, y: 0.005 }, { x: 1, y: -0.5 }])
            assert.strict.equal(typeof r[0].z, 'number')
            assert.strict.equal(r[1].z, null)
        })
        it(`近似共線(凸包寬度約為正方形邊長之5e-11倍, 不大於1e-9倍): 視為共線, 內插點皆為null; 約1e-7倍者有凸包面積`, function() {
            //x範圍2(正方形邊長2), 中間點偏離0.0000000001(約5e-11倍邊長之寬度)
            let srcNarrow = [{ x: 0, y: 0, z: 1 }, { x: 1, y: 1e-10, z: 2 }, { x: 2, y: 0, z: 3 }]
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(srcNarrow, { x: 1, y: 5e-11 }), { x: 1, y: 5e-11, z: null })
            //中間點偏離0.0000004(寬度約1e-7倍邊長), 大於容許距離而有凸包面積
            let srcWide = [{ x: 0, y: 0, z: 1 }, { x: 1, y: 4e-7, z: 2 }, { x: 2, y: 0, z: 3 }]
            assert.strict.equal(typeof interp2NaturalNeighbor(srcWide, { x: 1, y: 2e-7 }).z, 'number')
        })
        it(`共線之原始點仍有一個以上無效點時, 以有效點判斷(無效點略過)`, function() {
            let src = [{ x: 0, y: 0, z: 1 }, { x: null, y: 5, z: 2 }, { x: 1, y: 0, z: 2 }, { x: 2, y: 0, z: 3 }]
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(src, { x: 0.5, y: 0 }), { x: 0.5, y: 0, z: null })
        })
    })

    describe(`R-NN1-h 三角形(最小凸包)`, function() {
        //spec: JSDoc 可內插範圍(1)(2): 凸包內為Sibson(z為一次函數1+0.1x+0.2y時即為該函數之值), 凸包邊上為兩端點線性
        let tri = [{ x: 0, y: 0, z: 1 }, { x: 10, y: 0, z: 2 }, { x: 0, y: 10, z: 3 }]
        it(`內部與三邊上之點有值(為一次函數之值), 斜邊外側(6,6)與正方形外(-1,5)為null`, function() {
            let r = interp2NaturalNeighbor(tri, [{ x: 2, y: 2 }, { x: 5, y: 5 }, { x: 5, y: 0 }, { x: 0, y: 5 }, { x: 6, y: 6 }, { x: -1, y: 5 }])
            near(r, [
                { x: 2, y: 2, z: 1.6 }, //1.1.27為1.6801980198019804(裁切)
                { x: 5, y: 5, z: 2.5 }, //1.1.27為2.2
                { x: 5, y: 0, z: 1.5 }, //1.1.27為1.7
                { x: 0, y: 5, z: 2 }, //1.1.27為2.1
                { x: 6, y: 6, z: null },
                { x: -1, y: 5, z: null },
            ])
        })
        it(`斜邊外側(6,6): false時投影至(5,5)而為2.5(1.1.27為2.28698224852071)`, function() {
            near([interp2NaturalNeighbor(tri, { x: 6, y: 6 }, { limitInsideHull: false })], [{ x: 6, y: 6, z: 2.5 }])
        })
    })

    describe(`R-NN1-i 正規化範圍scale、座標尺度、點順序與無效點`, function() {
        //spec: 凸包判定與權重於內部座標進行, 結果不隨scale、座標平移縮放、輸入順序而變(只差z正規化往返之捨入)
        it(`scale為1000: 凸包內之值同scale為1(相對1e-12), 凸包外為null, false時同scale為1之投影值`, function() {
            let r = interp2NaturalNeighbor(ps, [{ x: 243, y: 207 }, { x: 600, y: 500 }], { scale: 1000 })
            near(r, [goldInHull[0], { x: 600, y: 500, z: null }])
            let rf = interp2NaturalNeighbor(ps, { x: 600, y: 500 }, { scale: 1000, limitInsideHull: false })
            near([rf], [{ x: 600, y: 500, z: projZ(ps, hullIdx, { x: 600, y: 500 }) }], 1e-9)
        })
        it(`經緯度尺度之座標(約1e-6)與TWD97尺度之座標(約1e6)有相同之凸包內外判定`, function() {
            let geo = ps.map(v => ({ x: v.x / 1e6 + 120, y: v.y / 1e6 + 23, z: v.z }))
            let rg = interp2NaturalNeighbor(geo, [{ x: 243 / 1e6 + 120, y: 207 / 1e6 + 23 }, { x: 600 / 1e6 + 120, y: 500 / 1e6 + 23 }])
            assert.strict.equal(typeof rg[0].z, 'number')
            assert.strict.deepStrictEqual(rg[1].z, null)
            let big = ps.map(v => ({ x: v.x * 1000 + 250000, y: v.y * 1000 + 2700000, z: v.z }))
            let rb = interp2NaturalNeighbor(big, [{ x: 243 * 1000 + 250000, y: 207 * 1000 + 2700000 }, { x: 600 * 1000 + 250000, y: 500 * 1000 + 2700000 }])
            assert.ok(Math.abs(rb[0].z - goldInHull[0].z) <= 1e-9)
            assert.strict.equal(rb[1].z, null)
        })
        it(`原始點反序輸入與含無效點之輸入: 凸包內外判定不變, 值同(相對1e-12)`, function() {
            let rev = [...ps].reverse()
            near(interp2NaturalNeighbor(rev, [{ x: 243, y: 207 }, { x: 600, y: 500 }]), [goldInHull[0], { x: 600, y: 500, z: null }])
            let withNull = [...ps, { x: null, y: 201, z: 122 }, { x: 5, y: 'abc', z: 1 }]
            near(interp2NaturalNeighbor(withNull, [{ x: 243, y: 207 }, { x: 600, y: 500 }]), [goldInHull[0], { x: 600, y: 500, z: null }])
        })
        it(`自訂keyX、keyY、keyZ時同樣有效`, function() {
            let src = ps.map(v => ({ a: v.x, b: v.y, c: v.z }))
            let r = interp2NaturalNeighbor(src, [{ a: 243, b: 207 }, { a: 600, b: 500 }], { keyX: 'a', keyY: 'b', keyZ: 'c' })
            assert.strict.deepStrictEqual(Object.keys(r[0]), ['a', 'b', 'c'])
            assert.ok(Math.abs(r[0].c - goldInHull[0].z) <= 1e-12 * 100)
            assert.strict.deepStrictEqual(r[1], { a: 600, b: 500, c: null })
        })
    })

    describe(`R-NN1-j 陣列內插點逐點判定且順序保留`, function() {
        it(`[凸包內, 凸包外, 正方形外, 凸包內]得[有值, null, null, 有值]`, function() {
            let r = interp2NaturalNeighbor(ps, [{ x: 243, y: 207 }, { x: 600, y: 500 }, { x: 1243, y: 1207 }, { x: 283, y: 207 }])
            near(r, [goldInHull[0], { x: 600, y: 500, z: null }, { x: 1243, y: 1207, z: null }, goldInHull[1]])
        })
    })

    describe(`R-NN1-k 以獨立判準(turf凸包)交叉核對`, function() {
        //spec: JSDoc 可內插範圍(1)(2)(3): 凸包外為null; 凸包內之值等於false時之值(選項不改變凸包內之值)
        it(`隨機點: 預設為null之充要條件為「在凸包外」; 凸包內之點預設與false之值逐字相同`, function() {
            let rnd = mkRnd(20261113)
            let hull = convex(featureCollection(ps.map(v => point([v.x, v.y]))))
            let pts = []
            for (let i = 0; i < 300; i++) {
                pts.push({ x: 21 + rnd() * 1130, y: -378 + rnd() * 1130 })
            }
            let r1 = interp2NaturalNeighbor(ps, pts)
            let r0 = interp2NaturalNeighbor(ps, pts, { limitInsideHull: false })
            let nIn = 0
            let nOut = 0
            for (let i = 0; i < pts.length; i++) {
                let ins = booleanPointInPolygon(point([pts[i].x, pts[i].y]), hull)
                assert.strict.equal(typeof r0[i].z, 'number', `false時皆有值 pts[${i}]`)
                if (ins) {
                    nIn++
                    assert.strict.equal(typeof r1[i].z, 'number', `凸包內之點須有值 pts[${i}]`)
                    assert.strict.deepStrictEqual(r1[i], r0[i])
                }
                else {
                    nOut++
                    assert.strict.equal(r1[i].z, null)
                }
            }
            assert.ok(nIn > 30 && nOut > 30, `nIn=${nIn} nOut=${nOut}`) //兩類皆有足夠樣本
        })
        it(`貼近凸包邊之內外兩側(距邊0.5)判定與turf一致`, function() {
            let hull = convex(featureCollection(ps.map(v => point([v.x, v.y]))))
            let ring = hull.geometry.coordinates[0]
            let pts = []
            for (let i = 0; i < ring.length - 1; i++) {
                let [ax, ay] = ring[i]
                let [bx, by] = ring[i + 1]
                let dx = bx - ax
                let dy = by - ay
                let len = Math.hypot(dx, dy)
                for (let t of [0.2, 0.5, 0.8]) {
                    for (let d of [-0.5, 0.5]) { //左右兩側
                        pts.push({ x: ax + dx * t - dy / len * d, y: ay + dy * t + dx / len * d })
                    }
                }
            }
            let r1 = interp2NaturalNeighbor(ps, pts)
            for (let i = 0; i < pts.length; i++) {
                let ins = booleanPointInPolygon(point([pts[i].x, pts[i].y]), hull)
                assert.strict.equal(r1[i].z !== null, ins, `pts[${i}]=${JSON.stringify(pts[i])} turf判定在凸包內=${ins}`)
            }
        })
    })

    describe(`R-NN1-n 極端scale與座標(面積下溢、外積溢位、平移造成之數值抵銷)`, function() {
        //spec: 幾何運算於內部座標進行, 不因scale或座標之量級而失效; 凸包外為null且不呼叫回呼
        let tri = [{ x: 0, y: 0, z: 1 }, { x: 10, y: 0, z: 2 }, { x: 0, y: 10, z: 3 }]
        let run = (src, pts, opt) => {
            let indFrag = new Set()
            let indFrags = new Set()
            let r = interp2NaturalNeighbor(src, pts, {
                ...opt,
                funInterpFragment: (msg) => {
                    indFrag.add(msg.indTar)
                    return msg.v
                },
                funInterpFragments: (msg) => {
                    indFrags.add(msg.indTar)
                    return msg.v
                },
            })
            return { r, indFrag: [...indFrag], indFrags: [...indFrags] }
        }
        for (let scale of [1e-165, 1e155]) {
            it(`scale為${scale}: 凸包內之點為1.6(一次函數之值)且等於false時之值, 凸包外之點為null且不呼叫回呼, false時投影為2.5`, function() {
                let o = run(tri, [{ x: 2, y: 2 }, { x: 6, y: 6 }], { scale })
                near([o.r[0]], [{ x: 2, y: 2, z: 1.6 }])
                assert.strict.equal(o.r[1].z, null)
                assert.strict.deepStrictEqual(o.indFrag, [0])
                assert.strict.deepStrictEqual(o.indFrags, [0])
                let o0 = run(tri, [{ x: 2, y: 2 }, { x: 6, y: 6 }], { scale, limitInsideHull: false })
                assert.strict.deepStrictEqual(o.r[0], o0.r[0])
                near([o0.r[1]], [{ x: 6, y: 6, z: 2.5 }])
            })
        }
        it(`原始座標平移1e9與-1e9: 凸包內有值(為1.6), 斜邊上有值, 斜邊外側為null`, function() {
            for (let d of [1e9, -1e9]) {
                let src = tri.map(v => ({ x: v.x + d, y: v.y + d, z: v.z }))
                let r = interp2NaturalNeighbor(src, [{ x: 2 + d, y: 2 + d }, { x: 5 + d, y: 5 + d }, { x: 6 + d, y: 6 + d }])
                assert.ok(Math.abs(r[0].z - 1.6) < 1e-6, `d=${d} z=${r[0].z}`)
                assert.strict.equal(typeof r[1].z, 'number') //斜邊上
                assert.strict.equal(r[2].z, null)
            }
        })
        it(`座標範圍溢位(±1e308, 正規化後為NaN): 預設與false皆為null(不誤中NaN-NaN之快取; 1.1.27之false為無意義之3), 並呼叫funInterpError`, function() {
            let huge = [{ x: -1e308, y: 0, z: 1 }, { x: 1e308, y: 0, z: 2 }, { x: 0, y: 1e308, z: 3 }]
            for (let opt of [{}, { limitInsideHull: false }]) {
                let errs = []
                let r = interp2NaturalNeighbor(huge, { x: 0, y: -1e307 }, { ...opt, funInterpError: (e) => errs.push(e.reason) })
                assert.strict.deepStrictEqual(r, { x: 0, y: -1e307, z: null })
                assert.strict.deepStrictEqual(errs, ['nonFiniteSourceCoordinate'])
            }
        })
        it(`原始點含Infinity(正規化範圍為無限, 無法判斷凸包): 預設與false時內插點皆為null(1.1.27之false為無意義之2.5)`, function() {
            let bad = [...tri, { x: Infinity, y: 5, z: 4 }]
            let errs = []
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(bad, [{ x: 2, y: 2 }, { x: 6, y: 6 }], { funInterpError: (e) => errs.push(e.reason) }).map(v => v.z), [null, null])
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(bad, [{ x: 2, y: 2 }, { x: 6, y: 6 }], { limitInsideHull: false, funInterpError: (e) => errs.push(e.reason) }).map(v => v.z), [null, null])
            assert.strict.equal(errs.length, 4)
        })
    })

    describe(`R-NN1-o 容許距離與極窄凸包之公開行為`, function() {
        //spec: JSDoc 可內插範圍(2)(6): 邊界容許距離為正方形邊長之1e-9倍; 凸包寬度不大於該值視為共線
        let tri = [{ x: 0, y: 0, z: 1 }, { x: 10, y: 0, z: 2 }, { x: 0, y: 10, z: 3 }] //正方形邊長10, 容許距離1e-8
        it(`斜邊外側距離約3.5e-9(小於容許距離)視為在凸包邊上(兩端點線性)且呼叫回呼, 約3.5e-8(大於)為null且不呼叫回呼, 內側約3.5e-8有值`, function() {
            let calls = []
            let opt = {
                funInterpFragment: (msg) => {
                    calls.push(msg.indTar)
                    return msg.v
                },
            }
            let r = interp2NaturalNeighbor(tri, [{ x: 5, y: 5 + 5e-9 }, { x: 5, y: 5 + 5e-8 }, { x: 5, y: 5 - 5e-8 }], opt)
            assert.strict.deepStrictEqual(r.map(v => v.z === null), [false, true, false])
            near([r[0]], [{ x: 5, y: 5 + 5e-9, z: 2.50000000025 }]) //投影至斜邊(5-2.5e-9,5+2.5e-9)之線性; 1.1.27為2.20000000044
            assert.strict.equal(calls.includes(0), true)
            assert.strict.equal(calls.includes(1), false)
            assert.strict.equal(calls.includes(2), true)
        })
        it(`極窄凸包(寬度約為正方形邊長之1e-10倍, 小於1e-9倍): 視為共線, 預設時為null, false時沿直線線性內插(投影位置相同之(0,0)與(0,1e-10)均分)`, function() {
            let narrow = [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 2 }, { x: 0, y: 1e-10, z: 3 }]
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(narrow, { x: 0.25, y: 2.5e-11 }), { x: 0.25, y: 2.5e-11, z: null })
            near([interp2NaturalNeighbor(narrow, { x: 0.25, y: 2.5e-11 }, { limitInsideHull: false })], [{ x: 0.25, y: 2.5e-11, z: 2 }]) //0.375*1+0.375*3+0.25*2; 1.1.27為2.918126997609568
        })
    })

    describe(`R-NN1-p 有狀態之回呼`, function() {
        //spec: JSDoc 可內插範圍(8): 凸包外之點(預設)不呼叫回呼, 故有狀態回呼之呼叫次數與順序隨之改變
        let tri = [{ x: 0, y: 0, z: 1 }, { x: 10, y: 0, z: 2 }, { x: 0, y: 10, z: 3 }]
        let run = (opt) => {
            let n = 0
            let order = []
            let r = interp2NaturalNeighbor(tri, [{ x: 6, y: 6 }, { x: 2, y: 2 }], {
                ...opt,
                funInterpFragments: (msg) => {
                    order.push(msg.indTar)
                    return ++n
                },
            })
            return { n, order, z: r.map(v => v.z) }
        }
        it(`預設: 回呼只對凸包內之點呼叫1次; false: 對兩點各呼叫`, function() {
            assert.strict.deepStrictEqual(run({}), { n: 1, order: [1], z: [null, 3] })
            assert.strict.deepStrictEqual(run({ limitInsideHull: false }), { n: 2, order: [0, 1], z: [3, 5] })
        })
    })

    describe(`R-NN1-l 經interp2與其他方法`, function() {
        //spec: interp2 JSDoc: opt.limitInsideHull僅method='naturalNeighbor'有效, method='kriging'不受凸包與正方形限制
        let zOut = projZ(ps, hullIdx, { x: 600, y: 500 })
        it(`interp2(useSync): 預設與true時凸包外為null, false時為投影值, 凸包內同interp2NaturalNeighbor`, function() {
            assert.strict.deepStrictEqual(interp2(ps, { x: 600, y: 500 }, { useSync: true }), { x: 600, y: 500, z: null })
            assert.strict.deepStrictEqual(interp2(ps, { x: 600, y: 500 }, { useSync: true, limitInsideHull: true }), { x: 600, y: 500, z: null })
            near([interp2(ps, { x: 600, y: 500 }, { useSync: true, limitInsideHull: false })], [{ x: 600, y: 500, z: zOut }], 1e-9)
            assert.strict.deepStrictEqual(interp2(ps, { x: 243, y: 207 }, { useSync: true }), interp2NaturalNeighbor(ps, { x: 243, y: 207 }))
        })
        it(`interp2(非同步)亦傳遞limitInsideHull`, async function() {
            assert.strict.deepStrictEqual(await interp2(ps, { x: 600, y: 500 }), { x: 600, y: 500, z: null })
            near([await interp2(ps, { x: 600, y: 500 }, { limitInsideHull: false })], [{ x: 600, y: 500, z: zOut }], 1e-9)
        })
        it(`method為kriging: limitInsideHull無效, 凸包外與正方形外皆有值且不隨選項改變`, function() {
            let p = [{ x: 600, y: 500 }, { x: 1243, y: 1207 }]
            let rk = interp2Kriging(ps, p)
            assert.strict.equal(typeof rk[0].z, 'number')
            assert.strict.equal(typeof rk[1].z, 'number')
            assert.strict.deepStrictEqual(interp2Kriging(ps, p, { limitInsideHull: true }), rk)
            assert.strict.deepStrictEqual(interp2Kriging(ps, p, { limitInsideHull: false }), rk)
            assert.strict.deepStrictEqual(interp2(ps, p, { useSync: true, method: 'kriging', limitInsideHull: true }), rk)
        })
    })

})
