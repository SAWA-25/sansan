// index.js - 完整增强版
import { extension_settings } from "../../../extensions.js";

// 1. 定义 HTML 模板 (增加了所有动作的上传按钮)
const petHtmlTemplate = `
<div id="pet-overlay-root">
    <div id="pet-bubble-container">
        <div class="pet-speech-bubble" id="pet-bubble">喵~</div>
    </div>

    <img id="pet-entity" src="" alt="Pet" draggable="false">

    <!-- 右键菜单 -->
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

    <!-- 设置面板 -->
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

            <!-- 待机 Idle -->
            <div class="pet-form-group">
                <label>待机 (Idle)</label>
                <div class="pet-image-uploader" id="uploader-idle">
                    <span class="preview-text" id="prev-text-idle">点击上传</span>
                    <img id="prev-img-idle" style="display:none">
                </div>
                <input type="file" id="upload-idle" accept="image/*" style="display:none">
            </div>

            <!-- 行走 Walk -->
             <div class="pet-form-group">
                <label>行走 (Walk)</label>
                <div class="pet-image-uploader" id="uploader-walk">
                    <span class="preview-text" id="prev-text-walk">点击上传 (可选)</span>
                    <img id="prev-img-walk" style="display:none">
                </div>
                <input type="file" id="upload-walk" accept="image/*" style="display:none">
            </div>

            <!-- 互动 Interact -->
            <div class="pet-form-group">
                <label>互动/点击 (Interact)</label>
                <div class="pet-image-uploader" id="uploader-interact">
                    <span class="preview-text" id="prev-text-interact">点击上传 (可选)</span>
                    <img id="prev-img-interact" style="display:none">
                </div>
                <input type="file" id="upload-interact" accept="image/*" style="display:none">
            </div>

            <!-- 拖拽 Drag -->
            <div class="pet-form-group">
                <label>被拖拽 (Drag)</label>
                <div class="pet-image-uploader" id="uploader-drag">
                    <span class="preview-text" id="prev-text-drag">点击上传 (可选)</span>
                    <img id="prev-img-drag" style="display:none">
                </div>
                <input type="file" id="upload-drag" accept="image/*" style="display:none">
            </div>

            <!-- 睡觉 Sleep -->
            <div class="pet-form-group">
                <label>睡觉 (Sleep)</label>
                <div class="pet-image-uploader" id="uploader-sleep">
                    <span class="preview-text" id="prev-text-sleep">点击上传 (可选)</span>
                    <img id="prev-img-sleep" style="display:none">
                </div>
                <input type="file" id="upload-sleep" accept="image/*" style="display:none">
            </div>

            <div class="pet-settings-buttons">
                <button class="pet-btn" id="btn-save-settings">保存并应用</button>
                <button class="pet-btn pet-btn-cancel" id="btn-close-settings">取消</button>
            </div>
        </div>
    </div>
</div>
`;

// 生成默认 Emoji 图片的函数
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

