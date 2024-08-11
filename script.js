// Initialize AOS
AOS.init({
    duration: 1200,
    once: true,
});
    document.querySelector('a[href="#skills"]').addEventListener('click', function() {
        const bars = ['html-bar', 'css-bar', 'js-bar', 'java-bar', 'database-bar', 'php-bar', 'python-bar', 'c-bar'];

        bars.forEach(function(id) {
            const bar = document.getElementById(id);
            bar.style.animation = 'none';
            bar.offsetHeight; // Trigger reflow to reset animation
            bar.style.animation = '';
        });
    });

