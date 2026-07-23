/**
 * Invitación de Graduación - Lógica Interactiva
 * Colores: Vino, Blanco Hueso, Dorado
 */

document.addEventListener('DOMContentLoaded', () => {
    initSparkles();
    initCountdown();
    setupEventListeners();
});

// Desvanecer el Preloader cuando todo esté cargado
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.classList.add('hidden');
                // Al quitar el cargador, el video de fondo ya se estará reproduciendo
                playVideoSafe();
            }, 800);
        }, 600);
    }
});

/* ==========================================================================
   1. Partículas Brillantes (Sparkles)
   ========================================================================== */
function initSparkles() {
    const container = document.getElementById('sparkles-container');
    if (!container) return;

    const sparkleCount = 60;
    for (let i = 0; i < sparkleCount; i++) {
        createSparkle(container, true);
    }
}

function createSparkle(container, initial = false) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';

    const size = Math.random() * 5 + 2; // de 2px a 7px
    const duration = Math.random() * 5 + 5; // de 5s a 10s
    const delay = Math.random() * 5; // hasta 5s de retraso

    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    sparkle.style.left = `${Math.random() * 100}%`;
    
    if (initial) {
        // En la carga inicial, distribuir verticalmente para evitar que todas salgan del fondo a la vez
        sparkle.style.top = `${Math.random() * 100}%`;
    } else {
        sparkle.style.top = '100%';
    }

    sparkle.style.animationDuration = `${duration}s`;
    sparkle.style.animationDelay = `${delay}s`;

    container.appendChild(sparkle);

    // Remover y recrear una nueva partícula al terminar su animación
    setTimeout(() => {
        sparkle.remove();
        createSparkle(container, false);
    }, (duration + delay) * 1000);
}

/* ==========================================================================
   2. Temporizador Cuenta Regresiva (28 de Julio de 2026, 8:30 AM)
   ========================================================================== */
function initCountdown() {
    // 28 de Julio de 2026 a las 08:30:00 (Mes es 0-indexed, Julio = 6)
    const targetDate = new Date(2026, 6, 28, 8, 30, 0).getTime();

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const difference = targetDate - now;

        const daysVal = document.getElementById('days');
        const hoursVal = document.getElementById('hours');
        const minutesVal = document.getElementById('minutes');
        const secondsVal = document.getElementById('seconds');
        const countdownTimerEl = document.getElementById('countdown-timer');

        if (difference < 0) {
            clearInterval(timer);
            if (countdownTimerEl) {
                countdownTimerEl.innerHTML = "<div class='time-block' style='grid-column: 1 / -1; width: 100%;'><span style='font-size: 2.2rem;'>¡LLEGÓ EL GRAN DÍA!</span></div>";
            }
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (daysVal) daysVal.innerText = String(days).padStart(2, '0');
        if (hoursVal) hoursVal.innerText = String(hours).padStart(2, '0');
        if (minutesVal) minutesVal.innerText = String(minutes).padStart(2, '0');
        if (secondsVal) secondsVal.innerText = String(seconds).padStart(2, '0');

    }, 1000);
}

/* ==========================================================================
   3. Manejo de Eventos y Secuencia Interactiva
   ========================================================================== */
const audio = document.getElementById('bg-audio');
const introVideo = document.getElementById('intro-video');
let isAudioPlaying = false;

function playVideoSafe() {
    if (!introVideo) return;
    introVideo.play().catch(err => {
        console.log("El video autoplay fue bloqueado o pausado. Esperando clic del usuario.");
    });
}

