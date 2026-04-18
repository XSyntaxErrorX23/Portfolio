(function () {
    function makeSilkscreenTexture() {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 700;
        const ctx = c.getContext('2d');

        // PCB base
        ctx.fillStyle = '#1d8c4c';
        ctx.fillRect(0, 0, 1024, 700);

        // Darker PCB noise speckle (subtle texture)
        for (let i = 0; i < 1500; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 700;
            const alpha = Math.random() * 0.08;
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.fillRect(x, y, 1, 1);
        }

        const white = '#e8e8e8';
        ctx.strokeStyle = white;
        ctx.fillStyle = white;
        ctx.lineWidth = 2;

        // Outer silkscreen border
        ctx.strokeRect(14, 14, 1024 - 28, 700 - 28);

        // ARDUINO UNO title (top-right area)
        ctx.font = 'bold 46px "Arial Black", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('ARDUINO', 990, 70);
        ctx.font = 'bold 30px "Arial Black", Arial, sans-serif';
        ctx.fillText('UNO', 990, 110);

        // Signature
        ctx.font = 'italic 22px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Jan Nicol custom', 30, 680);

        // Component outlines
        ctx.lineWidth = 1.5;

        // ATmega chip outline
        ctx.strokeRect(520, 250, 220, 240);
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ATmega328P', 630, 380);

        // Crystal outline
        ctx.strokeRect(350, 60, 140, 70);
        ctx.font = '12px Arial';
        ctx.fillText('Y1 16MHz', 420, 100);

        // Reset button outline
        ctx.beginPath();
        ctx.arc(140, 220, 38, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText('RESET', 140, 225);

        // USB and power jack outlines
        ctx.strokeRect(20, 90, 200, 220);
        ctx.fillText('USB', 120, 60);
        ctx.strokeRect(20, 400, 200, 150);
        ctx.fillText('POWER', 120, 380);

        // Pin labels top row (digital pins 13..0 reversed because of UV mapping)
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        const topLabels = ['SCL', 'SDA', 'AREF', 'GND', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'];
        const topXs = [];
        const digitalGroupBStart = 270;
        for (let i = 0; i < topLabels.length; i++) {
            const x = digitalGroupBStart + i * 42;
            ctx.fillText(topLabels[i], x, 195);
        }

        // Pin labels bottom row (power + analog)
        const botLabels = ['IOREF', 'RST', '3V3', '5V', 'GND', 'GND', 'VIN', '', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
        for (let i = 0; i < botLabels.length; i++) {
            const x = 280 + i * 48;
            ctx.fillText(botLabels[i], x, 555);
        }

        // Decorative traces (curved thin lines)
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(230, 230, 230, 0.35)';
        for (let i = 0; i < 18; i++) {
            ctx.beginPath();
            const sx = 250 + Math.random() * 600;
            const sy = 230 + Math.random() * 260;
            const ex = sx + (Math.random() - 0.5) * 200;
            const ey = sy + (Math.random() - 0.5) * 120;
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(sx + 40, sy + 10, ex - 40, ey - 10, ex, ey);
            ctx.stroke();
        }

        // Solder pads scattered
        ctx.fillStyle = '#c9a24a';
        for (let i = 0; i < 36; i++) {
            const x = 260 + Math.random() * 700;
            const y = 220 + Math.random() * 280;
            ctx.beginPath();
            ctx.arc(x, y, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mounting holes (corners)
        const holes = [[50, 50], [1024 - 50, 50], [50, 700 - 50], [1024 - 50, 700 - 50]];
        holes.forEach(([x, y]) => {
            ctx.fillStyle = '#040a0f';
            ctx.beginPath();
            ctx.arc(x, y, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#c9a24a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 22, 0, Math.PI * 2);
            ctx.stroke();
        });

        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        return tex;
    }

    function makeGlowTexture(rgb) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, `rgba(${rgb},1)`);
        grad.addColorStop(0.4, `rgba(${rgb},0.4)`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    }

    function init() {
        if (!window.THREE) return;
        const canvas = document.getElementById('arduinoCanvas');
        if (!canvas) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.set(0, 4.8, 6.8);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.AmbientLight(0x334455, 0.75));

        const key = new THREE.DirectionalLight(0xffffff, 1.15);
        key.position.set(4, 8, 5);
        scene.add(key);

        const rim = new THREE.DirectionalLight(0x00ffea, 0.7);
        rim.position.set(-4, 2, -5);
        scene.add(rim);

        const accentTop = new THREE.PointLight(0x00ffea, 2.4, 8);
        accentTop.position.set(0, 2.0, 1.2);
        scene.add(accentTop);

        const accentBottom = new THREE.PointLight(0x00ffea, 1.8, 6);
        accentBottom.position.set(0, -1.2, 0);
        scene.add(accentBottom);

        // Hover glow plane (below the board)
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = glowCanvas.height = 256;
        const gctx = glowCanvas.getContext('2d');
        const grad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, 'rgba(0,255,234,0.55)');
        grad.addColorStop(0.5, 'rgba(0,255,234,0.12)');
        grad.addColorStop(1, 'rgba(0,255,234,0)');
        gctx.fillStyle = grad;
        gctx.fillRect(0, 0, 256, 256);
        const glowTex = new THREE.CanvasTexture(glowCanvas);
        const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(4.2, 4.2),
            new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false })
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = -0.6;
        scene.add(glow);

        // Board assembly
        const board = new THREE.Group();

        // PCB base (darker so silkscreen layer reads well)
        const pcbMat = new THREE.MeshStandardMaterial({ color: 0x156236, roughness: 0.75, metalness: 0.18 });
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 2.6), pcbMat);
        board.add(pcb);

        // Silkscreen overlay
        const silkTex = makeSilkscreenTexture();
        const silkMat = new THREE.MeshStandardMaterial({
            map: silkTex,
            roughness: 0.85,
            metalness: 0.05,
            transparent: true
        });
        const silk = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.6), silkMat);
        silk.rotation.x = -Math.PI / 2;
        silk.position.y = 0.061;
        board.add(silk);

        // PCB edge strips (thin silver rim) — small detail
        const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0a3d20, roughness: 0.6, metalness: 0.4 });
        const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.02, 0.04), edgeMat);
        edgeTop.position.set(0, 0.062, 1.3);
        board.add(edgeTop);
        const edgeBot = edgeTop.clone();
        edgeBot.position.z = -1.3;
        board.add(edgeBot);

        // Silver material reused
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xc0c6cc, roughness: 0.28, metalness: 0.92 });
        const silverDarkMat = new THREE.MeshStandardMaterial({ color: 0x8b8e92, roughness: 0.35, metalness: 0.85 });

        // USB port with visible slot
        const usbGroup = new THREE.Group();
        const usbBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.9), silverMat);
        usbGroup.add(usbBody);
        const usbSlot = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.15, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 })
        );
        usbSlot.position.set(-0.4, 0.05, 0);
        usbGroup.add(usbSlot);
        usbGroup.position.set(-1.7, 0.31, -0.6);
        board.add(usbGroup);

        // DC power jack
        const blackPlasticMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5, metalness: 0.2 });
        const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 20), blackPlasticMat);
        jack.rotation.z = Math.PI / 2;
        jack.position.set(-1.65, 0.28, 0.7);
        board.add(jack);
        const jackInner = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.58, 14), silverDarkMat);
        jackInner.rotation.z = Math.PI / 2;
        jackInner.position.set(-1.65, 0.28, 0.7);
        board.add(jackInner);

        // ATmega328P DIP chip
        const chipMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.42, metalness: 0.35 });
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.9), chipMat);
        chip.position.set(0.5, 0.12, 0.15);
        board.add(chip);

        // Pin-1 notch
        const notch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12, 1, false, 0, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
        );
        notch.rotation.x = -Math.PI / 2;
        notch.position.set(0.11, 0.181, 0.15);
        board.add(notch);

        // DIP chip gold pins (7 per side)
        const pinChipMat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.9 });
        const chipPinGeo = new THREE.BoxGeometry(0.06, 0.04, 0.05);
        for (let i = 0; i < 7; i++) {
            const z = -0.32 + i * 0.11;
            const pL = new THREE.Mesh(chipPinGeo, pinChipMat);
            pL.position.set(0.12, 0.08, z);
            board.add(pL);
            const pR = new THREE.Mesh(chipPinGeo, pinChipMat);
            pR.position.set(0.88, 0.08, z);
            board.add(pR);
        }

        // Crystal oscillator as silver can (cylinder)
        const crystal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 16), silverMat);
        crystal.rotation.z = Math.PI / 2;
        crystal.position.set(-0.1, 0.13, -0.75);
        board.add(crystal);

        // Reset button
        const resetMat = new THREE.MeshStandardMaterial({ color: 0x1493d8, roughness: 0.4, metalness: 0.25 });
        const reset = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 14), resetMat);
        reset.position.set(-1.2, 0.15, -0.3);
        board.add(reset);

        // Pin header helper (black base + gold tip)
        const pinBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.55, metalness: 0.3 });
        const pinTipMat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.95 });
        const pinBaseGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
        const pinTipGeo = new THREE.BoxGeometry(0.05, 0.06, 0.05);
        function addPinGroup(startX, z, count) {
            for (let i = 0; i < count; i++) {
                const x = startX + i * 0.16;
                const base = new THREE.Mesh(pinBaseGeo, pinBaseMat);
                base.position.set(x, 0.12, z);
                board.add(base);
                const tip = new THREE.Mesh(pinTipGeo, pinTipMat);
                tip.position.set(x, 0.21, z);
                board.add(tip);
            }
        }
        // Top row (digital): 8 pins + gap + 6 pins + 4 pins (SCL/SDA/AREF/GND area)
        addPinGroup(-1.02, -1.1, 6);  // D8..D13
        addPinGroup(0.18, -1.1, 8);   // D0..D7
        addPinGroup(-1.50, -1.1, 4);  // SCL/SDA/AREF/GND
        // Bottom row (power + analog): 8 power + gap + 6 analog
        addPinGroup(-1.50, 1.1, 8);   // power rail
        addPinGroup(0.18, 1.1, 6);    // A0..A5

        // ICSP 2x3 header (near chip, right side)
        const icspGroup = new THREE.Group();
        for (let r = 0; r < 2; r++) {
            for (let ccol = 0; ccol < 3; ccol++) {
                const base = new THREE.Mesh(pinBaseGeo, pinBaseMat);
                base.position.set(ccol * 0.14, 0.12, r * 0.14);
                icspGroup.add(base);
                const tip = new THREE.Mesh(pinTipGeo, pinTipMat);
                tip.position.set(ccol * 0.14, 0.21, r * 0.14);
                icspGroup.add(tip);
            }
        }
        icspGroup.position.set(1.3, 0, 0.35);
        board.add(icspGroup);

        // Capacitors
        const capMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.85 });
        [[0.2, -0.3], [1.5, -0.7], [-0.9, 0.6]].forEach(([x, z]) => {
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.38, 16), capMat);
            cap.position.set(x, 0.25, z);
            board.add(cap);
        });

        // Mounting hole rings (silver on black)
        const holePositions = [[-1.72, -1.15], [1.72, -1.15], [-1.72, 1.15], [1.72, 1.15]];
        holePositions.forEach(([x, z]) => {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.06, 0.10, 16),
                new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.9, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(x, 0.063, z);
            board.add(ring);
            const hole = new THREE.Mesh(
                new THREE.CircleGeometry(0.06, 16),
                new THREE.MeshStandardMaterial({ color: 0x040a0f, roughness: 0.8 })
            );
            hole.rotation.x = -Math.PI / 2;
            hole.position.set(x, 0.064, z);
            board.add(hole);
        });

        // LEDs with glow sprites (tracked by name for external pulse API)
        const leds = {};
        function addLed(name, x, z, color, rgb, size, glowScale) {
            const restEmissive = 2.2;
            const ledMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: restEmissive,
                roughness: 0.2
            });
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12), ledMat);
            mesh.position.set(x, 0.18, z);
            board.add(mesh);

            const spriteMat = new THREE.SpriteMaterial({
                map: makeGlowTexture(rgb),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(glowScale, glowScale, 1);
            sprite.position.set(x, 0.18, z);
            board.add(sprite);

            const entry = { mesh, sprite, restEmissive, restSpriteScale: glowScale, pulseT: 0 };
            if (!leds[name]) leds[name] = [];
            leds[name].push(entry);
        }

        // Cyan status LEDs (grouped under 'cyan')
        addLed('cyan', 1.3, 0.4, 0x00ffea, '0,255,234', 0.07, 0.55);
        addLed('cyan', 1.3, 0.1, 0x00ffea, '0,255,234', 0.07, 0.55);
        addLed('cyan', 1.3, -0.2, 0x00ffea, '0,255,234', 0.07, 0.55);
        // Yellow power LED and red TX LED near USB
        addLed('power', -0.9, -0.25, 0xffd23f, '255,210,63', 0.06, 0.48);
        addLed('tx',    -0.75, -0.05, 0xff3a3a, '255,58,58',  0.06, 0.44);

        // Public API for external code (arduino-sketch.js)
        window.arduinoBoard = {
            pulse(name) {
                const group = leds[name];
                if (!group) return;
                for (const e of group) e.pulseT = 1.0;
            },
            pulseAll() {
                for (const g of Object.values(leds)) {
                    for (const e of g) e.pulseT = 1.0;
                }
            }
        };

        board.rotation.x = -0.25;
        board.scale.setScalar(0.88);
        scene.add(board);

        function resize() {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (w === 0 || h === 0) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 100);
        });
        resize();

        function render() {
            renderer.render(scene, camera);
        }

        if (reducedMotion) {
            render();
            return;
        }

        // Drag-to-rotate
        let dragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let yaw = 0;
        let pitch = -0.25;
        let autoSpinEnabled = true;
        let idleTimer;

        function resumeAutoSpin() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => { autoSpinEnabled = true; }, 2000);
        }

        function onPointerDown(e) {
            dragging = true;
            autoSpinEnabled = false;
            const p = e.touches ? e.touches[0] : e;
            dragStartX = p.clientX;
            dragStartY = p.clientY;
        }
        function onPointerMove(e) {
            if (!dragging) return;
            const p = e.touches ? e.touches[0] : e;
            const dx = p.clientX - dragStartX;
            const dy = p.clientY - dragStartY;
            yaw += dx * 0.01;
            pitch = Math.max(-1.0, Math.min(0.6, pitch + dy * 0.005));
            dragStartX = p.clientX;
            dragStartY = p.clientY;
            if (e.touches) e.preventDefault();
        }
        function onPointerUp() {
            if (!dragging) return;
            dragging = false;
            resumeAutoSpin();
        }

        canvas.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
        canvas.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);

        let inView = true;
        const io = new IntersectionObserver((entries) => {
            inView = entries[0].isIntersecting;
            if (inView) requestAnimationFrame(loop);
        }, { threshold: 0 });
        io.observe(canvas);

        const clock = new THREE.Clock();

        function loop() {
            if (!inView) return;
            const t = clock.getElapsedTime();
            if (autoSpinEnabled) yaw += 0.005;
            board.rotation.y = yaw;
            board.rotation.x = pitch;
            board.rotation.z = Math.sin(t * 0.7) * 0.04;
            board.position.y = Math.sin(t * 1.2) * 0.15;

            glow.material.opacity = 0.65 + Math.sin(t * 1.2) * 0.15;

            // Decay LED pulses
            for (const group of Object.values(leds)) {
                for (const e of group) {
                    if (e.pulseT > 0) {
                        e.pulseT = Math.max(0, e.pulseT - 0.04);
                        const boost = e.pulseT * e.pulseT;
                        e.mesh.material.emissiveIntensity = e.restEmissive + boost * 3.0;
                        const s = e.restSpriteScale * (1 + boost * 1.8);
                        e.sprite.scale.set(s, s, 1);
                    }
                }
            }

            render();
            requestAnimationFrame(loop);
        }
        loop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
