import assert from 'assert'
import path from 'path'
import { pathToFileURL } from 'url'
import { convex, featureCollection, point, booleanPointInPolygon } from '@turf/turf'


//規則帳本: sgud/rule/rulebook.md R-NN1(interp2NaturalNeighbor 之可內插範圍與 opt.limitInsideHull)
//環境變數 W_GIS_SRC_DIR 可指定含 interp2NaturalNeighbor.mjs 等檔之資料夾(對照修前碼或變異碼), 預設為本套件 src
let dirSrc = process.env.W_GIS_SRC_DIR ? path.resolve(process.env.W_GIS_SRC_DIR) : path.resolve('src')
let load = async(name) => {
    return (await import(pathToFileURL(path.join(dirSrc, name)).href)).default
}
let interp2NaturalNeighbor = await load('interp2NaturalNeighbor.mjs')
let interp2 = await load('interp2.mjs')
let interp2Kriging = await load('interp2Kriging.mjs')


//原始點: x範圍21~1151(1130), y範圍3~371(368); 可內插之正方形為x:[21,1151], y:[187-565,187+565]=[-378,752]; 凸包頂點為(21,325),(174,3),(953,28),(1151,371),(537,368)
let ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]

//以下期望值取自修前碼(提交前之 src/interp2NaturalNeighbor.mjs, 無凸包限制)之實測輸出, 供「凸包內之值不變」與「limitInsideHull為false時外推值不變」之對照
let goldInHull = [
    { x: 243, y: 207, z: 97.29447682486813 },
    { x: 283, y: 207, z: 114.43040421951908 },
    { x: 600, y: 250, z: 193.6150805720754 },
    { x: 900, y: 200, z: 136.28667176072523 },
    { x: 1050, y: 201, z: 106.11605662429457 }, //距凸包邊約2.5, Voronoi區塊延伸超出正方形而被裁切(JSDoc可內插範圍(4))
    { x: 400, y: 300, z: 184.59544103558545 },
    { x: 700, y: 330, z: 186.0544424153907 },
    { x: 1000, y: 330, z: 96.54757672445362 },
]
let goldOutHull = [ //凸包外而在正方形內
    { x: 600, y: 500, z: 220.47540877342678 },
    { x: 600, y: 380, z: 224.6248211729819 },
    { x: 100, y: 340, z: 62.825833859427966 },
    { x: 600, y: 752, z: 211.37506813130392 }, //正方形上緣
    { x: 1100, y: -300, z: 222.41927258774598 },
    { x: 21, y: 100, z: 37.103990690822584 }, //正方形左緣
]
let pOutSquare = [{ x: 1243, y: 1207 }, { x: 1160, y: 380 }, { x: 20, y: 100 }, { x: 600, y: 752.001 }, { x: 600, y: -378.001 }, { x: 1151.001, y: 300 }]

let xy = (p) => ({ x: p.x, y: p.y })
let nul = (p) => ({ x: p.x, y: p.y, z: null })

//簡易偽隨機, 固定種子
let mkRnd = (seed) => {
    let s = seed
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296
        return s / 4294967296
    }
}


