import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { fromArrayBuffer } from 'geotiff'
import writeTiff from '../src/writeTiff.mjs'
import interp2Grid from '../src/interp2Grid.mjs'


//writeTiff為Node專用並於執行期取得fs, 輸出float32單波段, 地理參照依interp2Grid之格點, 對應規則帳本R-WT
describe(`unit-writeTiff`, function() {

    let fd = path.resolve('./test/_tmp/unit-writeTiff')

    //3行2列之網格(同interp2Grid): 格點x為10、11、12, y為20、21, grds第0列為上方y=21之格點列
    let g = [10, 12, 3, 1, 20, 21, 2, 1] //xmin, xmax, xnum, dx, ymin, ymax, ynum, dy
    let grds = [[1, 2, 3], [4, 5, 255]]

    async function readTiff(fp) {
        let b = fs.readFileSync(fp)
        let tiff = await fromArrayBuffer(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
        let img = await tiff.getImage()
        return { b, img }
    }

    async function rejectsWithoutFile(pm, fp, message) {
        await assert.rejects(pm, { message })
        assert.strict.equal(fs.existsSync(fp), false)
    }

    before(function() {
        fs.rmSync(fd, { recursive: true, force: true })
        fs.mkdirSync(fd, { recursive: true })
    })

    after(function() {
        fs.rmSync(fd, { recursive: true, force: true })
    })

    it(`should write a GeoTIFF whose size and resolution follow the grid and whose origin is the top-left node extended by half a cell (R-WT)`, async function() {
        let fp = path.resolve(fd, 'grid.tif')
        await writeTiff(...g, grds, fp)
        let { b, img } = await readTiff(fp)
        assert.strict.equal(b.subarray(0, 4).toString('hex'), '4d4d002a') //big-endian TIFF
        assert.strict.equal(img.getWidth(), 3) //xnum
        assert.strict.equal(img.getHeight(), 2) //ynum
        assert.strict.deepStrictEqual(img.getResolution(), [1, -1, 0]) //[dx, -dy]
        assert.strict.deepStrictEqual(img.getOrigin(), [9.5, 21.5, 0]) //左上像素之左上角=左上格點(10,21)各外推半格, 像素中心即格點
        assert.strict.equal(img.pixelIsArea(), true) //GTRasterTypeGeoKey=1
    })

    it(`should write the geographic model with GeographicTypeGeoKey by default (R-WT, D12)`, async function() {
        for (let [name, opt, code] of [
            ['geo-default', undefined, 4326],
            ['geo-explicit', { typeModel: 'geographic' }, 4326],
            ['geo-3824', { typeGeoKey: 3824 }, 3824],
            ['geo-invalid-code', { typeGeoKey: 'abc' }, 4326], //地理型別之代碼無效時沿用4326
            ['geo-over-short', { typeGeoKey: 102100 }, 4326], //GeoKey值為SHORT, 大於65535者無效
        ]) {
            let fp = path.resolve(fd, `${name}.tif`)
            await writeTiff(...g, grds, fp, opt)
            let { img } = await readTiff(fp)
            assert.strict.deepStrictEqual(img.getGeoKeys(), { GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 1, GeographicTypeGeoKey: code }, name) //2=地理座標系統
        }
    })

    it(`should write the projected model with ProjectedCSTypeGeoKey for opt.typeModel projected (R-WT, D12)`, async function() {
        let fp = path.resolve(fd, 'tm2.tif')
        await writeTiff(300000, 300200, 3, 100, 2770000, 2770100, 2, 100, grds, fp, { typeModel: 'projected', typeGeoKey: 3826 }) //3826=TWD97 TM2 121分帶
        let { img } = await readTiff(fp)
        assert.strict.deepStrictEqual(img.getGeoKeys(), { GTModelTypeGeoKey: 1, GTRasterTypeGeoKey: 1, ProjectedCSTypeGeoKey: 3826 }) //1=投影座標系統
        assert.strict.deepStrictEqual(img.getOrigin(), [299950, 2770150, 0])
        assert.strict.deepStrictEqual(img.getResolution(), [100, -100, 0])
    })

    it(`should reject an invalid opt.typeModel with a clear message and write nothing (R-WT, D12)`, async function() {
        for (let [name, typeModel] of [['proj', 'proj'], ['upper', 'Projected'], ['empty', ''], ['null', null], ['number', 1]]) {
            let fp = path.resolve(fd, `model-${name}.tif`)
            await rejectsWithoutFile(writeTiff(...g, grds, fp, { typeModel }), fp, `opt.typeModel[${typeModel}] must be 'geographic' or 'projected'`)
        }
    })

    it(`should reject opt.typeModel projected without a valid opt.typeGeoKey and write nothing (R-WT, D12)`, async function() {
        for (let [name, typeGeoKey] of [['absent', undefined], ['zero', 0], ['text', 'abc'], ['over-short', 65536]]) {
            let fp = path.resolve(fd, `proj-${name}.tif`)
            await rejectsWithoutFile(writeTiff(...g, grds, fp, { typeModel: 'projected', typeGeoKey }), fp, `opt.typeGeoKey[${typeGeoKey}] must be an integer CRS code from 1 to 65535 when opt.typeModel is 'projected'`)
        }
    })

    it(`should place every pixel center on its interp2Grid node when the range is not a multiple of the spacing (R-WT, D12)`, async function() {
        //interp2Raster範例之範圍: xmax、ymax皆不在格點上, 最上格點y=ymin+(ynum-1)*dy
        let xmin = 121.47
        let xmax = 121.55
        let dx = 0.00979087
        let ymin = 25.02
        let ymax = 25.09
        let dy = 0.004531235
        let funKriging = (pts, vpts) => {
            return vpts.map((p) => ({ ...p, z: Math.round((p.x - xmin) / dx) * 1000 + Math.round((p.y - ymin) / dy) })) //值記錄格點索引ix*1000+iy
        }
        let r = await interp2Grid([{ x: xmin, y: ymin, z: 0 }], xmin, xmax, dx, ymin, ymax, dy, { funKriging, inverseKeyY: true })
        assert.strict.equal(r.xnum, 9)
        assert.strict.equal(r.ynum, 16)
        let fp = path.resolve(fd, 'nodes.tif')
        await writeTiff(r.xmin, r.xmax, r.xnum, r.dx, r.ymin, r.ymax, r.ynum, r.dy, r.grds, fp)
        let { img } = await readTiff(fp)
        let ras = (await img.readRasters())[0]
        let [ox, oy] = img.getOrigin()
        let [rx, ry] = img.getResolution()
        assert.strict.equal(img.pixelIsArea(), true)
        let errMax = 0
        for (let j = 0; j < r.ynum; j++) {
            for (let i = 0; i < r.xnum; i++) {
                let v = ras[j * r.xnum + i]
                let ix = Math.floor(v / 1000)
                let iy = v - ix * 1000
                //PixelIsArea: 像素(i,j)之中心為原點+(i+0.5, j+0.5)*解析度, 須等於其值所屬之格點(xmin+ix*dx, ymin+iy*dy)
                errMax = Math.max(errMax, Math.abs(ox + (i + 0.5) * rx - (xmin + ix * dx)) / dx, Math.abs(oy + (j + 0.5) * ry - (ymin + iy * dy)) / dy)
            }
        }
        assert.ok(errMax < 1e-9, `max pixel center error ${errMax} cells`)
    })

    it(`should coerce numeric strings of the grid arguments as interp2Grid does (R-WT, D12)`, async function() {
        let fp = path.resolve(fd, 'strings.tif')
        await writeTiff('10', '12', '3', '1', '20', '21', '2', '1', grds, fp)
        let { img } = await readTiff(fp)
        assert.strict.equal(img.getWidth(), 3)
        assert.strict.equal(img.getHeight(), 2)
        assert.strict.deepStrictEqual(img.getOrigin(), [9.5, 21.5, 0])
        assert.strict.deepStrictEqual(img.getResolution(), [1, -1, 0])
    })

    it(`should reject invalid grid arguments used for the origin and write nothing (R-WT, D12)`, async function() {
        for (let [name, args, message] of [
            ['xmin', ['abc', 12, 3, 1, 20, 21, 2, 1], 'xmin[abc] is not an effective number'],
            ['ymin', [10, 12, 3, 1, null, 21, 2, 1], 'ymin[null] is not an effective number'],
            ['dx', [10, 12, 3, 0, 20, 21, 2, 1], 'dx[0] is not a positive number'],
            ['dy', [10, 12, 3, 1, 20, 21, 2, -1], 'dy[-1] is not a positive number'],
            ['xnum', [10, 12, 0, 1, 20, 21, 2, 1], 'xnum[0] is not a positive integer'],
            ['ynum', [10, 12, 3, 1, 20, 21, 1.5, 1], 'ynum[1.5] is not a positive integer'],
        ]) {
            let fp = path.resolve(fd, `arg-${name}.tif`)
            await rejectsWithoutFile(writeTiff(...args, grds, fp), fp, message)
        }
    })

    it(`should reject with a clear message and write nothing when process.getBuiltinModule is unavailable (R-WT)`, async function() {
        let fp = path.resolve(fd, 'nobuiltin.tif')
        let gbm = process.getBuiltinModule
        process.getBuiltinModule = undefined
        try {
            await assert.rejects(writeTiff(0, 0.5, 2, 0.5, 0, 0.5, 2, 0.5, [[1, 2], [3, 4]], fp), {
                message: 'writeTiff requires Node.js with process.getBuiltinModule (v20.16+ for 20.x, or v22.3+)',
            })
        }
        finally {
            process.getBuiltinModule = gbm
        }
        assert.strict.equal(fs.existsSync(fp), false)
    })

    it(`should declare a single-band uncompressed float32 image (R-WT)`, async function() {
        let fp = path.resolve(fd, 'format.tif')
        await writeTiff(...g, grds, fp)
        let { img } = await readTiff(fp)
        let fdr = img.getFileDirectory()
        assert.strict.equal(img.getSamplesPerPixel(), 1)
        assert.strict.equal(img.getBitsPerSample(0), 32)
        assert.strict.equal(img.getSampleFormat(0), 3) //3=IEEE浮點數
        assert.strict.equal(fdr.getValue('PhotometricInterpretation'), 1) //1=BlackIsZero(單波段)
        assert.strict.equal(fdr.getValue('Compression'), 1) //1=不壓縮
        assert.strict.deepStrictEqual(Array.from(fdr.getValue('StripByteCounts')), [3 * 2 * 4]) //xnum*ynum*4位元組
    })

    it(`should write pixel values equal to grds, row by row from the top node row (R-WT)`, async function() {
        let fp = path.resolve(fd, 'values.tif')
        await writeTiff(...g, grds, fp)
        let { img } = await readTiff(fp)
        let ras = await img.readRasters()
        assert.strict.equal(ras[0].constructor.name, 'Float32Array')
        assert.strict.deepStrictEqual(Array.from(ras[0]), [1, 2, 3, 4, 5, 255])
    })

    it(`should keep decimals, negatives and values above 255 as float32 (R-WT)`, async function() {
        let fp = path.resolve(fd, 'mixed.tif')
        let grdsMixed = [[-1.5, 0.25, 300.75], [-1024, 65536.5, 0.1]]
        await writeTiff(...g, grdsMixed, fp)
        let { img } = await readTiff(fp)
        let ras = await img.readRasters()
        assert.strict.deepStrictEqual(Array.from(ras[0]), grdsMixed.flat().map(Math.fround)) //0.1非float32可精確表示之值, 讀回為Math.fround(0.1)
        assert.strict.deepStrictEqual(Array.from(ras[0]).slice(0, 5), [-1.5, 0.25, 300.75, -1024, 65536.5])
    })

})
