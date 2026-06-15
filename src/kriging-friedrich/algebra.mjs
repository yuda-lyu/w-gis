//! Linear algebra primitives (pure JS, zero dependencies)
//!
//! Port of `friedrich 0.6.0`:
//!   - `src/algebra/mod.rs`              (covariance-matrix helpers)
//!   - `src/algebra/extendable_matrix.rs` (EMatrix / EVector → ExtendableMatrix / ExtendableVector)
//!   - the slice of `nalgebra` that friedrich actually uses
//!     (matrix / vector ops, Cholesky decomposition, triangular solves,
//!      Cholesky solve / inverse, least-squares).
//!
//! Data representation (see PORT_SPEC §2):
//!   - vector = number[]
//!   - matrix = number[][] (row-major; matrix[r][c] = row r, col c)
//!
//! All matrix math here is row-major; we do NOT emulate nalgebra's
//! column-major memory layout, only its mathematical semantics.

//=============================================================================
// BASIC VECTOR OPERATIONS (input: number[])
//=============================================================================

/**
 * Dot product Σ aᵢ·bᵢ.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function dot(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
}

/**
 * Element-wise subtraction a − b.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 */
export function subVec(a, b) {
    const out = new Array(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
    return out;
}

/**
 * Element-wise addition a + b.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 */
export function addVec(a, b) {
    const out = new Array(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i];
    return out;
}

/**
 * Scalar multiplication s·a.
 * @param {number[]} a
 * @param {number} s
 * @returns {number[]}
 */
export function scaleVec(a, s) {
    const out = new Array(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[i] * s;
    return out;
}

/**
 * Euclidean norm sqrt(Σ aᵢ²).
 * @param {number[]} a
 * @returns {number}
 */
export function norm(a) {
    return Math.sqrt(normSquared(a));
}

/**
 * Squared Euclidean norm Σ aᵢ².
 * @param {number[]} a
 * @returns {number}
 */
export function normSquared(a) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * a[i];
    return s;
}

/**
 * Numerically stable sqrt(a² + b²) (matches Rust f64::hypot).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function hypot(a, b) {
    return Math.hypot(a, b);
}

//=============================================================================
// MATRIX / MATRIX-VECTOR OPERATIONS (matrix = number[][], one row per row)
//=============================================================================

/**
 * Matrix product A(m×k) · B(k×n) → (m×n).
 * @param {number[][]} A
 * @param {number[][]} B
 * @returns {number[][]}
 */
export function matMul(A, B) {
    const m = A.length;
    const k = A[0].length;
    const n = B[0].length;
    const out = new Array(m);
    for (let i = 0; i < m; i++) {
        const Ai = A[i];
        const row = new Array(n).fill(0);
        for (let p = 0; p < k; p++) {
            const a = Ai[p];
            const Bp = B[p];
            for (let j = 0; j < n; j++) row[j] += a * Bp[j];
        }
        out[i] = row;
    }
    return out;
}

/**
 * Matrix-vector product A(m×n) · x(n) → number[](m).
 * @param {number[][]} A
 * @param {number[]} x
 * @returns {number[]}
 */
export function matVec(A, x) {
    const m = A.length;
    const out = new Array(m);
    for (let i = 0; i < m; i++) {
        const Ai = A[i];
        let s = 0;
        for (let j = 0; j < Ai.length; j++) s += Ai[j] * x[j];
        out[i] = s;
    }
    return out;
}

/**
 * Transposed matrix-vector product Aᵀ(n×m) · x(m) → number[](n).
 * Equivalent to transpose(A)·x without materializing the transpose.
 * @param {number[][]} A  (m×n)
 * @param {number[]} x    (m)
 * @returns {number[]}    (n)
 */
export function matTransposeVec(A, x) {
    const m = A.length;
    const n = A[0].length;
    const out = new Array(n).fill(0);
    for (let i = 0; i < m; i++) {
        const Ai = A[i];
        const xi = x[i];
        for (let j = 0; j < n; j++) out[j] += Ai[j] * xi;
    }
    return out;
}

/**
 * Transpose of A.
 * @param {number[][]} A
 * @returns {number[][]}
 */
export function transpose(A) {
    const m = A.length;
    const n = A[0].length;
    const out = new Array(n);
    for (let j = 0; j < n; j++) {
        const col = new Array(m);
        for (let i = 0; i < m; i++) col[i] = A[i][j];
        out[j] = col;
    }
    return out;
}

/**
 * Element-wise matrix subtraction A − B.
 * @param {number[][]} A
 * @param {number[][]} B
 * @returns {number[][]}
 */
export function matSub(A, B) {
    const m = A.length;
    const out = new Array(m);
    for (let i = 0; i < m; i++) {
        const n = A[i].length;
        const row = new Array(n);
        for (let j = 0; j < n; j++) row[j] = A[i][j] - B[i][j];
        out[i] = row;
    }
    return out;
}

/**
 * n×n identity matrix.
 * @param {number} n
 * @returns {number[][]}
 */
export function identity(n) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
        const row = new Array(n).fill(0);
        row[i] = 1;
        out[i] = row;
    }
    return out;
}

