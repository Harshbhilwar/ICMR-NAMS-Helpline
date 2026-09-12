/* ==========================================
   HERO SLIDER
=========================================== */

let currentSlide = 0;


const slides = document.querySelectorAll(".hero-slide");

const dots = document.querySelectorAll(".slider-dot");


function showSlide(index) {

    if (slides.length === 0) {

        return;

    }


    if (index >= slides.length) {

        currentSlide = 0;

    }

    else if (index < 0) {

        currentSlide = slides.length - 1;

    }

    else {

        currentSlide = index;

    }


    slides.forEach((slide) => {

        slide.classList.remove("active");

    });


    dots.forEach((dot) => {

        dot.classList.remove("active");

    });


    slides[currentSlide].classList.add("active");


    if (dots[currentSlide]) {

        dots[currentSlide].classList.add("active");

    }

}


/* ==========================================
   NEXT / PREVIOUS
=========================================== */

function changeSlide(direction) {

    showSlide(currentSlide + direction);

}


/* ==========================================
   AUTOMATIC SLIDER
=========================================== */

setInterval(() => {

    changeSlide(1);

}, 5000);

