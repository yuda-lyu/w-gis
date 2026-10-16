import get from 'lodash-es/get.js'
import isnum from 'wsemi/src/isnum.mjs'
import ispint from 'wsemi/src/ispint.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import cint from 'wsemi/src/cint.mjs'
import { writeArrayBuffer } from 'geotiff'


/**
 * 將規則網格數據寫出為GeoTIFF檔案, 僅限Node.js使用
 *
 * 須於具process.getBuiltinModule之Node.js執行(v20.16以上之20.x, 或v22.3以上), 否則(含瀏覽器)回傳reject且不寫檔
 *
 * 網格同interp2Grid: 格點座標為x=xmin+ix*dx(ix為0至xnum-1)、y=ymin+iy*dy(iy為0至ynum-1), 值為格點上之值, grds第0列為最上方之格點列(y=ymin+(ynum-1)*dy); interp2Raster之回傳可直接使用, interp2Grid之回傳須以opt.inverseKeyY=true產生, 否則上下顛倒
 *
 * 輸出之像素中心即格點: 寫入GTRasterTypeGeoKey=1(PixelIsArea), 原點(ModelTiepoint, 左上像素之左上角)為左上格點各外推半格, 即(xmin-dx/2, ymin+(ynum-0.5)*dy); 不採PixelIsPoint, 因GDAL(QGIS)雖會依其平移半格, 但geotiff.js之getOrigin與getBoundingBox、OpenLayers、georaster皆以原點為左上角而不平移, 會差半格
 *
 * 座標系統: opt.typeModel為'geographic'時寫入GTModelTypeGeoKey=2與GeographicTypeGeoKey(GeoTIFF 1.1之GeodeticCRSGeoKey), 為'projected'時寫入GTModelTypeGeoKey=1與ProjectedCSTypeGeoKey(GeoTIFF 1.1之ProjectedCRSGeoKey), 值皆為opt.typeGeoKey; 不檢查代碼是否確為地理或投影座標系統
 *
 * 輸出為單波段、不壓縮之32位元浮點數(IEEE float32)GeoTIFF, 像素值即grds之值(可為小數、負數或大於255), 惟精度為float32(例如0.1讀回為0.10000000149011612)
 *
 * grds之值依Float32Array轉型: null寫為0, undefined與NaN寫為NaN; 不寫NoData標籤(GDAL_NODATA)
 *
 * 參數無效時回傳reject且不寫檔: xmin、ymin非數字, dx、dy非正數, xnum、ynum非正整數, opt.typeModel非'geographic'或'projected', 或opt.typeModel為'projected'而opt.typeGeoKey非1至65535之整數
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/unit-writeTiff.test.mjs Github}
 * @memberOf w-gis
 * @param {Number} xmin 輸入x方向最小值數字, 為最左格點之x座標
 * @param {Number} xmax 輸入x方向最大值數字, 為網格範圍上限, 不影響輸出
 * @param {Integer} xnum 輸入x方向格點數正整數, 為影像寬度
 * @param {Number} dx 輸入x方向格點間距正數, 為像素寬度
 * @param {Number} ymin 輸入y方向最小值數字, 為最下格點之y座標
 * @param {Number} ymax 輸入y方向最大值數字, 為網格範圍上限, 不影響輸出
 * @param {Integer} ynum 輸入y方向格點數正整數, 為影像高度
 * @param {Number} dy 輸入y方向格點間距正數, 為像素高度
 * @param {Array} grds 輸入網格值二維陣列, 為ynum列xnum行, grds[r][ix]為格點(x=xmin+ix*dx, y=ymin+(ynum-1-r)*dy)之值
 * @param {String} fpOut 輸入輸出檔案路徑字串
 * @param {Object} [opt={}] 輸入設定物件, 預設{}
 * @param {String} [opt.typeModel='geographic'] 輸入座標系統種類字串, 可選'geographic'(地理座標, 經緯度)、'projected'(投影座標, 例如TWD97 TM2), 預設'geographic'
 * @param {Integer} [opt.typeGeoKey=4326] 輸入座標系統之EPSG代碼整數(1至65535), opt.typeModel為'geographic'時未給或無效則使用4326(WGS84), 為'projected'時須給(例如3826為TWD97 TM2 121分帶)
 * @returns {Promise} 回傳Promise, resolve代表已寫出檔案, reject為錯誤
 * @example
 *
 * async function test() {
 *
 *     //3行2列之網格, 格點x為10、11、12, y為20、21, 第0列為上方y=21之格點列
 *     let grds = [
 *         [1, 2, 3],
 *         [4, 5, 255],
 *     ]
 *     await writeTiff(10, 12, 3, 1, 20, 21, 2, 1, grds, './grid.tif')
 *     // => 寫出./grid.tif, 單波段float32, 寬3高2, 原點[9.5,21.5], 解析度[1,-1], GeoKey為{GTModelTypeGeoKey:2, GTRasterTypeGeoKey:1, GeographicTypeGeoKey:4326}, 讀回之像素值依序為[1, 2, 3, 4, 5, 255]
 *
 *     //投影座標(TWD97 TM2 121分帶), 格點x為300000、300100、300200, y為2770000、2770100
 *     await writeTiff(300000, 300200, 3, 100, 2770000, 2770100, 2, 100, grds, './grid-tm2.tif', { typeModel: 'projected', typeGeoKey: 3826 })
 *     // => 寫出./grid-tm2.tif, 原點[299950,2770150], 解析度[100,-100], GeoKey為{GTModelTypeGeoKey:1, GTRasterTypeGeoKey:1, ProjectedCSTypeGeoKey:3826}
 *
 * }
 * test()
 *     .catch((err) => {
 *         console.log(err)
 *     })
 *
 */
