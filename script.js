document.addEventListener('DOMContentLoaded', () => {
    // 首先声明所有需要的 DOM 元素
    const card = document.querySelector('.card');
    const colorBtns = document.querySelectorAll('.color-btn');
    const downloadBtn = document.getElementById('downloadBtn');
    const editableContent = document.querySelector('.editable-content');
    const wordCountElement = document.getElementById('wordCount');
    const qrImage = document.getElementById('qrImage');
    const qrUpload = document.getElementById('qrUpload');
    const qrContainer = document.querySelector('.qr-upload');
    const qrToggle = document.getElementById('qrToggle');
    const qrUploadContainer = document.getElementById('qrUploadContainer');

    // 初始化二维码显示状态
    let isQrVisible = localStorage.getItem('qrVisible') !== 'false';

    // 更新日期函数
    function updateCurrentDate() {
        const dateElement = document.querySelector('.date');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateElement.textContent = `${year}年${month}月${day}日`;
    }

    // 字数统计功能
    function updateWordCount() {
        const text = editableContent.textContent || '';
        const count = text.trim().replace(/\s+/g, ' ').length;
        wordCountElement.textContent = count;
    }

    // 更新二维码显示状态的函数
    function updateQrVisibility(hidden) {
        if (hidden) {
            qrUploadContainer.classList.add('hidden');
            qrToggle.textContent = '👁️‍🗨️';
        } else {
            qrUploadContainer.classList.remove('hidden');
            qrToggle.textContent = '👁️';
        }
        isQrVisible = !hidden;
        localStorage.setItem('qrVisible', !hidden);
    }

    // 加载内容函数
    function loadContent() {
        const saved = localStorage.getItem('cardContent');
        if (saved) {
            const content = JSON.parse(saved);
            document.querySelector('.icon').textContent = content.icon;
            document.querySelector('h2').textContent = content.title;
            editableContent.innerHTML = content.content;
            document.querySelector('.author').textContent = content.author;
            document.querySelector('.card-name').textContent = content.cardName;
            document.querySelector('.qr-code').textContent = content.qrText;
            if (content.qrImageData) {
                qrImage.src = content.qrImageData;
            }
            if (content.hasOwnProperty('qrVisible')) {
                updateQrVisibility(!content.qrVisible);
            }
            updateWordCount();
        }
    }

    // 保存内容函数
    function saveContent() {
        const content = {
            icon: document.querySelector('.icon').textContent,
            title: document.querySelector('h2').textContent,
            content: editableContent.innerHTML,
            author: document.querySelector('.author').textContent,
            cardName: document.querySelector('.card-name').textContent,
            qrText: document.querySelector('.qr-code').textContent,
            qrImageData: qrImage.src,
            qrVisible: isQrVisible
        };
        localStorage.setItem('cardContent', JSON.stringify(content));
    }

    // 初始化设置
    updateCurrentDate();
    updateQrVisibility(!isQrVisible);
    card.classList.add('red-gradient');

    // 设置事件监听器
    setInterval(updateCurrentDate, 60000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateCurrentDate();
        }
    });

    // 移除日期的可编辑属性
    document.querySelector('.date').removeAttribute('contenteditable');

    // 添加颜色切换事件监听
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的激活状态
            colorBtns.forEach(b => b.classList.remove('active'));
            // 添加当前按钮的激活状态
            btn.classList.add('active');

            // 移除所有渐变类
            card.classList.remove(
                'red-gradient', 
                'blue-gradient', 
                'purple-gradient', 
                'green-gradient',
                'pink-gradient',
                'orange-gradient'
            );
            
            // 添加选中的渐变类
            const color = btn.dataset.color;
            card.classList.add(`${color}-gradient`);
        });
    });

    // 添加二维码上传事件监听
    qrContainer.addEventListener('click', () => {
        qrUpload.click();
    });

    qrUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('图片大小不能超过 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                qrImage.src = event.target.result;
                saveContent(); // 保存更新后的内容
            };
            reader.readAsDataURL(file);
        }
    });

    // 添加二维码显示/隐藏事件监听
    qrToggle.addEventListener('click', () => {
        const isHidden = qrUploadContainer.classList.contains('hidden');
        updateQrVisibility(isHidden);
    });

    // 添加内容编辑事件监听
    document.querySelectorAll('[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', () => {
            updateWordCount();
            saveContent();
        });

        element.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    });

    // 修改下载功能部分
    downloadBtn.addEventListener('click', async () => {
        try {
            downloadBtn.classList.add('loading');
            downloadBtn.disabled = true;

            // 创建一个隐藏的包装容器
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                padding: 20px;
                background: #1a1a1a;
                position: fixed;
                left: -9999px;
                top: 0;
                border-radius: 20px;
            `;
            
            const cardClone = card.cloneNode(true);
            wrapper.appendChild(cardClone);
            document.body.appendChild(wrapper);

            try {
                const canvas = await html2canvas(wrapper, {
                    scale: 2,
                    backgroundColor: '#1a1a1a',
                    allowTaint: true,
                    useCORS: true,
                    logging: false
                });

                // 直接触发下载
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `书摘卡片_${new Date().getTime()}.png`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 'image/png');

            } finally {
                // 确保移除临时元素
                document.body.removeChild(wrapper);
            }

        } catch (error) {
            console.error('保存图片时出错:', error);
            alert('保存图片时出错，请重试');
        } finally {
            downloadBtn.classList.remove('loading');
            downloadBtn.disabled = false;
        }
    });

    // 初始化
    loadContent();
}); 