import { extension_settings } from "../../../extensions.js";

// HTML 模板
const petHtmlTemplate = `
<div id="pet-overlay-root">
    <div id="pet-bubble-container">
        <div class="pet-speech-bubble" id="pet-bubble">喵~</div>
    </div>

    <img id="pet-entity" src="" alt="Pet" draggable="false">

    <div class="pet-context-menu" id="pet-context-menu">
        <div class="pet-mini-stats">
            <div class="pet-stat-row"><span>饱食</span><span id="val-hunger">80%</span></div>
            <div class="pet-stat-bar-bg"><div class="pet-stat-bar-fill" id="bar-hunger" style="width: 80%"></div></div>
            <div style="height:5px"></div>
            <div class="pet-stat-row"><span>快乐</span><span id="val-happiness">60%</span></div>
            <div class="pet-stat-bar-bg"><div class="pet-stat-bar-fill" id="bar-happiness" style="width: 60%; background:#c8e6f8"></div></div>
        </div>
        <div class="pet-menu-item" id="act-feed">🍖 喂食</div>
        <div class="pet-menu-item" id="act-sleep">💤 睡觉/叫醒</div>
        <div class="pet-menu-item" id="act-interact">💕 抚摸</div>
        <div class="pet-menu-separator"></div>
        <div class="pet-menu-item" id="act-settings">⚙️ 设置</div>
        <div class="pet-menu-item" id="act-reset">📍 重置位置</div>
    </div>

    <div class="pet-modal-overlay" id="pet-settings-modal">
        <div class="pet-settings-panel">
            <h3 style="text-align:center;color:#666;margin-bottom:20px;">宠物设置</h3>
            
            <div class="pet-form-group">
                <label>宠物名字</label>
                <input type="text" id="pet-set-name" placeholder="给它起个名" style="width:100%; padding:8px; border:1px solid #eee; border-radius:8px; color:black;">
            </div>

            <div class="pet-form-group">
                <label>大小 (像素)</label>
                <input type="range" id="pet-set-size" min="50" max="400" value="150" style="width:100%">
            </div>

            <hr style="border:0; border-top:1px solid #eee; margin:15px 0;">
            <label style="display:block; margin-bottom:10px; color:#666; font-weight:bold;">自定义动作图 (GIF/PNG)</label>

            <div class="pet-form-group">
                <label>待机 (Idle)</label>
                <div class="pet-image-uploader" id="uploader-idle">
                    <span class="preview-text" id="prev-text-idle">点击上传</span>
                    <img id="prev-img-idle" style="display:none">
                </div>
                <input type="file" id="upload-idle" accept="image/*" style="display:none">
            </div>

             <div class="pet-form-group">
                <label>行走 (Walk)</label>
                <div class="pet-image-uploader" id="uploader-walk">
                    <span class="preview-text" id="prev-text-walk">点击上传</span>
                    <img id="prev-img-walk" style="display:none">
                </div>
                <input type="file" id="upload-walk" accept="image/*" style="display:none">
            </div>

            <div class="pet-settings-buttons">
                <button class="pet-btn" id="btn-save-settings">保存并应用</button>
                <button class="pet-btn pet-btn-cancel" id="btn-close-settings">取消</button>
            </div>
        </div>
    </div>
</div>
`;

const generateEmojiBlob = (emoji) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '100px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 64);
    return canvas.toDataURL();
};

const DefaultAssets = {
    idle: generateEmojiBlob('🐱'),
    walk: generateEmojiBlob('🐈'),
    interact: generateEmojiBlob('😻'),
    drag: generateEmojiBlob('🙀'),
    sleep: generateEmojiBlob('💤')
};

