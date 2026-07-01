(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var tabs = document.querySelectorAll('.category-tabs > .tab, .category-tabs .dropbtn');
        var dropdownItems = document.querySelectorAll('.dropdown-content a');
        var articles = document.querySelectorAll('.article-list .card');
        var searchInput = document.getElementById('search-input');
        var searchClear = document.getElementById('search-clear');
        var currentCategory = 'all';
        var currentTag = null;

        function filterBy(category, tag) {
            currentCategory = category || 'all';
            currentTag = tag || null;
            
            tabs.forEach(function(t) { t.classList.remove('active'); });
            document.querySelector('.category-tabs').classList.toggle('category-filter-active', currentCategory !== 'all');
            
            var dropActive = document.querySelector('.dropdown-content a.active');
            if (dropActive) dropActive.classList.remove('active');

            if (currentCategory === 'all') {
                var allBtn = document.querySelector('.category-tabs > .tab[data-category="all"]');
                if (allBtn) allBtn.classList.add('active');
            } else if (currentTag) {
                var dropBtn = document.querySelector('.dropbtn');
                if (dropBtn) {
                    dropBtn.classList.add('active');
                    var activeItem = Array.from(dropdownItems).find(function(item) { 
                        return item.getAttribute('data-category') === currentTag; 
                    });
                    if (activeItem) activeItem.classList.add('active');
                }
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
                var catMatch = false;
                if (currentCategory === 'all') {
                    catMatch = true;
                } else if (currentTag) {
                    var articleTags = article.getAttribute('data-tags') || '';
                    catMatch = articleTags.indexOf(currentTag) !== -1;
                } else {
                    catMatch = article.getAttribute('data-category') === currentCategory;
                }

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

            var pagination = document.querySelector('.pagination');
            if (pagination) pagination.style.display = visible.length > 0 ? '' : 'none';
            if (searchClear) searchClear.style.display = keyword ? '' : 'none';
        }

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                document.querySelector('.dropdown-content')?.classList.remove('show');
                filterBy(this.getAttribute('data-category'), null);
            });
        });

        dropdownItems.forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                document.querySelector('.dropdown-content')?.classList.remove('show');
                var tag = this.getAttribute('data-category');
                filterBy('云计算', tag);
            });
        });

        var dropbtn = document.querySelector('.dropbtn');
        if (dropbtn) {
            dropbtn.addEventListener('click', function(e) {
                e.stopPropagation();
                document.querySelector('.dropdown-content')?.classList.toggle('show');
            });
        }

        document.addEventListener('click', function() {
            document.querySelector('.dropdown-content')?.classList.remove('show');
        });

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                if (this.value) {
                    var allTab = document.querySelector('.category-tabs > .tab[data-category="all"]');
                    if (allTab) {
                        tabs.forEach(function(t) { t.classList.remove('active'); });
                        allTab.classList.add('active');
                        currentCategory = 'all';
                        currentTag = null;
                    }
                }
                applyFilters();
            });

            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && this.value.trim()) {
                    window.location.href = './search/?keyword=' + encodeURIComponent(this.value.trim());
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