/**
 * m×n zero matrix.
 * @param {number} m
 * @param {number} n
 * @returns {number[][]}
 */
export function zeros(m, n) {
    const out = new Array(m);
    for (let i = 0; i < m; i++) out[i] = new Array(n).fill(0);
    return out;
}

/**
 * Diagonal of a square (or rectangular) matrix.
 * @param {number[][]} A
 * @returns {number[]}
 */
export function diagonal(A) {
    const n = Math.min(A.length, A[0].length);
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = A[i][i];
    return out;
}

/**
 * Trace Σ Aᵢᵢ (also used as generic diagonal sum, e.g. trace(A⁻¹)).
 * @param {number[][]} A
 * @returns {number}
 */
export function trace(A) {
    const n = Math.min(A.length, A[0].length);
    let s = 0;
    for (let i = 0; i < n; i++) s += A[i][i];
    return s;
}

//=============================================================================
// CHOLESKY DECOMPOSITION & TRIANGULAR SOLVES
//=============================================================================

/**
 * Cholesky decomposition of a symmetric positive-definite matrix A(n×n),
 * returning the lower-triangular factor L such that A = L·Lᵀ.
 *
 * Failure (non-positive-definite) behaviour:
 *   - `epsilon === null` → throw Error (matches Rust `.expect()` panic).
 *   - `epsilon` a finite positive number → mimic nalgebra
 *     `Cholesky::new_with_substitute`: whenever a diagonal pivot dⱼ ≤ 0,
 *     substitute `epsilon` for that pivot and keep going. If even the
 *     substitute fails to keep things real (cannot happen for epsilon > 0),
 *     throw.
 *
 * Reads only the lower triangle of A (the upper triangle is ignored), matching
 * nalgebra's behaviour of using only the lower-triangular part.
 *
 * @param {number[][]} A
 * @param {number|null} [epsilon=null]
 * @returns {number[][]} lower-triangular L
 */
export function cholesky(A, epsilon = null) {
    const n = A.length;
    // L starts as a zero matrix; we fill the lower triangle column by column,
    // mirroring nalgebra's in-place algorithm (lower-triangular, column-major).
    const L = zeros(n, n);

    for (let j = 0; j < n; j++) {
        // Diagonal pivot: A[j][j] − Σ_{k<j} L[j][k]²
        let diag = A[j][j];
        for (let k = 0; k < j; k++) diag -= L[j][k] * L[j][k];

        if (epsilon === null) {
            if (!(diag > 0)) {
                throw new Error(
                    "Cholesky decomposition failed, consider setting `cholesky_epsilon` via `GaussianProcessBuilder`"
                );
            }
        } else if (!(diag > 0)) {
            // new_with_substitute: replace the non-positive pivot with epsilon.
            diag = epsilon;
        }

        const ljj = Math.sqrt(diag);
        L[j][j] = ljj;

        // Below-diagonal entries of column j:
        //   L[i][j] = (A[i][j] − Σ_{k<j} L[i][k]·L[j][k]) / L[j][j]
        for (let i = j + 1; i < n; i++) {
            let s = A[i][j];
            for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
            L[i][j] = s / ljj;
        }
    }

    return L;
}

/**
 * Solve L·X = B where L is lower-triangular (forward substitution).
 * B may be a vector (number[]) → solves one RHS, or a matrix (number[][])
 * → solves column by column (each column is one RHS), returning the same shape.
 * Matches nalgebra `solve_lower_triangular`.
 *
 * @param {number[][]} L lower-triangular
 * @param {number[]|number[][]} B
 * @returns {number[]|number[][]}
 */
