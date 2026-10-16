import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { isBuiltin } from 'module'
import { pathToFileURL } from 'url'
import getIndexNames from '../toolg/getIndexNames.mjs'


//主入口(src)之可載入性, 對應規則帳本R-ENTRY-1、R-ENTRY-4
describe(`unit-entrySrc`, function() {

    let fdSrc = path.resolve('./src')
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

})
