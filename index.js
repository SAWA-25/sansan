// index.js - Sansan Desktop Pet V2 (Frame-by-Frame & Custom Food)
import { extension_settings } from "../../../extensions.js";

// ==========================================
// 0. 引入 html2canvas (用于屏幕截图)
// ==========================================
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// ==========================================
// 1. HTML 结构模板 (升级版)
// ==========================================
const petHtmlTemplate = `
<div id="pet-overlay-root">
    <!-- 气泡 -->
    <div id="pet-bubble-container">
        <div class="pet-speech-bubble" id="pet-bubble">喵~</div>
    </div>

    <!-- 宠物本体 (图片) -->
    <img id="pet-entity" src="" alt="Pet" draggable="false">

    <!-- 食物容器 (动态生成) -->
    <div id="pet-food-container"></div>

    <!-- 聊天输入框 (平时隐藏) -->
    <div id="pet-chat-box" class="pet-panel-glass">
        <input type="text" id="pet-chat-input" placeholder="和它说句话..." autocomplete="off">
        <button id="pet-chat-send">发送</button>
        <button id="pet-chat-close">×</button>
    </div>


    <!-- 右键菜单 -->
    <div class="pet-context-menu" id="pet-context-menu">
        <div class="pet-mini-stats">
            <div class="pet-stat-row"><span>饱食</span><span id="val-hunger">80%</span></div>
            <div class="pet-stat-bar-bg"><div class="pet-stat-bar-fill" id="bar-hunger" style="width: 80%"></div></div>
            <div style="height:5px"></div>
            <div class="pet-stat-row"><span>心情</span><span id="val-happiness">60%</span></div>
            <div class="pet-stat-bar-bg"><div class="pet-stat-bar-fill" id="bar-happiness" style="width: 60%; background:#c8e6f8"></div></div>
        </div>
        <div class="pet-menu-item" id="act-feed">🍖 投喂食物</div>
        <div class="pet-menu-item" id="act-vision">👀 看看这是哪 (识图)</div>
        <div class="pet-menu-item" id="act-chat">💬 聊天</div>
        <div class="pet-menu-item" id="act-sleep">💤 睡觉/叫醒</div>
        <div class="pet-menu-item" id="act-interact">💕 抚摸</div>
        <div class="pet-menu-separator"></div>
        <div class="pet-menu-item" id="act-settings">⚙️ 设置 / API</div>
        <div class="pet-menu-item" id="act-reset">📍 重置位置</div>
    </div>


    <!-- 设置面板 -->
    <div class="pet-modal-overlay" id="pet-settings-modal">
        <div class="pet-settings-panel">
            <h3 class="pet-settings-header">宠物设置 V2.0</h3>
            
            <div class="pet-settings-scroll-area">
                <div class="pet-form-group">
                    <label>宠物名字</label>
                    <input type="text" id="pet-set-name" class="pet-input">
                </div>

                <div class="pet-form-group">
                    <label>大小: <span id="size-display">150px</span></label>
                    <input type="range" id="pet-set-size" min="50" max="400" value="150" style="width:100%">
                </div>
                
                <div class="pet-form-group">
                    <label>动画速度 (毫秒/帧): <span id="fps-display">150ms</span></label>
                    <input type="range" id="pet-set-fps" min="50" max="500" value="150" step="10" style="width:100%">
                    <div style="font-size:12px;color:#999">数值越小动作越快</div>
                </div>

                
                <!-- API 设置 -->
                <div class="pet-section-title">AI 连接设置 (LLM)</div>
                <div class="pet-form-group">
                    <label>API Endpoint (反代地址)</label>
                    <input type="text" id="pet-ai-url" placeholder="https://api.openai.com/v1" class="pet-input">
                    <div class="pet-note">例如: https://api.openai.com/v1 (不需要加 /chat/completions)</div>
                </div>
                <div class="pet-form-group">
                    <label>API Key (密匙)</label>
                    <input type="password" id="pet-ai-key" placeholder="sk-..." class="pet-input">
                </div>
                <div class="pet-form-group">
                    <label>模型名称 (需支持视觉)</label>
                    <input type="text" id="pet-ai-model" value="gpt-4o-mini" class="pet-input">
                    <div class="pet-note">推荐: gpt-4o-mini, gpt-4o, claude-3-5-sonnet</div>
                </div>
                <div class="pet-form-group">
                    <label>人设提示词 (System Prompt)</label>
                    <textarea id="pet-ai-prompt" class="pet-input" rows="3" placeholder="你是一只可爱的桌面宠物..."></textarea>
                </div>


                <div class="pet-section-title">资源自定义 (支持多图逐帧)</div>
                <div style="font-size:12px; color:#e74c3c; margin-bottom:10px;">
                    ⚠️ 注意：请勿上传过大的图片，否则无法保存。逐帧动画请按住 Ctrl/Shift 选择多张图片。
                </div>

                <div class="pet-upload-grid">
                    <!-- 1. 待机 Idle -->
                    <div class="pet-upload-item">
                        <label>待机 (单张/多张)</label>
                        <div class="pet-image-uploader" id="uploader-idle">
                            <span class="preview-text" id="txt-idle">点击上传</span>
                            <img id="img-idle" class="preview-img">
                        </div>
                        <input type="file" id="file-idle" accept="image/*" multiple hidden>
                    </div>

                    <!-- 2. 行走 Walk -->
                    <div class="pet-upload-item">
                        <label>行走 (建议多张)</label>
                        <div class="pet-image-uploader" id="uploader-walk">
                            <span class="preview-text" id="txt-walk">点击上传</span>
                            <img id="img-walk" class="preview-img">
                        </div>
                        <input type="file" id="file-walk" accept="image/*" multiple hidden>
                    </div>

                    <!-- 3. 互动 Interact -->
                    <div class="pet-upload-item">
                        <label>互动/抚摸</label>
                        <div class="pet-image-uploader" id="uploader-interact">
                            <span class="preview-text" id="txt-interact">点击上传</span>
                            <img id="img-interact" class="preview-img">
                        </div>
                        <input type="file" id="file-interact" accept="image/*" multiple hidden>
                    </div>

                    <!-- 4. 食物 Food -->
                    <div class="pet-upload-item">
                        <label>自定义食物 (单张)</label>
                        <div class="pet-image-uploader" id="uploader-food">
                            <span class="preview-text" id="txt-food">点击上传</span>
                            <img id="img-food" class="preview-img">
                        </div>
                        <input type="file" id="file-food" accept="image/*" hidden>
                    </div>

                    <!-- 5. 睡觉 Sleep -->
                    <div class="pet-upload-item">
                        <label>睡觉</label>
                        <div class="pet-image-uploader" id="uploader-sleep">
                            <span class="preview-text" id="txt-sleep">点击上传</span>
                            <img id="img-sleep" class="preview-img">
                        </div>
                        <input type="file" id="file-sleep" accept="image/*" multiple hidden>
                    </div>
                </div>
            </div>

            <div class="pet-settings-buttons">
                <button class="pet-btn primary" id="btn-save-settings">保存设置</button>
                <button class="pet-btn cancel" id="btn-close-settings">取消</button>
            </div>
        </div>
    </div>
</div>
`;

