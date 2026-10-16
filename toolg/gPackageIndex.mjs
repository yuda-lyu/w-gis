import fs from 'fs'
import _ from 'lodash-es'
import getIndexNames from './getIndexNames.mjs'


let fd = './src/'
let fnIndex = 'WGis.mjs'


function main() {
    //由src內取得指定函數檔案, 再自動產生WGeo.mjs, 供rollup編譯之用

    //ns, 名單規則之單一出處為getIndexNames(帳本R-ENTRY-1), 測試亦引用之
    let ns = getIndexNames(fd, fnIndex)

    //scs
    let scs = []
    _.each(ns, function(name) {
        //let sc = `export ${name} from './${name}.mjs'` //stage1語法, 需要安裝@babel/plugin-proposal-export-default-from
        let sc = `export { default as ${name} } from './${name}.mjs'`
        scs.push(sc)
    })

    //merge content, 結尾補換行(eslint之eol-last)
    let c = _.join(scs, '\r\n') + '\r\n'

    //write
    //console.log(c)
    fs.writeFileSync(fd + fnIndex, c, 'utf8')

}
main()
