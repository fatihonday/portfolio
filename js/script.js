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
            bioHtml: "<p>Elektrik-Elektronik Mühendisiyim. Elektrik proje tasarımı, saha uygulamaları ve elektronik üretim süreçlerinde deneyim sahibiyim. Elektrik tesisat projeleri, teknik dokümantasyon, saha koordinasyonu, SMD/THT üretimi, Pick and Place süreçleri ve PCB üretimi alanlarında çalıştım. AutoCAD, KiCad ve Dialux başta olmak üzere çeşitli mühendislik yazılımlarını aktif olarak kullanıyorum. Ek olarak yazılım otomasyonları geliştirip bunları web sitemde paylaşıyorum.</p>"
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
            bioHtml: "<p>I am an Electrical & Electronics Engineer with experience in electrical project design, site applications, and electronics manufacturing. Throughout my career, I have been involved in electrical installation projects, technical documentation, site coordination, SMD/THT production, Pick and Place assembly, and PCB manufacturing processes. I enjoy improving my technical skills and expanding my knowledge in electrical engineering, electronics manufacturing, and hardware development.</p>"
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
            bioHtml: "<p>电气与电子工程专业工程师，具备电气项目设计、现场工程及电子制造经验。 曾参与电气安装项目、技术文档编制、现场协调，以及SMT/THT生产、贴片（Pick and Place）和PCB制造等工作。 希望持续提升专业能力，在电气工程、电子制造及硬件开发领域不断成长，并参与具有挑战性的工程项目。</p>"
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
