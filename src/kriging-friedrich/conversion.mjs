/**
 * conversion.mjs — Input flexibility for the JS port of friedrich 0.6.0.
 *
 * Port of `src/conversion/mod.rs`.
 *
 * Rust's `Input` trait uses the type system to distinguish:
 *   - `Vec<f64>`       (single multidimensional point) → output `f64`
 *   - `Vec<Vec<f64>>` (multiple points)               → output `Vec<f64>`
 *   - `DMatrix<f64>`  (nalgebra matrix)               → output `DVector<f64>`
 *
 * JS has no parametric types, so we use **runtime detection** on the first
 * element of the input array:
 *   - `number[]`   where `typeof input[0] === 'number'` → single point
 *   - `number[][]` where `Array.isArray(input[0])`      → multiple points
 *
 * The "isSingle" flag is propagated into GP results so that:
 *   - single-point inputs  → scalar outputs  (`number`)
 *   - multi-point inputs   → vector outputs  (`number[]`)
 *
 * This matches the `OutVector = f64` vs `OutVector = Vec<f64>` distinction
 * of the Rust trait impls.
 *
 * PORT_SPEC §9 (conversion.mjs), §12 item 10 (column-major vs row-major).
 *
 * No internal dependencies (conversion.mjs has no imports per PORT_SPEC §1
 * dependency graph).
 */

// ---------------------------------------------------------------------------
// isSingle
// ---------------------------------------------------------------------------

/**
 * Detect whether `input` represents a **single** multidimensional point.
 *
 * Rules (mirrors Rust trait dispatch):
 *   - `number[]`   (all elements are numbers)  → true   (single point, like `Vec<f64>`)
 *   - `number[][]` (first element is an array)  → false  (multiple points, like `Vec<Vec<f64>>`)
 *
 * An empty array is treated as multi-point (falsy single, matches
 * the `assert_ne!(nb_rows, 0)` guard in the Rust `Vec<Vec<f64>>` impl —
 * empty inputs are rejected upstream anyway).
 *
 * @param {number[]|number[][]} input
 * @returns {boolean}
 */
export function isSingle(input) {
    if (!Array.isArray(input) || input.length === 0) return false;
    return typeof input[0] === 'number';
}

// ---------------------------------------------------------------------------
// toMatrix
// ---------------------------------------------------------------------------

/**
 * Normalise any recognised input form to `number[][]` (one row per sample).
 *
 * | JS input              | Rust analogue         | Result               |
 * |-----------------------|-----------------------|----------------------|
 * | `[a, b, c]`           | `Vec<f64>`            | `[[a, b, c]]` (1×d)  |
 * | `[[a,b],[c,d],…]`     | `Vec<Vec<f64>>`       | unchanged            |
 *
 * Matches `Input::to_dmatrix` (both impls):
 *   - `Vec<f64>` → `DMatrix::from_row_slice(1, m.len(), m)` — wraps in 1 row.
 *   - `Vec<Vec<f64>>` → `DMatrix::from_fn(nb_rows, nb_cols, |r,c| m[r][c])` — direct.
 *
 * @param {number[]|number[][]} input
 * @returns {number[][]}
 */
export function toMatrix(input) {
    if (isSingle(input)) {
        // Single point: wrap into a 1-row matrix.
        return [input.slice()];
    }
    // Multiple points: return a shallow copy of the outer array so callers
    // cannot accidentally mutate the original, while keeping inner row refs.
    return input.slice();
}

// ---------------------------------------------------------------------------
// toVector
// ---------------------------------------------------------------------------

/**
 * Normalise a training-output value to `number[]`.
 *
 * | JS output   | Rust analogue  | Result   |
 * |-------------|----------------|----------|
 * | `number`    | `f64`          | `[v]`    |
 * | `number[]`  | `Vec<f64>`     | unchanged|
 *
 * Matches `Input::to_dvector`:
 *   - `Vec<f64>` impl: `DVector::from_element(1, *v)` — wraps scalar in 1-element vector.
 *   - `Vec<Vec<f64>>` impl: `DVector::from_column_slice(v)` — direct slice.
 *
 * @param {number|number[]} output
 * @returns {number[]}
 */
export function toVector(output) {
    if (typeof output === 'number') {
        return [output];
    }
    return output.slice();
}

// ---------------------------------------------------------------------------
// fromVector
// ---------------------------------------------------------------------------

/**
 * Convert an internal result vector back to the user-facing output type.
 *
 * | `single` | Result          | Rust analogue (`from_dvector`)         |
 * |----------|-----------------|----------------------------------------|
 * | `true`   | `v[0]` (number) | `Vec<f64>` impl: `assert_eq!(nrows,1); v[0]` |
 * | `false`  | `v.slice()`     | `Vec<Vec<f64>>` impl: `v.iter().cloned().collect()` |
 *
 * Note: `predictCovariance` **always** returns `number[][]` and must NOT call
 * this function (PORT_SPEC §9, §6.7).
 *
 * @param {number[]} v      internal result vector
 * @param {boolean}  single true if the original input was a single point
 * @returns {number|number[]}
 */
export function fromVector(v, single) {
    if (single) {
        // Mirrors: assert_eq!(v.nrows(), 1); v[0]
        return v[0];
    }
    return v.slice();
}
