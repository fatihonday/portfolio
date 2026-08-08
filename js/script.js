document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. ÇOKLU DİL VE BİYOGRAFİ İÇERİKLERİ
    // ==========================================
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
            bioHtml: "<p>Elektrik-Elektronik Mühendisliği ile müziğin tutkulu kesişim noktasında üreten bir mühendis ve müzisyenim. Müzikal tınıların arkasındaki donanımsal mimariyi, analog ses devrelerini ve efekt sistemlerini kendi mühendislik bakış açımla tasarlayıp hayata geçiriyorum.</p><p>Sadece sesin fiziği ve elektroniğiyle değil; aynı zamanda üretimi kolaylaştıran dijital yazılımlar, interaktif araçlar ve modern web teknolojileri geliştirerek çok yönlü projeler üretmeye devam ediyorum.</p>"
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
            bioHtml: "<p>I am an Electrical and Electronics Engineer and musician producing at the passionate intersection of engineering and music. I design and build analog audio circuits, effect systems, and hardware architectures behind musical tones from an engineering perspective.</p><p>Beyond the physics and electronics of sound, I develop digital software, interactive tools, and modern web applications to streamline design and production workflows.</p>"
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
            bioHtml: "<p>我是一名电气与电子工程师兼音乐人，致力于工程与音乐的热情交汇点。我从工程角度设计并开发模拟音频电路、音效系统以及音乐声效背后的硬件架构。</p><p>除了声音物理学和电子学之外，我还开发数字软件、互动工具和现代 Web 应用，以简化设计与生产流程。</p>"
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

    // Dil Değiştirme Mantığı
    const setLanguage = (lang) => {
        const data = translations[lang];
        if (!data) return;

        // UI Metinlerini Güncelle
        engineerText.innerText = data.engineerText;
        toolsTitle.innerText = data.toolsTitle;
        editorSub.innerText = data.editorSub;
        pcbSub.innerText = data.pcbSub;
        puzzleTitle.innerText = data.puzzleTitle;
        puzzleSub.innerText = data.puzzleSub;
        bioTitle.innerText = data.bioTitle;

        // Biyografi Metnini Bas
        bioContent.innerHTML = data.bioHtml;

        // CV Dosya Bağlantılarını Güncelle
        cvDownloadBtn.href = data.cvPdf;
        cvDownloadBtn.setAttribute('download', data.cvPdf.split('/').pop());
        cvImage.src = data.cvJpg;

        // Aktif Buton CSS'ini Güncelle
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

    // Varsayılan Dili Yükle
    setLanguage('TR');

    // ==========================================
    // 2. SAĞ PANEL (CV DRAWER) KONTROLLERİ
    // ==========================================
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
