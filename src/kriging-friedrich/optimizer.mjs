//! Parameter optimization (ADAM gradient ascent on the marginal log-likelihood).
//!
//! Port of `friedrich 0.6.0` `src/gaussian_process/optimizer.rs`.
//!
//! The fit of the parameters is done by gradient descent (the ADAM algorithm)
//! on the gradient of the marginal log-likelihood, which lets us use all the
//! data without bothering with cross-validation.
//!
//! - If the kernel is scalable, we follow "Fast methods for training Gaussian
//!   processes on large datasets" (https://arxiv.org/pdf/1604.01250.pdf) to
//!   rescale the kernel at each step with the optimal magnitude. This fits the
//!   noise without computing its gradient.
//! - Otherwise we fit the noise in log-scale, since its magnitude matters more
//!   than its precise value.
//!
//! Porting notes (PORT_SPEC §7):
//!   - These are free functions taking the GaussianProcess object `gp`; they are
//!     mixed onto `GaussianProcess.prototype` by `gaussian_process.mjs`.
//!   - `gp` is expected to expose: `covmatCholesky` (a CholeskyDecomposition),
//!     `trainingInputs` / `trainingOutputs` (Extendable* with `.asMatrix()` /
//!     `.asVector()`), `kernel`, `prior`, `noise`, `choleskyEpsilon`.
//!   - Rust's `chrono::Duration` (seconds) is replaced by `maxTime` in
//!     MILLISECONDS; timing uses `Date.now()` and the timeout comparison is `>`
//!     (matching `signed_duration_since(...) > max_time`).

import {
    dot,
    trace,
    makeCholeskyCovMatrix,
    makeGradientCovarianceMatrices,
} from "./algebra.mjs";

//=============================================================================
// NON-SCALABLE KERNEL
//=============================================================================

/**
 * Computes the gradient of the marginal likelihood for the current value of
 * each parameter. The produced vector contains the gradient per kernel
 * parameter followed by the gradient for the noise parameter.
 *
 * Per-parameter formula (`optimizer.rs:24`):
 *   ½ ( alphaᵀ · dp · alpha − trace(K⁻¹ · dp) )
 * where
 *   K     = cov(train, train)
 *   alpha = K⁻¹ · output
 *   dp    = ∂K/∂parameter
 *
 * Noise gradient (`gradient(K, noise) = 2·noise·Id`):
 *   noise · ( alpha·alpha − trace(K⁻¹) )
 *
 * @param {object} gp GaussianProcess (see module note)
 * @returns {number[]} length = kernel.nbParameters() + 1 (last entry = noise)
 */
export function gradientMarginalLikelihood(gp) {
    // Needed for the per-parameter gradient computation.
    const covInv = gp.covmatCholesky.inverse(); // K⁻¹
    const output = gp.trainingOutputs.asVector();

    // alpha = K⁻¹ · output  (matVec; covInv is symmetric).
    const n = output.length;
    const alpha = new Array(n);
    for (let r = 0; r < n; r++) {
        let s = 0;
        const row = covInv[r];
        for (let c = 0; c < n; c++) s += row[c] * output[c];
        alpha[r] = s;
    }

    const inputs = gp.trainingInputs.asMatrix();
    const results = [];

    // Loop over the gradient matrix for each parameter.
    for (const covGradient of makeGradientCovarianceMatrices(inputs, gp.kernel)) {
        // data_fit = Σ_c alpha[c] · (alpha · col_c)  =  alphaᵀ · covGradient · alpha
        // covGradient is symmetric, so its column c equals its row c.
        let dataFit = 0;
        for (let c = 0; c < n; c++) {
            // alpha · (column c of covGradient)
            let acol = 0;
            for (let r = 0; r < n; r++) acol += alpha[r] * covGradient[r][c];
            dataFit += acol * alpha[c];
        }

        // complexity_penalty = Σ_r (row r of covInv) · (column r of covGradient)
        //                    = trace(covInv · covGradient)
        let complexityPenalty = 0;
        for (let r = 0; r < n; r++) {
            const cRow = covInv[r];
            let tr = 0;
            for (let k = 0; k < n; k++) tr += cRow[k] * covGradient[k][r];
            complexityPenalty += tr;
        }

        results.push((dataFit - complexityPenalty) / 2);
    }

    // Noise parameter: gradient(K, noise) = 2·noise·Id.
    const dataFit = dot(alpha, alpha);
    const complexityPenalty = trace(covInv); // trace(K⁻¹)
    const noiseGradient = gp.noise * (dataFit - complexityPenalty);
    results.push(noiseGradient);

    return results;
}

