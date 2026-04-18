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
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.set(0, 2.5, 6);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.AmbientLight(0x223344, 0.9));
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(5, 8, 5);
        scene.add(dir);
        const accent = new THREE.PointLight(0x00ffea, 1.2, 10);
        accent.position.set(0, 1.2, 1.5);
        scene.add(accent);

        const board = new THREE.Group();

        const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1d8c4c, roughness: 0.7, metalness: 0.1 });
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 2.6), pcbMat);
        board.add(pcb);

        const silverMat = new THREE.MeshStandardMaterial({ color: 0xc0c6cc, roughness: 0.3, metalness: 0.9 });
        const usb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.9), silverMat);
        usb.position.set(-1.7, 0.31, -0.6);
        board.add(usb);

        const blackPlasticMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5, metalness: 0.2 });
        const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 20), blackPlasticMat);
        jack.rotation.z = Math.PI / 2;
        jack.position.set(-1.65, 0.28, 0.7);
        board.add(jack);

        const chipMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.3 });
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.95), chipMat);
        chip.position.set(0.6, 0.12, 0.15);
        board.add(chip);

        const crystal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.22), silverMat);
        crystal.position.set(-0.2, 0.15, -0.7);
        board.add(crystal);

        const resetMat = new THREE.MeshStandardMaterial({ color: 0x1493d8, roughness: 0.4, metalness: 0.2 });
        const reset = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 14), resetMat);
        reset.position.set(-1.2, 0.15, -0.3);
        board.add(reset);

        const pinMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.3, metalness: 0.9 });
        const pinGeo = new THREE.BoxGeometry(0.08, 0.28, 0.08);
        function addPinRow(z, count, xStart) {
            for (let i = 0; i < count; i++) {
                const pin = new THREE.Mesh(pinGeo, pinMat);
                pin.position.set(xStart + i * 0.16, 0.2, z);
                board.add(pin);
            }
        }
        addPinRow(-1.15, 14, -1.1);
        addPinRow(1.15, 14, -1.1);

        const capMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.8 });
        [[0.2, 0, -0.3], [1.5, 0, -0.7], [-0.9, 0, 0.6]].forEach(([x, , z]) => {
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.38, 16), capMat);
            cap.position.set(x, 0.25, z);
            board.add(cap);
        });

        const ledMat = new THREE.MeshStandardMaterial({
            color: 0x00ffea,
            emissive: 0x00ffea,
            emissiveIntensity: 1.8,
            roughness: 0.2,
            metalness: 0.1
        });
        [[1.3, 0.4], [1.3, 0.1], [1.3, -0.2]].forEach(([x, z]) => {
            const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), ledMat);
            led.position.set(x, 0.18, z);
            board.add(led);
        });

        board.rotation.x = -0.3;
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

        const clock = new THREE.Clock();

        function render() {
            renderer.render(scene, camera);
        }

        if (reducedMotion) {
            render();
            return;
        }

        function loop() {
            board.rotation.y += 0.005;
            board.position.y = Math.sin(clock.getElapsedTime() * 1.2) * 0.15;
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
