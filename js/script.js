import { pontos } from './dataPins.js'; 

let api_key;
const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

initAppByLocation();

function initAppByLocation(){
    if (isLocal) {
        import('../config.js').then(module => {
            api_key = module.API_KEY;
            console.log("Local running...");
            createMapAndMarkers();
        }).catch(err => console.error("Erro ao importar config.js:", err));
    }
    if (!isLocal) {
        fetch('/.netlify/functions/getData')
            .then(res => res.json())
            .then(data => {
                api_key = data.key;
                console.log("Netlify running...");
                createMapAndMarkers(); 
            })
        .catch(err => console.error("Erro ao obter a chave:", err));
    }
}

function createMapAndMarkers() {
    const zoomLevel = 14;
    const map = createMap(api_key, zoomLevel, pontos);
    const popupOffsets = {
        top: [0, 0],
        bottom: [0, -70],
        'bottom-right': [0, -70],
        'bottom-left': [0, -70],
        left: [25, -35],
        right: [-25, -35]
    };  
    createMarkers(pontos, map, popupOffsets);
}

function createMap(api_key, zoomLevel, pontos) {
    return tt.map({
        container: 'map',
        key: api_key,
        center: { lat: pontos[0].lat, lng: pontos[0].lng },
        zoom: zoomLevel
    });
}

function captureImages(ip) {
    return new Promise((resolve) => {
        const timestamp = new Date().getTime();
        const updatedImageURL = `https://transito.serttel.com.br/cttupe/index.php/portal/getImg/${ip}/?t=${timestamp}`;
        const tempImg = new Image();

        let timeout = setTimeout(() => {
            console.log("Imagem demorando para responder...");
        }, 5000);

        tempImg.onload = () => {
            clearTimeout(timeout);
            document.getElementById("modalImage").src = updatedImageURL;
            document.getElementById("modalImage").style.display = "block";
            resolve(true);
        }

        tempImg.onerror = () => {
            clearTimeout(timeout);
            mostrarAvisoImagem();
            resolve(false);
        }

        tempImg.src = updatedImageURL;
    });
}

function mostrarAvisoImagem() {
    document.getElementById("modalImage").src = "";
    const modalImage = document.getElementById("modalImage");
    modalImage.src = "";
    modalImage.alt = "Imagem não encontrada";
    modalImage.style.display = "none";
    let aviso = document.getElementById("avisoImagem");
    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "avisoImagem";
        aviso.style.color = "#888";
        aviso.style.textAlign = "center";
        aviso.style.padding = "20px";
        aviso.textContent = "Imagem não encontrada";
        modalImage.parentNode.appendChild(aviso);
    } else {
        aviso.style.display = "block";
    }
}

function createMarkers(pinsInput, mapInput, popupInput){
    const modalElement = document.getElementById('cameraModal');
    const modalContent = modalElement.querySelector('.modal-content');
    const myModal = new bootstrap.Modal(modalElement);
    let closeTimeout;

    modalContent.addEventListener('mouseenter', () => { clearTimeout(closeTimeout); });
    modalContent.addEventListener('mouseleave', () => { closeTimeout = setTimeout(() => myModal.hide(), 200); });

    pinsInput.forEach(ponto => {
        const marker = new tt.Marker().setLngLat({ lat: ponto.lat, lng: ponto.lng }).addTo(mapInput);
        const popup = new tt.Popup({ offset: popupInput }).setHTML(ponto.endereco);
        marker.setPopup(popup);
        (async () => {
            const resultado = await captureImages(ponto.ip);
            console.log(resultado ? `Imagem "${ponto.endereco}" encontrada com sucesso.` : `Imagem "${ponto.endereco}" não encontrada.`);
        })();
        openMarkerModal(marker, ponto, myModal);
    });
}

function openMarkerModal(markerInput, pontoInput, myModalInput){
        let openTimeout;
        const markerElement = markerInput.getElement();
        markerElement.addEventListener("mouseenter", () => {  
            document.getElementById('modalEndereco').textContent = pontoInput.endereco;
            (async () => {
                const resultado = await captureImages(pontoInput.ip);
            })();
            clearTimeout(openTimeout);
            openTimeout = setTimeout(() => myModalInput.show(), 200);
        });
}