/**
 * Fit parameters using the ADAM gradient-ascent algorithm.
 *
 * Runs for at most `maxIter` iterations. Stops early if every component of the
 * update step `delta` is ≤ `convergenceFraction` in magnitude (no significant
 * progress), or if the runtime exceeds `maxTime` (milliseconds).
 *
 * The `noise` parameter is fitted in log-scale, since its magnitude matters
 * more than its precise value.
 *
 * ADAM constants (`optimizer.rs:79`): beta1=0.9, beta2=0.999, epsilon=1e-8,
 * learningRate=0.1.
 *
 * @param {object} gp
 * @param {number} maxIter
 * @param {number} convergenceFraction
 * @param {number} maxTime milliseconds
 */
export function optimizeParameters(gp, maxIter, convergenceFraction, maxTime) {
    const beta1 = 0.9;
    const beta2 = 0.999;
    const epsilon = 1e-8;
    const learningRate = 0.1;

    // Initial parameters: kernel params with any 0 replaced by epsilon (a 0
    // parameter would block the multiplicative ADAM update), then noise in
    // log-space.
    const parameters = gp.kernel.getParameters().map((p) => (p === 0 ? epsilon : p));
    parameters.push(Math.log(gp.noise)); // noise in log-space

    const meanGrad = new Array(parameters.length).fill(0);
    const varGrad = new Array(parameters.length).fill(0);

    const timeStart = Date.now();
    for (let i = 1; i <= maxIter; i++) {
        const gradients = gradientMarginalLikelihood(gp);
        // Correct the noise gradient for log-space.
        gradients[gradients.length - 1] *= gp.noise;

        let hadSignificantProgress = false;
        for (let p = 0; p < parameters.length; p++) {
            meanGrad[p] = beta1 * meanGrad[p] + (1 - beta1) * gradients[p];
            varGrad[p] = beta2 * varGrad[p] + (1 - beta2) * gradients[p] * gradients[p];
            const biasCorrectedMean = meanGrad[p] / (1 - Math.pow(beta1, i));
            const biasCorrectedVariance = varGrad[p] / (1 - Math.pow(beta2, i));
            const delta = (learningRate * biasCorrectedMean) / (Math.sqrt(biasCorrectedVariance) + epsilon);
            if (Math.abs(delta) > convergenceFraction) hadSignificantProgress = true;
            parameters[p] *= 1 + delta;
        }

        // Set kernel parameters (the kernel reads only its own leading prefix
        // of `parameters`; the trailing noise log-value is ignored by it).
        gp.kernel.setParameters(parameters);
        // Get the noise out of log-space before setting it.
        gp.noise = Math.exp(parameters[parameters.length - 1]);

        // Refit the model (rebuild the Cholesky factor of the covariance matrix).
        gp.covmatCholesky = makeCholeskyCovMatrix(
            gp.trainingInputs.asMatrix(),
            gp.kernel,
            gp.noise,
            gp.choleskyEpsilon
        );

        if (!hadSignificantProgress || Date.now() - timeStart > maxTime) {
            break;
        }
    }
}

//=============================================================================
// SCALABLE KERNEL
//=============================================================================

/**
 * Returns `[scale, gradients]`: the optimal scale for the kernel+noise (used to
 * optimize the noise) plus the gradient per kernel parameter (NOT including the
 * noise gradient).
 *
 * Per-parameter formula (`optimizer.rs:150`):
 *   ½ ( alphaᵀ · dp · alpha / scale − trace(K⁻¹ · dp) )
 *   scale = outputᵀ · K⁻¹ · output / n
 * NOTE: the data-fit term is divided by `scale`, unlike the unscaled gradient.
 *
 * @param {object} gp
 * @returns {[number, number[]]} [scale, results] (results length = nbParameters)
 */
