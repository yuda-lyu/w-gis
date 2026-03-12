import assert from 'assert'
import splitAndProcGeoJSON from '../src/splitAndProcGeoJSON.mjs'


/**
 * 計算 ring 有號面積（正=CCW，負=CW）
 */
function calcSignedArea(ring) {
    let area = 0
    for (let i = 0; i < ring.length; i++) {
        let j = (i + 1) % ring.length
        area += ring[i][0] * ring[j][1]
        area -= ring[j][0] * ring[i][1]
    }
    return area / 2
}

function isCCW(ring) {
    return calcSignedArea(ring) > 0
}
function isCW(ring) {
    return calcSignedArea(ring) < 0
}

/**
 * 驗證 polygon geometry 的所有 ring winding order 正確
 */
function assertWindingOrder(geom) {
    if (geom.type === 'Polygon') {
        assert.ok(isCCW(geom.coordinates[0]), '外環應為 CCW')
        for (let i = 1; i < geom.coordinates.length; i++) {
            assert.ok(isCW(geom.coordinates[i]), '洞環應為 CW')
        }
    }
    else if (geom.type === 'MultiPolygon') {
        for (let pg of geom.coordinates) {
            assert.ok(isCCW(pg[0]), '外環應為 CCW')
            for (let i = 1; i < pg.length; i++) {
                assert.ok(isCW(pg[i]), '洞環應為 CW')
            }
        }
    }
}

/**
 * 驗證所有 ring 閉合
 */
function assertAllRingsClosed(geom) {
    let rings = []
    if (geom.type === 'Polygon') {
        rings = geom.coordinates
    }
    else if (geom.type === 'MultiPolygon') {
        for (let pg of geom.coordinates) {
            rings.push(...pg)
        }
    }
    for (let ring of rings) {
        if (ring.length >= 2) {
            let first = ring[0]
            let last = ring[ring.length - 1]
            assert.strict.deepEqual(first, last, 'ring 應閉合')
        }
    }
}


