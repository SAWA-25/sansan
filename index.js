[file name]: index.js
[file content begin]
// index.js - Sansan Desktop Pet V2 (Frame-by-Frame & Custom Food) with Vision & Mobile Support
import { extension_settings } from "../../../extensions.js";

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

    <!-- 移动端控制按钮 -->
    <div id="pet-mobile-controls" class="pet-mobile-controls">
        <button class="pet-mobile-btn" id="mobile-feed">🍖</button>
        <button class="pet-mobile-btn" id="mobile-interact">💕</button>
        <button class="pet-mobile-btn" id="mobile-sleep">💤</button>
        <button class="pet-mobile-btn" id="mobile-chat">💬</button>
        <button class="pet-mobile-btn" id="mobile-look">👀</button>
        <button class="pet-mobile-btn" id="mobile-menu">⚙️</button>
    </div>

    <!-- 右键菜单 -->
    <div class="pet-context-menu" id="pet-context-menu">
        <div class="pet-mini-stats">
            <div class="pet-stat-row"><span>饱食度</span><span id="val-hunger">80%</span></div>
            <div class="pet-stat-bar-bg"><div class="pet-stat-bar-fill" id="bar-hunger" style="width: 80%"></div></div>
            <div style="height:5px"></div>
            <div class="pet-stat-row"><span>心情值</span><span id="val-happiness">60%</span></div>
            <div class="pet-stat-bar-bg"><div class="pet-stat-bar-fill" id="bar-happiness" style="width: 60%; background:#c8e6f8"></div></div>
        </div>
        <div class="pet-menu-item" id="act-feed">🍖 投喂食物</div>
        <div class="pet-menu-item" id="act-sleep">💤 睡觉/叫醒</div>
        <div class="pet-menu-item" id="act-interact">💕 抚摸</div>
        <div class="pet-menu-item" id="act-chat">💬 对话</div>
        <div class="pet-menu-item" id="act-look">👀 看看周围</div>
        <div class="pet-menu-separator"></div>
        <div class="pet-menu-item" id="act-settings">⚙️ 设置</div>
        <div class="pet-menu-item" id="act-reset">📍 重置位置</div>
    </div>

    <!-- 聊天对话框 -->
    <div class="pet-modal-overlay" id="pet-chat-modal">
        <div class="pet-chat-panel">
            <h3 class="pet-chat-header">与<span id="chat-pet-name">三三</span>对话</h3>
            <div class="pet-chat-messages" id="chat-messages">
                <div class="pet-chat-message pet-chat-bot">
                    <span class="pet-chat-sender">三三:</span>
                    <span class="pet-chat-text">你好呀！我可以和你聊天，也可以看看周围的环境~</span>
                </div>
            </div>
            <div class="pet-chat-input-area">
                <textarea id="chat-input" placeholder="输入你想说的话..." rows="3"></textarea>
                <div class="pet-chat-buttons">
                    <button id="chat-send" class="pet-btn primary">发送</button>
                    <button id="chat-clear" class="pet-btn cancel">清空</button>
                    <button id="chat-close" class="pet-btn cancel">关闭</button>
                </div>
            </div>
        </div>
    </div>

    <!-- 设置面板 -->
    <div class="pet-modal-overlay" id="pet-settings-modal">
        <div class="pet-settings-panel">
            <h3 class="pet-settings-header">宠物设置 V2.0</h3>
            
            <div class="pet-settings-scroll-area">
                <!-- API 设置区域 -->
                <div class="pet-section-title">AI 视觉与对话设置</div>
                <div style="font-size:12px; color:#e74c3c; margin-bottom:10px;">
                    ⚠️ 需要配置 API 密钥才能使用对话和视觉功能
                </div>

                <div class="pet-form-group">
                    <label>API 反向代理地址</label>
                    <input type="text" id="pet-set-api-base" class="pet-input" placeholder="https://api.openai.com/v1">
                    <div style="font-size:12px;color:#999">例如: https://your-proxy.com/v1</div>
                </div>

                <div class="pet-form-group">
                    <label>API 密钥</label>
                    <input type="password" id="pet-set-api-key" class="pet-input" placeholder="sk-...">
                    <div style="font-size:12px;color:#999">你的 OpenAI API 密钥</div>
                </div>

                <div class="pet-form-group">
                    <label>视觉模型</label>
                    <select id="pet-set-vision-model" class="pet-input">
                        <option value="gpt-4-vision-preview">gpt-4-vision-preview</option>
                        <option value="gpt-4o">gpt-4o</option>
                    </select>
                </div>

                <div class="pet-form-group">
                    <label>对话模型</label>
                    <select id="pet-set-chat-model" class="pet-input">
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        <option value="gpt-4">gpt-4</option>
                        <option value="gpt-4-turbo">gpt-4-turbo</option>
                    </select>
                </div>

                <div class="pet-form-group">
                    <label>宠物性格</label>
                    <textarea id="pet-set-personality" class="pet-input" rows="3" placeholder="描述宠物的性格特点..."></textarea>
                    <div style="font-size:12px;color:#999">这会影响AI对话的风格</div>
                </div>

                <!-- 原有的设置内容 -->
                <div class="pet-section-title">基本设置</div>

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

                <div class="pet-section-title">移动端设置</div>
                <div class="pet-form-group">
                    <label>移动端宠物大小</label>
                    <input type="range" id="pet-set-mobile-size" min="30" max="200" value="80" style="width:100%">
                    <div style="font-size:12px;color:#999" id="mobile-size-display">80px</div>
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
        mobileSize: 80, // 新增：移动端大小
        frameSpeed: 150, // 动画每帧间隔(ms)
        stats: { hunger: 80, happiness: 80, energy: 90 },
        // images 结构改变：现在除了 food 外，其他都是数组 []
        images: { ...DefaultAssets },
        // AI 设置
        aiSettings: {
            apiBase: '',
            apiKey: '',
            visionModel: 'gpt-4-vision-preview',
            chatModel: 'gpt-3.5-turbo',
            personality: '你是一只可爱的桌面宠物，名字叫三三。你喜欢和人互动，说话风格可爱活泼，会使用表情符号。'
        }
    },
    
    state: {
        isDragging: false,
        isSleeping: false,
        isWalking: false,
        isEating: false, // 新增：正在吃东西状态
        isProcessingAI: false, // AI处理中
        isMobile: false, // 新增：移动端检测
        
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
        // 检测移动端
        this.state.isMobile = this.isMobileDevice();
        
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
            chatModal: document.getElementById('pet-chat-modal'),
            foodContainer: document.getElementById('pet-food-container'),
            mobileControls: document.getElementById('pet-mobile-controls')
        };

        this.loadData();
        
        if(!localStorage.getItem('st_desktop_pet_data_v2')) {
            this.state.posX = window.innerWidth / 2 - (this.state.isMobile ? this.store.mobileSize/2 : 75);
            this.state.posY = window.innerHeight / 2 - (this.state.isMobile ? this.store.mobileSize/2 : 75);
        }

        this.updateAppearance();
        this.movePetTo(this.state.posX, this.state.posY);
        this.bindEvents();
        
        // 启动统一游戏循环 (包含移动和动画)
        this.startGameLoop();
        this.startBehaviorAI();
        this.startStatDecay();
        this.updateStatsUI();

        console.log(`[Sansan V2] Pet Initialized. Mobile: ${this.state.isMobile}`);
    },

    // 检测移动设备
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    },

    loadData() {
        // 为了区分旧版数据，使用新的 key: _v2
        const saved = localStorage.getItem('st_desktop_pet_data_v2');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.store.petName = data.petName || '三三';
                this.store.size = data.size || 150;
                this.store.mobileSize = data.mobileSize || 80; // 移动端大小
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

                // 加载 AI 设置
                if (data.aiSettings) {
                    this.store.aiSettings = { ...this.store.aiSettings, ...data.aiSettings };
                }

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

        const speed = this.state.isMobile ? 1.5 : 2.5; // 移动端移动速度稍慢
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
        const currentSize = this.state.isMobile ? this.store.mobileSize : this.store.size;
        
        // 边界限制
        const maxX = window.innerWidth - currentSize;
        const maxY = window.innerHeight - currentSize;
        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        this.state.posX = x;
        this.state.posY = y;

        this.elements.pet.style.left = x + 'px';
        this.elements.pet.style.top = y + 'px';
        
        // 气泡跟随
        const bubble = document.getElementById('pet-bubble-container');
        bubble.style.left = (x + currentSize / 2) + 'px';
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

        const currentSize = this.state.isMobile ? this.store.mobileSize : this.store.size;
        
        // 随机漫步范围
        const range = this.state.isMobile ? 150 : 300; // 移动端范围小一些
        let tx = this.state.posX + (Math.random() * range * 2 - range);
        let ty = this.state.posY + (Math.random() * range * 2 - range);
        
        // 修正目标点在屏幕内
        const maxX = window.innerWidth - currentSize;
        const maxY = window.innerHeight - currentSize;
        this.state.targetX = Math.max(0, Math.min(tx, maxX));
        this.state.targetY = Math.max(0, Math.min(ty, maxY));
    },

    stopWalking() {
        this.state.isWalking = false;
        this.setAction('idle');
        this.elements.pet.style.transform = "scaleX(1)"; // 恢复朝向
    },

    // --- AI 视觉与对话功能 ---

    async captureScreen() {
        try {
            // 使用 html2canvas 捕获屏幕
            if (typeof html2canvas === 'undefined') {
                // 动态加载 html2canvas
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                document.head.appendChild(script);
                
                return new Promise((resolve, reject) => {
                    script.onload = () => resolve(this.captureWithHtml2Canvas());
                    script.onerror = reject;
                });
            } else {
                return await this.captureWithHtml2Canvas();
            }
        } catch (error) {
            console.error('截图失败:', error);
            throw new Error('截图功能不可用');
        }
    },

    async captureWithHtml2Canvas() {
        return new Promise((resolve, reject) => {
            html2canvas(document.body, {
                useCORS: true,
                allowTaint: true,
                scale: this.state.isMobile ? 0.3 : 0.5, // 移动端分辨率更低
                logging: false
            }).then(canvas => {
                // 将 canvas 转换为 base64
                const base64Image = canvas.toDataURL('image/jpeg', 0.7);
                resolve(base64Image);
            }).catch(reject);
        });
    },

    async callVisionAPI(imageBase64) {
        if (!this.store.aiSettings.apiKey) {
            throw new Error('请先在设置中配置API密钥');
        }

        const apiUrl = this.store.aiSettings.apiBase ? 
            `${this.store.aiSettings.apiBase}/chat/completions` : 
            'https://api.openai.com/v1/chat/completions';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.store.aiSettings.apiKey}`
            },
            body: JSON.stringify({
                model: this.store.aiSettings.visionModel,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `请描述这张截图中的内容。我是一只桌面宠物，当前在屏幕上的位置大约是 (${Math.round(this.state.posX)}, ${Math.round(this.state.posY)})。请用可爱的宠物语气描述你看到了什么。`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageBase64
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    },

    async callChatAPI(messages) {
        if (!this.store.aiSettings.apiKey) {
            throw new Error('请先在设置中配置API密钥');
        }

        const apiUrl = this.store.aiSettings.apiBase ? 
            `${this.store.aiSettings.apiBase}/chat/completions` : 
            'https://api.openai.com/v1/chat/completions';

        // 添加系统提示词
        const systemMessage = {
            role: "system",
            content: this.store.aiSettings.personality
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.store.aiSettings.apiKey}`
            },
            body: JSON.stringify({
                model: this.store.aiSettings.chatModel,
                messages: [systemMessage, ...messages],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    },

    async lookAround() {
        if (this.state.isProcessingAI) {
            this.say("我正在忙着呢，稍等一下~");
            return;
        }

        this.state.isProcessingAI = true;
        this.setAction('interact');
        this.say("让我看看周围...");

        try {
            const screenshot = await this.captureScreen();
            const description = await this.callVisionAPI(screenshot);
            
            this.say(description);
            this.addChatMessage('bot', description);
            
        } catch (error) {
            console.error('视觉识别失败:', error);
            this.say("哎呀，看不清楚周围呢~");
        } finally {
            this.state.isProcessingAI = false;
            setTimeout(() => {
                if(this.state.currentAction === 'interact') this.setAction('idle');
            }, 2000);
        }
    },

    async chatWithPet(message) {
        if (this.state.isProcessingAI) {
            this.say("我正在忙着呢，稍等一下~");
            return;
        }

        this.state.isProcessingAI = true;
        this.setAction('interact');

        try {
            // 获取聊天记录
            const messages = this.getChatHistory();
            messages.push({
                role: "user",
                content: message
            });

            const response = await this.callChatAPI(messages);
            
            this.say(response);
            this.addChatMessage('bot', response);
            
        } catch (error) {
            console.error('对话失败:', error);
            this.say("我现在有点困，不想说话~");
        } finally {
            this.state.isProcessingAI = false;
            setTimeout(() => {
                if(this.state.currentAction === 'interact') this.setAction('idle');
            }, 2000);
        }
    },

    getChatHistory() {
        // 简单的聊天记录管理，只保留最近5条
        const messages = JSON.parse(localStorage.getItem('st_desktop_pet_chat_history') || '[]');
        return messages.slice(-5);
    },

    saveChatMessage(role, content) {
        const messages = this.getChatHistory();
        messages.push({ role: role === 'user' ? 'user' : 'assistant', content });
        localStorage.setItem('st_desktop_pet_chat_history', JSON.stringify(messages.slice(-10))); // 最多保存10条
    },

    addChatMessage(type, text) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `pet-chat-message pet-chat-${type}`;
        
        const sender = type === 'user' ? '你:' : `${this.store.petName}:`;
        messageDiv.innerHTML = `
            <span class="pet-chat-sender">${sender}</span>
            <span class="pet-chat-text">${text}</span>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 保存到历史记录
        this.saveChatMessage(type, text);
    },

    openChat() {
        this.hideMenu();
        document.getElementById('chat-pet-name').textContent = this.store.petName;
        document.getElementById('chat-input').value = '';
        document.getElementById('chat-input').focus();
        this.elements.chatModal.classList.add('show');
    },

    closeChat() {
        this.elements.chatModal.classList.remove('show');
    },

    // --- 互动系统 (喂食升级) ---

    spawnFood() {
        // 如果已经在吃东西，忽略
        if(this.state.isEating) return;

        // 1. 生成食物 DOM
        const foodEl = document.createElement('img');
        foodEl.src = this.store.images.food || `${basePath}food.png`;
        foodEl.className = 'pet-food-item';
        const currentSize = this.state.isMobile ? this.store.mobileSize : this.store.size;
        foodEl.style.width = (currentSize / 3) + 'px';
        
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
        this.state.targetX = foodX - (currentSize / 4);
        this.state.targetY = foodY - (currentSize / 4);
        
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
        // 拖拽逻辑 - 桌面端
        this.elements.pet.addEventListener('mousedown', (e) => {
            if(e.button !== 0) return;
            e.preventDefault();
            this.startDragging(e.clientX, e.clientY);
        });

        // 触摸逻辑 - 移动端
        this.elements.pet.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDragging(touch.clientX, touch.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if(this.state.isDragging) {
                this.handleDragging(e.clientX, e.clientY);
            }
        });

        window.addEventListener('touchmove', (e) => {
            if(this.state.isDragging) {
                const touch = e.touches[0];
                this.handleDragging(touch.clientX, touch.clientY);
            }
        });

        window.addEventListener('mouseup', () => {
            this.stopDragging();
        });

        window.addEventListener('touchend', () => {
            this.stopDragging();
        });

        // 右键菜单 - 桌面端
        this.elements.pet.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });

        // 长按菜单 - 移动端
        let pressTimer;
        this.elements.pet.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                const touch = e.touches[0];
                this.showContextMenu(touch.clientX, touch.clientY);
            }, 500); // 长按500ms显示菜单
        });

        this.elements.pet.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });

        window.addEventListener('click', (e) => {
            if(!e.target.closest('.pet-context-menu')) this.hideMenu();
        });

        // 移动端控制按钮
        if (this.state.isMobile) {
            document.getElementById('mobile-feed').onclick = () => this.spawnFood();
            document.getElementById('mobile-interact').onclick = () => this.interact();
            document.getElementById('mobile-sleep').onclick = () => this.toggleSleep();
            document.getElementById('mobile-chat').onclick = () => this.openChat();
            document.getElementById('mobile-look').onclick = () => this.lookAround();
            document.getElementById('mobile-menu').onclick = () => this.openSettings();
        }

        // 按钮绑定
        document.getElementById('act-feed').onclick = () => this.spawnFood();
        document.getElementById('act-sleep').onclick = () => this.toggleSleep();
        document.getElementById('act-interact').onclick = () => this.interact();
        document.getElementById('act-chat').onclick = () => this.openChat();
        document.getElementById('act-look').onclick = () => this.lookAround();
        document.getElementById('act-reset').onclick = () => {
            const currentSize = this.state.isMobile ? this.store.mobileSize : this.store.size;
            this.movePetTo(window.innerWidth/2 - currentSize/2, window.innerHeight/2 - currentSize/2);
            this.hideMenu();
        };
        
        // 设置面板逻辑
        document.getElementById('act-settings').onclick = this.openSettings.bind(this);
        document.getElementById('btn-close-settings').onclick = () => this.elements.modal.classList.remove('show');
        document.getElementById('btn-save-settings').onclick = this.applySettings.bind(this);

        // 聊天面板逻辑
        document.getElementById('chat-send').onclick = () => {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            if (message) {
                this.addChatMessage('user', message);
                input.value = '';
                this.chatWithPet(message);
            }
        };

        document.getElementById('chat-clear').onclick = () => {
            document.getElementById('chat-messages').innerHTML = `
                <div class="pet-chat-message pet-chat-bot">
                    <span class="pet-chat-sender">${this.store.petName}:</span>
                    <span class="pet-chat-text">你好呀！我可以和你聊天，也可以看看周围的环境~</span>
                </div>
            `;
            localStorage.removeItem('st_desktop_pet_chat_history');
        };

        document.getElementById('chat-close').onclick = () => this.closeChat();
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('chat-send').click();
            }
        });

        document.getElementById('pet-set-size').addEventListener('input', (e) => {
            document.getElementById('size-display').textContent = e.target.value + 'px';
        });
        
        document.getElementById('pet-set-fps').addEventListener('input', (e) => {
            document.getElementById('fps-display').textContent = e.target.value + 'ms';
        });

        document.getElementById('pet-set-mobile-size').addEventListener('input', (e) => {
            document.getElementById('mobile-size-display').textContent = e.target.value + 'px';
        });

        // 绑定多图上传
        this.bindMultiUploader('idle', 'file-idle', 'uploader-idle', 'img-idle', 'txt-idle');
        this.bindMultiUploader('walk', 'file-walk', 'uploader-walk', 'img-walk', 'txt-walk');
        this.bindMultiUploader('interact', 'file-interact', 'uploader-interact', 'img-interact', 'txt-interact');
        this.bindMultiUploader('sleep', 'file-sleep', 'uploader-sleep', 'img-sleep', 'txt-sleep');
        // 单图上传
        this.bindMultiUploader('food', 'file-food', 'uploader-food', 'img-food', 'txt-food', true);

        // 窗口大小变化时重新调整位置
        window.addEventListener('resize', () => {
            const currentSize = this.state.isMobile ? this.store.mobileSize : this.store.size;
            const maxX = window.innerWidth - currentSize;
            const maxY = window.innerHeight - currentSize;
            
            this.state.posX = Math.min(this.state.posX, maxX);
            this.state.posY = Math.min(this.state.posY, maxY);
            this.movePetTo(this.state.posX, this.state.posY);
        });
    },

    // 拖拽相关方法
    startDragging(clientX, clientY) {
        this.state.isDragging = true;
        this.state.isWalking = false;
        this.state.isEating = false;
        this.setAction('walk');
        
        const rect = this.elements.pet.getBoundingClientRect();
        this.state.dragOffsetX = clientX - rect.left;
        this.state.dragOffsetY = clientY - rect.top;
    },

    handleDragging(clientX, clientY) {
        this.movePetTo(clientX - this.state.dragOffsetX, clientY - this.state.dragOffsetY);
    },

    stopDragging() {
        if(this.state.isDragging) {
            this.state.isDragging = false;
            if(!this.state.isSleeping) this.setAction('idle');
            this.saveData();
        }
    },

    showContextMenu(clientX, clientY) {
        this.elements.menu.style.left = Math.min(clientX, window.innerWidth - 160) + 'px';
        this.elements.menu.style.top = Math.min(clientY, window.innerHeight - 250) + 'px';
        this.elements.menu.classList.add('show');
        this.updateStatsUI();
    },

    openSettings() {
        this.hideMenu();
        document.getElementById('pet-set-name').value = this.store.petName;
        document.getElementById('pet-set-size').value = this.store.size;
        document.getElementById('size-display').textContent = this.store.size + 'px';
        document.getElementById('pet-set-fps').value = this.store.frameSpeed;
        document.getElementById('fps-display').textContent = this.store.frameSpeed + 'ms';
        document.getElementById('pet-set-mobile-size').value = this.store.mobileSize;
        document.getElementById('mobile-size-display').textContent = this.store.mobileSize + 'px';

        // AI 设置
        document.getElementById('pet-set-api-base').value = this.store.aiSettings.apiBase;
        document.getElementById('pet-set-api-key').value = this.store.aiSettings.apiKey;
        document.getElementById('pet-set-vision-model').value = this.store.aiSettings.visionModel;
        document.getElementById('pet-set-chat-model').value = this.store.aiSettings.chatModel;
        document.getElementById('pet-set-personality').value = this.store.aiSettings.personality;

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
        this.store.mobileSize = parseInt(document.getElementById('pet-set-mobile-size').value);
        this.store.frameSpeed = parseInt(document.getElementById('pet-set-fps').value);
        
        // 保存 AI 设置
        this.store.aiSettings.apiBase = document.getElementById('pet-set-api-base').value;
        this.store.aiSettings.apiKey = document.getElementById('pet-set-api-key').value;
        this.store.aiSettings.visionModel = document.getElementById('pet-set-vision-model').value;
        this.store.aiSettings.chatModel = document.getElementById('pet-set-chat-model').value;
        this.store.aiSettings.personality = document.getElementById('pet-set-personality').value;

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
        const currentSize = this.state.isMobile ? this.store.mobileSize : this.store.size;
        this.elements.pet.style.width = currentSize + 'px';
        
        // 显示/隐藏移动端控制按钮
        if (this.elements.mobileControls) {
            this.elements.mobileControls.style.display = this.state.isMobile ? 'flex' : 'none';
        }
        
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
[file content end]
