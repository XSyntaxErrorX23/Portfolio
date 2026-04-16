const canvas = document.getElementById('particlesCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const embers = [];
const emberCount = 60;

class Ember {
    constructor(spawnAtBottom = false) {
        this.reset(spawnAtBottom);
    }

    reset(spawnAtBottom) {
        this.x = Math.random() * canvas.width;
        this.y = spawnAtBottom ? canvas.height + Math.random() * 40 : Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.15;
        this.vy = -(Math.random() * 0.35 + 0.1);
        this.radius = Math.random() * 1.4 + 0.5;
        this.alpha = Math.random() * 0.4 + 0.25;
        this.fade = Math.random() * 0.0025 + 0.0008;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy -= 0.003;
        this.vx += (Math.random() - 0.5) * 0.02;
        this.alpha -= this.fade;
        if (this.y < -10 || this.alpha <= 0) this.reset(true);
    }

    draw() {
        const a = Math.max(this.alpha, 0);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233, 201, 126, ${a})`;
        ctx.shadowColor = 'rgba(201, 169, 97, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fill();
    }
}

for (let i = 0; i < emberCount; i++) embers.push(new Ember());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    embers.forEach(e => { e.update(); e.draw(); });
    requestAnimationFrame(animate);
}

animate();
