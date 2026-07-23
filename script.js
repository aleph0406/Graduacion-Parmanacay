/**
 * Invitación de Graduación
 * Secuencia: preloader -> video -> portada -> invitación + música
 */
(() => {
    "use strict";

    const GRADUATION_DATE = "2026-07-28T08:30:00-04:00";
    const PAGE_COUNT = 3;

    let elements = {};
    let pageFlipInstance = null;
    let fallbackPageIndex = 0;
    let isAudioPlaying = false;
    let videoSequenceFinished = false;
    let invitationOpened = false;

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        elements = {
            body: document.body,
            loader: document.getElementById("loader"),
            videoOverlay: document.getElementById("video-overlay"),
            introVideo: document.getElementById("intro-video"),
            skipVideoBtn: document.getElementById("skip-video-btn"),
            initialPopup: document.getElementById("initial-popup"),
            entryBtn: document.getElementById("entry-btn"),
            invitationContainer: document.getElementById("invitation-container"),
            footerControls: document.getElementById("footer-controls"),
            audio: document.getElementById("bg-audio"),
            musicToggle: document.getElementById("music-toggle"),
            musicIcon: document.getElementById("music-icon"),
            musicStatus: document.getElementById("music-status"),
            flipContainer: document.getElementById("magazine-flipbook"),
            prevBtn: document.getElementById("prev-page"),
            nextBtn: document.getElementById("next-page")
        };

        initSparkles();
        initCountdown();
        bindEvents();

        // Se intenta reproducir inmediatamente; el video está silenciado para
        // cumplir las políticas de reproducción automática de los navegadores.
        playVideoSafely();

        // Respaldo: el loader nunca debe quedarse bloqueando la interfaz.
        window.setTimeout(hideLoader, 3000);
    }

    window.addEventListener("load", () => {
        window.setTimeout(hideLoader, 450);
    });

    function hideLoader() {
        const { loader } = elements;
        if (!loader || loader.classList.contains("hidden")) return;

        loader.classList.add("hidden");
        loader.setAttribute("aria-hidden", "true");

        // Se elimina por completo después de la transición. Esta corrección
        // evita que una capa transparente bloquee "Saltar intro" y la portada.
        window.setTimeout(() => loader.remove(), 750);
    }

    function bindEvents() {
        const {
            introVideo,
            skipVideoBtn,
            entryBtn,
            musicToggle,
            prevBtn,
            nextBtn,
            flipContainer
        } = elements;

        introVideo?.addEventListener("ended", finishVideoSequence);
        introVideo?.addEventListener("error", finishVideoSequence);
        skipVideoBtn?.addEventListener("click", finishVideoSequence);
        entryBtn?.addEventListener("click", openInvitation);
        musicToggle?.addEventListener("click", toggleAudio);
        elements.audio?.addEventListener("playing", () => setAudioState(true));
        elements.audio?.addEventListener("pause", () => setAudioState(false));
        elements.audio?.addEventListener("ended", () => setAudioState(false));
        elements.audio?.addEventListener("error", handleAudioError);
        prevBtn?.addEventListener("click", showPreviousPage);
        nextBtn?.addEventListener("click", showNextPage);

        // En el modo alternativo, tocar la tarjeta avanza una página.
        flipContainer?.addEventListener("click", () => {
            if (!flipContainer.classList.contains("fallback-mode")) return;
            showNextPage();
        });

        document.addEventListener("keydown", (event) => {
            if (!invitationOpened) return;
            if (event.key === "ArrowLeft") showPreviousPage();
            if (event.key === "ArrowRight") showNextPage();
        });
    }

    async function playVideoSafely() {
        const { introVideo } = elements;
        if (!introVideo || videoSequenceFinished) return;

        try {
            await introVideo.play();
        } catch (error) {
            // Algunos navegadores pueden bloquear incluso un video silenciado.
            // El botón de salto continúa disponible para avanzar.
            console.info("El navegador bloqueó la reproducción automática del video.", error);
        }
    }

    function finishVideoSequence() {
        if (videoSequenceFinished) return;
        videoSequenceFinished = true;

        const { introVideo, videoOverlay, initialPopup } = elements;

        if (introVideo) {
            introVideo.pause();
        }

        hideLayer(videoOverlay);
        showLayer(initialPopup);
    }

    function openInvitation() {
        if (invitationOpened) return;
        invitationOpened = true;

        const {
            body,
            initialPopup,
            invitationContainer,
            footerControls
        } = elements;

        hideLayer(initialPopup);
        revealContent(invitationContainer);
        revealContent(footerControls);
        body?.classList.remove("is-locked");

        // Este clic del usuario permite iniciar la música legalmente en móvil.
        startAudio();

        // Dos frames garantizan que el contenedor ya tenga dimensiones reales.
        requestAnimationFrame(() => {
            requestAnimationFrame(initFlipbook);
        });
    }

    function hideLayer(element) {
        if (!element) return;
        element.classList.add("hidden");
        element.setAttribute("aria-hidden", "true");
    }

    function showLayer(element) {
        if (!element) return;
        element.classList.remove("hidden");
        element.setAttribute("aria-hidden", "false");
    }

    function revealContent(element) {
        if (!element) return;
        element.classList.remove("hidden");
        element.setAttribute("aria-hidden", "false");
    }

    async function startAudio() {
        const { audio } = elements;
        if (!audio) return;

        try {
            audio.muted = false;
            audio.volume = 0.85;

            if (audio.networkState === HTMLMediaElement.NETWORK_EMPTY) {
                audio.load();
            }

            await audio.play();
            setAudioState(true);
        } catch (error) {
            setAudioState(false);
            console.info("No se pudo iniciar la melodía automáticamente. Usa el botón para reintentar.", error);
        }
    }

    async function toggleAudio() {
        const { audio } = elements;
        if (!audio) return;

        if (!audio.paused && !audio.ended) {
            audio.pause();
            return;
        }

        await startAudio();
    }

    function handleAudioError() {
        const { audio, musicStatus } = elements;
        setAudioState(false);

        if (musicStatus) {
            musicStatus.textContent = "Reintentar melodía";
        }

        console.error(
            "No se encontró o no se pudo cargar la melodía. Verifica que el archivo esté junto a index.html y conserve uno de los nombres configurados.",
            audio?.error
        );
    }

    function setAudioState(isPlaying) {
        const { musicToggle, musicIcon, musicStatus } = elements;
        isAudioPlaying = isPlaying;

        musicToggle?.setAttribute("aria-pressed", String(isPlaying));
        if (musicIcon) musicIcon.textContent = isPlaying ? "🔊" : "🎵";
        if (musicStatus) musicStatus.textContent = isPlaying ? "Pausar melodía" : "Escuchar melodía";
    }

    function initFlipbook() {
        const { flipContainer } = elements;
        if (!flipContainer || pageFlipInstance || flipContainer.classList.contains("fallback-mode")) return;

        const pages = Array.from(flipContainer.querySelectorAll(".page"));
        if (!pages.length) return;

        try {
            if (!window.St?.PageFlip) {
                throw new Error("La biblioteca PageFlip no está disponible.");
            }

            pageFlipInstance = new window.St.PageFlip(flipContainer, {
                width: 430,
                height: 645,
                size: "stretch",
                minWidth: 280,
                maxWidth: 520,
                minHeight: 420,
                maxHeight: 780,
                autoSize: true,
                drawShadow: true,
                maxShadowOpacity: 0.48,
                showCover: true,
                usePortrait: true,
                mobileScrollSupport: false,
                useMouseEvents: true,
                clickEventForward: true,
                flippingTime: 850,
                showPageCorners: true,
                disableFlipByClick: false
            });

            pageFlipInstance.loadFromHTML(pages);
            pageFlipInstance.on("flip", updateNavigationState);
            updateNavigationState();
        } catch (error) {
            console.warn("Se activó el modo alternativo de páginas.", error);
            initFallbackPages();
        }
    }

    function initFallbackPages() {
        const { flipContainer } = elements;
        if (!flipContainer) return;

        flipContainer.classList.add("fallback-mode");
        fallbackPageIndex = 0;
        renderFallbackPage();
    }

    function showPreviousPage() {
        if (pageFlipInstance) {
            pageFlipInstance.flipPrev();
            return;
        }

        if (!elements.flipContainer?.classList.contains("fallback-mode")) return;
        fallbackPageIndex = Math.max(0, fallbackPageIndex - 1);
        renderFallbackPage();
    }

    function showNextPage() {
        if (pageFlipInstance) {
            const currentPage = pageFlipInstance.getCurrentPageIndex();
            if (currentPage >= PAGE_COUNT - 1) {
                if (typeof pageFlipInstance.turnToPage === "function") {
                    pageFlipInstance.turnToPage(0);
                } else {
                    pageFlipInstance.flip(0);
                }
            } else {
                pageFlipInstance.flipNext();
            }
            return;
        }

        if (!elements.flipContainer?.classList.contains("fallback-mode")) return;
        fallbackPageIndex = (fallbackPageIndex + 1) % PAGE_COUNT;
        renderFallbackPage();
    }

    function updateNavigationState() {
        const { prevBtn, nextBtn } = elements;
        if (!pageFlipInstance) return;

        const currentPage = pageFlipInstance.getCurrentPageIndex();
        if (prevBtn) prevBtn.disabled = currentPage <= 0;
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.setAttribute(
                "aria-label",
                currentPage >= PAGE_COUNT - 1 ? "Volver a la primera página" : "Ir a la página siguiente"
            );
        }
    }

    function renderFallbackPage() {
        const { flipContainer, prevBtn, nextBtn } = elements;
        const pages = Array.from(flipContainer?.querySelectorAll(".page") || []);

        pages.forEach((page, index) => {
            page.classList.toggle("is-active", index === fallbackPageIndex);
            page.setAttribute("aria-hidden", String(index !== fallbackPageIndex));
        });

        if (prevBtn) prevBtn.disabled = fallbackPageIndex === 0;
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.setAttribute(
                "aria-label",
                fallbackPageIndex === pages.length - 1 ? "Volver a la primera página" : "Ir a la página siguiente"
            );
        }
    }

    function initCountdown() {
        const targetTime = new Date(GRADUATION_DATE).getTime();

        const updateCountdown = () => {
            const difference = targetTime - Date.now();
            const timerElement = document.getElementById("countdown-timer");

            if (!timerElement) return false;

            if (difference <= 0) {
                timerElement.innerHTML = '<p class="countdown-complete">¡Llegó el gran día!</p>';
                return false;
            }

            const day = 1000 * 60 * 60 * 24;
            const hour = 1000 * 60 * 60;
            const minute = 1000 * 60;

            setText("days", Math.floor(difference / day));
            setText("hours", Math.floor((difference % day) / hour));
            setText("minutes", Math.floor((difference % hour) / minute));
            setText("seconds", Math.floor((difference % minute) / 1000));
            return true;
        };

        updateCountdown();
        const intervalId = window.setInterval(() => {
            if (!updateCountdown()) window.clearInterval(intervalId);
        }, 1000);
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value).padStart(2, "0");
    }

    function initSparkles() {
        const container = document.getElementById("sparkles-container");
        if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const sparkleCount = window.innerWidth <= 768 ? 28 : 52;
        for (let index = 0; index < sparkleCount; index += 1) {
            createSparkle(container, true);
        }
    }

    function createSparkle(container, initial = false) {
        if (!document.body.contains(container)) return;

        const sparkle = document.createElement("span");
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 5 + 5;
        const delay = Math.random() * 5;

        sparkle.className = "sparkle";
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = initial ? `${Math.random() * 100}%` : "100%";
        sparkle.style.animationDuration = `${duration}s`;
        sparkle.style.animationDelay = `${delay}s`;
        container.appendChild(sparkle);

        window.setTimeout(() => {
            sparkle.remove();
            createSparkle(container, false);
        }, (duration + delay) * 1000);
    }
})();
