/**
 * Task Manager 3D Presentation
 * Полный интерактивный 3D-сайт с Three.js
 * Плавающие объекты, освещение, анимации, частицы
 */

(function () {
    'use strict';

    // ========== Three.js Scene ==========
    let scene, camera, renderer, controls;
    let floatingObjects = [];
    let particles;
    let clock = new THREE.Clock();
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function initThree() {
        const canvas = document.getElementById('bg-canvas');

        // Scene
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0e17, 0.015);

        // Camera
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 25);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x0a0e17, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.4);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
        mainLight.position.set(10, 20, 15);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 100;
        mainLight.shadow.camera.left = -30;
        mainLight.shadow.camera.right = 30;
        mainLight.shadow.camera.top = 30;
        mainLight.shadow.camera.bottom = -30;
        scene.add(mainLight);

        const purpleLight = new THREE.PointLight(0x7c3aed, 1.5, 50);
        purpleLight.position.set(-15, 10, -10);
        scene.add(purpleLight);

        const orangeLight = new THREE.PointLight(0xf59e0b, 0.8, 40);
        orangeLight.position.set(15, 5, 10);
        scene.add(orangeLight);

        const cyanLight = new THREE.PointLight(0x00f0ff, 1, 60);
        cyanLight.position.set(0, -5, 20);
        scene.add(cyanLight);

        // Create floating process cubes
        createFloatingObjects();

        // Create particle system
        createParticles();

        // Create grid floor
        createGrid();

        // Create orbital rings
        createRings();

        // Create floating data panels (abstract)
        createDataPanels();

        // Mouse move
        document.addEventListener('mousemove', onMouseMove);

        // Resize
        window.addEventListener('resize', onWindowResize);

        // Start animation
        animate();

        // Hide loader
        setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
        }, 1500);
    }

    function createFloatingObjects() {
        const geometries = [
            new THREE.BoxGeometry(1.2, 1.2, 1.2),
            new THREE.OctahedronGeometry(0.9),
            new THREE.TetrahedronGeometry(1),
            new THREE.IcosahedronGeometry(0.8),
            new THREE.DodecahedronGeometry(0.7),
            new THREE.TorusGeometry(0.6, 0.25, 16, 32),
            new THREE.TorusKnotGeometry(0.5, 0.15, 64, 16)
        ];

        const colors = [0x00f0ff, 0x7c3aed, 0xf59e0b, 0x10b981, 0xef4444, 0x3b82f6, 0xec4899];

        for (let i = 0; i < 35; i++) {
            const geo = geometries[Math.floor(Math.random() * geometries.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.7,
                roughness: 0.25,
                emissive: color,
                emissiveIntensity: 0.15,
                transparent: true,
                opacity: 0.85
            });

            const mesh = new THREE.Mesh(geo, material);
            mesh.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 40 - 10
            );
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            mesh.scale.setScalar(0.5 + Math.random() * 1.2);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Store animation data
            mesh.userData = {
                speed: 0.2 + Math.random() * 0.5,
                rotSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                },
                floatAmp: 0.5 + Math.random() * 1.5,
                floatOffset: Math.random() * Math.PI * 2,
                originalY: mesh.position.y
            };

            scene.add(mesh);
            floatingObjects.push(mesh);

            // Wireframe outline for some objects
            if (Math.random() > 0.6) {
                const wireMat = new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.3
                });
                const wireMesh = new THREE.Mesh(geo, wireMat);
                wireMesh.scale.multiplyScalar(1.05);
                mesh.add(wireMesh);
            }
        }
    }

    function createParticles() {
        const particleCount = 1500;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const color1 = new THREE.Color(0x00f0ff);
        const color2 = new THREE.Color(0x7c3aed);
        const color3 = new THREE.Color(0xf59e0b);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 80;
            positions[i3 + 1] = (Math.random() - 0.5) * 60;
            positions[i3 + 2] = (Math.random() - 0.5) * 60;

            const mixColor = Math.random();
            let c;
            if (mixColor < 0.4) c = color1;
            else if (mixColor < 0.7) c = color2;
            else c = color3;

            colors[i3] = c.r;
            colors[i3 + 1] = c.g;
            colors[i3 + 2] = c.b;
            sizes[i] = Math.random() * 2 + 0.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);
    }

    function createGrid() {
        const gridHelper = new THREE.GridHelper(80, 80, 0x00f0ff, 0x1a1a2e);
        gridHelper.position.y = -15;
        gridHelper.material.opacity = 0.15;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Second grid for depth
        const grid2 = new THREE.GridHelper(60, 40, 0x7c3aed, 0x0a0e17);
        grid2.position.y = -15.1;
        grid2.position.z = -20;
        grid2.rotation.x = Math.PI / 12;
        grid2.material.opacity = 0.08;
        grid2.material.transparent = true;
        scene.add(grid2);
    }

    function createRings() {
        for (let i = 0; i < 4; i++) {
            const radius = 8 + i * 4;
            const geo = new THREE.TorusGeometry(radius, 0.05, 16, 100);
            const mat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x00f0ff : 0x7c3aed,
                transparent: true,
                opacity: 0.2 - i * 0.03
            });
            const ring = new THREE.Mesh(geo, mat);
            ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
            ring.rotation.y = (Math.random() - 0.5) * 0.2;
            ring.position.y = -5 + i * 2;
            ring.userData = {
                rotSpeed: 0.001 + Math.random() * 0.002,
                axis: i % 2 === 0 ? 'z' : 'y'
            };
            scene.add(ring);
            floatingObjects.push(ring);
        }
    }

    function createDataPanels() {
        // Abstract floating "monitor" panels
        for (let i = 0; i < 6; i++) {
            const group = new THREE.Group();

            // Panel body
            const panelGeo = new THREE.PlaneGeometry(3, 2);
            const panelMat = new THREE.MeshStandardMaterial({
                color: 0x0a0e17,
                metalness: 0.9,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            const panel = new THREE.Mesh(panelGeo, panelMat);
            group.add(panel);

            // Border
            const edges = new THREE.EdgesGeometry(panelGeo);
            const lineMat = new THREE.LineBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.6
            });
            const border = new THREE.LineSegments(edges, lineMat);
            group.add(border);

            // Fake "bars" on panel
            for (let j = 0; j < 5; j++) {
                const barH = 0.1 + Math.random() * 0.8;
                const barGeo = new THREE.PlaneGeometry(0.25, barH);
                const barMat = new THREE.MeshBasicMaterial({
                    color: [0x00f0ff, 0x7c3aed, 0xf59e0b, 0x10b981, 0xef4444][j],
                    transparent: true,
                    opacity: 0.8
                });
                const bar = new THREE.Mesh(barGeo, barMat);
                bar.position.set(-1 + j * 0.5, -0.7 + barH / 2, 0.01);
                group.add(bar);
            }

            group.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20 + 5,
                (Math.random() - 0.5) * 30 - 15
            );
            group.rotation.y = (Math.random() - 0.5) * Math.PI * 0.5;

            group.userData = {
                speed: 0.15 + Math.random() * 0.3,
                rotSpeed: { x: 0, y: (Math.random() - 0.5) * 0.005, z: 0 },
                floatAmp: 0.8 + Math.random(),
                floatOffset: Math.random() * Math.PI * 2,
                originalY: group.position.y
            };

            scene.add(group);
            floatingObjects.push(group);
        }
    }

    function onMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) * 0.05;
        mouseY = (event.clientY - windowHalfY) * 0.05;
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Animate floating objects
        floatingObjects.forEach((obj) => {
            if (obj.userData.rotSpeed) {
                obj.rotation.x += obj.userData.rotSpeed.x || 0;
                obj.rotation.y += obj.userData.rotSpeed.y || 0;
                obj.rotation.z += obj.userData.rotSpeed.z || 0;
            }
            if (obj.userData.floatAmp !== undefined) {
                obj.position.y = obj.userData.originalY +
                    Math.sin(elapsed * obj.userData.speed + obj.userData.floatOffset) *
                    obj.userData.floatAmp;
            }
            if (obj.userData.axis === 'z') {
                obj.rotation.z += obj.userData.rotSpeed;
            } else if (obj.userData.axis === 'y') {
                obj.rotation.y += obj.userData.rotSpeed;
            }
        });

        // Rotate particles slowly
        if (particles) {
            particles.rotation.y = elapsed * 0.02;
            particles.rotation.x = Math.sin(elapsed * 0.01) * 0.1;
        }

        // Camera follows mouse slightly
        camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 0.2 + 5 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }

    // ========== UI Interactions ==========
    function initUI() {
        // Navigation scroll
        const nav = document.getElementById('main-nav');
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            // Active nav link
            let current = '';
            sections.forEach((section) => {
                const top = section.offsetTop - 150;
                if (window.scrollY >= top) {
                    current = section.getAttribute('id');
                }
            });
            navLinks.forEach((link) => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });

        // Mobile menu
        const menuToggle = document.getElementById('menu-toggle');
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('menu-open');
        });

        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                nav.classList.remove('menu-open');
            });
        });

        // Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');

                tabBtns.forEach((b) => b.classList.remove('active'));
                tabPanels.forEach((p) => p.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById('panel-' + tabId).classList.add('active');
            });
        });

        // Timeline animation on scroll
        const timelineItems = document.querySelectorAll('.timeline-item');
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        timelineItems.forEach((item) => observer.observe(item));

        // Animate stats counters
        const statValues = document.querySelectorAll('.stat-value');
        let statsAnimated = false;

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !statsAnimated) {
                    statsAnimated = true;
                    statValues.forEach((el) => {
                        const target = parseInt(el.getAttribute('data-target'));
                        animateCounter(el, target, 2000);
                    });
                }
            });
        }, { threshold: 0.5 });

        if (statValues.length) {
            statsObserver.observe(statValues[0].parentElement.parentElement);
        }

        // Feature cards tilt effect
        const featureCards = document.querySelectorAll('[data-tilt]');
        featureCards.forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    function animateCounter(element, target, duration) {
        let start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(ease * target);
            element.textContent = value + (target === 100 ? '%' : '');
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target + (target === 100 ? '%' : '');
            }
        }
        requestAnimationFrame(update);
    }

    // ========== Init ==========
    document.addEventListener('DOMContentLoaded', () => {
        initThree();
        initUI();
    });

})();
