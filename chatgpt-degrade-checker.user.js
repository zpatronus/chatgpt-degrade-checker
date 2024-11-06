// ==UserScript==
// @name         ChatGPT降级检测
// @namespace    https://github.com/KoriIku/chatgpt-degrade-check
// @version      1.7
// @description  由于 ChatGPT 会对某些 ip 进行无提示的服务降级，此脚本用于检测你的 ip 在 ChatGPT 数据库中的风险等级。
// @match        *://chatgpt.com/*
// @grant        none
// @downloadURL  https://update.greasyfork.org/scripts/516051/ChatGPT%E9%99%8D%E7%BA%A7%E6%A3%80%E6%B5%8B.user.js
// @updateURL    https://update.greasyfork.org/scripts/516051/ChatGPT%E9%99%8D%E7%BA%A7%E6%A3%80%E6%B5%8B.user.js
// @license AGPLv3
// ==/UserScript==

(function() {
    'use strict';

    // 创建显示框
    const displayBox = document.createElement('div');
    displayBox.style.position = 'fixed';
    displayBox.style.top = '50%';
    displayBox.style.right = '20px';
    displayBox.style.transform = 'translateY(-50%)';
    displayBox.style.width = '220px';
    displayBox.style.padding = '10px';
    displayBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    displayBox.style.color = '#fff';
    displayBox.style.fontSize = '14px';
    displayBox.style.borderRadius = '8px';
    displayBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    displayBox.style.zIndex = '10000';
    displayBox.style.transition = 'all 0.3s ease';
    displayBox.style.display = 'none';

    displayBox.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>PoW 信息</strong>
        </div>
        <div id="content">
            PoW难度: <span id="difficulty">N/A</span><span id="difficulty-level" style="margin-left: 3px"></span>
            <span id="difficulty-tooltip" style="
                cursor: pointer;
                color: #fff;
                font-size: 12px;
                display: inline-block;
                width: 14px;
                height: 14px;
                line-height: 14px;
                text-align: center;
                border-radius: 50%;
                border: 1px solid #fff;
                margin-left: 3px;
            ">?</span><br>
            用户类型: <span id="persona">N/A</span>
        </div>`;
    document.body.appendChild(displayBox);

    // 创建收缩状态的指示器
    const collapsedIndicator = document.createElement('div');
    collapsedIndicator.style.position = 'fixed';
    collapsedIndicator.style.top = '50%';
    collapsedIndicator.style.right = '20px';
    collapsedIndicator.style.transform = 'translateY(-50%)';
    collapsedIndicator.style.width = '32px';
    collapsedIndicator.style.height = '32px';
    collapsedIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    collapsedIndicator.style.borderRadius = '50%';
    collapsedIndicator.style.cursor = 'pointer';
    collapsedIndicator.style.zIndex = '10000';
    collapsedIndicator.style.padding = '4px';
    collapsedIndicator.style.display = 'flex';
    collapsedIndicator.style.alignItems = 'center';
    collapsedIndicator.style.justifyContent = 'center';
    collapsedIndicator.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    collapsedIndicator.style.transition = 'all 0.3s ease';

    // 创建内部的difficulty指示球
    collapsedIndicator.innerHTML = `
        <div id="difficulty-indicator" style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #888;
            transition: all 0.3s ease;
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.3) inset;
        "></div>
    `;
    document.body.appendChild(collapsedIndicator);

    // 鼠标悬停事件
    collapsedIndicator.addEventListener('mouseenter', function() {
        displayBox.style.display = 'block';
        collapsedIndicator.style.opacity = '0';
    });

    displayBox.addEventListener('mouseleave', function() {
        displayBox.style.display = 'none';
        collapsedIndicator.style.opacity = '1';
    });

    // 创建提示框
    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.innerText = '这个值越小，代表PoW难度越高，ChatGPT认为你的IP风险越高。';
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '12px';
    tooltip.style.visibility = 'hidden';
    tooltip.style.zIndex = '10001';
    tooltip.style.width = '240px';
    tooltip.style.lineHeight = '1.4';
    document.body.appendChild(tooltip);

    // 显示提示
    document.getElementById('difficulty-tooltip').addEventListener('mouseenter', function(event) {
        tooltip.style.visibility = 'visible';

        // 计算提示框位置，避免超出屏幕和被鼠标遮挡
        const tooltipWidth = 240; // 提示框宽度
        const windowWidth = window.innerWidth;
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // 计算左侧位置，确保不会超出屏幕
        let leftPosition = mouseX - tooltipWidth - 10; // 默认显示在鼠标左侧
        if (leftPosition < 10) { // 如果太靠左，就显示在鼠标右侧
            leftPosition = mouseX + 20;
        }

        // 计算顶部位置，显示在鼠标上方
        let topPosition = mouseY - 40;

        tooltip.style.left = `${leftPosition}px`;
        tooltip.style.top = `${topPosition}px`;
    });

    // 隐藏提示
    document.getElementById('difficulty-tooltip').addEventListener('mouseleave', function() {
        tooltip.style.visibility = 'hidden';
    });

    // 更新difficulty指示器
    function updateDifficultyIndicator(difficulty) {
        const indicator = document.getElementById('difficulty-indicator');
        const difficultyLevel = document.getElementById('difficulty-level');

        if (difficulty === 'N/A') {
            indicator.style.backgroundColor = '#888';
            indicator.style.transform = 'scale(0.8)';
            difficultyLevel.innerText = '';
            return;
        }

        // 去掉前导的0x，如果有的话
        const cleanDifficulty = difficulty.replace('0x', '');

        // 获取十六进制字符串的长度
        const hexLength = cleanDifficulty.length;

        let color, scale, level, textColor;

        if (hexLength <= 3) { // 3位以下（包括3位）为高难度 - 红色
            color = '#F44336';
            textColor = '#ff6b6b';
            scale = 1.2;
            level = '(难)';
        } else if (hexLength <= 4) { // 4位为中等难度 - 黄色
            color = '#FFC107';
            textColor = '#ffd700';
            scale = 1;
            level = '(中)';
        } else { // 5位及以上为低难度 - 绿色
            color = '#4CAF50';
            textColor = '#98fb98';
            scale = 0.8;
            level = '(简单)';
        }

        indicator.style.backgroundColor = color;
        indicator.style.transform = `scale(${scale})`;
        indicator.style.boxShadow = `0 0 12px ${color}`;

        // 更新难度等级文本
        difficultyLevel.innerHTML = `<span style="color: ${textColor}">${level}</span>`;
    }

    // 拦截 fetch 请求
    const originalFetch = window.fetch;
    window.fetch = async function(resource, options) {
        const response = await originalFetch(resource, options);

        if (resource.includes('/backend-api/sentinel/chat-requirements') && options.method === 'POST') {
            const clonedResponse = response.clone();
            clonedResponse.json().then(data => {
                const difficulty = data.proofofwork ? data.proofofwork.difficulty : 'N/A';
                const persona = data.persona || 'N/A';
                document.getElementById('difficulty').innerText = difficulty;
                document.getElementById('persona').innerText = persona;
                updateDifficultyIndicator(difficulty);
            }).catch(e => console.error('解析响应时出错:', e));
        }
        return response;
    };
})();