// ==========================================
// 2. 配置与默认资源
// ==========================================
const extensionName = "sansan"; 
const basePath = `scripts/extensions/${extensionName}/assets/`;

// 默认使用单张 GIF，如果用户没上传，就用这些
const DefaultAssets = {
    idle:     [`${basePath}idle.gif`], 
    walk:     [`${basePath}walk.gif`],  
    interact: [`${basePath}happy.gif`], 
    sleep:    [`${basePath}sleep.gif`],
    food:     `${basePath}food.png` // 默认食物图片，如果文件夹里没有，会显示不出来
};

// ==========================================
// 3. 核心逻辑
// ==========================================
const PetExtension = {
    store: {
        petName: '三三',
        size: 150,
        frameSpeed: 150, // 动画每帧间隔(ms)
        stats: { hunger: 80, happiness: 80, energy: 90 },
        // images 结构改变：现在除了 food 外，其他都是数组 []
        images: { ...DefaultAssets },
        // AI 配置
        ai: {
            url: "https://api.openai.com/v1",
            key: "",
            model: "gpt-4o-mini",
            prompt: "你是一只生活在电脑屏幕上的电子宠物猫，名字叫三三。说话要简短、可爱、带一点傲娇。每句话不要超过20个字。如果看到屏幕上有代码，吐槽一下代码写得乱；如果看到视频，就说想一起看。"
        }
    },

    
    state: {
        isDragging: false,
        isSleeping: false,
        isWalking: false,
        isEating: false, // 新增：正在吃东西状态
        
        currentAction: 'idle',
        
        // 坐标系统
        posX: 100, posY: 100,
        targetX: 0, targetY: 0,
        
        // 动画系统
        frameIndex: 0,
        lastFrameTime: 0,
        
        timers: {
            behavior: null,
            stats: null,
            bubble: null,
            animationLoop: null // 统一的游戏循环
        }
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
            bubble: document.getElementById('pet-bubble'),
            menu: document.getElementById('pet-context-menu'),
            modal: document.getElementById('pet-settings-modal'),
            foodContainer: document.getElementById('pet-food-container')
        };

        this.loadData();
        
        if(!localStorage.getItem('st_desktop_pet_data_v2')) {
            this.state.posX = window.innerWidth / 2 - 75;
            this.state.posY = window.innerHeight / 2 - 75;
        }

        this.updateAppearance();
        this.movePetTo(this.state.posX, this.state.posY);
        this.bindEvents();
        
        // 启动统一游戏循环 (包含移动和动画)
        this.startGameLoop();
        this.startBehaviorAI();
        this.startStatDecay();
        this.updateStatsUI();

        console.log(`[Sansan V2] Pet Initialized.`);
    },

    loadData() {
        // 为了区分旧版数据，使用新的 key: _v2
        const saved = localStorage.getItem('st_desktop_pet_data_v2');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.store.petName = data.petName || '三三';
                this.store.size = data.size || 150;
                this.store.frameSpeed = data.frameSpeed || 150;
                this.store.stats = { ...this.store.stats, ...data.stats };
                
                // 兼容性合并：如果某个动作没有数据，使用默认
                this.store.images = { ...DefaultAssets, ...data.images };
                
                // 确保数据类型正确 (防止旧版字符串污染新版数组逻辑)
                ['idle', 'walk', 'interact', 'sleep'].forEach(key => {
                    if (typeof this.store.images[key] === 'string') {
                        this.store.images[key] = [this.store.images[key]];
                    }
                });

            } catch(e) { console.error("Pet data load failed", e); }
        }
    },

    saveData() {
        try {
            localStorage.setItem('st_desktop_pet_data_v2', JSON.stringify(this.store));
        } catch (e) {
            this.say("存储空间不足，无法保存新图片！");
            console.error("Storage full", e);
        }
    },

    // --- 核心游戏循环 (动画 + 移动) ---
    startGameLoop() {
        const loop = (timestamp) => {
            if (!this.state.lastFrameTime) this.state.lastFrameTime = timestamp;

            // 1. 处理帧动画 (Frame Animation)
            const frames = this.store.images[this.state.currentAction];
            // 如果存在多帧，且达到了切换时间
            if (frames && frames.length > 1) {
                if (timestamp - this.state.lastFrameTime > this.store.frameSpeed) {
                    this.state.frameIndex = (this.state.frameIndex + 1) % frames.length;
                    this.elements.pet.src = frames[this.state.frameIndex];
                    this.state.lastFrameTime = timestamp;
                }
            } else if (frames && frames.length === 1) {
                // 单张图 (GIF或PNG)，只在动作切换时赋值一次，避免重复赋值造成闪烁
                if (this.elements.pet.src !== frames[0]) {
                    this.elements.pet.src = frames[0];
                }
            }

            // 2. 处理物理移动 (Movement)
            this.updateMovement();

            this.state.timers.animationLoop = requestAnimationFrame(loop);
        };
        this.state.timers.animationLoop = requestAnimationFrame(loop);
    },

    updateMovement() {
        // 只有在行走或去吃东西时才移动
        if (!this.state.isWalking && !this.state.isEating) return;

        const speed = 2.5; // 移动速度
        const dx = this.state.targetX - this.state.posX;
        const dy = this.state.targetY - this.state.posY;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // 到达目的地
        if (dist < 10) {
            if (this.state.isEating) {
                this.finishEating();
            } else {
                this.stopWalking();
            }
            return;
        }

        // 计算这一帧的位移
        const moveX = (dx / dist) * speed;
        const moveY = (dy / dist) * speed;
        
        this.movePetTo(this.state.posX + moveX, this.state.posY + moveY);

        // 自动转向
        if (dx < 0) {
            this.elements.pet.style.transform = "scaleX(-1)"; 
        } else {
            this.elements.pet.style.transform = "scaleX(1)";
        }
    },

    // 设置动作状态
    setAction(actionKey) {
        if (this.state.currentAction === actionKey) return;
        
        // 保护：睡觉时不能切换动作，除非是醒来
        if (this.state.isSleeping && actionKey !== 'idle') return;

        this.state.currentAction = actionKey;
        this.state.frameIndex = 0; // 重置动画帧
        
        // 立即显示第一帧，避免等待
        const frames = this.store.images[actionKey];
        if (frames && frames.length > 0) {
            this.elements.pet.src = frames[0];
        } else {
            // 资源缺失回退
            this.elements.pet.src = this.store.images.idle[0]; 
        }
    },

    movePetTo(x, y) {
        // 边界限制
        const maxX = window.innerWidth - this.store.size;
        const maxY = window.innerHeight - this.store.size;
        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        this.state.posX = x;
        this.state.posY = y;

        this.elements.pet.style.left = x + 'px';
        this.elements.pet.style.top = y + 'px';
        
        // 气泡跟随
        const bubble = document.getElementById('pet-bubble-container');
        bubble.style.left = (x + this.store.size / 2) + 'px';
        bubble.style.top = y + 'px';
    },

    // --- 智能行为 AI ---
    startBehaviorAI() {
        const loop = () => {
            const delay = 4000 + Math.random() * 6000; // 4~10秒思考一次
            this.state.timers.behavior = setTimeout(() => {
                // 只有在待机且可见时才行动
                if (this.state.currentAction === 'idle' && !this.state.isDragging && !this.state.isSleeping && !this.state.isEating) {
                    if (Math.random() < 0.7) {
                        this.startWalkingRandomly();
                    }
                }
                loop();
            }, delay);
        };
        loop();
    },

    startWalkingRandomly() {
        this.state.isWalking = true;
        this.setAction('walk');

        // 随机漫步范围
        const range = 300;
        let tx = this.state.posX + (Math.random() * range * 2 - range);
        let ty = this.state.posY + (Math.random() * range * 2 - range);
        
        // 修正目标点在屏幕内
        const maxX = window.innerWidth - this.store.size;
        const maxY = window.innerHeight - this.store.size;
        this.state.targetX = Math.max(0, Math.min(tx, maxX));
        this.state.targetY = Math.max(0, Math.min(ty, maxY));
    },

    stopWalking() {
        this.state.isWalking = false;
        this.setAction('idle');
        this.elements.pet.style.transform = "scaleX(1)"; // 恢复朝向
    },

    
    // --- AI 与 识图核心逻辑 ---

    // 1. 识图功能
    async visionCheck() {
        if (!window.html2canvas) return this.say("组件加载中，请稍后再试...");
        if (!this.store.ai.key) return this.say("请先在设置里填写 API Key！");

        this.hideMenu();
        this.state.isThinking = true;
        this.say("正在看..."); 
        
        try {
            // 暂时隐藏宠物，避免自己被截图进去
            this.elements.pet.style.opacity = '0'; 
            document.getElementById('pet-bubble-container').style.opacity = '0';

            // 截图
            const canvas = await html2canvas(document.body, { 
                useCORS: true, // 尝试允许跨域图片
                logging: false,
                scale: 0.5 // 降低分辨率以节省 Token 和带宽
            });
            
            // 恢复显示
            this.elements.pet.style.opacity = '1';
            document.getElementById('pet-bubble-container').style.opacity = '1';

            const base64Img = canvas.toDataURL('image/jpeg', 0.7);
            
            // 调用 LLM
            await this.callLLM("我现在在屏幕上看到了这个画面，请根据我的设定（电子宠物），简短评价一下这个画面。如果在看视频或文章，概括一下内容。", base64Img);

        } catch(err) {
            console.error(err);
            this.elements.pet.style.opacity = '1';
            document.getElementById('pet-bubble-container').style.opacity = '1';
            this.say("看不清楚... (截图失败)");
        } finally {
            this.state.isThinking = false;
        }
    },

    // 2. 聊天功能
    async sendChat() {
        const text = this.elements.chatInput.value.trim();
        if (!text) return;
        if (!this.store.ai.key) return this.say("请先填写 API Key");

        this.elements.chatInput.value = '';
        this.elements.chatBox.style.display = 'none'; // 发送后关闭框
        
        this.say("Thinking...");
        this.state.isThinking = true;
        
        await this.callLLM(text, null); // 纯文本对话
        this.state.isThinking = false;
    },

    // 3. 通用 LLM 调用器
    async callLLM(userText, imageBase64 = null) {
        const api = this.store.ai;
        let url = api.url;
        if (!url.endsWith('/v1')) url = url.replace(/\/+$/, '') + '/v1'; // 简单修正路径
        url += '/chat/completions';

        const messages = [
            { role: "system", content: api.prompt }
        ];

        if (imageBase64) {
            // 视觉请求格式
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: userText },
                    { type: "image_url", image_url: { url: imageBase64 } }
                ]
            });
        } else {
            // 纯文本请求
            messages.push({ role: "user", content: userText });
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${api.key}`
                },
                body: JSON.stringify({
                    model: api.model,
                    messages: messages,
                    max_tokens: 100
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            const reply = data.choices[0].message.content;
            
            this.say(reply, 6000); // AI 回复显示久一点
            this.setAction('interact'); // 开心跳动

        } catch (e) {
            console.error("LLM Call Failed", e);
            this.say("大脑连接断开了... (API请求失败)");
        }
    },

    // --- 互动系统 (喂食升级) ---

    spawnFood() {
        // 如果已经在吃东西，忽略
        if(this.state.isEating) return;

        // 1. 生成食物 DOM
        const foodEl = document.createElement('img');
        foodEl.src = this.store.images.food || `${basePath}food.png`;
        foodEl.className = 'pet-food-item';
        foodEl.style.width = (this.store.size / 3) + 'px';
        
        // 2. 随机位置放置食物 (稍微远离宠物，让它走过去)
        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 100;
        const foodX = Math.max(50, Math.random() * maxX);
        const foodY = Math.max(50, Math.random() * maxY);
        
        foodEl.style.left = foodX + 'px';
        foodEl.style.top = foodY + 'px';
        
        this.elements.foodContainer.innerHTML = ''; // 清空旧食物
        this.elements.foodContainer.appendChild(foodEl);

        // 3. 宠物状态切换
        this.state.isEating = true;
        this.state.isWalking = false; // 停止随机漫步
        this.setAction('walk'); // 播放走路动画
        this.say("哇！好吃的！");

        // 4. 设定目标点为食物位置 (稍微修正重叠)
        this.state.targetX = foodX - (this.store.size / 4);
        this.state.targetY = foodY - (this.store.size / 4);
        
        this.hideMenu();
    },

    finishEating() {
        // 到达食物位置
        this.elements.foodContainer.innerHTML = ''; // 吃掉食物
        this.store.stats.hunger = Math.min(100, this.store.stats.hunger + 25);
        this.store.stats.happiness = Math.min(100, this.store.stats.happiness + 5);
        
        this.say("吧唧吧唧... 真香！");
        this.setAction('interact'); // 播放开心的动画
        this.updateStatsUI();
        
        setTimeout(() => {
            this.state.isEating = false;
            this.setAction('idle');
        }, 2500);
    },

    interact() {
        if(this.state.isSleeping || this.state.isEating) return;
        this.store.stats.happiness = Math.min(100, this.store.stats.happiness + 10);
        this.say("蹭蹭你~");
        this.setAction('interact');
        this.updateStatsUI();
        this.hideMenu();

        setTimeout(() => {
            if(this.state.currentAction === 'interact') this.setAction('idle');
        }, 2000);
    },

    toggleSleep() {
        this.state.isSleeping = !this.state.isSleeping;
        this.hideMenu();

        if(this.state.isSleeping) {
            this.state.isWalking = false;
            this.state.isEating = false;
            this.elements.foodContainer.innerHTML = '';
            this.setAction('sleep');
            this.say("晚安... Zzz");
            this.elements.pet.style.opacity = "0.7";
        } else {
            this.setAction('idle');
            this.say("睡醒啦！");
            this.elements.pet.style.opacity = "1";
        }
    },

    // --- 设置面板与事件 ---
    
    bindEvents() {
        // 拖拽逻辑
        this.elements.pet.addEventListener('mousedown', (e) => {
            if(e.button !== 0) return;
            e.preventDefault();
            this.state.isDragging = true;
            this.state.isWalking = false;
            this.state.isEating = false;
            this.setAction('walk'); // 被提起来通常用挣扎或walk图
            
            const rect = this.elements.pet.getBoundingClientRect();
            this.state.dragOffsetX = e.clientX - rect.left;
            this.state.dragOffsetY = e.clientY - rect.top;
        });

        window.addEventListener('mousemove', (e) => {
            if(this.state.isDragging) {
                this.movePetTo(e.clientX - this.state.dragOffsetX, e.clientY - this.state.dragOffsetY);
            }
        });

        window.addEventListener('mouseup', () => {
            if(this.state.isDragging) {
                this.state.isDragging = false;
                if(!this.state.isSleeping) this.setAction('idle');
                this.saveData();
            }
        });

        // 右键菜单
        this.elements.pet.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.elements.menu.style.left = Math.min(e.clientX, window.innerWidth - 160) + 'px';
            this.elements.menu.style.top = Math.min(e.clientY, window.innerHeight - 250) + 'px';
            this.elements.menu.classList.add('show');
            this.updateStatsUI();
        });

        window.addEventListener('click', (e) => {
            if(!e.target.closest('.pet-context-menu')) this.hideMenu();
        });

        // 按钮绑定
        document.getElementById('act-feed').onclick = () => this.spawnFood();
        document.getElementById('act-sleep').onclick = () => this.toggleSleep();
        document.getElementById('act-interact').onclick = () => this.interact();
        document.getElementById('act-vision').onclick = () => this.visionCheck(); // 识图
        document.getElementById('act-reset').onclick = () => {
            this.movePetTo(window.innerWidth/2, window.innerHeight/2);
            this.hideMenu();
        document.getElementById('act-chat').onclick = () => {
            this.hideMenu();
            this.elements.chatBox.style.display = 'flex';
            this.elements.chatInput.focus();
        };
        document.getElementById('pet-chat-close').onclick = () => this.elements.chatBox.style.display = 'none';
        document.getElementById('pet-chat-send').onclick = () => this.sendChat();
        this.elements.chatInput.onkeypress = (e) => { if(e.key === 'Enter') this.sendChat(); };

        document.getElementById('act-reset').onclick = () => {
            this.movePetTo(window.innerWidth/2, window.innerHeight/2);
            this.hideMenu();
        };
        
        // 设置面板逻辑
        document.getElementById('act-settings').onclick = this.openSettings.bind(this);
        document.getElementById('btn-close-settings').onclick = () => this.elements.modal.classList.remove('show');
        document.getElementById('btn-save-settings').onclick = this.applySettings.bind(this);

        document.getElementById('pet-set-size').addEventListener('input', (e) => {
            document.getElementById('size-display').textContent = e.target.value + 'px';
        });
        document.getElementById('pet-set-fps').addEventListener('input', (e) => {
            document.getElementById('fps-display').textContent = e.target.value + 'ms';
        });

        // 绑定多图上传
        this.bindMultiUploader('idle', 'file-idle', 'uploader-idle', 'img-idle', 'txt-idle');
        this.bindMultiUploader('walk', 'file-walk', 'uploader-walk', 'img-walk', 'txt-walk');
        this.bindMultiUploader('interact', 'file-interact', 'uploader-interact', 'img-interact', 'txt-interact');
        this.bindMultiUploader('sleep', 'file-sleep', 'uploader-sleep', 'img-sleep', 'txt-sleep');
        // 单图上传
        this.bindMultiUploader('food', 'file-food', 'uploader-food', 'img-food', 'txt-food', true);
    },

    openSettings() {
        this.hideMenu();
        document.getElementById('pet-set-name').value = this.store.petName;
        document.getElementById('pet-set-size').value = this.store.size;
        document.getElementById('size-display').textContent = this.store.size + 'px';
        document.getElementById('pet-set-fps').value = this.store.frameSpeed;
        // AI Settings
        document.getElementById('pet-ai-url').value = s.ai.url;
        document.getElementById('pet-ai-key').value = s.ai.key;
        document.getElementById('pet-ai-model').value = s.ai.model;
        document.getElementById('pet-ai-prompt').value = s.ai.prompt;
        document.getElementById('fps-display').textContent = this.store.frameSpeed + 'ms';

        // 预览图逻辑：如果是数组，取第一张；如果是字符串，直接用
        const refreshPreview = (key) => {
            const data = this.store.images[key];
            const img = document.getElementById('img-' + key);
            const txt = document.getElementById('txt-' + key);
            let src = null;

            if (Array.isArray(data) && data.length > 0) src = data[0];
            else if (typeof data === 'string') src = data;

            if (src && src.length > 50) { // 简单校验
                img.src = src;
                img.style.display = 'block';
                txt.style.display = 'none';
            } else {
                img.style.display = 'none';
                txt.style.display = 'block';
            }
        };

        ['idle', 'walk', 'interact', 'sleep', 'food'].forEach(refreshPreview);
        this.elements.modal.classList.add('show');
    },

    applySettings() {
        this.store.petName = document.getElementById('pet-set-name').value;
        this.store.size = parseInt(document.getElementById('pet-set-size').value);
        this.store.frameSpeed = parseInt(document.getElementById('pet-set-fps').value);
        this.ai.url = document.getElementById('pet-ai-url').value.trim();
        this.ai.key = document.getElementById('pet-ai-key').value.trim();
        this.ai.model = document.getElementById('pet-ai-model').value.trim();
        this.ai.prompt = document.getElementById('pet-ai-prompt').value.trim();
        this.saveData();
        this.updateAppearance();
        this.elements.modal.classList.remove('show');
        this.say("设置已生效！");
    },

    bindMultiUploader(key, inputId, divId, imgId, txtId, isSingle = false) {
        const div = document.getElementById(divId);
        const input = document.getElementById(inputId);
        const img = document.getElementById(imgId);
        const txt = document.getElementById(txtId);

        div.onclick = () => input.click();

        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            // 按文件名排序，保证动画帧顺序 (walk_01.png, walk_02.png...)
            files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

            const promises = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.readAsDataURL(file);
                });
            });

            try {
                const results = await Promise.all(promises);
                
                if (isSingle) {
                    this.store.images[key] = results[0]; // 单张 (食物)
                    img.src = results[0];
                } else {
                    this.store.images[key] = results; // 数组 (动画)
                    img.src = results[0]; // 预览显示第一帧
                    
                    // 提示用户上传了多少帧
                    txt.textContent = `已选 ${results.length} 帧`;
                }

                img.style.display = 'block';
                txt.style.display = isSingle ? 'none' : 'block'; 
                
            } catch (err) {
                console.error("Image upload failed", err);
                this.say("图片读取失败");
            }
        };
    },

    updateAppearance() {
        this.elements.pet.style.width = this.store.size + 'px';
        this.setAction(this.state.currentAction);
    },

    say(text) {
        this.elements.bubble.textContent = text;
        this.elements.bubble.classList.add('show');
        if(this.state.timers.bubble) clearTimeout(this.state.timers.bubble);
        this.state.timers.bubble = setTimeout(() => {
            this.elements.bubble.classList.remove('show');
        }, 3000);
    },

    hideMenu() { this.elements.menu.classList.remove('show'); },

    startStatDecay() {
        this.state.timers.stats = setInterval(() => {
            if(!this.state.isSleeping) {
                this.store.stats.hunger = Math.max(0, this.store.stats.hunger - 1);
                this.store.stats.happiness = Math.max(0, this.store.stats.happiness - 1);
            } else {
                this.store.stats.energy = Math.min(100, this.store.stats.energy + 2);
            }
            this.updateStatsUI();
        }, 10000);
    },

    updateStatsUI() {
        if(!document.getElementById('val-hunger')) return;
        document.getElementById('val-hunger').textContent = Math.floor(this.store.stats.hunger) + '%';
        document.getElementById('bar-hunger').style.width = this.store.stats.hunger + '%';
        document.getElementById('val-happiness').textContent = Math.floor(this.store.stats.happiness) + '%';
        document.getElementById('bar-happiness').style.width = this.store.stats.happiness + '%';
    }
};

jQuery(document).ready(function () {
    PetExtension.init();
});