describe(`interp2NaturalNeighbor opt.limitInsideHull(R-NN1)`, function() {

    describe(`R-NN1-a 凸包內之值不受選項影響且與修前相同`, function() {
        //spec: JSDoc 可內插範圍(1)(2)(3), 以及任務不得改變之「既有凸包內之內插結果」
        it(`預設、limitInsideHull為true、false三者, 凸包內各點之結果逐字相同, 且等於修前實測值`, function() {
            let pts = goldInHull.map(xy)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts), goldInHull)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts, { limitInsideHull: true }), goldInHull)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts, { limitInsideHull: false }), goldInHull)
        })
        it(`單一點物件輸入之結果同陣列輸入`, function() {
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, { x: 243, y: 207 }), goldInHull[0])
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, { x: 243, y: 207 }, { limitInsideHull: false }), goldInHull[0])
        })
    })

    describe(`R-NN1-b 凸包外而在正方形內之點`, function() {
        //spec: JSDoc 可內插範圍(2)(3)
        it(`預設與limitInsideHull為true: z為null`, function() {
            let pts = goldOutHull.map(xy)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts), goldOutHull.map(nul))
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts, { limitInsideHull: true }), goldOutHull.map(nul))
        })
        it(`limitInsideHull為false: 仍計算(外推), 值等於修前實測值`, function() {
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, goldOutHull.map(xy), { limitInsideHull: false }), goldOutHull)
        })
        it(`limitInsideHull為false時外推值受正方形大小影響(JSDoc可內插範圍(3)): 於遠處加1點使正方形放大, 凸包外之點改變`, function() {
            let psFar = [...ps, { x: 20000, y: 187, z: 100 }]
            let r0 = interp2NaturalNeighbor(ps, { x: 600, y: 500 }, { limitInsideHull: false })
            let r1 = interp2NaturalNeighbor(psFar, { x: 600, y: 500 }, { limitInsideHull: false })
            assert.strict.equal(typeof r0.z, 'number')
            assert.strict.equal(typeof r1.z, 'number')
            assert.ok(Math.abs(r0.z - r1.z) > 1)
        })
    })

    describe(`R-NN1-c 正方形外之點`, function() {
        //spec: JSDoc 可內插範圍(1)
        it(`預設、true、false皆為null`, function() {
            let pts = pOutSquare
            let rr = pts.map(nul)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts), rr)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts, { limitInsideHull: true }), rr)
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, pts, { limitInsideHull: false }), rr)
        })
    })

    describe(`R-NN1-d 凸包邊界(含邊界視為在內)與原始點`, function() {
        //spec: JSDoc 可內插範圍(2)含邊界; 可內插範圍(5)與原始點座標相同者回傳該原始點之z
        it(`凸包邊(21,325)-(537,368)上之點(279,346.5)與內側(279,346.4)有值且等於修前實測值, 外側(279,346.6)為null`, function() {
            let r = interp2NaturalNeighbor(ps, [{ x: 279, y: 346.5 }, { x: 279, y: 346.4 }, { x: 279, y: 346.6 }])
            assert.strict.deepStrictEqual(r, [
                { x: 279, y: 346.5, z: 143.5609466673654 },
                { x: 279, y: 346.4, z: 143.56458297183678 },
                { x: 279, y: 346.6, z: null },
            ])
        })
        it(`凸包外側(279,346.6), limitInsideHull為false時等於修前實測值(外推)`, function() {
            let r = interp2NaturalNeighbor(ps, { x: 279, y: 346.6 }, { limitInsideHull: false })
            assert.strict.deepStrictEqual(r, { x: 279, y: 346.6, z: 143.55731090493532 })
        })
        it(`凸包各邊上之點(十進位小數, 正規化之浮點誤差會使其略偏外側)仍視為在內, 值等於修前實測值`, function() {
            //4點分別位於凸包四條邊(皆與兩端點共線), 若容許距離為0則正規化後之外積為負而被判為凸包外(此即容許距離存在之理由)
            let r = interp2NaturalNeighbor(ps, [{ x: 330.579, y: 8.025 }, { x: 433.8, y: 359.4 }, { x: 992.798, y: 96.943 }, { x: 1026.358, y: 370.391 }])
            assert.strict.deepStrictEqual(r, [
                { x: 330.579, y: 8.025, z: 73.02277713624122 },
                { x: 433.8, y: 359.4, z: 206.49522711512725 },
                { x: 992.798, y: 96.943, z: 178.33795896271675 },
                { x: 1026.358, y: 370.391, z: 98.5324278288246 },
            ])
        })
        it(`凸包頂點(即原始點)回傳該原始點之z`, function() {
            let r = interp2NaturalNeighbor(ps, [{ x: 537, y: 368 }, { x: 21, y: 325 }, { x: 1151, y: 371 }, { x: 174, y: 3 }, { x: 953, y: 28 }])
            assert.strict.deepStrictEqual(r.map(v => v.z), [249, 22, 86, 22, 223])
        })
        it(`非凸包頂點之原始點(1092,290)位於凸包內, 回傳其z`, function() {
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, { x: 1092, y: 290 }), { x: 1092, y: 290, z: 39 })
        })
    })

    describe(`R-NN1-e 回呼函數(凸包外之點不呼叫funInterpFragment與funInterpFragments)`, function() {
        //spec: JSDoc 可內插範圍(1)(2): 內插點無法內插者不呼叫funInterpFragment與funInterpFragments
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
        it(`false: 凸包外而在正方形內之點(indTar 1)亦被呼叫, 正方形外之點(indTar 2)不被呼叫`, function() {
            let o = run({ limitInsideHull: false })
            assert.strict.deepStrictEqual(o.indFrag, [0, 1, 3])
            assert.strict.deepStrictEqual(o.indFrags, [0, 1, 3])
            assert.strict.deepStrictEqual(o.r.map(v => v.z === null), [false, false, true, false])
        })
        it(`凸包內之點加回傳msg.v之回呼, 結果與未傳回呼者相同`, function() {
            let o = run({})
            assert.strict.deepStrictEqual(o.r[0], goldInHull[0])
            assert.strict.deepStrictEqual(o.r[3], goldInHull[1])
        })
    })

    describe(`R-NN1-f 非布林值視為未給(採預設true)`, function() {
        //spec: 輸入參數之檢測機制 K3(非預期之輸入視為未給)與 B1(只收true與false, 'true'、1、包裝物件皆無效)
        it(`'true'、'false'、1、0、null、undefined、''、NaN、[]、{}、new Boolean(false)、new Boolean(true)、函數: 凸包外之點皆為null(同預設)`, function() {
            // eslint-disable-next-line no-new-wrappers
            let vs = ['true', 'false', 1, 0, null, undefined, '', NaN, [], {}, new Boolean(false), new Boolean(true), () => false] //包裝物件為刻意測試之輸入
            for (let v of vs) {
                let r = interp2NaturalNeighbor(ps, [{ x: 600, y: 500 }, { x: 243, y: 207 }], { limitInsideHull: v })
                assert.strict.deepStrictEqual(r, [{ x: 600, y: 500, z: null }, goldInHull[0]], `limitInsideHull=${String(typeof v === 'function' ? 'fn' : (v && typeof v === 'object' ? JSON.stringify(v) + '(obj)' : v))}`)
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
        //spec: JSDoc 可內插範圍(2): 除與原始點座標相同者外, 所有內插點皆回傳z為null
        let cases = [
            {
                tag: '3點水平共線',
                src: [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 2 }, { x: 2, y: 0, z: 3 }],
                pts: [{ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.0000001 }],
                same: [{ x: 1, y: 0, z: 2 }, { x: 0, y: 0, z: 1 }],
                gold: [1.4962207522327484, 1.5714285577316676],
            },
            {
                tag: '4點垂直共線',
                src: [{ x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 2 }, { x: 0, y: 3, z: 4 }, { x: 0, y: 4, z: 9 }],
                pts: [{ x: 0, y: 0.5 }, { x: 0.2, y: 0.5 }],
                same: [{ x: 0, y: 3, z: 4 }],
                gold: [1.5, 1.5730576582503741],
            },
            {
                tag: '5點斜線共線',
                src: [{ x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 2 }, { x: 2, y: 2, z: 3 }, { x: 3, y: 3, z: 7 }, { x: 4, y: 4, z: 8 }],
                pts: [{ x: 1.5, y: 1.5 }, { x: 1.5, y: 1.6 }],
                same: [{ x: 2, y: 2, z: 3 }],
                gold: [2.541666704191204, 2.605879347920783],
            },
            {
                tag: '2點',
                src: [{ x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 2 }],
                pts: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.4 }],
                same: [{ x: 1, y: 1, z: 2 }],
                gold: [1.5000000167638068, 1.4662255385048575],
            },
            {
                tag: '1點',
                src: [{ x: 5, y: 5, z: 7 }],
                pts: [{ x: 5.1, y: 5 }],
                same: [{ x: 5, y: 5, z: 7 }],
                gold: [null],
            },
            {
                tag: '3個重複點(1個相異點)',
                src: [{ x: 5, y: 5, z: 7 }, { x: 5, y: 5, z: 7 }, { x: 5, y: 5, z: 7 }],
                pts: [{ x: 5.1, y: 5 }],
                same: [{ x: 5, y: 5, z: 7 }],
                gold: [null],
            },
        ]
        for (let c of cases) {
            it(`${c.tag}: 預設與true時非原始點座標之內插點皆為null, 原始點座標回傳其z`, function() {
                for (let opt of [{}, { limitInsideHull: true }]) {
                    assert.strict.deepStrictEqual(interp2NaturalNeighbor(c.src, c.pts, opt), c.pts.map(nul))
                    assert.strict.deepStrictEqual(interp2NaturalNeighbor(c.src, c.same.map(xy), opt), c.same)
                }
            })
            it(`${c.tag}: false時仍計算, 值等於修前實測值`, function() {
                let r = interp2NaturalNeighbor(c.src, c.pts.slice(0, c.gold.length), { limitInsideHull: false })
                assert.strict.deepStrictEqual(r.map(v => v.z), c.gold)
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
        //spec: JSDoc 可內插範圍(2): 凸包含邊界
        let tri = [{ x: 0, y: 0, z: 1 }, { x: 10, y: 0, z: 2 }, { x: 0, y: 10, z: 3 }]
        it(`內部與三邊上之點有值(等於修前實測值), 斜邊外側(6,6)與正方形外(-1,5)為null`, function() {
            let r = interp2NaturalNeighbor(tri, [{ x: 2, y: 2 }, { x: 5, y: 5 }, { x: 5, y: 0 }, { x: 0, y: 5 }, { x: 6, y: 6 }, { x: -1, y: 5 }])
            assert.strict.deepStrictEqual(r, [
                { x: 2, y: 2, z: 1.6801980198019804 },
                { x: 5, y: 5, z: 2.2 },
                { x: 5, y: 0, z: 1.7 },
                { x: 0, y: 5, z: 2.1 },
                { x: 6, y: 6, z: null },
                { x: -1, y: 5, z: null },
            ])
        })
        it(`斜邊外側(6,6): false時等於修前實測值(外推)`, function() {
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(tri, { x: 6, y: 6 }, { limitInsideHull: false }), { x: 6, y: 6, z: 2.28698224852071 })
        })
    })

    describe(`R-NN1-i 正規化範圍scale、座標尺度、點順序與無效點`, function() {
        //spec: 凸包判定於正規化座標進行, 結果不得隨scale、座標平移縮放、輸入順序而變
        it(`scale為1000: 凸包內之值等於修前實測值, 凸包外為null, false時等於修前實測值`, function() {
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, [{ x: 243, y: 207 }, { x: 600, y: 500 }], { scale: 1000 }), [
                { x: 243, y: 207, z: 97.29447682486855 },
                { x: 600, y: 500, z: null },
            ])
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(ps, { x: 600, y: 500 }, { scale: 1000, limitInsideHull: false }), { x: 600, y: 500, z: 220.4754087734266 })
        })
        it(`經緯度尺度之座標(約1e-6)與TWD97尺度之座標(約1e6)有相同之凸包內外判定`, function() {
            let geo = ps.map(v => ({ x: v.x / 1e6 + 120, y: v.y / 1e6 + 23, z: v.z }))
            let rg = interp2NaturalNeighbor(geo, [{ x: 243 / 1e6 + 120, y: 207 / 1e6 + 23 }, { x: 600 / 1e6 + 120, y: 500 / 1e6 + 23 }])
            assert.strict.equal(typeof rg[0].z, 'number')
            assert.strict.deepStrictEqual(rg[1].z, null)
            let big = ps.map(v => ({ x: v.x * 1000 + 250000, y: v.y * 1000 + 2700000, z: v.z }))
            let rb = interp2NaturalNeighbor(big, [{ x: 243 * 1000 + 250000, y: 207 * 1000 + 2700000 }, { x: 600 * 1000 + 250000, y: 500 * 1000 + 2700000 }])
            assert.strict.deepStrictEqual(rb.map(v => v.z), [97.29447682486813, null])
        })
        it(`原始點反序輸入與含無效點之輸入: 凸包內外判定不變`, function() {
            let rev = [...ps].reverse()
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(rev, [{ x: 243, y: 207 }, { x: 600, y: 500 }]), [goldInHull[0], { x: 600, y: 500, z: null }])
            let withNull = [...ps, { x: null, y: 201, z: 122 }, { x: 5, y: 'abc', z: 1 }]
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(withNull, [{ x: 243, y: 207 }, { x: 600, y: 500 }]), [goldInHull[0], { x: 600, y: 500, z: null }])
        })
        it(`自訂keyX、keyY、keyZ時同樣有效`, function() {
            let src = ps.map(v => ({ a: v.x, b: v.y, c: v.z }))
            let r = interp2NaturalNeighbor(src, [{ a: 243, b: 207 }, { a: 600, b: 500 }], { keyX: 'a', keyY: 'b', keyZ: 'c' })
            assert.strict.deepStrictEqual(r, [{ a: 243, b: 207, c: 97.29447682486813 }, { a: 600, b: 500, c: null }])
        })
    })

    describe(`R-NN1-j 陣列內插點逐點判定且順序保留`, function() {
        it(`[凸包內, 凸包外, 正方形外, 凸包內]得[有值, null, null, 有值]`, function() {
            let r = interp2NaturalNeighbor(ps, [{ x: 243, y: 207 }, { x: 600, y: 500 }, { x: 1243, y: 1207 }, { x: 283, y: 207 }])
            assert.strict.deepStrictEqual(r, [goldInHull[0], { x: 600, y: 500, z: null }, { x: 1243, y: 1207, z: null }, goldInHull[1]])
        })
    })

    describe(`R-NN1-k 以獨立判準(turf凸包)交叉核對`, function() {
        //spec: JSDoc 可內插範圍(2): 凸包外為null; 凸包內之值等於false時之值(選項不改變凸包內之值)
        it(`隨機點: 預設為null之充要條件為「在正方形外或凸包外」; 凸包內之點預設與false之值逐字相同`, function() {
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
        //spec: JSDoc 可內插範圍(2): 凸包內有值(與false時相同)、凸包外為null且不呼叫回呼, 不因scale或座標之量級而失效
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
            it(`scale為${scale}: 凸包內之點有值且等於false時之值, 凸包外之點為null且不呼叫回呼`, function() {
                let o = run(tri, [{ x: 2, y: 2 }, { x: 6, y: 6 }], { scale })
                assert.strict.equal(typeof o.r[0].z, 'number')
                assert.strict.equal(o.r[1].z, null)
                assert.strict.deepStrictEqual(o.indFrag, [0])
                assert.strict.deepStrictEqual(o.indFrags, [0])
                let o0 = run(tri, [{ x: 2, y: 2 }, { x: 6, y: 6 }], { scale, limitInsideHull: false })
                assert.strict.deepStrictEqual(o.r[0], o0.r[0])
                assert.strict.equal(o0.r[1].z, 2.5) //修前實測值(false時維持)
            })
        }
        it(`原始座標平移1e9與-1e9: 凸包內有值(與未平移者相近), 斜邊外側為null`, function() {
            for (let d of [1e9, -1e9]) {
                let src = tri.map(v => ({ x: v.x + d, y: v.y + d, z: v.z }))
                let r = interp2NaturalNeighbor(src, [{ x: 2 + d, y: 2 + d }, { x: 5 + d, y: 5 + d }, { x: 6 + d, y: 6 + d }])
                assert.strict.equal(typeof r[0].z, 'number')
                assert.ok(Math.abs(r[0].z - 1.6801980198019804) < 1e-6, `d=${d} z=${r[0].z}`)
                assert.strict.equal(typeof r[1].z, 'number') //斜邊上
                assert.strict.equal(r[2].z, null)
            }
        })
        it(`座標範圍溢位(±1e308, 正規化後為NaN): 預設時為null(不誤中NaN-NaN之快取), false時維持修前值3`, function() {
            let huge = [{ x: -1e308, y: 0, z: 1 }, { x: 1e308, y: 0, z: 2 }, { x: 0, y: 1e308, z: 3 }]
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(huge, { x: 0, y: -1e307 }), { x: 0, y: -1e307, z: null })
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(huge, { x: 0, y: -1e307 }, { limitInsideHull: false }), { x: 0, y: -1e307, z: 3 })
        })
        it(`原始點含Infinity(正規化範圍為無限, 無法判斷凸包): 預設時內插點皆為null, false時維持修前值`, function() {
            let bad = [...tri, { x: Infinity, y: 5, z: 4 }]
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(bad, [{ x: 2, y: 2 }, { x: 6, y: 6 }]).map(v => v.z), [null, null])
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(bad, [{ x: 2, y: 2 }, { x: 6, y: 6 }], { limitInsideHull: false }).map(v => v.z), [2.5, 2.5]) //修前實測值(無意義值, 僅鎖定false不變)
        })
    })

    describe(`R-NN1-o 容許距離與極窄凸包之公開行為`, function() {
        //spec: JSDoc 可內插範圍(2): 邊界容許距離為正方形邊長之1e-9倍; 凸包寬度不大於該值視為共線
        let tri = [{ x: 0, y: 0, z: 1 }, { x: 10, y: 0, z: 2 }, { x: 0, y: 10, z: 3 }] //正方形邊長10, 容許距離1e-8
        it(`斜邊外側距離約3.5e-9(小於容許距離)視為在內且呼叫回呼, 約3.5e-8(大於)為null且不呼叫回呼, 內側約3.5e-8有值`, function() {
            let calls = []
            let opt = {
                funInterpFragment: (msg) => {
                    calls.push(msg.indTar)
                    return msg.v
                },
            }
            let r = interp2NaturalNeighbor(tri, [{ x: 5, y: 5 + 5e-9 }, { x: 5, y: 5 + 5e-8 }, { x: 5, y: 5 - 5e-8 }], opt)
            assert.strict.deepStrictEqual(r.map(v => v.z === null), [false, true, false])
            assert.strict.equal(r[0].z, 2.20000000044) //修前實測值
            assert.strict.equal(calls.includes(0), true)
            assert.strict.equal(calls.includes(1), false)
            assert.strict.equal(calls.includes(2), true)
        })
        it(`極窄凸包(寬度約為正方形邊長之1e-10倍, 小於1e-9倍): 視為共線, 預設時為null, false時維持修前值`, function() {
            let narrow = [{ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 2 }, { x: 0, y: 1e-10, z: 3 }]
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(narrow, { x: 0.25, y: 2.5e-11 }), { x: 0.25, y: 2.5e-11, z: null })
            assert.strict.deepStrictEqual(interp2NaturalNeighbor(narrow, { x: 0.25, y: 2.5e-11 }, { limitInsideHull: false }), { x: 0.25, y: 2.5e-11, z: 2.918126997609568 })
        })
    })

    describe(`R-NN1-p 有狀態之回呼`, function() {
        //spec: JSDoc 可內插範圍(2): 凸包外之點不呼叫回呼, 故有狀態回呼之呼叫次數與順序隨之改變
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
        it(`預設: 回呼只對凸包內之點呼叫1次; false: 對兩點各呼叫(與修前相同)`, function() {
            assert.strict.deepStrictEqual(run({}), { n: 1, order: [1], z: [null, 3] })
            assert.strict.deepStrictEqual(run({ limitInsideHull: false }), { n: 2, order: [0, 1], z: [3, 5] })
        })
    })

    describe(`R-NN1-l 經interp2與其他方法`, function() {
        //spec: interp2 JSDoc: opt.limitInsideHull僅method='naturalNeighbor'有效, method='kriging'不受凸包與正方形限制
        it(`interp2(useSync): 預設與true時凸包外為null, false時為外推值, 凸包內不變`, function() {
            assert.strict.deepStrictEqual(interp2(ps, { x: 600, y: 500 }, { useSync: true }), { x: 600, y: 500, z: null })
            assert.strict.deepStrictEqual(interp2(ps, { x: 600, y: 500 }, { useSync: true, limitInsideHull: true }), { x: 600, y: 500, z: null })
            assert.strict.deepStrictEqual(interp2(ps, { x: 600, y: 500 }, { useSync: true, limitInsideHull: false }), goldOutHull[0])
            assert.strict.deepStrictEqual(interp2(ps, { x: 243, y: 207 }, { useSync: true }), goldInHull[0])
        })
        it(`interp2(非同步)亦傳遞limitInsideHull`, async function() {
            assert.strict.deepStrictEqual(await interp2(ps, { x: 600, y: 500 }), { x: 600, y: 500, z: null })
            assert.strict.deepStrictEqual(await interp2(ps, { x: 600, y: 500 }, { limitInsideHull: false }), goldOutHull[0])
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
