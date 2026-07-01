(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var tabs = document.querySelectorAll('.category-tabs > .tab');
        var articles = document.querySelectorAll('.article-list .card');
        var searchInput = document.getElementById('search-input');
        var searchClear = document.getElementById('search-clear');
        var pagination = document.querySelector('.pagination');
        var currentCategory = 'all';

        function filterBy(category) {
            currentCategory = category || 'all';
            
            tabs.forEach(function(t) { t.classList.remove('active'); });
            document.querySelector('.category-tabs').classList.toggle('category-filter-active', currentCategory !== 'all');
            
            if (currentCategory === 'all') {
                var allBtn = document.querySelector('.category-tabs > .tab[data-category="all"]');
                if (allBtn) allBtn.classList.add('active');
            } else {
                var found = Array.from(tabs).find(function(t) {
                    return t.getAttribute('data-category') === currentCategory;
                });
                if (found) found.classList.add('active');
            }

            applyFilters();
        }

        function applyFilters() {
            var keyword = (searchInput ? searchInput.value : '').toLowerCase().trim();
            var showAll = !keyword;

            var list = document.querySelector('.article-list');
            var visible = [];

            articles.forEach(function(article) {
                var catMatch = currentCategory === 'all' || article.getAttribute('data-category') === currentCategory;
                var kwMatch = showAll;
                if (!showAll) {
                    var titleEl = article.querySelector('.article-title a');
                    var title = titleEl ? titleEl.textContent.toLowerCase() : '';
                    var descEl = article.querySelector('.article-subtitle');
                    var desc = descEl ? descEl.textContent.toLowerCase() : '';
                    var tags = (article.getAttribute('data-tags') || '').toLowerCase();
                    kwMatch = title.indexOf(keyword) !== -1 || desc.indexOf(keyword) !== -1 || tags.indexOf(keyword) !== -1;
                }

                article.style.display = catMatch && kwMatch ? '' : 'none';
                if (catMatch && kwMatch) visible.push(article);
            });

            if (currentCategory !== 'all') {
                var pinned = visible.filter(function(a) { return a.getAttribute('data-pinned') === 'true'; });
                var rest = visible.filter(function(a) { return a.getAttribute('data-pinned') !== 'true'; });
                pinned.forEach(function(a) { list.appendChild(a); });
                rest.forEach(function(a) { list.appendChild(a); });
            }

            if (pagination) {
                pagination.style.display = visible.length > 0 && currentCategory === 'all' && !keyword ? '' : 'none';
            }
            if (searchClear) searchClear.style.display = keyword ? '' : 'none';
        }

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                filterBy(this.getAttribute('data-category'));
            });
        });

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                if (this.value) {
                    var allTab = document.querySelector('.category-tabs > .tab[data-category="all"]');
                    if (allTab) {
                        tabs.forEach(function(t) { t.classList.remove('active'); });
                        allTab.classList.add('active');
                        currentCategory = 'all';
                    }
                }
                applyFilters();
            });

            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && this.value.trim()) {
                    var base = (typeof window.searchURL !== 'undefined') ? window.searchURL : './search/';
                    window.location.href = base + '?keyword=' + encodeURIComponent(this.value.trim());
                }
            });
        }

        if (searchClear) {
            searchClear.addEventListener('click', function() {
                searchInput.value = '';
                searchInput.focus();
                applyFilters();
            });
        }

        applyFilters();
    });
})();