export function solveLowerTri(L, B) {
    if (Array.isArray(B[0])) {
        // B is a matrix: solve each column.
        const n = L.length;
        const ncols = B[0].length;
        const X = zeros(n, ncols);
        for (let c = 0; c < ncols; c++) {
            const col = new Array(n);
            for (let i = 0; i < n; i++) col[i] = B[i][c];
            const sol = solveLowerTriVec(L, col);
            for (let i = 0; i < n; i++) X[i][c] = sol[i];
        }
        return X;
    }
    return solveLowerTriVec(L, B);
}

/**
 * Forward substitution for a single RHS vector: solve L·x = b.
 * @param {number[][]} L lower-triangular
 * @param {number[]} b
 * @returns {number[]}
 */
function solveLowerTriVec(L, b) {
    const n = L.length;
    const x = new Array(n);
    for (let i = 0; i < n; i++) {
        let s = b[i];
        const Li = L[i];
        for (let k = 0; k < i; k++) s -= Li[k] * x[k];
        x[i] = s / Li[i];
    }
    return x;
}

/**
 * Solve U·X = B where U is upper-triangular (back substitution).
 * In friedrich the upper-triangular system is U = Lᵀ.
 * B may be number[] or number[][] (column-wise), returning the same shape.
 *
 * @param {number[][]} U upper-triangular
 * @param {number[]|number[][]} B
 * @returns {number[]|number[][]}
 */
export function solveUpperTri(U, B) {
    if (Array.isArray(B[0])) {
        const n = U.length;
        const ncols = B[0].length;
        const X = zeros(n, ncols);
        for (let c = 0; c < ncols; c++) {
            const col = new Array(n);
            for (let i = 0; i < n; i++) col[i] = B[i][c];
            const sol = solveUpperTriVec(U, col);
            for (let i = 0; i < n; i++) X[i][c] = sol[i];
        }
        return X;
    }
    return solveUpperTriVec(U, B);
}

/**
 * Back substitution for a single RHS vector: solve U·x = b.
 * @param {number[][]} U upper-triangular
 * @param {number[]} b
 * @returns {number[]}
 */
function solveUpperTriVec(U, b) {
    const n = U.length;
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let s = b[i];
        const Ui = U[i];
        for (let k = i + 1; k < n; k++) s -= Ui[k] * x[k];
        x[i] = s / Ui[i];
    }
    return x;
}

/**
 * Solve A·X = B given the lower-triangular Cholesky factor L (A = L·Lᵀ):
 * first solve L·Y = B (forward), then Lᵀ·X = Y (back).
 * Matches nalgebra `Cholesky::solve`.
 *
 * @param {number[][]} L lower-triangular factor
 * @param {number[]|number[][]} B
 * @returns {number[]|number[][]}
 */
export function choleskySolve(L, B) {
    const y = solveLowerTri(L, B);
    const Lt = transpose(L);
    return solveUpperTri(Lt, y);
}

/**
 * Compute A⁻¹ = (L·Lᵀ)⁻¹ from the lower-triangular Cholesky factor L,
 * by solving A·X = I. Matches nalgebra `Cholesky::inverse`.
 *
 * @param {number[][]} L lower-triangular factor
 * @returns {number[][]} A⁻¹
 */
export function choleskyInverse(L) {
    const n = L.length;
    return choleskySolve(L, identity(n));
}

//=============================================================================
// MISC
//=============================================================================

/**
 * Return a copy of A with `value` added to its diagonal (Aᵢᵢ += value).
 * Does not mutate the input.
 * @param {number[][]} A
 * @param {number} value
 * @returns {number[][]}
 */
export function addToDiagonal(A, value) {
    const out = A.map((row) => row.slice());
    const n = Math.min(out.length, out[0].length);
    for (let i = 0; i < n; i++) out[i][i] += value;
    return out;
}

/**
 * Least-squares solve of min ‖A·x − b‖ (used by LinearPrior.fit).
 * A may be non-square (m×n). Implemented via the normal equations
 * (AᵀA)·x = Aᵀb solved by Cholesky; falls back to a regularized solve if
 * AᵀA is (numerically) singular, approximating SVD-with-threshold-0 well
 * enough for the LinearPrior integration tests.
 *
 * Rust uses SVD solve (threshold 0); PORT_SPEC §12.12 permits the normal-
 * equations approximation here.
 *
 * @param {number[][]} A (m×n)
 * @param {number[]} b   (m)
 * @returns {number[]}   (n)
 */
