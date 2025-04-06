import get from 'lodash-es/get.js'
import floor from 'lodash-es/floor.js'
import cdbl from 'wsemi/src/cdbl.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isab from 'wsemi/src/isab.mjs'
import isu8arr from 'wsemi/src/isu8arr.mjs'
import isblob from 'wsemi/src/isblob.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import { fromArrayBuffer, fromBlob } from 'geotiff'
import ptXYtoObj from './ptXYtoObj.mjs'


/**
 * 查詢點陣列[x,y]或點物件{x,y}於指定Tiff點陣圖內數值，若無則回傳def值
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/buildFindPointInTiff.test.mjs Github}
 * @memberOf w-gis
 * @returns {Object} 回傳函數物件，包含init、isInit、getPoint函數。init為初始化，輸入inp與opt，無輸出，isInit為回傳是否初始化布林值，無輸入。getPoint為查詢點位於點陣圖內數值，輸入p與opt。
 * @example
 *
 * import b642u8arr from 'wsemi/src/b642u8arr.mjs'
 * import buildFindPointInTiff from 'wsemi/src/buildFindPointInTiff.mjs'
 *
 * let p
 * let r
 *
 * let b64Tif = `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`
 * let u8a = b642u8arr(b64Tif)
 * // lon 121.51338 121.51847
 * // lat 25.046 25.05
 *
 * let BD = buildFindPointInTiff
 * let bd = new BD()
 * await bd.init(u8a)
 *
 * p = [121.51353, 25.04987]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 3.1814956665039062
 *
 * p = [121.51835, 25.04608]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 2.9800331592559814
 *
 * p = [121.51353, 25.05016]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 'unknow'
 *
 * p = [121.51353, 25.05016]
 * r = await bd.getPoint(p, { def: '未知' })
 * console.log(r)
 * // => '未知'
 *
 */
function Build() {
    let bInit = false
    let width = null
    let height = null
    let origin = null
    let resolution = null
    let image = null

    async function init(inp, opt = {}) {

        //type
        let type = get(opt, 'type', '')

        let cvAb = async (inp) => {

            // let u8a = fs.readFileSync(fp)
            // let ab = u8a.buffer
            // inp = ab

            //fromArrayBuffer
            let r = await fromArrayBuffer(inp)

            return r
        }

        let cvBlob = async (inp) => {

            //fromBlob
            let r = await fromBlob(inp)

            return r
        }

        let cvU8a = async (inp) => {

            //ab
            let ab = inp.buffer

            //fromArrayBuffer
            let r = await fromArrayBuffer(ab)

            return r
        }

        //tiff
        let tiff = null
        if (isestr(type)) {
            if (type === 'ab') {
                tiff = await cvAb(inp)
            }
            else if (type === 'u8a') {
                tiff = await cvU8a(inp)
            }
            else if (type === 'blob') {
                tiff = await cvBlob(inp)
            }
            else {
                throw new Error(`invalid type[${type}]`)
            }
        }
        else if (isab(inp)) {
            tiff = await cvAb(inp)
        }
        else if (isu8arr(inp)) {
            tiff = await cvU8a(inp)
        }
        else if (isblob(inp)) {
            tiff = await cvBlob(inp)
        }
        else {
            throw new Error(`inp is not an ArrayBuffer or a Blob`)
        }

        //getImage
        image = await tiff.getImage()

        //width, height
        width = image.getWidth()
        height = image.getHeight()
        // console.log('width', width, 'height', height)

        //origin
        origin = image.getOrigin()
        // console.log('origin', origin)

        //resolution
        resolution = image.getResolution()
        // console.log('resolution', resolution)

        //samplesPerPixel
        // let samplesPerPixel = image.getSamplesPerPixel()
        // console.log('samplesPerPixel', samplesPerPixel)

        //bbox
        // let bbox = image.getBoundingBox()
        // console.log('bbox', bbox)

        //bInit
        bInit = true

    }

    function isInit() {
        return bInit
    }

    async function getPoint(p, opt = {}) {

        //check
        if (!bInit) {
            throw new Error('no init')
        }

        //pt
        let pt = ptXYtoObj(p, opt)

        //check
        if (!iseobj(pt)) {
            throw new Error('p need to be [x,y] or {x,y}')
        }

        //x
        let x = get(pt, 'x', '')
        if (!isnum(x)) {
            throw new Error('p[0] or p.x is not an effective number')
        }
        x = cdbl(x)

        //y
        let y = get(pt, 'y', '')
        if (!isnum(y)) {
            throw new Error('p[1] or p.y is not an effective number')
        }
        y = cdbl(y)

        //def
        let def = get(opt, 'def', '')
        if (!isestr(def)) {
            def = 'unknow'
        }

        let _x = x - origin[0]
        let _y = y - origin[1]
        let rx = _x / resolution[0]
        let ry = _y / resolution[1]
        let ix = floor(rx)
        let iy = floor(ry)
        // console.log('ix', ix, 'iy', iy)

        //check
        if (ix < 0 || iy < 0 || ix > (width - 1) || iy > (height - 1)) {
            return def
        }

        //intrep
        let data = await image.readRasters({ window: [ix, iy, ix + 1, iy + 1] })
        // console.log('data', data)

        //v
        let v = def
        let _v = get(data, '0.0', '') //回傳為陣列, 第1個[0]是R, [1]為G, [2]為B
        if (isnum(_v)) {
            v = cdbl(_v)
        }

        return v
    }

    return {
        init,
        isInit,
        getPoint,
    }
}


export default Build
