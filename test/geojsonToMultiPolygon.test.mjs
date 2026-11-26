import assert from 'assert'
import geojsonToMultiPolygon from '../src/geojsonToMultiPolygon.mjs'
import toMultiPolygon from '../src/toMultiPolygon.mjs'
import isPointInPolygons from '../src/isPointInPolygons.mjs'


//規則帳本R-GJ1: geojsonToMultiPolygon依GeoJSON之type(而非座標深度)轉換成MultiPolygon, Polygon之內環保留為洞(使用端Gitea #217)
//各案之標記R-GJ1-a~k對應規則帳本之條目; 各區塊(polygon)與各環之座標值逐一相異, 使順序、位置或環之歸屬錯誤時結果必不同
describe(`geojsonToMultiPolygon`, function() {

    let outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
    let hole = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]
    let outerB = [[20, 0], [30, 0], [30, 10], [20, 0]]
    let outerC = [[40, 1], [50, 1], [50, 11], [40, 1]]
    let holeC = [[44, 3], [47, 3], [47, 6], [44, 3]] //嚴格位於outerC內
    let outerD = [[60, 2], [70, 2], [70, 12], [60, 2]]
    let cp = (v) => JSON.parse(JSON.stringify(v))
    let gPolyHole = () => ({ type: 'Polygon', coordinates: cp([outer, hole]) })
    let feat = (geometry) => ({ type: 'Feature', properties: {}, geometry })

    //取得函數執行期間之console.warn內容
    let catchWarn = (fun) => {
        let ws = []
        let org = console.warn
        console.warn = (...args) => {
            ws.push(args.join(' '))
        }
        try {
            fun()
        }
        finally {
            console.warn = org
        }
        return ws
    }

    //取得拋出之錯誤訊息, 未拋錯回傳null
    let getErrMsg = (fun) => {
        try {
            fun()
        }
        catch (err) {
            return err.message
        }
        return null
    }

    let deepFreeze = (v) => {
        if (v !== null && typeof v === 'object') {
            Object.freeze(v)
            Object.values(v).forEach(deepFreeze)
        }
        return v
    }

    let collectArrays = (v, set) => {
        if (Array.isArray(v)) {
            set.add(v)
            v.forEach((vv) => collectArrays(vv, set))
        }
        else if (v !== null && typeof v === 'object') {
            Object.values(v).forEach((vv) => collectArrays(vv, set))
        }
        return set
    }

    it(`should keep inner ring of Polygon as hole of the same block (R-GJ1-a)`, function() {
        let r = geojsonToMultiPolygon(gPolyHole())
        assert.strict.deepStrictEqual(r, [[outer, hole]])
        assert.strict.equal(r.length, 1) //1塊
        assert.strict.equal(r[0].length, 2) //2環
    })

    it(`should make point in hole outside and point around hole inside when result is given to isPointInPolygons and toMultiPolygon (R-GJ1-a)`, function() {
        let r = geojsonToMultiPolygon(gPolyHole())
        assert.strict.equal(isPointInPolygons([5, 5], r), false) //洞內點
        assert.strict.equal(isPointInPolygons([2, 2], r), true) //洞外點(外環內)
        assert.strict.equal(isPointInPolygons([15, 5], r), false) //外環外
        let m = toMultiPolygon(cp(r))
        assert.strict.equal(m.length, 1) //1塊
        assert.strict.equal(m[0].length, 2) //2環

        //多塊: 洞只剔除所屬之塊
        let r2 = geojsonToMultiPolygon({ type: 'MultiPolygon', coordinates: [[outer, hole], [outerC, holeC]] })
        assert.strict.equal(isPointInPolygons([5, 5], r2), false)
        assert.strict.equal(isPointInPolygons([46.5, 4], r2), false) //第2塊之洞內點
        assert.strict.equal(isPointInPolygons([2, 2], r2), true)
        assert.strict.equal(isPointInPolygons([48, 5], r2), true)
    })

    it(`should keep depth-based behavior of toMultiPolygon and isPointInPolygons unchanged (R-GJ1-j)`, function() {
        let coords = gPolyHole().coordinates

        //預設supposeType='polygons': 各環成為獨立polygon, 內環成為實心(本函數存在之原因, 行為不變只補JSDoc)
        let m = toMultiPolygon(cp(coords))
        assert.strict.equal(m.length, 2)
        assert.strict.equal(isPointInPolygons([5, 5], cp(coords)), true)

        //ringStrings: 內環為洞
        assert.strict.equal(toMultiPolygon(cp(coords), { supposeType: 'ringStrings' }).length, 1)
        assert.strict.equal(isPointInPolygons([5, 5], cp(coords), { supposeType: 'ringStrings' }), false)
    })

    it(`should wrap Polygon without inner ring into one block (R-GJ1-a)`, function() {
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'Polygon', coordinates: [cp(outerB)] }), [[outerB]])
    })

    it(`should keep MultiPolygon as is (R-GJ1-b)`, function() {
        let g = { type: 'MultiPolygon', coordinates: cp([[outer, hole], [outerB], [outerC, holeC]]) }
        let r = geojsonToMultiPolygon(g)
        assert.strict.deepStrictEqual(r, [[outer, hole], [outerB], [outerC, holeC]])
    })

    it(`should use geometry of Feature, and return [] when geometry is null or missing (R-GJ1-c)`, function() {
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(feat(gPolyHole())), [[outer, hole]])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(feat(null)), [])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'Feature', properties: {} }), [])
    })

    it(`should merge features of FeatureCollection in order and skip null or missing geometry (R-GJ1-c)`, function() {
        let fc = {
            type: 'FeatureCollection',
            features: [
                feat({ type: 'Polygon', coordinates: cp([outerD]) }),
                feat(null),
                feat({ type: 'MultiPolygon', coordinates: cp([[outerC, holeC], [outerB]]) }),
                { type: 'Feature', properties: {} },
                feat(gPolyHole()),
            ],
        }
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(fc), [[outerD], [outerC, holeC], [outerB], [outer, hole]])
    })

    it(`should merge geometries of GeometryCollection in order including nested one (R-GJ1-c)`, function() {
        let gc = {
            type: 'GeometryCollection',
            geometries: [
                { type: 'Polygon', coordinates: cp([outerB]) },
                {
                    type: 'GeometryCollection',
                    geometries: [
                        gPolyHole(),
                        { type: 'MultiPolygon', coordinates: cp([[outerC, holeC]]) },
                    ],
                },
                { type: 'Polygon', coordinates: cp([outerD]) },
            ],
        }
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(gc), [[outerB], [outer, hole], [outerC, holeC], [outerD]])
    })

    it(`should skip empty coordinates and return [] when no geometry (R-GJ1-c)`, function() {
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'Polygon', coordinates: [] }), [])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'MultiPolygon', coordinates: [] }), [])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'MultiPolygon', coordinates: [[], cp([outerB]), [], cp([outerD])] }), [[outerB], [outerD]])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'FeatureCollection', features: [] }), [])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'GeometryCollection', geometries: [] }), [])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'FeatureCollection', features: [feat({ type: 'Polygon', coordinates: [] }), feat(null)] }), [])
    })

    it(`should accept JSON text and JSON5 text as the same as object (R-GJ1-d)`, function() {
        let fc = { type: 'FeatureCollection', features: [feat(gPolyHole()), feat({ type: 'MultiPolygon', coordinates: cp([[outerC, holeC]]) })] }
        let want = geojsonToMultiPolygon(cp(fc))
        assert.strict.deepStrictEqual(want, [[outer, hole], [outerC, holeC]])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(JSON.stringify(fc)), want)
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(`{ type: 'Polygon', /* c */ coordinates: [[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]],], }`), [[outer, hole]])
    })

    it(`should throw on non-areal geometry by default and skip it when opt.nonAreal is skip (R-GJ1-e)`, function() {
        let types = {
            Point: [1, 1],
            MultiPoint: [[1, 1], [2, 2]],
            LineString: [[0, 0], [1, 1]],
            MultiLineString: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]],
        }
        for (let [t, coordinates] of Object.entries(types)) {
            let fc = {
                type: 'FeatureCollection',
                features: [
                    feat({ type: 'Polygon', coordinates: cp([outerB]) }),
                    feat({ type: t, coordinates }),
                    feat({ type: 'Polygon', coordinates: cp([outerD]) }),
                ],
            }
            let msg = getErrMsg(() => geojsonToMultiPolygon(fc))
            assert.strict.ok(msg === `invalid geojson.features[1].geometry: must be Polygon or MultiPolygon (use opt.nonAreal 'skip' to skip Point, MultiPoint, LineString and MultiLineString)`, `${t} should throw with location`)
            assert.strict.ok(getErrMsg(() => geojsonToMultiPolygon(fc, { nonAreal: 'throw' })) === msg, `${t} should throw when nonAreal is throw`)
            assert.strict.deepStrictEqual(geojsonToMultiPolygon(fc, { nonAreal: 'skip' }), [[outerB], [outerD]])
            assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: t, coordinates }, { nonAreal: 'skip' }), [])
        }

        //GeometryCollection內亦同
        let gc = { type: 'GeometryCollection', geometries: [{ type: 'Point', coordinates: [1, 1] }, { type: 'Polygon', coordinates: cp([outerB]) }] }
        assert.strict.throws(() => geojsonToMultiPolygon(gc), /geojson\.geometries\[0\]: must be Polygon or MultiPolygon/)
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(gc, { nonAreal: 'skip' }), [[outerB]])
    })

    it(`should throw on unsupported type even when opt.nonAreal is skip (R-GJ1-e)`, function() {
        let allowed = `'FeatureCollection', 'Feature', 'GeometryCollection', 'Polygon', 'MultiPolygon', 'Point', 'MultiPoint', 'LineString', 'MultiLineString'`
        for (let t of ['polygon', 'POLYGON', 'Topology', 'Circle', '', 123, null, undefined, {}, []]) {
            let g = { type: t, coordinates: cp([outerB]) }
            assert.strict.ok(getErrMsg(() => geojsonToMultiPolygon(g, { nonAreal: 'skip' })) === `invalid geojson.type: must be one of ${allowed}`, 'unsupported type should throw')
        }
        assert.strict.ok(getErrMsg(() => geojsonToMultiPolygon({ coordinates: cp([outerB]) }, { nonAreal: 'skip' })) === `invalid geojson.type: must be one of ${allowed}`, 'missing type should throw')
    })

    it(`should use default nonAreal when opt or opt.nonAreal is not expected (R-GJ1-f)`, function() {
        let g = { type: 'LineString', coordinates: [[0, 0], [1, 1]] }
        let rev = Proxy.revocable({}, {})
        rev.revoke()
        let opts = [
            'skip', ['skip'], 123, true, null, undefined, () => {}, new Date(), rev.proxy,
            Object.assign([], { nonAreal: 'skip' }), Object.assign(() => {}, { nonAreal: 'skip' }), Object.assign(new Date(), { nonAreal: 'skip' }), //非一般物件之opt即使帶有效鍵亦視為未給
            {}, { nonAreal: undefined }, { nonAreal: null }, { nonAreal: 'SKIP' }, { nonAreal: ' skip' }, { nonAreal: 'Skip' }, { nonAreal: true }, { nonAreal: 1 }, { nonAreal: ['skip'] },
            { nonAreal: {} }, { nonAreal: Object('skip') }, { nonAreal: 'throw' }, { skip: true }, { nonareal: 'skip' },
        ]
        for (let opt of opts) {
            let msg = getErrMsg(() => geojsonToMultiPolygon(g, opt))
            assert.strict.ok(typeof msg === 'string' && msg.startsWith('invalid geojson: must be Polygon or MultiPolygon'), 'should use default throw')
        }
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(g, { nonAreal: 'skip' }), [])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(g, { nonAreal: 'skip', other: 1, debug: 'x' }), [])
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(g, Object.assign(Object.create(null), { nonAreal: 'skip' })), [])
    })

    it(`should warn without input value only when opt.debug is true and opt.nonAreal is not expected (R-GJ1-f)`, function() {
        let g = { type: 'Polygon', coordinates: cp([outerB]) }
        let secret = 'SECRET-OPT-VALUE'

        //debug為true且nonAreal非預期: 警告一次, 不含值
        let ws = catchWarn(() => geojsonToMultiPolygon(g, { nonAreal: secret, debug: true }))
        assert.strict.equal(ws.length, 1)
        assert.strict.ok(ws[0].includes('opt.nonAreal') && !ws[0].includes(secret), 'warn should name the key and not echo the value')
        assert.strict.ok(catchWarn(() => geojsonToMultiPolygon(g, { nonAreal: 123, debug: true })).length === 1, 'number should warn')
        assert.strict.ok(catchWarn(() => geojsonToMultiPolygon(g, { nonAreal: 'SKIP', debug: true })).length === 1, 'wrong case should warn')

        //debug非true(含'true'、1): 不警告
        for (let debug of [false, undefined, null, 'true', 1, {}, []]) {
            assert.strict.ok(catchWarn(() => geojsonToMultiPolygon(g, { nonAreal: secret, debug })).length === 0, 'debug other than true should not warn')
        }

        //nonAreal為有效值或未給(undefined、null): 不警告
        for (let nonAreal of ['throw', 'skip', undefined, null]) {
            assert.strict.ok(catchWarn(() => geojsonToMultiPolygon(g, { nonAreal, debug: true })).length === 0, 'expected or unset nonAreal should not warn')
        }
        assert.strict.ok(catchWarn(() => geojsonToMultiPolygon(g, { debug: true })).length === 0, 'no nonAreal should not warn')
    })

    it(`should throw invalid error without echoing input value (R-GJ1-g)`, function() {
        let S = 'SECRET-VALUE-123'
        let rev = Proxy.revocable([], {})
        rev.revoke()
        let cases = [
            null, undefined, 0, 123, true, '', ' ', () => {}, [outer], [], new Date(), rev.proxy,
            `{bad json ${S}`, 'null', '123', `"${S}"`, `[${S}]`,
            { type: S },
            { type: 'Polygon' },
            { type: 'Polygon', coordinates: S },
            { type: 'Polygon', coordinates: { a: S } },
            { type: 'Polygon', coordinates: [S] },
            { type: 'Polygon', coordinates: [[S]] },
            { type: 'Polygon', coordinates: [[]] }, //只有空環
            { type: 'Polygon', coordinates: [outer, []] }, //含空環(下游函數會拋原生錯誤, 故於此拒絕)
            { type: 'MultiPolygon', coordinates: [[[]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [S, 1], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [1, S], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [1, 1, S], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [1], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], null, [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], ['1', '2'], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [NaN, 1], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [1, Infinity], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [-Infinity, 1], [1, 1]]] },
            { type: 'Polygon', coordinates: [[[0, 0], [1n, 1], [1, 1]]] },
            { type: 'MultiPolygon', coordinates: S },
            { type: 'MultiPolygon', coordinates: [S] },
            { type: 'MultiPolygon', coordinates: [[S]] },
            { type: 'MultiPolygon', coordinates: [[[[0, S]]]] },
            { type: 'MultiPolygon', coordinates: [outer] }, //Polygon座標誤放於MultiPolygon(環內為位置而非環, 少一層)
            { type: 'FeatureCollection' },
            { type: 'FeatureCollection', features: S },
            { type: 'FeatureCollection', features: [S] },
            { type: 'FeatureCollection', features: [null] },
            { type: 'FeatureCollection', features: [undefined] },
            { type: 'FeatureCollection', features: [[]] },
            { type: 'Feature', geometry: S },
            { type: 'Feature', geometry: [] },
            { type: 'Feature', geometry: { type: S } },
            { type: 'GeometryCollection' },
            { type: 'GeometryCollection', geometries: S },
            { type: 'GeometryCollection', geometries: [null] },
            { type: 'GeometryCollection', geometries: [S] },
        ]
        for (let c of cases) {
            let msg = getErrMsg(() => geojsonToMultiPolygon(c))
            assert.strict.ok(typeof msg === 'string', 'should throw')
            assert.strict.ok(/^invalid geojson/.test(msg), 'message should start with invalid geojson')
            assert.strict.ok(!msg.includes(S), 'message should not echo input value')
        }
    })

    it(`should report location and expected kind in message with fixed wording (R-GJ1-g)`, function() {
        let ok = feat({ type: 'Polygon', coordinates: cp([outerB]) })
        let m = (g) => getErrMsg(() => geojsonToMultiPolygon(g))
        let fcOf = (geometry) => ({ type: 'FeatureCollection', features: [ok, feat(geometry)] })
        assert.strict.ok(m(fcOf({ type: 'Polygon', coordinates: [[[0, 0], [1, 'x']]] })) === 'invalid geojson.features[1].geometry.coordinates[0][1]: must be an array of two or more finite numbers', 'position')
        assert.strict.ok(m(fcOf({ type: 'Polygon', coordinates: [[[0, 0]], 'x'] })) === 'invalid geojson.features[1].geometry.coordinates[1]: must be a non-empty array of positions', 'ring')
        assert.strict.ok(m(fcOf({ type: 'Polygon', coordinates: [[[0, 0]], []] })) === 'invalid geojson.features[1].geometry.coordinates[1]: must be a non-empty array of positions', 'empty ring')
        assert.strict.ok(m({ type: 'Polygon', coordinates: [[]] }) === 'invalid geojson.coordinates[0]: must be a non-empty array of positions', 'empty only ring')
        for (let v of [null, undefined, '', 'x', 0, {}, { length: 0 }, { x: 1, y: 2 }]) { //MultiPolygon內之polygon非陣列(含{length:0}類陣列物件)
            assert.strict.ok(m({ type: 'MultiPolygon', coordinates: [cp([outerB]), v] }) === 'invalid geojson.coordinates[1]: must be an array of rings', 'polygon not array')
        }
        for (let v of [null, undefined, '', 'x', 0, {}, { length: 2, 0: 1, 1: 2 }, { x: 1, y: 2 }]) { //位置非陣列(含{x,y}物件與類陣列物件)
            assert.strict.ok(m({ type: 'Polygon', coordinates: [[[0, 0], v]] }) === 'invalid geojson.coordinates[0][1]: must be an array of two or more finite numbers', 'position not array')
        }
        assert.strict.ok(m({ type: 'Polygon', coordinates: [[[0, 0, 1, 2, 3], [1, 1, 1, 2, 'x']]] }) === 'invalid geojson.coordinates[0][1]: must be an array of two or more finite numbers', 'every element of position is checked')
        assert.strict.ok(m(fcOf({ type: 'MultiPolygon', coordinates: [[[[0, 0]]], 'x'] })) === 'invalid geojson.features[1].geometry.coordinates[1]: must be an array of rings', 'polygon')
        assert.strict.ok(m(fcOf({ type: 'MultiPolygon', coordinates: 'x' })) === 'invalid geojson.features[1].geometry.coordinates: must be an array', 'coordinates')
        assert.strict.ok(m({ type: 'FeatureCollection', features: [ok, 'x'] }) === 'invalid geojson.features[1]: must be an object', 'feature')
        assert.strict.ok(m({ type: 'FeatureCollection', features: 'x' }) === 'invalid geojson.features: must be an array', 'features')
        assert.strict.ok(m({ type: 'GeometryCollection', geometries: 'x' }) === 'invalid geojson.geometries: must be an array', 'geometries')
        assert.strict.ok(m({ type: 'GeometryCollection', geometries: [{ type: 'GeometryCollection', geometries: [null] }] }) === 'invalid geojson.geometries[0].geometries[0]: must be an object', 'nested')
        assert.strict.ok(m('{bad') === 'invalid geojson: must be a valid JSON text', 'text')
        assert.strict.ok(m(123) === 'invalid geojson: must be an object or a JSON text', 'top')
        assert.strict.ok(m({ type: 'Polygon', coordinates: [[[0, 0], [1, 1]]], foo: 1 }) === null, 'extra keys and short ring are not structure errors')
    })

    it(`should not modify input and should not share any array with input (R-GJ1-h)`, function() {
        let fc = deepFreeze({
            type: 'FeatureCollection',
            features: [
                feat(gPolyHole()),
                feat({ type: 'MultiPolygon', coordinates: cp([[outerC, holeC], [outerB]]) }),
                feat({ type: 'GeometryCollection', geometries: [{ type: 'Polygon', coordinates: cp([outerD]) }] }),
            ],
        })
        let snap = JSON.stringify(fc)
        let r = geojsonToMultiPolygon(fc) //凍結之輸入若被改動會拋錯
        assert.strict.equal(JSON.stringify(fc), snap)

        //回傳內任何一層陣列(塊、環、位置)皆不為輸入內之陣列
        let src = collectArrays(fc, new Set())
        let dst = collectArrays(r, new Set())
        assert.strict.ok(src.size > 0 && dst.size > 0, 'should have arrays')
        let shared = [...dst].filter((a) => src.has(a)).length
        assert.strict.ok(shared === 0, 'result should not share arrays with input')

        //改動回傳不影響輸入
        r[0][0][0][0] = 999
        r[1][1].push([1, 1])
        assert.strict.equal(JSON.stringify(fc), snap)

        //重複呼叫之回傳彼此獨立
        let r1 = geojsonToMultiPolygon(fc)
        let r2 = geojsonToMultiPolygon(fc)
        assert.strict.deepStrictEqual(r1, r2)
        r1[0][0][0][0] = 123
        assert.strict.notEqual(r2[0][0][0][0], 123)
    })

    it(`should keep elevation and extra numbers of position and copy them (R-GJ1-h)`, function() {
        let g = { type: 'Polygon', coordinates: [[[0, 0, 5], [10, 0, 6], [10, 10, 7], [0, 0, 5]]] }
        let r = geojsonToMultiPolygon(g)
        assert.strict.deepStrictEqual(r, [[[[0, 0, 5], [10, 0, 6], [10, 10, 7], [0, 0, 5]]]])
        assert.strict.notStrictEqual(r[0][0][0], g.coordinates[0][0])

        //4個以上之數字亦保留(各元素皆須為有限數字, 見訊息案)
        let g4 = { type: 'Polygon', coordinates: [[[0, 0, 5, 1], [10, 0, 6, 2], [10, 10, 7, 3]]] }
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(g4), [[[[0, 0, 5, 1], [10, 0, 6, 2], [10, 10, 7, 3]]]])

        //-0原樣保留
        assert.strict.ok(Object.is(geojsonToMultiPolygon({ type: 'Polygon', coordinates: [[[-0, 0], [1, 1]]] })[0][0][0][0], -0), '-0 should be kept')
    })

    it(`should treat containers recursively by type and accept bare geometry in FeatureCollection (R-GJ1-c)`, function() {
        //各層皆依type遞迴處理(寬鬆): FeatureCollection內裸geometry、巢狀FeatureCollection、GeometryCollection內Feature、Feature之geometry為Feature
        let g = {
            type: 'FeatureCollection',
            features: [
                { type: 'Polygon', coordinates: cp([outerB]) },
                { type: 'FeatureCollection', features: [feat({ type: 'Polygon', coordinates: cp([outerC, holeC]) })] },
                feat({ type: 'GeometryCollection', geometries: [feat({ type: 'Polygon', coordinates: cp([outerD]) })] }),
                feat(feat({ type: 'MultiPolygon', coordinates: cp([[outer, hole]]) })),
            ],
        }
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(g), [[outerB], [outerC, holeC], [outerD], [outer, hole]])
    })

    it(`should treat opt key whose reading throws as unset and not leak its error (R-GJ1-f)`, function() {
        let S = 'SECRET-OPT-GETTER'
        let thrower = () => {
            throw new Error(S)
        }
        let line = { type: 'LineString', coordinates: [[0, 0], [1, 1]] }
        let o1 = Object.defineProperty({}, 'nonAreal', { enumerable: true, get: thrower })
        let o2 = Object.defineProperty({ nonAreal: 'skip' }, 'debug', { enumerable: true, get: thrower })
        let o3 = Object.defineProperty({ debug: true }, 'nonAreal', { enumerable: true, get: thrower })

        //nonAreal讀取拋錯 → 視為未給(預設throw, 拋之為本函數之訊息而非getter之錯誤)
        let msg = getErrMsg(() => geojsonToMultiPolygon(line, o1))
        assert.strict.ok(typeof msg === 'string' && msg.startsWith('invalid geojson: must be Polygon or MultiPolygon') && !msg.includes(S), 'nonAreal getter')

        //debug讀取拋錯 → 視為未給(false), nonAreal為skip仍有效
        assert.strict.deepStrictEqual(geojsonToMultiPolygon(line, o2), [])

        //debug為true而nonAreal讀取拋錯 → 視為未給且不警告(未給不屬非預期之值)
        assert.strict.ok(catchWarn(() => getErrMsg(() => geojsonToMultiPolygon(line, o3))).length === 0, 'unset should not warn')
    })

    it(`should read each position once and output the validated copy (R-GJ1-h)`, function() {
        //環內第2個位置為存取器: 第1次讀取給有效位置, 其後各次給無效內容; 輸出須為第1次讀取之值(檢測之值即使用之值)
        let ring = [[0, 0], [5, 5], [1, 1], [0, 0]]
        let n = 0
        Object.defineProperty(ring, 1, {
            enumerable: true,
            get: () => {
                n++
                return n === 1 ? [1, 0] : ['EVIL', 'x']
            },
        })
        let r = geojsonToMultiPolygon({ type: 'Polygon', coordinates: [ring] })
        assert.strict.deepStrictEqual(r, [[[[0, 0], [1, 0], [1, 1], [0, 0]]]])
        assert.strict.equal(n, 1)
    })

    it(`should neither check nor repair closure, point count or direction, and keep input unchanged when result is closed by isPointInPolygons (R-GJ1-i)`, function() {
        //外環與內環皆未封閉, 內環與外環方向相同(皆逆時針): 不檢查、不改寫
        let outerOpen = [[0, 0], [10, 0], [10, 10], [0, 10]]
        let holeOpen = [[4, 4], [6, 4], [6, 6], [4, 6]]
        let g = { type: 'Polygon', coordinates: cp([outerOpen, holeOpen]) }
        let snap = JSON.stringify(g)
        let r = geojsonToMultiPolygon(g)
        assert.strict.deepStrictEqual(r, [[outerOpen, holeOpen]])

        //2點之環亦不檢查點數(幾何有效性交turf等後續處理)
        assert.strict.deepStrictEqual(geojsonToMultiPolygon({ type: 'Polygon', coordinates: [[[0, 0], [1, 1]]] }), [[[[0, 0], [1, 1]]]])

        //isPointInPolygons內之fixCloseMultiPolygon會就地補封閉環, 因回傳為複本, 輸入不被動到
        assert.strict.equal(isPointInPolygons([5, 5], r), false)
        assert.strict.equal(isPointInPolygons([2, 2], r), true)
        assert.strict.equal(JSON.stringify(g), snap)
    })

    it(`should throw fixed readable message when reading input throws (R-GJ1-k)`, function() {
        let S = 'SECRET-GETTER-123'
        let rev = Proxy.revocable({ type: 'Polygon', coordinates: [] }, {})
        rev.revoke()
        let revArr = Proxy.revocable([], {})
        revArr.revoke()
        let circular = { type: 'FeatureCollection', features: [] }
        circular.features.push(circular)
        let thrower = () => {
            throw new Error(S)
        }
        let hostile = (o, key) => { //讀取該鍵即拋錯之存取器
            return Object.defineProperty(o, key, { enumerable: true, get: thrower })
        }
        let posProxy = new Proxy([0, 0], { //讀索引即拋錯之位置(標籤與length可讀, 故判為陣列)
            get: (t, k) => {
                return k === '0' ? thrower() : t[k]
            },
        })
        let ringProxy = new Proxy([[0, 0]], { //一切讀取皆拋錯之環(連型別標籤都讀不到, 判為非陣列)
            get: thrower,
        })
        let cases = [
            hostile({ type: 'Polygon' }, 'coordinates'),
            { type: 'FeatureCollection', features: [hostile({ type: 'Feature' }, 'geometry')] },
            hostile({}, 'type'),
            { type: 'Polygon', coordinates: [[posProxy]] },
            { type: 'Polygon', coordinates: [ringProxy] },
            circular,
            { type: 'Feature', geometry: rev.proxy },
            { type: 'Polygon', coordinates: revArr.proxy },
        ]
        for (let c of cases) {
            let msg = getErrMsg(() => geojsonToMultiPolygon(c))
            assert.strict.ok(typeof msg === 'string', 'should throw')
            assert.strict.ok(/^invalid geojson[^:]*: must be /.test(msg), 'message should be fixed wording')
            assert.strict.ok(!msg.includes(S), 'message should not echo the thrown message of input')
        }

        //存取器拋錯、讀索引拋錯與循環參照之訊息為可讀類固定訊息(已撤銷之Proxy由型別判斷擋下, 訊息為各處之must be)
        for (let k of [0, 1, 2, 3, 5]) {
            assert.strict.ok(getErrMsg(() => geojsonToMultiPolygon(cases[k])) === 'invalid geojson: must be a readable object', `case ${k} should be readable error`)
        }
    })

})
