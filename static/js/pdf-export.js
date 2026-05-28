(function () {
  'use strict';

  var btn = document.getElementById('pdf-export-btn');
  if (!btn) return;

  var article = document.querySelector('article.main-article');
  if (!article) {
    btn.addEventListener('click', function () { window.print(); });
    return;
  }

  var filename = btn.getAttribute('data-filename') || 'article.pdf';
  var isHtml2PdfLoaded = false;
  var html2PdfLoadPromise = null;

  function loadHtml2Pdf() {
    if (isHtml2PdfLoaded) {
      return Promise.resolve();
    }
    
    if (html2PdfLoadPromise) {
      return html2PdfLoadPromise;
    }

    html2PdfLoadPromise = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = '/js/html2pdf.bundle.min.js';
      script.onload = function() {
        isHtml2PdfLoaded = true;
        resolve();
      };
      script.onerror = function() {
        reject(new Error('Failed to load html2pdf'));
      };
      document.head.appendChild(script);
    });

    return html2PdfLoadPromise;
  }

  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.textContent = '加载中…';

    if (typeof html2pdf !== 'undefined') {
      exportToPdf();
    } else {
      loadHtml2Pdf()
        .then(function() {
          exportToPdf();
        })
        .catch(function() {
          resetButton();
          window.print();
        });
    }
  });

  function exportToPdf() {
    var opt = {
      margin: [0.4, 0.5, 0.4, 0.5],
      filename: filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        width: article.scrollWidth,
        height: article.scrollHeight,
        windowWidth: article.scrollWidth
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf()
      .set(opt)
      .from(article)
      .save()
      .then(function () {
        resetButton();
      })
      .catch(function (err) {
        console.error('PDF export failed:', err);
        resetButton();
        window.print();
      });
  }

  function resetButton() {
    btn.disabled = false;
    btn.textContent = '导出 PDF';
  }
})();