export function lstsqSolve(A, b) {
    const m = A.length;
    const n = A[0].length;

    // Normal equations: ATA (n×n) = Aᵀ·A,  ATb (n) = Aᵀ·b
    const ATA = zeros(n, n);
    const ATb = new Array(n).fill(0);
    for (let i = 0; i < m; i++) {
        const Ai = A[i];
        const bi = b[i];
        for (let p = 0; p < n; p++) {
            const aip = Ai[p];
            ATb[p] += aip * bi;
            const row = ATA[p];
            for (let q = p; q < n; q++) {
                row[q] += aip * Ai[q];
            }
        }
    }
    // Symmetrize the lower triangle.
    for (let p = 0; p < n; p++) {
        for (let q = p + 1; q < n; q++) ATA[q][p] = ATA[p][q];
    }

    // Try a plain Cholesky solve; if AᵀA is not positive-definite (rank
    // deficient / numerically singular), add a tiny ridge and retry. This is
    // an approximation of SVD-with-threshold-0 (the pseudo-inverse picks the
    // minimum-norm solution; the ridge nudges us toward it).
    try {
        const L = cholesky(ATA, null);
        return choleskySolve(L, ATb);
    } catch (_e) {
        const ridge = 1e-12;
        const reg = addToDiagonal(ATA, ridge);
        const L = cholesky(reg, 1e-300);
        return choleskySolve(L, ATb);
    }
}

//=============================================================================
// EXTENDABLE MATRIX / VECTOR  (EMatrix / EVector)
//=============================================================================

/**
 * A matrix that can grow by appending rows.
 *
 * JS port note: we simply `push` rows. The Rust version pre-allocates with a
 * 1.5× capacity-doubling strategy purely for memory efficiency; that has no
 * effect on the numerical result, so we omit it (PORT_SPEC §2.3).
 */
export class ExtendableMatrix {
    /**
     * @param {number[][]} data
     */
    constructor(data) {
        /** @type {number[][]} */
        this.data = data;
    }

    /** Number of rows. @returns {number} */
    get nrows() {
        return this.data.length;
    }

    /** Number of columns. @returns {number} */
    get ncols() {
        return this.data.length === 0 ? 0 : this.data[0].length;
    }

    /**
     * Current data as number[][] (internal reference; caller must treat as read-only).
     * @returns {number[][]}
     */
    asMatrix() {
        return this.data;
    }

    /**
     * Append rows at the bottom (in place).
     * @param {number[][]} rows
     */
    addRows(rows) {
        for (let i = 0; i < rows.length; i++) this.data.push(rows[i]);
    }
}

/**
 * A vector that can grow by appending entries.
 */
export class ExtendableVector {
    /**
     * @param {number[]} data
     */
    constructor(data) {
        /** @type {number[]} */
        this.data = data;
    }

    /** Number of rows (entries). @returns {number} */
    get nrows() {
        return this.data.length;
    }

    /**
     * Current data as number[] (internal reference; caller must treat as read-only).
     * @returns {number[]}
     */
    asVector() {
        return this.data;
    }

    /**
     * Append entries (in place).
     * @param {number[]} rows
     */
    addRows(rows) {
        for (let i = 0; i < rows.length; i++) this.data.push(rows[i]);
    }

    /**
     * Overwrite the whole content; length must equal the current length
     * (matches Rust `assert_eq!`).
     * @param {number[]} rows
     */
    assign(rows) {
        if (rows.length !== this.data.length) {
            throw new Error(
                `ExtendableVector.assign: length mismatch (got ${rows.length}, expected ${this.data.length})`
            );
        }
        for (let i = 0; i < rows.length; i++) this.data[i] = rows[i];
    }
}

//=============================================================================
// CHOLESKY DECOMPOSITION CLASS (incremental O(n²) update)
//=============================================================================

/**
 * A stored Cholesky decomposition of a symmetric positive-definite matrix,
 * supporting incremental O(n²) growth via `insertColumn` (used by
 * GaussianProcess.addSamples). Mirrors nalgebra's `Cholesky` object that
 * friedrich keeps inside the GP.
 */
