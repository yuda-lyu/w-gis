/**
 * Prior models for Gaussian Process Regression.
 *
 * Port of `friedrich 0.6.0 src/parameters/prior.rs`.
 *
 * When asked to predict a value for an input that is too dissimilar to known
 * inputs, the model returns the prior. The GP is fitted on the *residual* of
 * the prior, so a good prior can significantly improve precision.
 *
 * Data representation (see PORT_SPEC §2):
 *   - inputs  : number[][] (row-major; one sample per row)
 *   - outputs : number[]
 *
 * Dependencies: algebra.mjs (dot, lstsqSolve)
 */

import { dot, lstsqSolve } from './algebra.mjs';

// ---------------------------------------------------------------------------
// ZeroPrior
// ---------------------------------------------------------------------------

/**
 * The Zero prior.
 *
 * Always returns zero for every input point.
 * Mathematically: f(x) = 0 for all x.
 */
export class ZeroPrior {
    /**
     * Creates the default ZeroPrior (stateless; inputDimension is ignored).
     * Matches Rust `ZeroPrior::default(input_dimension)`.
     *
     * @param {number} _inputDimension ignored
     * @returns {ZeroPrior}
     */
    static default(_inputDimension) {
        return new ZeroPrior();
    }

    /**
     * Returns a zero vector of length `inputs.length`.
     * Matches Rust `prior(input) → DVector::zeros(input.nrows())`.
     *
     * @param {number[][]} inputs one sample per row
     * @returns {number[]} all zeros, length = inputs.length
     */
    prior(inputs) {
        return new Array(inputs.length).fill(0);
    }

    /**
     * No-op: ZeroPrior has no parameters to fit.
     *
     * @param {number[][]} _inputs
     * @param {number[]} _outputs
     */
    fit(_inputs, _outputs) {
        // no-op (matches Rust default trait impl)
    }
}

// ---------------------------------------------------------------------------
// ConstantPrior
// ---------------------------------------------------------------------------

/**
 * The Constant prior.
 *
 * Returns a single constant value for every input point: f(x) = c.
 * Can be fitted to the mean of the training outputs.
 */
export class ConstantPrior {
    /**
     * @param {number} c the constant prior value
     */
    constructor(c) {
        /** @type {number} */
        this.c = c;
    }

    /**
     * Creates the default ConstantPrior with c = 0.
     * Matches Rust `ConstantPrior::default(_input_dimension) → Self::new(0f64)`.
     *
     * @param {number} _inputDimension ignored
     * @returns {ConstantPrior}
     */
    static default(_inputDimension) {
        return new ConstantPrior(0);
    }

    /**
     * Returns a constant vector of length `inputs.length`, each entry = this.c.
     * Matches Rust `prior(input) → DVector::from_element(input.nrows(), self.c)`.
     *
     * @param {number[][]} inputs one sample per row
     * @returns {number[]} constant array, length = inputs.length
     */
    prior(inputs) {
        return new Array(inputs.length).fill(this.c);
    }

    /**
     * Fits the prior to the arithmetic mean of `outputs`.
     * Matches Rust `fit(_, training_outputs) { self.c = training_outputs.mean() }`.
     * nalgebra's `mean()` divides by N (element count), matching JS arithmetic mean.
     *
     * @param {number[][]} _inputs ignored
     * @param {number[]} outputs training output values
     */
    fit(_inputs, outputs) {
        const n = outputs.length;
        let sum = 0;
        for (let i = 0; i < n; i++) sum += outputs[i];
        this.c = sum / n;
    }
}

// ---------------------------------------------------------------------------
// LinearPrior
// ---------------------------------------------------------------------------

/**
 * The Linear prior.
 *
 * A linear function of the inputs: f(x) = x·weights + intercept.
 * Can be fitted to training data using least-squares (Rust uses SVD; JS uses
 * normal equations via lstsqSolve — semantically equivalent, see PORT_SPEC §12.12).
 *
 * Rust struct fields:
 *   weights:   DVector<f64>  (length = input dimension)
 *   intercept: f64
 */
export class LinearPrior {
    /**
     * @param {number[]} weights  length = input dimension
     * @param {number}   intercept
     */
    constructor(weights, intercept) {
        /** @type {number[]} */
        this.weights = weights;
        /** @type {number} */
        this.intercept = intercept;
    }

    /**
     * Creates the default LinearPrior with all-zero weights and zero intercept.
     * Matches Rust `LinearPrior::default(input_dimension) →
     *   Self { weights: DVector::zeros(input_dimension), intercept: 0f64 }`.
     *
     * @param {number} inputDimension
     * @returns {LinearPrior}
     */
    static default(inputDimension) {
        return new LinearPrior(new Array(inputDimension).fill(0), 0);
    }

    /**
     * Evaluates the linear prior for each row of `inputs`.
     * Matches Rust `prior(input) → input * self.weights + self.intercept` where
     * input is (n×d) and weights is (d×1), yielding (n×1).
     *
     * @param {number[][]} inputs one sample per row
     * @returns {number[]} length = inputs.length
     */
    prior(inputs) {
        const n = inputs.length;
        const out = new Array(n);
        for (let r = 0; r < n; r++) {
            out[r] = dot(inputs[r], this.weights) + this.intercept;
        }
        return out;
    }

    /**
     * Fits the linear prior via least-squares.
     *
     * Matches Rust: insert a column of ones at index 0 → [1 | inputs],
     * then solve [1|inputs]·w = outputs (SVD, threshold 0).
     * The resulting w[0] is the intercept and w[1..] are the weights.
     *
     * JS: builds augmented matrix (m × d+1) with a leading ones column,
     * delegates to `lstsqSolve(augmented, outputs)`.
     *
     * @param {number[][]} inputs training inputs (m × d)
     * @param {number[]} outputs  training outputs (m)
     */
    fit(inputs, outputs) {
        const m = inputs.length;
        // augmented[r] = [1, ...inputs[r]]  (mirrors Rust insert_column(0, 1.))
        const augmented = new Array(m);
        for (let r = 0; r < m; r++) {
            augmented[r] = [1, ...inputs[r]];
        }

        const w = lstsqSolve(augmented, outputs);

        // w[0] = intercept, w[1..] = weights  (mirrors Rust weights[0] / remove_row(0))
        this.intercept = w[0];
        this.weights = w.slice(1);
    }
}
