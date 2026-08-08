document.addEventListener("DOMContentLoaded", () => {
    
    // Güvenlik engeline (CORS) takılırsa gösterilecek kurtarıcı metinler
    const fallbackBioTexts = {
        TR: "<p>Elektrik-Elektronik Mühendisliği ile müziğin tutkulu kesişim noktasında üreten bir mühendis ve müzisyenim. Müzikal tınıların arkasındaki donanımsal mimariyi, analog ses devrelerini ve efekt sistemlerini kendi mühendislik bakış açımla tasarlayıp hayata geçiriyorum.</p>",
        EN: "<p>I am an Electrical and Electronics Engineer and musician producing at the passionate intersection of engineering and music. I design and build analog audio circuits and effect systems.</p>",
        CN: "<p>我是一名电气与电子工程师兼音乐人，致力于工程与音乐的热情交汇点。我从工程角度设计并开发模拟音频电路、音效系统以及音乐声效背后的硬件架构。</p>"
    };

    const translations = {
        TR: {
            engineerText: "Elektrik Elektronik Mühendisi",
            toolsTitle: "Öne Çıkan Uygulamalar & Araçlar",
            editorSub: "Geliştirici Arayüzü",
            pcbSub: "Devre Tasarım Aracı",
            puzzleTitle: "Kaydırmalı Yapboz",
            puzzleSub: "İnteraktif Modül",
            bioTitle: "Fatih Önday Kimdir?",
            cvPdf: "assets/001-Fatih-Onday-CV-TR.pdf",
            cvJpg: "assets/001-Fatih-Onday-CV-TR.jpg",
            bioFile: "content/bio-TR.txt",
            langCode: "TR"
        },
        EN: {
            engineerText: "Electrical & Electronics Engineer",
            toolsTitle: "Featured Applications & Tools",
            editorSub: "Developer Interface",
            pcbSub: "Circuit Design Tool",
            puzzleTitle: "Sliding Puzzle",
            puzzleSub: "Interactive Module",
            bioTitle: "Who is Fatih Önday?",
            cvPdf: "assets/001-Fatih-Onday-CV-EN.pdf",
            cvJpg: "assets/001-Fatih-Onday-CV-EN.jpg",
            bioFile: "content/bio-EN.txt",
            langCode: "EN"
        },
        CN: {
            engineerText: "电气与电子工程师",
            toolsTitle: "特色应用与工具",
            editorSub: "开发者界面",
            pcbSub: "电路板设计工具",
            puzzleTitle: "滑动拼图",
            puzzleSub: "互动模块",
            bioTitle: "Fatih Önday 简介",
            cvPdf: "assets/001-Fatih-Onday-CV-CN.pdf",
            cvJpg: "assets/001-Fatih-Onday-CV-CN.jpg",
            bioFile: "content/bio-CN.txt",
            langCode: "CN"
        }
    };

    const langBtns = document.querySelectorAll('.lang-btn');
    const engineerText = document.getElementById('engineerText');
    const toolsTitle = document.getElementById('toolsTitle');
    const editorSub = document.getElementById('editorSub');
    const pcbSub = document.getElementById('pcbSub');
    const puzzleTitle = document.getElementById('puzzleTitle');
    const puzzleSub = document.getElementById('puzzleSub');
    const bioTitle = document.getElementById('bioTitle');
    const bioContent = document.getElementById('bioContent');
    const cvDownloadBtn = document.getElementById('cvDownloadBtn');
    const cvImage = document.getElementById('cvImage');

    const loadBioText = (filePath, langCode) => {
        fetch(filePath)
            .then(res => {
                if (!res.ok) throw new Error("Metin dosyası bulunamadı.");
                return res.text();
            })
            .then(data => {
                bioContent.innerHTML = data;
            })
            .catch(err => {
                console.warn("Live Server kullanılmıyor olabilir. Fallback metin yükleniyor.");
                bioContent.innerHTML = fallbackBioTexts[langCode];
            });
    };

    const setLanguage = (lang) => {
        const data = translations[lang];
        if (!data) return;

        engineerText.innerText = data.engineerText;
        toolsTitle.innerText = data.toolsTitle;
        editorSub.innerText = data.editorSub;
        pcbSub.innerText = data.pcbSub;
        puzzleTitle.innerText = data.puzzleTitle;
        puzzleSub.innerText = data.puzzleSub;
        bioTitle.innerText = data.bioTitle;

        cvDownloadBtn.href = data.cvPdf;
        cvDownloadBtn.setAttribute('download', data.cvPdf.split('/').pop());
        cvImage.src = data.cvJpg;

        loadBioText(data.bioFile, data.langCode);

        langBtns.forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });

    setLanguage('TR');

    const cvDrawer = document.getElementById('cvDrawer');
    const hoverZone = document.getElementById('hoverZone');

    const openCV = () => { cvDrawer.classList.add('active'); };
    const closeCV = () => { cvDrawer.classList.remove('active'); };

    if (hoverZone && cvDrawer) {
        hoverZone.addEventListener('mouseenter', openCV);
        document.addEventListener('click', (e) => {
            if (!cvDrawer.contains(e.target) && !hoverZone.contains(e.target)) {
                closeCV();
            }
        });
    }
});