// 核心逻辑封装
const PetExtension = {
    store: {
        petName: '小猫',
        size: 150,
        images: { ...DefaultAssets },
        stats: { hunger: 80, happiness: 80, energy: 90 }
    },
    state: {
        isDragging: false,
        isSleeping: false,
        isWalking: false,
        currentAction: 'idle',
        posX: window.innerWidth / 2 - 75,
        posY: window.innerHeight / 2 - 75,
        direction: 1,
        targetX: 0,
        targetY: 0,
        dragOffsetX: 0,
        dragOffsetY: 0,
        walkTimer: null,
        behaviorLoop: null,
        statLoop: null
    },
    elements: {},

    init() {
        // 注入 HTML
        if (!document.getElementById('pet-overlay-root')) {
            const div = document.createElement('div');
            div.innerHTML = petHtmlTemplate;
            document.body.appendChild(div.firstElementChild);
        }

        // 获取元素引用
        this.elements = {
            pet: document.getElementById('pet-entity'),
            bubbleContainer: document.getElementById('pet-bubble-container'),
            bubble: document.getElementById('pet-bubble'),
            menu: document.getElementById('pet-context-menu'),
            modal: document.getElementById('pet-settings-modal'),
            root: document.getElementById('pet-overlay-root')
        };

        this.loadData();
        this.updateAppearance();
        this.startBehaviorLoop();
        this.startStatDecay();
        this.updateStatsUI();
        this.movePet(this.state.posX, this.state.posY);
        this.bindEvents();

        console.log('[Desktop Pet] Extension loaded.');
    },

    loadData() {
        const saved = localStorage.getItem('st_desktop_pet_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.store.petName = data.petName || this.store.petName;
                this.store.size = data.size || this.store.size;
                this.store.stats = data.stats || this.store.stats;
                if(data.images) this.store.images = { ...this.store.images, ...data.images };
            } catch(e) { console.error(e); }
        }
    },

    saveData() {
        localStorage.setItem('st_desktop_pet_data', JSON.stringify(this.store));
    },

    movePet(x, y) {
        const maxX = window.innerWidth - this.store.size;
        const maxY = window.innerHeight - this.store.size;
        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));
        this.state.posX = x;
        this.state.posY = y;
        this.elements.pet.style.left = x + 'px';
        this.elements.pet.style.top = y + 'px';
        this.elements.bubbleContainer.style.left = (x + this.store.size / 2) + 'px';
        this.elements.bubbleContainer.style.top = y + 'px';
    },

    changeAction(action) {
        if (this.state.isSleeping && action !== 'sleep') return;
        if (this.state.currentAction === action) return;
        this.state.currentAction = action;
        let imgSrc = this.store.images[action] || this.store.images.idle;
        this.elements.pet.src = imgSrc;
    },

    say(text) {
        this.elements.bubble.textContent = text;
        this.elements.bubble.classList.add('show');
        if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
        this.bubbleTimer = setTimeout(() => {
            this.elements.bubble.classList.remove('show');
        }, 3000);
    },

    startBehaviorLoop() {
        const loop = () => {
            const delay = 3000 + Math.random() * 5000;
            this.state.behaviorLoop = setTimeout(() => {
                if (!this.state.isDragging && !this.state.isSleeping && document.visibilityState === 'visible') {
                    if (Math.random() < 0.6) this.startWalking();
                    else this.stopWalking();
                }
                loop();
            }, delay);
        };
        loop();
    },

    startWalking() {
        if (this.state.isDragging || this.state.isSleeping) return;
        this.state.isWalking = true;
        this.changeAction('walk');
        const range = 200; 
        let targetX = this.state.posX + (Math.random() * range * 2 - range);
        let targetY = this.state.posY + (Math.random() * range * 2 - range);
        const maxX = window.innerWidth - this.store.size;
        const maxY = window.innerHeight - this.store.size;
        this.state.targetX = Math.max(0, Math.min(targetX, maxX));
        this.state.targetY = Math.max(0, Math.min(targetY, maxY));

        if (this.state.targetX < this.state.posX) {
            this.elements.pet.classList.add('pet-flipped');
        } else {
            this.elements.pet.classList.remove('pet-flipped');
        }
        this.processMovement();
    },

    processMovement() {
        if (!this.state.isWalking) return;
        const speed = 2;
        const dx = this.state.targetX - this.state.posX;
        const dy = this.state.targetY - this.state.posY;
        const distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < 5) {
            this.stopWalking();
            return;
        }
        this.movePet(this.state.posX + (dx/distance)*speed, this.state.posY + (dy/distance)*speed);
        this.state.walkTimer = requestAnimationFrame(() => this.processMovement());
    },

    stopWalking() {
        this.state.isWalking = false;
        cancelAnimationFrame(this.state.walkTimer);
        this.changeAction('idle');
    },

    startStatDecay() {
        this.state.statLoop = setInterval(() => {
            if (!this.state.isSleeping) {
                this.store.stats.hunger = Math.max(0, this.store.stats.hunger - 1);
                this.store.stats.happiness = Math.max(0, this.store.stats.happiness - 1);
            } else {
                this.store.stats.energy = Math.min(100, this.store.stats.energy + 2);
            }
            this.updateStatsUI();
            this.saveData();
        }, 10000);
    },

    updateStatsUI() {
        document.getElementById('val-hunger').textContent = Math.floor(this.store.stats.hunger) + '%';
        document.getElementById('bar-hunger').style.width = this.store.stats.hunger + '%';
        document.getElementById('val-happiness').textContent = Math.floor(this.store.stats.happiness) + '%';
        document.getElementById('bar-happiness').style.width = this.store.stats.happiness + '%';
    },

    updateAppearance() {
        this.elements.pet.style.width = this.store.size + 'px';
        this.changeAction('idle');
    },

    // UI Actions
    feed() {
        this.stopWalking();
        this.store.stats.hunger = Math.min(100, this.store.stats.hunger + 20);
        this.say("吧唧吧唧... 好吃！");
        this.updateStatsUI();
        this.hideMenu();
    },
    toggleSleep() {
        this.state.isSleeping = !this.state.isSleeping;
        this.hideMenu();
        if(this.state.isSleeping) {
            this.stopWalking();
            this.changeAction('sleep');
            this.say("晚安...");
            this.elements.pet.style.opacity = "0.8";
        } else {
            this.changeAction('idle');
            this.say("早安！");
            this.elements.pet.style.opacity = "1";
        }
    },
    interact() {
        this.stopWalking();
        this.store.stats.happiness = Math.min(100, this.store.stats.happiness + 5);
        this.changeAction('interact');
        this.say("喵~");
        this.updateStatsUI();
        setTimeout(() => this.changeAction('idle'), 1500);
        this.hideMenu();
    },
    resetPosition() {
        this.movePet(window.innerWidth/2 - this.store.size/2, window.innerHeight/2 - this.store.size/2);
        this.hideMenu();
    },
    hideMenu() { this.elements.menu.classList.remove('show'); },
    
    // Events
    bindEvents() {
        // Drag
        this.elements.pet.addEventListener('mousedown', (e) => {
            if(e.button !== 0) return;
            this.state.isDragging = true;
            this.stopWalking();
            this.changeAction('drag');
            this.state.dragOffsetX = e.clientX - this.elements.pet.getBoundingClientRect().left;
            this.state.dragOffsetY = e.clientY - this.elements.pet.getBoundingClientRect().top;
            this.elements.pet.style.transition = 'none';
            this.elements.bubbleContainer.style.transition = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if(this.state.isDragging) {
                this.movePet(e.clientX - this.state.dragOffsetX, e.clientY - this.state.dragOffsetY);
            }
        });

        window.addEventListener('mouseup', () => {
            if(this.state.isDragging) {
                this.state.isDragging = false;
                this.elements.pet.style.transition = 'transform 0.1s linear';
                this.elements.bubbleContainer.style.transition = 'top 0.1s linear, left 0.1s linear';
                this.changeAction(this.state.isSleeping ? 'sleep' : 'idle');
                this.saveData();
            }
        });

        // Menu
        this.elements.pet.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            let x = e.clientX, y = e.clientY;
            if(x + 150 > window.innerWidth) x -= 150;
            if(y + 200 > window.innerHeight) y -= 200;
            this.elements.menu.style.left = x + 'px';
            this.elements.menu.style.top = y + 'px';
            this.elements.menu.classList.add('show');
            this.updateStatsUI();
        });

        window.addEventListener('click', (e) => {
            if(!e.target.closest('.pet-context-menu') && e.target.id !== 'pet-entity') this.hideMenu();
        });

        // Buttons
        document.getElementById('act-feed').onclick = () => this.feed();
        document.getElementById('act-sleep').onclick = () => this.toggleSleep();
        document.getElementById('act-interact').onclick = () => this.interact();
        document.getElementById('act-reset').onclick = () => this.resetPosition();
        document.getElementById('act-settings').onclick = () => {
            this.hideMenu();
            document.getElementById('pet-set-name').value = this.store.petName;
            document.getElementById('pet-set-size').value = this.store.size;
            this.elements.modal.classList.add('show');
        };

        document.getElementById('btn-close-settings').onclick = () => this.elements.modal.classList.remove('show');
        document.getElementById('btn-save-settings').onclick = () => {
            this.store.petName = document.getElementById('pet-set-name').value;
            this.store.size = parseInt(document.getElementById('pet-set-size').value);
            this.saveData();
            this.updateAppearance();
            this.elements.modal.classList.remove('show');
            this.say("设置已保存");
        };
        
        // Image Upload Handlers
        const handleUpload = (key, inputId, divId, imgId) => {
            document.getElementById(divId).onclick = () => document.getElementById(inputId).click();
            document.getElementById(inputId).onchange = (e) => {
                const file = e.target.files[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.store.images[key] = ev.target.result;
                    document.getElementById(imgId).src = ev.target.result;
                    document.getElementById(imgId).style.display = 'block';
                };
                reader.readAsDataURL(file);
            };
        };
        handleUpload('idle', 'upload-idle', 'uploader-idle', 'prev-img-idle');
        handleUpload('walk', 'upload-walk', 'uploader-walk', 'prev-img-walk');
    }
};

// 酒馆扩展加载入口
jQuery(document).ready(function () {
    PetExtension.init();
});
