document.addEventListener("DOMContentLoaded", () => {
    
    // Çoklu Dil Çeviri Sözlüğü
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

    // Metin Dosyası Yükleyici (Sadece .txt dosyasını okur)
    const loadBioText = (filePath) => {
        // Tarayıcı önbelleğini atlamak için zaman damgası ekliyoruz
        const cacheBusterPath = `${filePath}?v=${new Date().getTime()}`;
        
        fetch(cacheBusterPath)
            .then(res => {
                if (!res.ok) throw new Error("Dosya bulunamadı.");
                return res.text();
            })
            .then(data => {
                // txt içeriği doğrudan ekrana basılır
                bioContent.innerHTML = data;
            })
            .catch(err => {
                // Eğer HTML'ye çift tıklayıp (file:///) girersen bu hata görünür.
                // Mutlaka Live Server ile açmalısın.
                console.error("Yükleme Hatası:", err);
                bioContent.innerHTML = `<p style="color:#ff4444; font-weight:bold;">Metin yüklenemedi. HTML dosyasını Live Server üzerinden açtığınızdan emin olun.</p>`;
            });
    };

    // Dil Değiştirme Mantığı
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

        loadBioText(data.bioFile);

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

    // Sağ Panel (CV Drawer) Kontrolleri
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
