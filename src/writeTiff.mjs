import fs from 'fs'
import get from 'lodash-es/get.js'
import ispint from 'wsemi/src/ispint.mjs'
import cint from 'wsemi/src/cint.mjs'
import { writeArrayBuffer } from 'geotiff'


async function writeTiff(xmin, xmax, xnum, dx, ymin, ymax, ynum, dy, grds, fpOut, opt = {}) {

    //typeGeoKey
    let typeGeoKey = get(opt, 'typeGeoKey')
    if (!ispint(typeGeoKey)) {
        typeGeoKey = 4326 //4326=WGS84
    }
    typeGeoKey = cint(typeGeoKey)

    //width
    let width = xnum
    let height = ynum
    // console.log('width', width, 'height', height)

    //metadata
    let metadata = {
        width,
        height,
        GeographicTypeGeoKey: typeGeoKey,
        ModelPixelScale: [dx, dy, 0],
        ModelTiepoint: [0, 0, 0, xmin, ymax, 0],
        BitsPerSample: [8], //8=8位元(0~255)
        SampleFormat: [1], //1=無符號整數
        PhotometricInterpretation: 1, //1=灰階, 2=RGB
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

    //writeFileSync, 輸出至QGIS時tiff展示時, 得要自己再調整顏色顯示範圍成為0~255
    fs.writeFileSync(fpOut, Buffer.from(tiff))

}


export default writeTiff