export function scaledGradientMarginalLikelihood(gp) {
    const covInv = gp.covmatCholesky.inverse(); // K⁻¹
    const output = gp.trainingOutputs.asVector();
    const n = output.length;

    // alpha = K⁻¹ · output
    const alpha = new Array(n);
    for (let r = 0; r < n; r++) {
        let s = 0;
        const row = covInv[r];
        for (let c = 0; c < n; c++) s += row[c] * output[c];
        alpha[r] = s;
    }

    // Scaling for the kernel: outputᵀ · K⁻¹ · output / n = output·alpha / n.
    const scale = dot(output, alpha) / n;

    const inputs = gp.trainingInputs.asMatrix();
    const results = [];

    for (const covGradient of makeGradientCovarianceMatrices(inputs, gp.kernel)) {
        // data_fit = (alphaᵀ · covGradient · alpha) / scale
        let dataFit = 0;
        for (let c = 0; c < n; c++) {
            let acol = 0;
            for (let r = 0; r < n; r++) acol += alpha[r] * covGradient[r][c];
            dataFit += acol * alpha[c];
        }
        dataFit /= scale;

        // complexity_penalty = trace(covInv · covGradient)
        let complexityPenalty = 0;
        for (let r = 0; r < n; r++) {
            const cRow = covInv[r];
            let tr = 0;
            for (let k = 0; k < n; k++) tr += cRow[k] * covGradient[k][r];
            complexityPenalty += tr;
        }

        results.push((dataFit - complexityPenalty) / 2);
    }

    // NOTE: faithful to Rust source — the noise gradient is intentionally NOT
    // pushed here (it is commented out in optimizer.rs:188-191); the noise is
    // instead fitted via `kernel.rescale(scale)` + `gp.noise *= scale`.

    return [scale, results];
}

/**
 * Fit parameters using ADAM gradient ascent; additionally, at each step the
 * kernel and noise are rescaled by the optimal magnitude `scale`.
 *
 * Runs for at most `maxIter` iterations. Stops early on no significant progress
 * (all `delta` ≤ `convergenceFraction`) or if the runtime exceeds `maxTime`
 * (milliseconds).
 *
 * ADAM constants identical to {@link optimizeParameters}.
 *
 * @param {object} gp
 * @param {number} maxIter
 * @param {number} convergenceFraction
 * @param {number} maxTime milliseconds
 */
export function scaledOptimizeParameters(gp, maxIter, convergenceFraction, maxTime) {
    const beta1 = 0.9;
    const beta2 = 0.999;
    const epsilon = 1e-8;
    const learningRate = 0.1;

    // Initial parameters: kernel params with 0 replaced by epsilon.
    // (No noise pushed: the noise is fitted by rescaling, not by gradient.)
    let parameters = gp.kernel.getParameters().map((p) => (p === 0 ? epsilon : p));

    const meanGrad = new Array(parameters.length).fill(0);
    const varGrad = new Array(parameters.length).fill(0);

    const timeStart = Date.now();
    for (let i = 1; i <= maxIter; i++) {
        const [scale, gradients] = scaledGradientMarginalLikelihood(gp);

        let hadSignificantProgress = false;
        for (let p = 0; p < parameters.length; p++) {
            meanGrad[p] = beta1 * meanGrad[p] + (1 - beta1) * gradients[p];
            varGrad[p] = beta2 * varGrad[p] + (1 - beta2) * gradients[p] * gradients[p];
            const biasCorrectedMean = meanGrad[p] / (1 - Math.pow(beta1, i));
            const biasCorrectedVariance = varGrad[p] / (1 - Math.pow(beta2, i));
            const delta = (learningRate * biasCorrectedMean) / (Math.sqrt(biasCorrectedVariance) + epsilon);
            if (Math.abs(delta) > convergenceFraction) hadSignificantProgress = true;
            parameters[p] *= 1 + delta;
        }

        // Set parameters, then rescale the kernel and noise by the optimal scale.
        gp.kernel.setParameters(parameters);
        gp.kernel.rescale(scale);
        gp.noise *= scale;
        // Get parameters back as they have been rescaled (rescale changes the
        // amplitude, so the local `parameters` must be refreshed from the kernel).
        parameters = gp.kernel.getParameters();

        // Refit the model.
        gp.covmatCholesky = makeCholeskyCovMatrix(
            gp.trainingInputs.asMatrix(),
            gp.kernel,
            gp.noise,
            gp.choleskyEpsilon
        );

        if (!hadSignificantProgress || Date.now() - timeStart > maxTime) {
            break;
        }
    }
}
