const navbar = `
<div class="logo">
    <h1>InstaFetch</h1>
</div>

<div class="nav-links">
    <a href="/frontend/pages/index.html">Video</a>
    <a href="#">Photo</a>
    <a href="#">Reel</a>
    <a href="#">Story</a>

    <div class="nav-indicator"></div>
</div>
`;

document.getElementById("navbar").innerHTML = navbar;


// ===== JS LOGIC =====
const links = document.querySelectorAll(".nav-links a");
const indicator = document.querySelector(".nav-indicator");

let activeLink = links[0];

function moveIndicator(el) {
    const rect = el.getBoundingClientRect();
    const parentRect = el.parentElement.getBoundingClientRect();

    indicator.style.width = rect.width + "px";
    indicator.style.left = (rect.left - parentRect.left) + "px";
}

// 🔥 set active on load
window.addEventListener("load", () => {
    const currentPage = window.location.pathname;

    links.forEach(link => {
        if (currentPage.includes(link.getAttribute("href"))) {
            activeLink = link;
        }
    });

    // remove old active
    links.forEach(l => l.classList.remove("active"));

    // add active class
    activeLink.classList.add("active");

    moveIndicator(activeLink);
});

// 🔥 hover
links.forEach(link => {
    link.addEventListener("mouseenter", () => {
        moveIndicator(link);
    });
});

// 🔥 leave → back to active
document.querySelector(".nav-links").addEventListener("mouseleave", () => {
    moveIndicator(activeLink);
});

// 🔥 click → update active
links.forEach(link => {
    link.addEventListener("click", () => {
        activeLink = link;

        // update class
        links.forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        moveIndicator(activeLink);
    });
});