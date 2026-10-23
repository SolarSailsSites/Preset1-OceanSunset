// --- 1. INTERACTION HELPERS ---
function copyDiscordTag(tag) {
    const tempInput = document.createElement('input');
    tempInput.value = tag;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('Copied Discord Tag to Clipboard!');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// --- 2. 60 FPS OPTIMIZED PROCEDURAL PIXEL ART SUNSET ENGINE ---
const canvas = document.getElementById('sunsetCanvas');
const ctx = canvas.getContext('2d');

const V_WIDTH = 256;
const V_HEIGHT = 144;
canvas.width = V_WIDTH;
canvas.height = V_HEIGHT;

const imgData = ctx.createImageData(V_WIDTH, V_HEIGHT);
const data = imgData.data;

// SUNSET PALETTE BUFFER [R, G, B]
const cBuffer = [
    43, 16, 85, // 0,1,2: Deep Moody Violet (Top Sky)
    117, 34, 91, // 3,4,5: Coral Pink / Dark Magenta (Mid Sky)
    209, 117, 75, // 6,7,8: Fiery Yellow-Orange (Low Sky Horizon)
    255, 255, 255, // 9,10,11: Pure Flat White Sun Core
    36, 20, 52, // 12,13,14: Base Dark Cloud Color
    58, 42, 74 // 15,16,17: Bottom Cloud Highlight Color
];

const baselineHorizon = Math.floor(V_HEIGHT * 0.62);

let time = 0;
const numClouds = 17;
const clouds = [];

function randomizeCloud(cloud, startOnScreen) {
    cloud.x = startOnScreen ? (Math.random() * (V_WIDTH + 260) - 130) : -60;
    cloud.y = 12 + Math.random() * (baselineHorizon - 45);
    cloud.shapeType = Math.floor(Math.random() * 3);
    cloud.scale = 0.55 + Math.random() * 0.35;

    let baseSpeedRate = 0.03 + Math.random() * 0.12;
    let speedSpreadBonus = (cloud.scale * 0.20);
    cloud.speed = baseSpeedRate + speedSpreadBonus;
}

for (let i = 0; i < numClouds; i++) {
    clouds[i] = {};
    randomizeCloud(clouds[i], true);
}

// --- 60 FPS ACCUMULATOR TIMESTEP OPTIMIZATION ---
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS; // ~16.66ms per tick
let lastTime = performance.now();
let accumulator = 0;

function updateSimulation() {
    time += 0.015;

    for (let i = 0; i < numClouds; i++) {
        clouds[i].x += clouds[i].speed;
        if (clouds[i].x > V_WIDTH + 60) {
            randomizeCloud(clouds[i], false);
        }
    }
}

function renderFrame() {
    const horizon = baselineHorizon;
    for (let y = 0; y < V_HEIGHT; y++) {
        const isWater = y >= horizon;

        let sampleY = y;
        if (isWater) {
            let waveShift = Math.sin(y * 0.4 + time * 3.0) * 1.5;
            sampleY = horizon - (y - horizon) + Math.floor(waveShift);
            sampleY = Math.max(0, Math.min(horizon - 1, sampleY));
        }

        let pctSky = sampleY / horizon;

        for (let x = 0; x < V_WIDTH; x++) {
            const idx = (y * V_WIDTH + x) * 4;

            let r = 0,
                g = 0,
                b = 0;

            if (pctSky < 0.40) {
                let t = pctSky / 0.40;
                r = cBuffer[0] * (1 - t) + cBuffer[3] * t;
                g = cBuffer[1] * (1 - t) + cBuffer[4] * t;
                b = cBuffer[2] * (1 - t) + cBuffer[5] * t;
            } else {
                let t = (pctSky - 0.40) / 0.60;
                r = cBuffer[3] * (1 - t) + cBuffer[6] * t;
                g = cBuffer[4] * (1 - t) + cBuffer[7] * t;
                b = cBuffer[5] * (1 - t) + cBuffer[8] * t;
            }

            let sunCenterX = V_WIDTH * 0.5;
            let sunCenterY = horizon + 2;
            let cornerShadowMultiplier = 1.0;

            if (!isWater) {
                let skyWave = Math.sin(sampleY * 0.18 - time * 1.0) * 0.6;
                let dx = x - (sunCenterX + skyWave);
                let dy = sampleY - sunCenterY;
                let distToSun = Math.sqrt(dx * dx + dy * dy);

                if (distToSun < 19) {
                    r = cBuffer[9];
                    g = cBuffer[10];
                    b = cBuffer[11];
                } else if (distToSun < 35) {
                    let normalizedGlowDist = (distToSun - 19) / (35 - 19);
                    let sunFactor = Math.exp(-Math.pow(normalizedGlowDist * 1.9, 2.0));
                    r = r * (1 - sunFactor) + cBuffer[9] * sunFactor;
                    g = g * (1 - sunFactor) + cBuffer[10] * sunFactor;
                    b = b * (1 - sunFactor) + cBuffer[11] * sunFactor;
                }

                for (let i = 0; i < numClouds; i++) {
                    let cl = clouds[i];
                    let cx = x - Math.floor(cl.x);
                    let cy = y - Math.floor(cl.y);

                    let isPixelInCloud = false;
                    let useLighterHighlight = false;
                    let sw = 26 * cl.scale;

                    if (cl.shapeType === 0) {
                        let abx = Math.abs(cx);
                        if (cy === -1 && abx < sw * 1.3) {
                            isPixelInCloud = true;
                            useLighterHighlight = true;
                        }
                        if (cy === -2 && abx < sw * 0.8) isPixelInCloud = true;
                        if (cy === -3 && abx < sw * 0.4) isPixelInCloud = true;
                    } else if (cl.shapeType === 1) {
                        let stratusUpperOval = Math.sqrt((cx - sw * 0.25) * (cx - sw * 0.25) + (cy * 2.2) * (cy * 2.2));
                        if (cy < 0 && stratusUpperOval < sw * 0.9) {
                            isPixelInCloud = true;
                            if (cy === -1) useLighterHighlight = true;
                        }
                    } else if (cl.shapeType === 2) {
                        let ey = cy * 2.6;
                        let podLeft = Math.sqrt((cx + 4.5 * cl.scale) * (cx + 4.5 * cl.scale) + (ey + 2) * (ey + 2));
                        let podRight = Math.sqrt((cx - 4.5 * cl.scale) * (cx - 4.5 * cl.scale) + (ey + 2) * (ey + 2));

                        if (cy < 0 && (podLeft < 7 * cl.scale || podRight < 6 * cl.scale)) {
                            isPixelInCloud = true;
                            if (cy === -1) useLighterHighlight = true;
                        }
                    }

                    if (isPixelInCloud) {
                        if (useLighterHighlight) {
                            r = cBuffer[15];
                            g = cBuffer[16];
                            b = cBuffer[17];
                        } else {
                            r = cBuffer[12];
                            g = cBuffer[13];
                            b = cBuffer[14];
                        }
                        break;
                    }
                }
            } else {
                let reflectWave = Math.sin(y * 0.6 + time * 4.5) * 2.8 + Math.cos(x * 0.08 + time * 2.0) * 0.5;

                let depthFactor = (y - horizon) / (V_HEIGHT - horizon);
                let vScaleX = 1.40 + (depthFactor * 0.8);

                let rx = (x - (sunCenterX + reflectWave)) * vScaleX;
                let ry = (y - horizon) * 0.48;
                let distToReflection = Math.sqrt(rx * rx + ry * ry);

                let sideWave = Math.sin(y * 0.35 - time * 3.0) * 3.5;
                let leftShadowWidth = 35 + (depthFactor * 25) + sideWave;
                let rightShadowWidth = 35 + (depthFactor * 25) - sideWave;

                if (x < leftShadowWidth) {
                    let factor = x / leftShadowWidth;
                    cornerShadowMultiplier = 0.55 + Math.pow(factor, 0.5) * 0.45;
                } else if (x > (V_WIDTH - rightShadowWidth)) {
                    let factor = (V_WIDTH - x) / rightShadowWidth;
                    cornerShadowMultiplier = 0.55 + Math.pow(factor, 0.5) * 0.45;
                }

                if (distToReflection < 19) {
                    let fadeFactor = Math.max(0, 1 - Math.pow(depthFactor, 1.5));
                    r = cBuffer[0] * (1 - fadeFactor) + cBuffer[9] * fadeFactor;
                    g = cBuffer[1] * (1 - fadeFactor) + cBuffer[10] * fadeFactor;
                    b = (cBuffer[2] * (1 - fadeFactor) * cornerShadowMultiplier) + cBuffer[11] * fadeFactor;
                } else if (distToReflection < 48) {
                    let normalizedGlowDist = (distToReflection - 19) / (48 - 19);
                    let fadeFactor = Math.max(0, 1 - Math.pow(depthFactor, 1.2));
                    let sunFactor = Math.exp(-Math.pow(normalizedGlowDist * 1.6, 2.0)) * fadeFactor;

                    r = r * (1 - sunFactor) + cBuffer[9] * sunFactor;
                    g = g * (1 - sunFactor) + cBuffer[10] * sunFactor;
                    b = b * (1 - sunFactor) + cBuffer[11] * sunFactor;
                }

                let rippleOffset = Math.sin(y * 0.5 + time * 5.0) * 2.5;
                let refX = x - Math.floor(rippleOffset);
                let refY = horizon - (y - horizon);

                for (let i = 0; i < numClouds; i++) {
                    let cl = clouds[i];
                    let cx = refX - Math.floor(cl.x);
                    let cy = -Math.abs(refY - Math.floor(cl.y));

                    let isPixelInCloudRef = false;
                    let useLighterHighlightRef = false;
                    let sw = 26 * cl.scale;

                    if (cl.shapeType === 0) {
                        let abx = Math.abs(cx);
                        if (cy === -1 && abx < sw * 1.3) {
                            isPixelInCloudRef = true;
                            useLighterHighlightRef = true;
                        }
                        if (cy === -2 && abx < sw * 0.8) isPixelInCloudRef = true;
                        if (cy === -3 && abx < sw * 0.4) isPixelInCloudRef = true;
                    } else if (cl.shapeType === 1) {
                        let stratusUpperOval = Math.sqrt((cx - sw * 0.25) * (cx - sw * 0.25) + (cy * 2.2) * (cy * 2.2));
                        if (cy < 0 && stratusUpperOval < sw * 0.9) {
                            isPixelInCloudRef = true;
                            if (cy === -1) useLighterHighlightRef = true;
                        }
                    } else if (cl.shapeType === 2) {
                        let ey = cy * 2.6;
                        let podLeft = Math.sqrt((cx + 4.5 * cl.scale) * (cx + 4.5 * cl.scale) + (ey + 2) * (ey + 2));
                        let podRight = Math.sqrt((cx - 4.5 * cl.scale) * (cx - 4.5 * cl.scale) + (ey + 2) * (ey + 2));
                        if (cy < 0 && (podLeft < 7 * cl.scale || podRight < 6 * cl.scale)) {
                            isPixelInCloudRef = true;
                            if (cy === -1) useLighterHighlightRef = true;
                        }
                    }

                    if (isPixelInCloudRef) {
                        let reflectionVisibilityFade = Math.max(0, 1 - (y - horizon) / (V_HEIGHT - horizon));
                        let blendStrength = 0.18 * reflectionVisibilityFade;

                        let targetCloudRefR = useLighterHighlightRef ? cBuffer[15] : cBuffer[12];
                        let targetCloudRefG = useLighterHighlightRef ? cBuffer[16] : cBuffer[13];
                        let targetCloudRefB = useLighterHighlightRef ? cBuffer[17] : cBuffer[14];

                        r = r * (1 - blendStrength) + targetCloudRefR * blendStrength;
                        g = g * (1 - blendStrength) + targetCloudRefG * blendStrength;
                        b = b * (1 - blendStrength) + targetCloudRefB * blendStrength;
                        break;
                    }
                }
            }

            if (isWater) {
                r = (r * 0.32) * cornerShadowMultiplier;
                g = (g * 0.46 + 12) * cornerShadowMultiplier;
                b = (b * 0.58 + 22) * cornerShadowMultiplier;
            }

            const isDitherTile = (x + y) % 2 === 0;
            const ditherOffset = isDitherTile ? 8 : -8;

            let finalR = Math.min(255, Math.max(0, r + ditherOffset));
            let finalG = Math.min(255, Math.max(0, g + ditherOffset));
            let finalB = Math.min(255, Math.max(0, b + ditherOffset));

            data[idx] = Math.round(finalR / 16) * 16;
            data[idx + 1] = Math.round(finalG / 16) * 16;
            data[idx + 2] = Math.round(finalB / 16) * 16;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

function gameLoop(now) {
    let delta = now - lastTime;
    lastTime = now;

    if (delta > 250) delta = 250; // Tab-switching protection

    accumulator += delta;

    let updated = false;
    while (accumulator >= FRAME_TIME) {
        updateSimulation();
        accumulator -= FRAME_TIME;
        updated = true;
    }

    if (updated) {
        renderFrame();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame((now) => {
    lastTime = now;
    requestAnimationFrame(gameLoop);
});

// --- 3. INTERACTIVE CLICK-TO-HIDE FOCUS CONTROLS ---
const overlay = document.getElementById('overlay');
const hint = document.getElementById('hint');

function toggleFocus() {
    overlay.classList.toggle('hidden');
    hint.classList.toggle('hidden');
}

canvas.addEventListener('click', toggleFocus);

overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        toggleFocus();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Escape' || e.code === 'KeyH') {
        toggleFocus();
    }
});

// Automatically update copyright year
document.getElementById('current-year').innerText = new Date().getFullYear();