export class CholeskyDecomposition {
    /**
     * Build from a symmetric positive-definite matrix.
     * @param {number[][]} A
     * @param {number|null} [epsilon=null] null → throw on failure; positive → substitute mode.
     */
    constructor(A, epsilon = null) {
        /** @type {number[][]} lower-triangular factor L (A = L·Lᵀ) */
        this._L = cholesky(A, epsilon);
        /** @type {number|null} */
        this._epsilon = epsilon;
    }

    /**
     * Lower-triangular factor L.
     * @returns {number[][]}
     */
    l() {
        return this._L;
    }

    /**
     * Solve A·X = B (B: number[] | number[][]), same shape out.
     * Equivalent to choleskySolve(this.l(), B).
     * @param {number[]|number[][]} B
     * @returns {number[]|number[][]}
     */
    solve(B) {
        return choleskySolve(this._L, B);
    }

    /**
     * Solve L·X = B (forward substitution only).
     * Equivalent to solveLowerTri(this.l(), B).
     * @param {number[]|number[][]} B
     * @returns {number[]|number[][]}
     */
    solveLower(B) {
        return solveLowerTri(this._L, B);
    }

    /**
     * Inverse A⁻¹.
     * @returns {number[][]}
     */
    inverse() {
        return choleskyInverse(this._L);
    }

    /**
     * Insert a row/column at position `colIndex`, yielding the
     * (n+1)×(n+1) decomposition. In friedrich `colIndex` is always the old
     * dimension (i.e. appended at the end), so this implements the standard
     * "bordering" update:
     *
     *   L' = [ L      0   ]      with   L · l21 = v[0..n]   (lower-tri solve)
     *        [ l21ᵀ   l22 ]             l22 = sqrt(v[n] − l21·l21)
     *
     * where `v` = `newColumn` (length n+1): v[0..n] are covariances with the
     * existing rows and v[n] is the new point's self-covariance (already
     * including noise²).
     *
     * If l22² ≤ 0 and an epsilon was configured, substitute epsilon for the
     * pivot (matches the substitute behaviour of the batch Cholesky).
     *
     * Updates this object in place and returns `this`.
     *
     * @param {number} colIndex  must equal the current dimension (end insertion)
     * @param {number[]} newColumn length colIndex+1
     * @returns {this}
     */
    insertColumn(colIndex, newColumn) {
        const n = this._L.length; // old dimension
        // friedrich only ever inserts at the end.
        if (colIndex !== n) {
            throw new Error(
                `CholeskyDecomposition.insertColumn: only end insertion supported (colIndex=${colIndex}, dim=${n})`
            );
        }

        const L = this._L;

        // Solve L · l21 = v[0..n]  (forward substitution).
        const v = newColumn;
        const l21 = new Array(n);
        for (let i = 0; i < n; i++) {
            let s = v[i];
            const Li = L[i];
            for (let k = 0; k < i; k++) s -= Li[k] * l21[k];
            l21[i] = s / Li[i];
        }

        // l22 = sqrt(v[n] − l21·l21)
        let pivot = v[n];
        for (let i = 0; i < n; i++) pivot -= l21[i] * l21[i];

        if (this._epsilon === null) {
            if (!(pivot > 0)) {
                throw new Error(
                    "Cholesky decomposition failed, consider setting `cholesky_epsilon` via `GaussianProcessBuilder`"
                );
            }
        } else if (!(pivot > 0)) {
            pivot = this._epsilon;
        }
        const l22 = Math.sqrt(pivot);

        // Build the (n+1)×(n+1) lower-triangular factor.
        for (let i = 0; i < n; i++) L[i].push(0); // pad existing rows with a 0 in the new column
        const lastRow = new Array(n + 1);
        for (let i = 0; i < n; i++) lastRow[i] = l21[i];
        lastRow[n] = l22;
        L.push(lastRow);

        return this;
    }
}

//=============================================================================
// COVARIANCE-MATRIX HELPERS  (algebra/mod.rs free functions)
//=============================================================================

/**
 * Covariance matrix between rows of m1 and rows of m2 using `kernel`.
 * out[r][c] = kernel.kernel(m1[r], m2[c]). Shape (m1.length × m2.length).
 *
 * @param {number[][]} m1
 * @param {number[][]} m2
 * @param {{kernel: (x1:number[], x2:number[]) => number}} kernel
 * @returns {number[][]}
 */
