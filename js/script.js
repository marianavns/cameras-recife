import { pontos } from './dataPins.js'; 

let api_key;
const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

verificaLocation();

function verificaLocation(){
    if (isLocal) {
        import('../config.js').then(module => {
            api_key = module.API_KEY;
            console.log("Rodando local");
            mapContent();
        }).catch(err => console.error("Erro ao importar config.js:", err));
    }
    if (!isLocal){
        fetch('/.netlify/functions/getData')
            .then(res => res.json())
            .then(data => {
                api_key = data.key;
                console.log("Rodando no Netlify");
                mapContent(); 
            })
        .catch(err => console.error("Erro ao obter a chave:", err));
    }
}

function mapContent() {

    const zoomLevel = 14;
    const map = criaMapa(api_key, zoomLevel, pontos);
    const popupOffsets = {
        top: [0, 0],
        bottom: [0, -70],
        'bottom-right': [0, -70],
        'bottom-left': [0, -70],
        left: [25, -35],
        right: [-25, -35]
    };
    
    adicionarMarcadores(pontos, map, popupOffsets);
    setInterval(() => atualizarImagem(pontos[0].ip), 60000);
    atualizarImagem(pontos[0].ip);
}

function criaMapa(api_key, zoomLevel, pontos) {
    const map = tt.map({
        container: 'map',
        key: api_key,
        center: { lat: pontos[0].lat, lng: pontos[0].lng },
        zoom: zoomLevel
    });
    return map;
}

function atualizarImagem(ip) {
    const timestamp = new Date().getTime();
    const novaUrl = `https://transito.serttel.com.br/cttupe/index.php/portal/getImg/${ip}/?t=${timestamp}`;
    const tempImg = new Image();
    tempImg.onload = function() {
        console.log(`Dimensões da imagem: ${tempImg.naturalWidth} x ${tempImg.naturalHeight}`);
        if (tempImg.naturalWidth > 1 && tempImg.naturalHeight > 1) {
            document.getElementById("camera").src = novaUrl;
            document.getElementById("modalImage").src = novaUrl;
            document.getElementById("modalImage").alt = "";
            document.getElementById("modalImage").style.display = "block";
            let aviso = document.getElementById("avisoImagem");
            if (aviso) aviso.style.display = "none";
        } else {
            mostrarAvisoImagem();
        }
    };
    tempImg.onerror = function() {
        console.log("Falha ao carregar a imagem.");
        mostrarAvisoImagem();
    };
    tempImg.src = novaUrl;
}

function mostrarAvisoImagem() {
    document.getElementById("camera").src = "";
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

function adicionarMarcadores(pinsInput, mapInput, popupInput){
    pinsInput.forEach(ponto => {
        const marker = new tt.Marker().setLngLat({ lat: ponto.lat, lng: ponto.lng }).addTo(mapInput);

        const popup = new tt.Popup({ offset: popupInput }).setHTML(ponto.endereco);
        marker.setPopup(popup);

        const markerElement = marker.getElement();
        markerElement.addEventListener("mouseenter", () => {
            atualizarImagem(ponto.ip);
            document.getElementById('modalEndereco').textContent = ponto.endereco;
            const myModal = new bootstrap.Modal(document.getElementById('cameraModal'));
            myModal.show();
        });

        markerElement.addEventListener("mouseleave", () => {
            const modalEl = document.getElementById('cameraModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        });
    });
}