async function writeTiff(xmin, xmax, xnum, dx, ymin, ymax, ynum, dy, grds, fpOut, opt = {}) {

    //fs, Node專用: 不以靜態import取得, 改於呼叫時以process.getBuiltinModule取得(帳本R-WT、R-ENTRY-4), 使主入口與索引不靜態引用Node內建而可被bundler打包
    let fs = (typeof process !== 'undefined' && typeof process.getBuiltinModule === 'function') ? process.getBuiltinModule('fs') : null
    if (!fs) {
        throw new Error('writeTiff requires Node.js with process.getBuiltinModule (v20.16+ for 20.x, or v22.3+)')
    }

    //check xmin
    if (!isnum(xmin)) {
        throw new Error(`xmin[${xmin}] is not an effective number`)
    }
    xmin = cdbl(xmin)

    //check xnum
    if (!ispint(xnum)) {
        throw new Error(`xnum[${xnum}] is not a positive integer`)
    }
    xnum = cint(xnum)

    //check dx
    if (!isnum(dx) || cdbl(dx) <= 0) {
        throw new Error(`dx[${dx}] is not a positive number`)
    }
    dx = cdbl(dx)

    //check ymin
    if (!isnum(ymin)) {
        throw new Error(`ymin[${ymin}] is not an effective number`)
    }
    ymin = cdbl(ymin)

    //check ynum
    if (!ispint(ynum)) {
        throw new Error(`ynum[${ynum}] is not a positive integer`)
    }
    ynum = cint(ynum)

    //check dy
    if (!isnum(dy) || cdbl(dy) <= 0) {
        throw new Error(`dy[${dy}] is not a positive number`)
    }
    dy = cdbl(dy)

    //typeModel
    let typeModel = get(opt, 'typeModel', 'geographic')
    if (typeModel !== 'geographic' && typeModel !== 'projected') {
        throw new Error(`opt.typeModel[${typeModel}] must be 'geographic' or 'projected'`)
    }

    //typeGeoKey, GeoKey值為SHORT, 故有效代碼為1至65535之整數
    let typeGeoKey = get(opt, 'typeGeoKey')
    if (!ispint(typeGeoKey) || cint(typeGeoKey) > 65535) {
        if (typeModel === 'projected') {
            throw new Error(`opt.typeGeoKey[${typeGeoKey}] must be an integer CRS code from 1 to 65535 when opt.typeModel is 'projected'`)
        }
        typeGeoKey = 4326 //4326=WGS84
    }
    typeGeoKey = cint(typeGeoKey)

    //width
    let width = xnum
    let height = ynum
    // console.log('width', width, 'height', height)

    //x0, y0, 網格同interp2Grid: 格點為x=xmin+ix*dx、y=ymin+iy*dy, grds第0列為最上方之格點列y=ymin+(ynum-1)*dy, xmax與ymax僅為範圍上限不一定落在格點上故不使用
    //PixelIsArea之ModelTiepoint為左上像素之左上角, 故由左上格點各外推半格, 使像素中心即格點
    let x0 = xmin - dx / 2
    let y0 = ymin + (ynum - 0.5) * dy

    //metadata
    let metadata = {
        width,
        height,
        GTModelTypeGeoKey: typeModel === 'projected' ? 1 : 2, //1=投影座標系統, 2=地理座標系統, GeoTIFF 1.1之Requirement 8.1規定須有
        GTRasterTypeGeoKey: 1, //1=PixelIsArea, 不採2(PixelIsPoint): geotiff.js之getOrigin與getBoundingBox、OpenLayers、georaster皆不依此鍵平移, 會差半格
        ModelPixelScale: [dx, dy, 0],
        ModelTiepoint: [0, 0, 0, x0, y0, 0],
        BitsPerSample: [32], //32位元, 須與資料vs(Float32Array)一致: geotiff依值之型別寫入, 宣告不符則讀回之值錯誤
        SampleFormat: [3], //3=IEEE浮點數
        PhotometricInterpretation: 1, //1=灰階(BlackIsZero), 2=RGB
        //SamplesPerPixel由geotiff依波段數自動給[1]; 不壓縮(Compression=1, geotiff預設)故不需Predictor; 無NoData參數故不寫GDAL_NODATA
    }
    if (typeModel === 'projected') {
        metadata.ProjectedCSTypeGeoKey = typeGeoKey //GeoTIFF 1.1之ProjectedCRSGeoKey
    }
    else {
        metadata.GeographicTypeGeoKey = typeGeoKey //GeoTIFF 1.1之GeodeticCRSGeoKey
    }

    //vs
    let vs = new Float32Array(width * height)
    if (true) {
        let k = -1
        for (let iy = 0; iy < height; iy++) {
            for (let ix = 0; ix < width; ix++) {
                k++
                vs[k] = grds[iy][ix]
                // console.log('iy', iy, 'ix', ix, 'z', vs[k])
            }
        }
    }
    // console.log('vs', take(vs, 5), size(vs))

    //tiff
    let tiff = await writeArrayBuffer(vs, metadata)

    //writeFileSync
    fs.writeFileSync(fpOut, Buffer.from(tiff))

}


export default writeTiff