/* 
   在这里修改默认图片！
   如果你在 GitHub 上有了 GIF，把 generateEmojiBlob(...) 换成图片的相对路径
   例如: idle: "scripts/extensions/st-desktop-pet/assets/idle.gif",
*/
const DefaultAssets = {
    idle: "scripts/extensions/sansan/assets/idle.gif",
    walk: "scripts/extensions/sansan/assets/walk.gif",
    interact: "scripts/extensions/sansan/assets/happy.gif",
    drag: "scripts/extensions/sansan/assets/drag.gif",
    sleep: generateEmojiBlob('💤')
};

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
        targetX: 0, targetY: 0,
        dragOffsetX: 0, dragOffsetY: 0,
        walkTimer: null,
        behaviorLoop: null,
        statLoop: null
    },
    elements: {},

    init() {
        if (!document.getElementById('pet-overlay-root')) {
            const div = document.createElement('div');
            div.innerHTML = petHtmlTemplate;
            document.body.appendChild(div.firstElementChild);
        }

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
        // 如果该动作没有对应的图，回退到 idle
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
        
        // 如果没有上传行走图片，就保持 idle 图片但移动位置
        this.changeAction('walk');
        this.state.isWalking = true;
        
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

    // Actions
    feed() {
        this.stopWalking();
        this.store.stats.hunger = Math.min(100, this.store.stats.hunger + 20);
        this.say("吧唧吧唧... 好吃！");
        
        // 尝试播放 Interact 动画（通常吃饭用Interact或者专门的Eat，这里简化）
        this.changeAction('interact'); 
        this.updateStatsUI();
        
        setTimeout(() => {
            if(!this.state.isWalking && !this.state.isSleeping) this.changeAction('idle');
        }, 2000);
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
        setTimeout(() => {
            if(!this.state.isWalking && !this.state.isSleeping) this.changeAction('idle');
        }, 1500);
        this.hideMenu();
    },

    resetPosition() {
        this.movePet(window.innerWidth/2 - this.store.size/2, window.innerHeight/2 - this.store.size/2);
        this.hideMenu();
    },

    hideMenu() { this.elements.menu.classList.remove('show'); },
    
    bindEvents() {
        // 拖拽
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

        // 右键菜单
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

        // 按钮事件绑定
        document.getElementById('act-feed').onclick = () => this.feed();
        document.getElementById('act-sleep').onclick = () => this.toggleSleep();
        document.getElementById('act-interact').onclick = () => this.interact();
        document.getElementById('act-reset').onclick = () => this.resetPosition();
        
        // 设置面板相关
        document.getElementById('act-settings').onclick = () => {
            this.hideMenu();
            document.getElementById('pet-set-name').value = this.store.petName;
            document.getElementById('pet-set-size').value = this.store.size;
            
            // 刷新图片预览
            const refreshPreview = (key, imgId, txtId) => {
                const img = document.getElementById(imgId);
                const txt = document.getElementById(txtId);
                if (this.store.images[key] && this.store.images[key].length > 100) { 
                    // 简单的判断，如果是base64或者长路径
                    img.src = this.store.images[key];
                    img.style.display = 'block';
                    txt.style.display = 'none';
                } else {
                    img.style.display = 'none';
                    txt.style.display = 'block';
                }
            };
            refreshPreview('idle', 'prev-img-idle', 'prev-text-idle');
            refreshPreview('walk', 'prev-img-walk', 'prev-text-walk');
            refreshPreview('interact', 'prev-img-interact', 'prev-text-interact');
            refreshPreview('drag', 'prev-img-drag', 'prev-text-drag');
            refreshPreview('sleep', 'prev-img-sleep', 'prev-text-sleep');

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
        
        // 通用上传处理函数
        const handleUpload = (key, inputId, divId, imgId) => {
            const div = document.getElementById(divId);
            const input = document.getElementById(inputId);
            
            div.onclick = () => input.click();
            input.onchange = (e) => {
                const file = e.target.files[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.store.images[key] = ev.target.result;
                    document.getElementById(imgId).src = ev.target.result;
                    document.getElementById(imgId).style.display = 'block';
                    // 隐藏文字
                    const span = div.querySelector('span');
                    if(span) span.style.display = 'none';
                };
                reader.readAsDataURL(file);
            };
        };

        // 绑定所有上传按钮
        handleUpload('idle', 'upload-idle', 'uploader-idle', 'prev-img-idle');
        handleUpload('walk', 'upload-walk', 'uploader-walk', 'prev-img-walk');
        handleUpload('interact', 'upload-interact', 'uploader-interact', 'prev-img-interact');
        handleUpload('drag', 'upload-drag', 'uploader-drag', 'prev-img-drag');
        handleUpload('sleep', 'upload-sleep', 'uploader-sleep', 'prev-img-sleep');
    }
};

jQuery(document).ready(function () {
    PetExtension.init();
});
