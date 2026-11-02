import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { isBuiltin } from 'module'
import { pathToFileURL } from 'url'
import runNode from './tools/runNode.mjs'
import getIndexNames from './tools/getIndexNames.mjs'


//主入口(src)之可載入性, 對應規則帳本R-ENTRY-1、R-ENTRY-4
describe(`unit-entrySrc`, function() {

    let fdSrc = path.resolve('./src')
    let fdTmp = path.resolve('./test/_tmp/unit-entrySrc')
    let names = getIndexNames('./src/')

    //取靜態引用(去除註解後之import/export from)
    function getSpecs(fp) {
        let c = fs.readFileSync(fp, 'utf8')
        c = c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
        let specs = []
        let re = /\b(?:import|export)\s[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]/g
        let m
        while ((m = re.exec(c))) {
            specs.push(m[1] || m[2])
        }
        return specs
    }

    after(function() {
        fs.rmSync(fdTmp, { recursive: true, force: true })
    })

    it(`should import src/WGis.mjs and export exactly the index names, functions except importTurf object (R-ENTRY-1)`, async function() {
        let m = await import(pathToFileURL(path.resolve(fdSrc, 'WGis.mjs')).href)
        assert.strict.deepStrictEqual(Object.keys(m).sort(), [...names].sort())
        for (let k of names) {
            let want = k === 'importTurf' ? 'object' : 'function'
            let got = m[k] === null ? 'null' : typeof m[k]
            assert.strict.equal(got, want, `export ${k}`)
        }
        assert.strict.equal(typeof m.importTurf.area, 'function') //Node下為@turf/turf之命名空間
    })

    it(`should import each src/<name>.mjs whose default is the same reference as the index export (R-ENTRY-1)`, async function() {
        let idx = await import(pathToFileURL(path.resolve(fdSrc, 'WGis.mjs')).href)
        for (let k of names) {
            let m = await import(pathToFileURL(path.resolve(fdSrc, `${k}.mjs`)).href)
            assert.strict.equal(m.default, idx[k], `src/${k}.mjs`)
        }
    })

    it(`should not statically import Node built-in modules from any module reachable from src/WGis.mjs (R-ENTRY-4)`, function() {
        let bad = []
        let seen = new Set()
        let stack = [path.resolve(fdSrc, 'WGis.mjs')]
        while (stack.length > 0) {
            let fp = stack.pop()
            if (seen.has(fp)) {
                continue
            }
            seen.add(fp)
            for (let spec of getSpecs(fp)) {
                if (spec.startsWith('.')) {
                    stack.push(path.resolve(path.dirname(fp), spec))
                }
                else if (isBuiltin(spec)) {
                    bad.push(`${path.relative(fdSrc, fp).replace(/\\/g, '/')} -> ${spec}`)
                }
            }
        }
        assert.strict.ok(seen.size > names.length) //含內部模組
        assert.strict.deepStrictEqual(bad, [])
    })

    it(`should generate the committed src/WGis.mjs by running toolg/gPackageIndex.mjs in a copy (R-ENTRY-1)`, async function() {
        this.timeout(60000)

        //副本: 只複製src頂層檔案(索引只取頂層)與toolg, 副本之索引先換成佔位內容(須被腳本覆寫, 且索引自身不得列入名單), 再以副本為cwd執行, 腳本以cwd相對之./src/運作
        fs.rmSync(fdTmp, { recursive: true, force: true })
        fs.mkdirSync(path.resolve(fdTmp, 'src'), { recursive: true })
        fs.cpSync(path.resolve('./toolg'), path.resolve(fdTmp, 'toolg'), { recursive: true })
        for (let n of fs.readdirSync(fdSrc, { withFileTypes: true })) {
            if (n.isFile()) {
                fs.copyFileSync(path.resolve(fdSrc, n.name), path.resolve(fdTmp, 'src', n.name))
            }
        }
        fs.writeFileSync(path.resolve(fdTmp, 'src', 'WGis.mjs'), '//placeholder\r\n', 'utf8')

        let r = await runNode(['./toolg/gPackageIndex.mjs'], fdTmp)
        assert.strict.equal(r.code, 0, r.out.slice(-2000))

        //產生之索引與repo已提交者位元組相同, 且其匯出名單等於獨立判準之名單
        let gen = fs.readFileSync(path.resolve(fdTmp, 'src', 'WGis.mjs'))
        assert.strict.ok(gen.equals(fs.readFileSync(path.resolve(fdSrc, 'WGis.mjs'))), 'generated index differs from src/WGis.mjs')
        let got = [...gen.toString('utf8').matchAll(/export \{ default as (\w+) \} from '\.\/(\w+)\.mjs'/g)].map((m) => {
            assert.strict.equal(m[1], m[2])
            return m[1]
        })
        assert.strict.deepStrictEqual([...got].sort(), [...getIndexNames(path.resolve(fdTmp, 'src') + '/')].sort())
    })

})
