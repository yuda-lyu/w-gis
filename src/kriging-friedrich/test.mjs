/**
 * test.mjs — zero-dependency port of `friedrich/tests/integration.rs`.
 *
 * Faithfully reproduces the five Rust integration tests using a tiny hand-rolled
 * `assert` helper (no test framework, no npm dependencies). On any failed
 * assertion it throws (printing the failing case); when every test passes it
 * prints "ok".
 *
 * Run: `node test.mjs`
 *
 * Rust ↔ JS method-name mapping (this port uses snake_case GP methods):
 *   gp.predict(&x)              → gp.predict(x)
 *   gp.predict_variance(&x)     → gp.predict_variance(x)
 *   gp.predict_mean_variance(&x)→ gp.predict_mean_variance(x)  // returns [mean, var]
 *   gp.predict_covariance(&x)   → gp.predict_covariance(x)     // number[][]
 *   gp.add_samples(&xs, &ys)    → gp.add_samples(xs, ys)
 *   GaussianProcess::default(…) → GaussianProcess.default(…)
 */

import { GaussianProcess } from './index.mjs';

// ---------------------------------------------------------------------------
// Minimal assertion helper (throws on failure; matches Rust assert! semantics).
// ---------------------------------------------------------------------------

/**
 * @param {boolean} condition
 * @param {string}  message  shown when the assertion fails
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(`assertion failed: ${message}`);
    }
}

/**
 * Helper: build the same simple 1-D GP used by every Rust test
 * (`integration.rs::make_gp`).
 * @returns {GaussianProcess}
 */
function makeGp() {
    const inputs = [[0.0], [1.0], [2.0], [3.0], [4.0]];
    const outputs = [0.0, 1.0, 0.0, -1.0, 0.0];
    return GaussianProcess.default(inputs, outputs);
}

// ---------------------------------------------------------------------------
// Test 1: interpolation_and_low_variance_at_training_points
// ---------------------------------------------------------------------------

function interpolationAndLowVarianceAtTrainingPoints() {
    const gp = makeGp();

    const inputs = [[0.0], [1.0], [2.0], [3.0], [4.0]];
    const expected = [0.0, 1.0, 0.0, -1.0, 0.0];

    const means = gp.predict(inputs);
    const vars = gp.predict_variance(inputs);

    for (let i = 0; i < means.length; i++) {
        assert(
            Math.abs(means[i] - expected[i]) < 0.2,
            `mean at training point ${i}: expected ≈ ${expected[i]}, got ${means[i]}`
        );
    }
    for (let i = 0; i < vars.length; i++) {
        assert(
            vars[i] < 0.5,
            `variance at training point ${i} should be small, got ${vars[i]}`
        );
    }
}

// ---------------------------------------------------------------------------
// Test 2: uncertainty_grows_away_from_data
// ---------------------------------------------------------------------------

function uncertaintyGrowsAwayFromData() {
    const gp = makeGp();

    // Near a training point.
    const near = [2.01];
    const varNear = gp.predict_variance(near);

    // Far from any training point.
    const far = [10.0];
    const varFar = gp.predict_variance(far);

    assert(
        varFar > varNear,
        `variance far from data (${varFar}) should exceed variance near data (${varNear})`
    );
}

// ---------------------------------------------------------------------------
// Test 3: predict_mean_variance_matches_separate_calls
// ---------------------------------------------------------------------------

function predictMeanVarianceMatchesSeparateCalls() {
    const gp = makeGp();

    const inputs = [[0.5], [1.5], [5.0]];

    const means = gp.predict(inputs);
    const vars = gp.predict_variance(inputs);
    const [means2, vars2] = gp.predict_mean_variance(inputs);

    for (let i = 0; i < inputs.length; i++) {
        assert(
            Math.abs(means[i] - means2[i]) < 1e-10,
            `mean mismatch at ${i}: ${means[i]} vs ${means2[i]}`
        );
        assert(
            Math.abs(vars[i] - vars2[i]) < 1e-10,
            `variance mismatch at ${i}: ${vars[i]} vs ${vars2[i]}`
        );
    }
}

// ---------------------------------------------------------------------------
// Test 4: covariance_matrix_properties
// ---------------------------------------------------------------------------

function covarianceMatrixProperties() {
    const gp = makeGp();

    const inputs = [[0.5], [1.5], [2.5], [3.5]];
    const cov = gp.predict_covariance(inputs); // number[][]
    const vars = gp.predict_variance(inputs);

    const n = inputs.length;
    // cov.nrows() / cov.ncols()  (number[][]: row count and column count).
    assert(cov.length === n, `cov.nrows() ${cov.length} !== ${n}`);
    assert(cov[0].length === n, `cov.ncols() ${cov[0].length} !== ${n}`);

    // Symmetry.
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            assert(
                Math.abs(cov[i][j] - cov[j][i]) < 1e-10,
                `covariance not symmetric at (${i},${j}): ${cov[i][j]} vs ${cov[j][i]}`
            );
        }
    }

    // Diagonal matches predict_variance.
    for (let i = 0; i < n; i++) {
        assert(
            Math.abs(cov[i][i] - vars[i]) < 1e-10,
            `diagonal ${i} mismatch: cov=${cov[i][i]} var=${vars[i]}`
        );
    }
}

// ---------------------------------------------------------------------------
// Test 5: adding_samples_moves_prediction
// ---------------------------------------------------------------------------

function addingSamplesMovesPrediction() {
    const gp = makeGp();

    const testPoint = [5.0];
    const meanBefore = gp.predict(testPoint);

    const newInput = [[5.0]];
    const newOutput = [10.0];
    gp.add_samples(newInput, newOutput);

    const meanAfter = gp.predict(testPoint);

    // After observing y=10 at x=5, the prediction there should shift toward 10.
    assert(
        Math.abs(meanAfter - 10.0) < Math.abs(meanBefore - 10.0),
        `prediction should move toward new observation: before=${meanBefore}, after=${meanAfter}`
    );
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const tests = [
    ['interpolation_and_low_variance_at_training_points', interpolationAndLowVarianceAtTrainingPoints],
    ['uncertainty_grows_away_from_data', uncertaintyGrowsAwayFromData],
    ['predict_mean_variance_matches_separate_calls', predictMeanVarianceMatchesSeparateCalls],
    ['covariance_matrix_properties', covarianceMatrixProperties],
    ['adding_samples_moves_prediction', addingSamplesMovesPrediction],
];

for (const [name, fn] of tests) {
    fn(); // throws on failure
    console.log(`ok - ${name}`);
}

console.log(`\nok — all ${tests.length} tests passed`);