function setupEventListeners() {
    const entryBtn = document.getElementById('entry-btn');
    const skipVideoBtn = document.getElementById('skip-video-btn');
    
    const initialPopup = document.getElementById('initial-popup');
    const videoOverlay = document.getElementById('video-overlay');
    const invitationContainer = document.getElementById('invitation-container');
    const footerControls = document.getElementById('footer-controls');
    const whatsappFloat = document.getElementById('whatsapp-float');
    
    const musicToggle = document.getElementById('music-toggle');
    const musicIcon = document.getElementById('music-icon');
    const musicStatus = document.getElementById('music-status');

    // 1. Al terminar el video o darle a Saltar Video
    const finishVideoSequence = () => {
        if (introVideo) {
            introVideo.pause();
        }
        videoOverlay.classList.add('hidden');
        
        // Revelamos el popup de la portada que tiene "Haz Click Aquí"
        initialPopup.classList.remove('hidden');
    };

    if (introVideo) {
        introVideo.addEventListener('ended', finishVideoSequence);
    }
    
    if (skipVideoBtn) {
        skipVideoBtn.addEventListener('click', finishVideoSequence);
    }

    // 2. Al hacer clic en la portada (Haz Click Aquí)
    if (entryBtn) {
        entryBtn.addEventListener('click', () => {
            // Ocultamos el popup
            initialPopup.classList.add('hidden');
            
            // Mostramos los contenedores de la invitación y controles
            invitationContainer.classList.remove('hidden');
            footerControls.classList.remove('hidden');
            whatsappFloat.classList.remove('hidden');

            // Intentamos reproducir el audio de fondo de inmediato
            if (audio) {
                audio.play()
                    .then(() => {
                        isAudioPlaying = true;
                        if (musicIcon) musicIcon.innerText = '🔊';
                        if (musicStatus) musicStatus.innerText = 'Pausar Melodía';
                    })
                    .catch(err => {
                        console.log("La reproducción de audio fue bloqueada por el navegador:", err);
                    });
            }

            // Inicializamos el Flipbook tras un breve retraso para que tenga dimensiones físicas en el DOM
            setTimeout(() => {
                initFlipbook();
                
                // Volteamos automáticamente a la primera página de contenido (1.webp)
                if (pageFlipInstance) {
                    pageFlipInstance.flip(1);
                }
            }, 150);
        });
    }

    // 3. Control de Pausa/Reproducción de Música
    if (musicToggle) {
        musicToggle.addEventListener('click', () => {
            if (!audio) return;
            
            if (isAudioPlaying) {
                audio.pause();
                isAudioPlaying = false;
                if (musicIcon) musicIcon.innerText = '🔇';
                if (musicStatus) musicStatus.innerText = 'Escuchar Melodía';
            } else {
                audio.play()
                    .then(() => {
                        isAudioPlaying = true;
                        if (musicIcon) musicIcon.innerText = '🔊';
                        if (musicStatus) musicStatus.innerText = 'Pausar Melodía';
                    })
                    .catch(err => {
                        console.error("Error al reproducir audio:", err);
                    });
            }
        });
    }
}

/* ==========================================================================
   4. Configuración e Inicialización de PageFlip
   ========================================================================== */
let pageFlipInstance = null;

function initFlipbook() {
    console.log("Iniciando Flipbook...");
    const flipContainer = document.getElementById('magazine-flipbook');
    if (!flipContainer) {
        console.error("Contenedor #magazine-flipbook no encontrado en el DOM");
        return;
    }
    if (pageFlipInstance) {
        console.log("El flipbook ya está inicializado");
        return;
    }

    // Detectamos dispositivo móvil para ajustar la visualización
    const isMobile = window.innerWidth <= 768;
    console.log("Modo móvil detectado:", isMobile);

    try {
        if (typeof St === "undefined" || !St.PageFlip) {
            throw new Error("La biblioteca PageFlip (St.PageFlip) no se ha cargado correctamente.");
        }

        pageFlipInstance = new St.PageFlip(flipContainer, {
            width: 400,
            height: 600,
            size: "stretch",
            minWidth: 280,
            maxWidth: 500,
            minHeight: 420,
            maxHeight: 750,
            maxShadowOpacity: 0.5,
            showCover: true,
            mobileScrollSupport: true,
            useMouseEvents: true,
            flippingTime: 900,
            showPageCorners: true,
            // En móvil mostramos de a una página (retrato), en escritorio doble página (paisaje)
            orientation: isMobile ? "portrait" : "landscape"
        });

        const pages = document.querySelectorAll('.page');
        console.log("Cantidad de páginas encontradas:", pages.length);
        pageFlipInstance.loadFromHTML(pages);
        console.log("Flipbook inicializado exitosamente");
    } catch (error) {
        console.error("Error al inicializar St.PageFlip:", error);
    }

    // Hacer que hacer clic directo sobre una página pase a la siguiente usando delegación de eventos
    flipContainer.addEventListener('click', (e) => {
        const pageEl = e.target.closest('.page');
        if (pageEl) {
            const pagesArray = Array.from(flipContainer.querySelectorAll('.page'));
            const pageIndex = pagesArray.indexOf(pageEl);
            if (pageIndex !== -1) {
                if (pageIndex === pagesArray.length - 1) {
                    pageFlipInstance.flip(0); // Si es la última página (3.webp), vuelve al inicio
                } else {
                    pageFlipInstance.flipNext();
                }
            }
        }
    });

    // Agregar estilo de cursor pointer a las páginas
    pages.forEach(page => {
        page.style.cursor = 'pointer';
    });

    // Ajustar orientación en cambios de tamaño de pantalla
    window.addEventListener('resize', () => {
        if (!pageFlipInstance) return;
        
        const currentlyMobile = window.innerWidth <= 768;
        const newOrientation = currentlyMobile ? "portrait" : "landscape";
        
        if (pageFlipInstance.getOrientation() !== newOrientation) {
            pageFlipInstance.update({
                orientation: newOrientation
            });
        }
    });

    // Eventos de botones
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            pageFlipInstance.flipPrev();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            pageFlipInstance.flipNext();
        });
    }
}
