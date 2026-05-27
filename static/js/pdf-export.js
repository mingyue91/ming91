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

  btn.addEventListener('click', function () {
    if (typeof html2pdf !== 'undefined') {
      btn.disabled = true;
      btn.textContent = '生成中…';

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
          btn.disabled = false;
          btn.textContent = '导出 PDF';
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = '导出 PDF';
          window.print();
        });
    } else {
      window.print();
    }
  });
})();