export function makeCovarianceMatrix(m1, m2, kernel) {
    const r = m1.length;
    const c = m2.length;
    const out = new Array(r);
    for (let i = 0; i < r; i++) {
        const row = new Array(c);
        const xi = m1[i];
        for (let j = 0; j < c; j++) row[j] = kernel.kernel(xi, m2[j]);
        out[i] = row;
    }
    return out;
}

/**
 * Covariance matrix of `inputs` with diagonal noise², returned as its
 * CholeskyDecomposition.
 *
 *   cov[i][j] = kernel.kernel(inputs[i], inputs[j])
 *   cov[i][i] += diagonalNoise²   (note: the SQUARE of the noise)
 *
 * `epsilon` is forwarded to the Cholesky (null → throw on failure;
 * positive → substitute mode).
 *
 * @param {number[][]} inputs
 * @param {{kernel: (x1:number[], x2:number[]) => number}} kernel
 * @param {number} diagonalNoise the noise STANDARD DEVIATION
 * @param {number|null} [epsilon=null]
 * @returns {CholeskyDecomposition}
 */
export function makeCholeskyCovMatrix(inputs, kernel, diagonalNoise, epsilon = null) {
    const n = inputs.length;
    const noiseSq = diagonalNoise * diagonalNoise;
    const cov = new Array(n);
    for (let i = 0; i < n; i++) {
        const row = new Array(n);
        const xi = inputs[i];
        for (let j = 0; j < n; j++) row[j] = kernel.kernel(xi, inputs[j]);
        row[i] += noiseSq;
        cov[i] = row;
    }
    return new CholeskyDecomposition(cov, epsilon);
}

/**
 * Incrementally add the last `nbNewInputs` rows of `allInputs` to an existing
 * Cholesky decomposition (in place), one row at a time. For each new row:
 *   - compute the new column (covariances with all rows up to and including
 *     itself, length col_index+1),
 *   - add noise² to the final (self) entry,
 *   - call `cholesky.insertColumn(col_index, column)`.
 *
 * @param {CholeskyDecomposition} cholesky updated in place
 * @param {number[][]} allInputs full input matrix (old rows then new rows)
 * @param {number} nbNewInputs number of trailing rows to add
 * @param {{kernel: (x1:number[], x2:number[]) => number}} kernel
 * @param {number} diagonalNoise the noise STANDARD DEVIATION
 */
export function addRowsCholeskyCovMatrix(cholesky, allInputs, nbNewInputs, kernel, diagonalNoise) {
    const total = allInputs.length;
    const nbOld = total - nbNewInputs;
    const noiseSq = diagonalNoise * diagonalNoise;

    for (let rowIndex = 0; rowIndex < nbNewInputs; rowIndex++) {
        const colIndex = nbOld + rowIndex;
        const row = allInputs[colIndex];

        const columnSize = colIndex + 1;
        const newColumn = new Array(columnSize);
        for (let trainingRowIndex = 0; trainingRowIndex < columnSize; trainingRowIndex++) {
            newColumn[trainingRowIndex] = kernel.kernel(allInputs[trainingRowIndex], row);
        }
        newColumn[colIndex] += noiseSq;

        cholesky.insertColumn(colIndex, newColumn);
    }
}

/**
 * For each kernel hyper-parameter, build the (symmetric) gradient matrix
 * ∂K/∂param. Returns number[][][] of length kernel.nbParameters().
 *
 *   mats[p][r][c] = mats[p][c][r] = kernel.gradient(inputs[r], inputs[c])[p]
 *
 * @param {number[][]} inputs
 * @param {{nbParameters: () => number, gradient: (x1:number[], x2:number[]) => number[]}} kernel
 * @returns {number[][][]}
 */
export function makeGradientCovarianceMatrices(inputs, kernel) {
    const n = inputs.length;
    const nbParams = kernel.nbParameters();

    const mats = new Array(nbParams);
    for (let p = 0; p < nbParams; p++) mats[p] = zeros(n, n);

    for (let r = 0; r < n; r++) {
        const xr = inputs[r];
        // Symmetric: fill (r,c) and (c,r) together for c ≥ r.
        for (let c = r; c < n; c++) {
            const grad = kernel.gradient(xr, inputs[c]);
            for (let p = 0; p < nbParams; p++) {
                mats[p][r][c] = grad[p];
                mats[p][c][r] = grad[p];
            }
        }
    }

    return mats;
}
