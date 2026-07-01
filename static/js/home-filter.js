(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var tabs = document.querySelectorAll('.category-tabs > .tab, .category-tabs .dropbtn');
        var articles = document.querySelectorAll('.article-list .card');
        var searchInput = document.getElementById('search-input');
        var searchClear = document.getElementById('search-clear');
        var pagination = document.querySelector('.pagination');
        var currentCategory = 'all';
        var currentTag = null;

        function getDropdown(cat) {
            var drop = document.getElementById('subdrop-' + cat);
            if (drop) return drop;
            var parent = document.querySelector('.tab-dropdown .dropbtn[data-category="' + cat + '"]');
            return parent ? parent.parentNode.querySelector('.dropdown-content') : null;
        }

        function buildSubcategories(cat) {
            var drop = getDropdown(cat);
            if (!drop) return;
            var tagSet = {};
            articles.forEach(function(a) {
                if (a.getAttribute('data-category') === cat) {
                    (a.getAttribute('data-tags') || '').split(',').forEach(function(t) {
                        var tag = t.trim();
                        if (tag) tagSet[tag] = true;
                    });
                }
            });
            var tags = Object.keys(tagSet).sort();
            drop.innerHTML = '';
            tags.forEach(function(tag) {
                var a = document.createElement('a');
                a.setAttribute('data-tag', tag);
                a.textContent = tag;
                a.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    drop.classList.remove('show');
                    currentTag = this.getAttribute('data-tag');
                    filterBy(cat, currentTag);
                });
                drop.appendChild(a);
            });
        }

        function filterBy(category, tag) {
            currentCategory = category || 'all';
            currentTag = tag || null;
            
            tabs.forEach(function(t) { t.classList.remove('active'); });
            document.querySelector('.category-tabs').classList.toggle('category-filter-active', currentCategory !== 'all');
            
            var drops = document.querySelectorAll('.dropdown-content a.active');
            drops.forEach(function(d) { d.classList.remove('active'); });

            if (currentCategory === 'all') {
                var allBtn = document.querySelector('.category-tabs > .tab[data-category="all"]');
                if (allBtn) allBtn.classList.add('active');
            } else if (currentTag) {
                var dropBtn = document.querySelector('.dropbtn[data-category="' + currentCategory + '"]');
                if (dropBtn) {
                    dropBtn.classList.add('active');
                    var activeItem = dropBtn.parentNode.querySelector('.dropdown-content a[data-tag="' + currentTag + '"]');
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
                    var articleTags = (article.getAttribute('data-tags') || '').split(',').map(function(t) { return t.trim(); });
                    catMatch = article.getAttribute('data-category') === currentCategory && articleTags.indexOf(currentTag) !== -1;
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

            if (pagination) {
                pagination.style.display = visible.length > 0 && currentCategory === 'all' && !keyword ? '' : 'none';
            }
            if (searchClear) searchClear.style.display = keyword ? '' : 'none';
        }

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function(e) {
                var cat = this.getAttribute('data-category');
                document.querySelectorAll('.dropdown-content.show').forEach(function(d) { d.classList.remove('show'); });
                if (this.classList.contains('dropbtn')) {
                    var drop = this.parentNode.querySelector('.dropdown-content');
                    if (drop) {
                        buildSubcategories(cat);
                        drop.classList.toggle('show');
                    }
                    e.stopPropagation();
                } else {
                    filterBy(cat, null);
                }
            });
        });

        document.addEventListener('click', function() {
            document.querySelectorAll('.dropdown-content.show').forEach(function(d) { d.classList.remove('show'); });
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

        buildSubcategories('云计算');
        applyFilters();
    });
})();
