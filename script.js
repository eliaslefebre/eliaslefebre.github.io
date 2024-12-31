function filterItems(tag) {
    const items = document.querySelectorAll('.portfolio-item');
    
    items.forEach(item => {
        const itemTags = item.getAttribute('data-tags').split(' ');
        
        if (tag === 'all' || itemTags.includes(tag)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}