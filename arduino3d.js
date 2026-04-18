(function () {
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
        camera.position.set(0, 4.2, 4.8);
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
            new THREE.PlaneGeometry(6, 6),
            new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false })
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = -1.0;
        scene.add(glow);

        // Board assembly
        const board = new THREE.Group();

        const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1d8c4c, roughness: 0.72, metalness: 0.15 });
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 2.6), pcbMat);
        board.add(pcb);

        // Silkscreen hints (thin white lines on PCB top)
        const silkMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9, metalness: 0 });
        [
            [0.0, -1.22, 3.4, 0.04],
            [0.0, 1.22, 3.4, 0.04],
            [-1.9, 0.0, 0.04, 2.5],
            [1.9, 0.0, 0.04, 2.5]
        ].forEach(([x, z, w, d]) => {
            const strip = new THREE.Mesh(
                new THREE.BoxGeometry(w, 0.005, d),
                silkMat
            );
            strip.position.set(x, 0.062, z);
            board.add(strip);
        });

        const silverMat = new THREE.MeshStandardMaterial({ color: 0xc0c6cc, roughness: 0.28, metalness: 0.92 });
        const usb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.9), silverMat);
        usb.position.set(-1.7, 0.31, -0.6);
        board.add(usb);

        const blackPlasticMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5, metalness: 0.2 });
        const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 20), blackPlasticMat);
        jack.rotation.z = Math.PI / 2;
        jack.position.set(-1.65, 0.28, 0.7);
        board.add(jack);

        const chipMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.42, metalness: 0.35 });
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), chipMat);
        chip.position.set(0.5, 0.11, 0.15);
        board.add(chip);

        // Chip dot (pin-1 marker)
        const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const chipDot = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), dotMat);
        chipDot.rotation.x = -Math.PI / 2;
        chipDot.position.set(0.22, 0.161, -0.12);
        board.add(chipDot);

        const crystal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.22), silverMat);
        crystal.position.set(-0.2, 0.15, -0.7);
        board.add(crystal);

        const resetMat = new THREE.MeshStandardMaterial({ color: 0x1493d8, roughness: 0.4, metalness: 0.25 });
        const reset = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 14), resetMat);
        reset.position.set(-1.2, 0.15, -0.3);
        board.add(reset);

        // Pin headers: black plastic base + gold tip for contrast
        const pinBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.55, metalness: 0.3 });
        const pinTipMat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.95 });
        const pinBaseGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
        const pinTipGeo = new THREE.BoxGeometry(0.05, 0.06, 0.05);
        function addPinRow(z, count, xStart) {
            for (let i = 0; i < count; i++) {
                const base = new THREE.Mesh(pinBaseGeo, pinBaseMat);
                base.position.set(xStart + i * 0.16, 0.12, z);
                board.add(base);
                const tip = new THREE.Mesh(pinTipGeo, pinTipMat);
                tip.position.set(xStart + i * 0.16, 0.21, z);
                board.add(tip);
            }
        }
        addPinRow(-1.1, 14, -1.1);
        addPinRow(1.1, 14, -1.1);

        const capMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.85 });
        [[0.2, -0.3], [1.5, -0.7], [-0.9, 0.6]].forEach(([x, z]) => {
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.38, 16), capMat);
            cap.position.set(x, 0.25, z);
            board.add(cap);
        });

        // Cyan status LEDs (original)
        const cyanLedMat = new THREE.MeshStandardMaterial({
            color: 0x00ffea,
            emissive: 0x00ffea,
            emissiveIntensity: 2.0,
            roughness: 0.2
        });
        [[1.3, 0.4], [1.3, 0.1], [1.3, -0.2]].forEach(([x, z]) => {
            const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), cyanLedMat);
            led.position.set(x, 0.18, z);
            board.add(led);
        });

        // Realistic colored LEDs near USB (yellow power, red TX)
        const yellowLedMat = new THREE.MeshStandardMaterial({
            color: 0xffd23f, emissive: 0xffd23f, emissiveIntensity: 1.5, roughness: 0.3
        });
        const redLedMat = new THREE.MeshStandardMaterial({
            color: 0xff3a3a, emissive: 0xff3a3a, emissiveIntensity: 1.3, roughness: 0.3
        });
        const powerLed = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), yellowLedMat);
        powerLed.position.set(-0.9, 0.16, -0.25);
        board.add(powerLed);
        const txLed = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), redLedMat);
        txLed.position.set(-0.75, 0.16, -0.05);
        board.add(txLed);

        board.rotation.x = -0.25;
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

        // Drag-to-rotate (manual, no OrbitControls dependency)
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

        // Pause loop when canvas is off-screen
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

            // Pulse the underglow with the bob
            glow.material.opacity = 0.65 + Math.sin(t * 1.2) * 0.15;

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