describe('splitAndProcGeoJSON', function () {

    // ========================================
    // 一、空輸入 / 無效輸入
    // ========================================
    describe('空輸入與無效輸入', function () {

        it('null 輸入', function () {
            let r = splitAndProcGeoJSON(null)
            assert.strict.deepEqual(r.points.features, [])
            assert.strict.deepEqual(r.lines.features, [])
            assert.strict.deepEqual(r.polygons.features, [])
        })

        it('undefined 輸入', function () {
            let r = splitAndProcGeoJSON(undefined)
            assert.strict.deepEqual(r.points.features, [])
        })

        it('空 FeatureCollection', function () {
            let r = splitAndProcGeoJSON({ type: 'FeatureCollection', features: [] })
            assert.strict.deepEqual(r.points.features, [])
        })

        it('數字輸入', function () {
            let r = splitAndProcGeoJSON(42)
            assert.strict.deepEqual(r.points.features, [])
            assert.strict.deepEqual(r.lines.features, [])
            assert.strict.deepEqual(r.polygons.features, [])
        })

        it('布林值輸入', function () {
            let r = splitAndProcGeoJSON(false)
            assert.strict.deepEqual(r.points.features, [])
        })

        it('陣列輸入', function () {
            let r = splitAndProcGeoJSON([1, 2, 3])
            assert.strict.deepEqual(r.points.features, [])
        })

        it('無效 JSON 字串', function () {
            let r = splitAndProcGeoJSON('{invalid json}')
            assert.strict.deepEqual(r.points.features, [])
            assert.strict.deepEqual(r.lines.features, [])
            assert.strict.deepEqual(r.polygons.features, [])
        })

        it('空物件', function () {
            let r = splitAndProcGeoJSON({})
            assert.strict.deepEqual(r.points.features, [])
        })

        it('未知 type 的物件', function () {
            let r = splitAndProcGeoJSON({ type: 'SomeUnknownType' })
            assert.strict.deepEqual(r.points.features, [])
        })

    })


    // ========================================
    // 二、純 Point / MultiPoint 類型
    // ========================================
    describe('純 Point / MultiPoint 類型', function () {

        it('純 Point 應正確分類', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: 'pt1' }, geometry: { type: 'Point', coordinates: [121, 25] } },
                    { type: 'Feature', properties: { name: 'pt2' }, geometry: { type: 'Point', coordinates: [120, 24] } },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 2)
            assert.strictEqual(r.lines.features.length, 0)
            assert.strictEqual(r.polygons.features.length, 0)
        })

        it('MultiPoint 應歸類至 points', function () {
            let input = {
                type: 'Feature',
                properties: { name: 'mpt' },
                geometry: {
                    type: 'MultiPoint',
                    coordinates: [[121, 25], [120, 24], [119, 23]],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 1)
            assert.strictEqual(r.points.features[0].geometry.type, 'MultiPoint')
            assert.strictEqual(r.lines.features.length, 0)
            assert.strictEqual(r.polygons.features.length, 0)
        })

        it('Point 與 MultiPoint 混合', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: 'pt' }, geometry: { type: 'Point', coordinates: [121, 25] } },
                    { type: 'Feature', properties: { name: 'mpt' }, geometry: { type: 'MultiPoint', coordinates: [[120, 24], [119, 23]] } },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 2)
        })

    })


    // ========================================
    // 三、純 LineString / MultiLineString 類型
    // ========================================
    describe('純 LineString / MultiLineString 類型', function () {

        it('純 LineString 應正確分類', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: 'ls' }, geometry: { type: 'LineString', coordinates: [[121, 25], [122, 26]] } },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.lines.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 0)
        })

        it('MultiLineString 應歸類至 lines', function () {
            let input = {
                type: 'Feature',
                properties: { name: 'mls' },
                geometry: {
                    type: 'MultiLineString',
                    coordinates: [
                        [[121, 25], [122, 26]],
                        [[120, 24], [119, 23]],
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.lines.features.length, 1)
            assert.strictEqual(r.lines.features[0].geometry.type, 'MultiLineString')
        })

        it('LineString 與 MultiLineString 混合', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } },
                    { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: [[[2, 2], [3, 3]], [[4, 4], [5, 5]]] } },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.lines.features.length, 2)
        })

    })


    // ========================================
    // 四、混合類型 + 簡單 Polygon
    // ========================================
    describe('混合類型含簡單 Polygon', function () {

        it('Point + LineString + Polygon 混合', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: 'pt' }, geometry: { type: 'Point', coordinates: [121, 25] } },
                    { type: 'Feature', properties: { name: 'ls' }, geometry: { type: 'LineString', coordinates: [[121, 25], [122, 26]] } },
                    { type: 'Feature', properties: { name: 'pg' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 1)
            assert.strictEqual(r.lines.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 1)
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('所有基本類型 + Multi 類型混合', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { t: 'Point' }, geometry: { type: 'Point', coordinates: [0, 0] } },
                    { type: 'Feature', properties: { t: 'MultiPoint' }, geometry: { type: 'MultiPoint', coordinates: [[1, 1], [2, 2]] } },
                    { type: 'Feature', properties: { t: 'LineString' }, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } },
                    { type: 'Feature', properties: { t: 'MultiLineString' }, geometry: { type: 'MultiLineString', coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]] } },
                    { type: 'Feature', properties: { t: 'Polygon' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
                    { type: 'Feature', properties: { t: 'MultiPolygon' }, geometry: { type: 'MultiPolygon', coordinates: [[[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]]] } },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 2, 'Point + MultiPoint = 2')
            assert.strictEqual(r.lines.features.length, 2, 'LineString + MultiLineString = 2')
            assert.strictEqual(r.polygons.features.length, 2, 'Polygon + MultiPolygon = 2')
        })

    })


    // ========================================
    // 五、Polygon 帶洞
    // ========================================
    describe('Polygon 帶洞', function () {

        it('帶洞 Polygon 的 winding order 應正確', function () {
            let input = {
                type: 'Feature',
                properties: { name: '帶洞' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                        [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]],
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features.length, 1)
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('帶兩個洞的 Polygon', function () {
            let input = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                        [[2, 2], [6, 2], [6, 6], [2, 6], [2, 2]],
                        [[10, 10], [18, 10], [18, 18], [10, 18], [10, 10]],
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features.length, 1)
            // 兩個不重疊的洞，預期仍為合理結構
            let geom = r.polygons.features[0].geometry
            assertWindingOrder(geom)
            assertAllRingsClosed(geom)
        })

    })


    // ========================================
    // 六、三層套疊 Polygon（核心場景）
    // ========================================
    describe('三層套疊 Polygon', function () {

        it('三層套疊應拆為 MultiPolygon，winding order 正確', function () {
            let input = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: { name: '三層' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                            [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                            [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                        ],
                    },
                }],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 0)
            assert.strictEqual(r.lines.features.length, 0)
            assert.strictEqual(r.polygons.features.length, 1)
            let geom = r.polygons.features[0].geometry
            assert.strictEqual(geom.type, 'MultiPolygon')
            assert.ok(geom.coordinates.length >= 2, '至少 2 個 polygon')
            assertWindingOrder(geom)
        })

        it('三層套疊 + 其他類型混合', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: 'pt' }, geometry: { type: 'Point', coordinates: [121, 25] } },
                    { type: 'Feature', properties: { name: 'ls' }, geometry: { type: 'LineString', coordinates: [[121, 25], [122, 26]] } },
                    {
                        type: 'Feature',
                        properties: { name: '三層' },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                                [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                                [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                            ],
                        },
                    },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 1)
            assert.strictEqual(r.lines.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 1)
            assert.strictEqual(r.polygons.features[0].geometry.type, 'MultiPolygon')
            assertWindingOrder(r.polygons.features[0].geometry)
        })

    })


    // ========================================
    // 七、四層及更多層套疊 Polygon
    // ========================================
    describe('四層及更多層套疊 Polygon', function () {

        it('四層套疊 Polygon（極端場景）', function () {
            let input = {
                type: 'Feature',
                properties: { name: '四層' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[0, 0], [30, 0], [30, 30], [0, 30], [0, 0]],
                        [[3, 3], [27, 3], [27, 27], [3, 27], [3, 3]],
                        [[6, 6], [24, 6], [24, 24], [6, 24], [6, 6]],
                        [[9, 9], [21, 9], [21, 21], [9, 21], [9, 9]],
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            let geom = r.polygons.features[0].geometry
            assert.strictEqual(geom.type, 'MultiPolygon')
            assertWindingOrder(geom)
            assertAllRingsClosed(geom)
        })

        it('五層套疊 Polygon', function () {
            let input = {
                type: 'Feature',
                properties: { name: '五層' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[0, 0], [50, 0], [50, 50], [0, 50], [0, 0]],
                        [[5, 5], [45, 5], [45, 45], [5, 45], [5, 5]],
                        [[10, 10], [40, 10], [40, 40], [10, 40], [10, 10]],
                        [[15, 15], [35, 15], [35, 35], [15, 35], [15, 15]],
                        [[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]],
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            let geom = r.polygons.features[0].geometry
            assert.strictEqual(geom.type, 'MultiPolygon')
            assertWindingOrder(geom)
            assertAllRingsClosed(geom)
        })

    })


    // ========================================
    // 八、GeometryCollection 含 Polygon
    // ========================================
    describe('GeometryCollection 含 Polygon', function () {

        it('GC 內的 Polygon 應被拆解並處理 winding order', function () {
            let input = {
                type: 'Feature',
                properties: { name: 'gc' },
                geometry: {
                    type: 'GeometryCollection',
                    geometries: [
                        { type: 'Point', coordinates: [121, 25] },
                        { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 1)
            assertWindingOrder(r.polygons.features[0].geometry)
            assert.strictEqual(r.polygons.features[0].properties.name, 'gc')
        })

        it('GC 包含三層套疊 Polygon 應正確處理', function () {
            let input = {
                type: 'Feature',
                properties: { name: 'gc-nested' },
                geometry: {
                    type: 'GeometryCollection',
                    geometries: [
                        { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
                        {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                                [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                                [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                            ],
                        },
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.lines.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 1)
            assert.strictEqual(r.polygons.features[0].geometry.type, 'MultiPolygon')
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('GC 內含多種幾何類型', function () {
            let input = {
                type: 'Feature',
                properties: { name: 'gc-full' },
                geometry: {
                    type: 'GeometryCollection',
                    geometries: [
                        { type: 'Point', coordinates: [0, 0] },
                        { type: 'MultiPoint', coordinates: [[1, 1], [2, 2]] },
                        { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
                        { type: 'MultiLineString', coordinates: [[[2, 2], [3, 3]], [[4, 4], [5, 5]]] },
                        { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
                        { type: 'MultiPolygon', coordinates: [[[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]]] },
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 2)
            assert.strictEqual(r.lines.features.length, 2)
            assert.strictEqual(r.polygons.features.length, 2)
            // 所有 polygon 的 winding order 正確
            for (let f of r.polygons.features) {
                assertWindingOrder(f.geometry)
            }
            // 所有 features 應繼承 properties
            for (let f of [...r.points.features, ...r.lines.features, ...r.polygons.features]) {
                assert.strictEqual(f.properties.name, 'gc-full')
            }
        })

        it('巢狀 GeometryCollection 應遞迴拆解', function () {
            let input = {
                type: 'Feature',
                properties: { name: 'nested-gc' },
                geometry: {
                    type: 'GeometryCollection',
                    geometries: [
                        {
                            type: 'GeometryCollection',
                            geometries: [
                                { type: 'Point', coordinates: [0, 0] },
                                { type: 'Polygon', coordinates: [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]] },
                            ],
                        },
                        { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 1)
            assert.strictEqual(r.lines.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 1)
        })

    })


    // ========================================
    // 九、JSON 字串輸入
    // ========================================
    describe('JSON 字串輸入', function () {

        it('JSON 字串應被解析並正確處理', function () {
            let input = JSON.stringify({
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: 'str-pg' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
                ],
            })
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features.length, 1)
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('JSON 字串包含混合類型', function () {
            let input = JSON.stringify({
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
                    { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } },
                    { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
                ],
            })
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 1)
            assert.strictEqual(r.lines.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 1)
        })

        it('JSON 字串包含三層套疊 Polygon', function () {
            let input = JSON.stringify({
                type: 'Feature',
                properties: { name: 'json-nested' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                        [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                        [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                    ],
                },
            })
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features[0].geometry.type, 'MultiPolygon')
            assertWindingOrder(r.polygons.features[0].geometry)
        })

    })


    // ========================================
    // 十、裸 Geometry 輸入
    // ========================================
    describe('裸 Geometry 輸入', function () {

        it('裸 Point Geometry', function () {
            let input = { type: 'Point', coordinates: [121, 25] }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 1)
            assert.strictEqual(r.points.features[0].geometry.type, 'Point')
        })

        it('裸 LineString Geometry', function () {
            let input = { type: 'LineString', coordinates: [[0, 0], [1, 1]] }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.lines.features.length, 1)
        })

        it('裸 Polygon Geometry', function () {
            let input = { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features.length, 1)
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('裸 MultiPolygon Geometry', function () {
            let input = {
                type: 'MultiPolygon',
                coordinates: [
                    [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]],
                    [[[10, 10], [15, 10], [15, 15], [10, 15], [10, 10]]],
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features.length, 1)
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('裸 Polygon 三層套疊', function () {
            let input = {
                type: 'Polygon',
                coordinates: [
                    [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                    [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                    [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features[0].geometry.type, 'MultiPolygon')
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('裸 GeometryCollection', function () {
            let input = {
                type: 'GeometryCollection',
                geometries: [
                    { type: 'Point', coordinates: [0, 0] },
                    { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 1)
        })

    })


    // ========================================
    // 十一、MultiPolygon 場景
    // ========================================
    describe('MultiPolygon 場景', function () {

        it('兩個獨立 Polygon 的 MultiPolygon', function () {
            let input = {
                type: 'Feature',
                properties: { name: '兩獨立' },
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]],
                        [[[10, 10], [14, 10], [14, 14], [10, 14], [10, 10]]],
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features.length, 1)
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('MultiPolygon 含套疊 ring', function () {
            let input = {
                type: 'Feature',
                properties: { name: 'MP套疊' },
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                            [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                        ],
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assertWindingOrder(r.polygons.features[0].geometry)
        })

        it('MultiPolygon 含三層套疊 ring', function () {
            let input = {
                type: 'Feature',
                properties: { name: 'MP三層' },
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                            [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                            [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                        ],
                        [[[30, 30], [40, 30], [40, 40], [30, 40], [30, 30]]],
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            let geom = r.polygons.features[0].geometry
            assert.strictEqual(geom.type, 'MultiPolygon')
            assertWindingOrder(geom)
            assertAllRingsClosed(geom)
        })

    })


    // ========================================
    // 十二、winding order 修正
    // ========================================
    describe('winding order 修正', function () {

        it('CW 外環 Polygon 應被修正為 CCW', function () {
            let input = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]], // CW
                },
            }
            let r = splitAndProcGeoJSON(input)
            let ring = r.polygons.features[0].geometry.coordinates[0]
            assert.ok(isCCW(ring), '外環應修正為 CCW')
        })

        it('CW 外環 + CCW 洞的 Polygon 應修正', function () {
            let input = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]], // CW 外環
                        [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]], // CCW 洞
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            assertWindingOrder(r.polygons.features[0].geometry)
        })

    })


    // ========================================
    // 十三、深拷貝驗證
    // ========================================
    describe('深拷貝驗證', function () {

        it('修改輸出不影響原始輸入', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: 'original' }, geometry: { type: 'Point', coordinates: [121, 25] } },
                    { type: 'Feature', properties: { name: 'pg-original' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            r.points.features[0].properties.name = 'modified'
            r.polygons.features[0].properties.name = 'modified'
            assert.strictEqual(input.features[0].properties.name, 'original')
            assert.strictEqual(input.features[1].properties.name, 'pg-original')
        })

        it('修改輸出座標不影響原始輸入座標', function () {
            let input = {
                type: 'Feature',
                properties: {},
                geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
            }
            let origCoord = input.geometry.coordinates[0][0][0]
            let r = splitAndProcGeoJSON(input)
            r.polygons.features[0].geometry.coordinates[0][0][0] = 999
            assert.strictEqual(input.geometry.coordinates[0][0][0], origCoord)
        })

    })


    // ========================================
    // 十四、properties 完整保留
    // ========================================
    describe('properties 完整保留', function () {

        it('巢狀 style 物件應保留', function () {
            let input = {
                type: 'Feature',
                properties: {
                    name: '樣式',
                    style: { fillColor: 'rgba(255,0,0,0.5)', weight: 3 },
                },
                geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
            }
            let r = splitAndProcGeoJSON(input)
            let props = r.polygons.features[0].properties
            assert.strictEqual(props.name, '樣式')
            assert.strictEqual(props.style.fillColor, 'rgba(255,0,0,0.5)')
            assert.strictEqual(props.style.weight, 3)
        })

        it('各類型 Feature 的 properties 都應保留', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: '台北', elevation: 10 }, geometry: { type: 'Point', coordinates: [121.5, 25.0] } },
                    { type: 'Feature', properties: { name: '路線', distance: 350 }, geometry: { type: 'LineString', coordinates: [[121, 25], [122, 26]] } },
                    { type: 'Feature', properties: { name: '區域', area: 100 }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features[0].properties.name, '台北')
            assert.strictEqual(r.points.features[0].properties.elevation, 10)
            assert.strictEqual(r.lines.features[0].properties.name, '路線')
            assert.strictEqual(r.lines.features[0].properties.distance, 350)
            assert.strictEqual(r.polygons.features[0].properties.name, '區域')
            assert.strictEqual(r.polygons.features[0].properties.area, 100)
        })

        it('Feature 帶 id 應保留', function () {
            let input = {
                type: 'Feature',
                id: 'feat-123',
                properties: { name: '帶id' },
                geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features[0].id, 'feat-123')
        })

    })


    // ========================================
    // 十五、實際地圖數據場景
    // ========================================
    describe('實際地圖數據場景', function () {

        it('地圖標記 + 路線 + 等高線混合', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: { name: '台北' }, geometry: { type: 'Point', coordinates: [121.517, 25.048] } },
                    { type: 'Feature', properties: { name: '高雄' }, geometry: { type: 'Point', coordinates: [120.302, 22.639] } },
                    { type: 'Feature', properties: { name: '高鐵' }, geometry: { type: 'LineString', coordinates: [[121.517, 25.048], [120.302, 22.639]] } },
                    {
                        type: 'Feature',
                        properties: { style: { fillColor: 'rgba(255,255,255,1)' } },
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [[[[121.247, 23.162], [120.984, 23.171], [121.073, 23.191], [121.247, 23.162]]]],
                        },
                    },
                    {
                        type: 'Feature',
                        properties: { name: '台北市' },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[[121.4, 25.0], [121.6, 25.0], [121.6, 25.1], [121.4, 25.1], [121.4, 25.0]]],
                        },
                    },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.points.features.length, 2)
            assert.strictEqual(r.lines.features.length, 1)
            assert.strictEqual(r.polygons.features.length, 2)
            for (let f of r.polygons.features) {
                assertWindingOrder(f.geometry)
            }
        })

        it('多個不同結構的 Polygon Features', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    // 簡單 Polygon
                    {
                        type: 'Feature',
                        properties: { name: '簡單' },
                        geometry: { type: 'Polygon', coordinates: [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]] },
                    },
                    // 帶洞 Polygon
                    {
                        type: 'Feature',
                        properties: { name: '帶洞' },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                                [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]],
                            ],
                        },
                    },
                    // 三層套疊 Polygon
                    {
                        type: 'Feature',
                        properties: { name: '三層' },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                                [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                                [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                            ],
                        },
                    },
                    // MultiPolygon
                    {
                        type: 'Feature',
                        properties: { name: 'MP' },
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [[[50, 50], [60, 50], [60, 60], [50, 60], [50, 50]]],
                                [[[70, 70], [80, 70], [80, 80], [70, 80], [70, 70]]],
                            ],
                        },
                    },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features.length, 4)
            for (let f of r.polygons.features) {
                assertWindingOrder(f.geometry)
            }
            assert.strictEqual(r.polygons.features[0].geometry.type, 'Polygon')
            assert.strictEqual(r.polygons.features[2].geometry.type, 'MultiPolygon')
        })

        it('超大混合資料集：多種 Point + Line + Polygon 變體', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    // 多個 Point
                    { type: 'Feature', properties: { idx: 0 }, geometry: { type: 'Point', coordinates: [121, 25] } },
                    { type: 'Feature', properties: { idx: 1 }, geometry: { type: 'Point', coordinates: [120, 24] } },
                    // MultiPoint
                    { type: 'Feature', properties: { idx: 2 }, geometry: { type: 'MultiPoint', coordinates: [[119, 23], [118, 22]] } },
                    // LineString
                    { type: 'Feature', properties: { idx: 3 }, geometry: { type: 'LineString', coordinates: [[121, 25], [122, 26]] } },
                    // MultiLineString
                    { type: 'Feature', properties: { idx: 4 }, geometry: { type: 'MultiLineString', coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]] } },
                    // 簡單 Polygon
                    { type: 'Feature', properties: { idx: 5 }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]] } },
                    // 帶洞 Polygon
                    {
                        type: 'Feature',
                        properties: { idx: 6 },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                                [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]],
                            ],
                        },
                    },
                    // 三層套疊 Polygon
                    {
                        type: 'Feature',
                        properties: { idx: 7 },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                                [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                                [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                            ],
                        },
                    },
                    // 四層套疊 Polygon
                    {
                        type: 'Feature',
                        properties: { idx: 8 },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [30, 0], [30, 30], [0, 30], [0, 0]],
                                [[3, 3], [27, 3], [27, 27], [3, 27], [3, 3]],
                                [[6, 6], [24, 6], [24, 24], [6, 24], [6, 6]],
                                [[9, 9], [21, 9], [21, 21], [9, 21], [9, 9]],
                            ],
                        },
                    },
                    // MultiPolygon
                    {
                        type: 'Feature',
                        properties: { idx: 9 },
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [[[50, 50], [60, 50], [60, 60], [50, 60], [50, 50]]],
                                [[[70, 70], [80, 70], [80, 80], [70, 80], [70, 70]]],
                            ],
                        },
                    },
                    // GeometryCollection
                    {
                        type: 'Feature',
                        properties: { idx: 10 },
                        geometry: {
                            type: 'GeometryCollection',
                            geometries: [
                                { type: 'Point', coordinates: [100, 100] },
                                { type: 'Polygon', coordinates: [[[90, 90], [95, 90], [95, 95], [90, 95], [90, 90]]] },
                            ],
                        },
                    },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            // Point: idx 0,1 + MultiPoint: idx 2 + GC Point: idx 10 = 4
            assert.strictEqual(r.points.features.length, 4)
            // LineString: idx 3 + MultiLineString: idx 4 = 2
            assert.strictEqual(r.lines.features.length, 2)
            // Polygon: idx 5,6,7,8 + MultiPolygon: idx 9 + GC Polygon: idx 10 = 6
            assert.strictEqual(r.polygons.features.length, 6)
            // 所有 polygon 的 winding order 正確
            for (let f of r.polygons.features) {
                assertWindingOrder(f.geometry)
                assertAllRingsClosed(f.geometry)
            }
            // 三層套疊(idx 7)和四層套疊(idx 8)應為 MultiPolygon
            // 在 polygons 中的順序為 idx 5(0), 6(1), 7(2), 8(3), 9(4), 10-GC(5)
            assert.strictEqual(r.polygons.features[2].geometry.type, 'MultiPolygon')
            assert.strictEqual(r.polygons.features[3].geometry.type, 'MultiPolygon')
        })

        it('模擬等高線多色填色（多 Feature，各為 MultiPolygon）', function () {
            let colors = [
                'rgba(255,255,255,1)',
                'rgba(254,200,127,1)',
                'rgba(253,150,64,1)',
                'rgba(230,100,30,1)',
                'rgba(200,50,10,1)',
            ]
            let features = colors.map((color, idx) => ({
                type: 'Feature',
                properties: { style: { fillColor: color }, level: idx },
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [[[120 + idx * 0.1, 23], [121 + idx * 0.1, 23], [121 + idx * 0.1, 24], [120 + idx * 0.1, 24], [120 + idx * 0.1, 23]]],
                    ],
                },
            }))
            let input = { type: 'FeatureCollection', features }
            let r = splitAndProcGeoJSON(input)
            assert.strictEqual(r.polygons.features.length, 5)
            for (let i = 0; i < 5; i++) {
                assert.strictEqual(r.polygons.features[i].properties.style.fillColor, colors[i])
                assert.strictEqual(r.polygons.features[i].properties.level, i)
                assertWindingOrder(r.polygons.features[i].geometry)
            }
        })

        it('模擬島嶼帶湖泊帶島的四層套疊', function () {
            // 島嶼 → 湖泊 → 湖中島 → 島上池塘
            let input = {
                type: 'Feature',
                properties: { name: '島嶼帶湖泊', category: 'geography' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[0, 0], [40, 0], [40, 40], [0, 40], [0, 0]], // 島嶼外圍
                        [[5, 5], [35, 5], [35, 35], [5, 35], [5, 5]], // 湖泊
                        [[10, 10], [30, 10], [30, 30], [10, 30], [10, 10]], // 湖中島
                        [[15, 15], [25, 15], [25, 25], [15, 25], [15, 15]], // 島上池塘
                    ],
                },
            }
            let r = splitAndProcGeoJSON(input)
            let geom = r.polygons.features[0].geometry
            assert.strictEqual(geom.type, 'MultiPolygon')
            assertWindingOrder(geom)
            assertAllRingsClosed(geom)
            assert.strictEqual(r.polygons.features[0].properties.name, '島嶼帶湖泊')
            assert.strictEqual(r.polygons.features[0].properties.category, 'geography')
        })

    })


    // ========================================
    // 十六、回傳結構驗證
    // ========================================
    describe('回傳結構驗證', function () {

        it('回傳物件包含三個 FeatureCollection', function () {
            let r = splitAndProcGeoJSON(null)
            assert.strictEqual(r.points.type, 'FeatureCollection')
            assert.strictEqual(r.lines.type, 'FeatureCollection')
            assert.strictEqual(r.polygons.type, 'FeatureCollection')
            assert.ok(Array.isArray(r.points.features))
            assert.ok(Array.isArray(r.lines.features))
            assert.ok(Array.isArray(r.polygons.features))
        })

        it('所有 polygon features 的 type 均為 Feature', function () {
            let input = {
                type: 'FeatureCollection',
                features: [
                    { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
                                [[4, 4], [16, 4], [16, 16], [4, 16], [4, 4]],
                                [[8, 8], [12, 8], [12, 12], [8, 12], [8, 8]],
                            ],
                        },
                    },
                ],
            }
            let r = splitAndProcGeoJSON(input)
            for (let f of r.polygons.features) {
                assert.strictEqual(f.type, 'Feature')
                assert.ok(f.geometry !== undefined)
                assert.ok(f.properties !== undefined)
            }
        })

    })

})
