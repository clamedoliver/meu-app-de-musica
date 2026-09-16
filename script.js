let avaliacoes = JSON.parse(localStorage.getItem('avaliacoesMusicais')) || [];
let perfilUsuario = JSON.parse(localStorage.getItem('perfilUsuario')) || {
    nome: "Seu Nome",
    bio: "Seu diário pessoal de música.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
};
let comentariosMusicas = JSON.parse(localStorage.getItem('comentariosMusicas')) || {};

let musicaAtualParaAvaliar = null;
let notaSelecionada = 0;
let musicaDetalheAtual = null;
let albumIdAtual = null;
let secaoAnterior = 'home';
let timeoutBusca = null;

function fazerRequisicaoDeezer(endpoint) {
    return new Promise((resolve) => {
        const callbackName = 'deezer_cb_' + Math.random().toString(36).substring(2, 15);
        const script = document.createElement('script');

        window[callbackName] = function(data) {
            delete window[callbackName];
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            resolve(data);
        };

        const separador = endpoint.includes('?') ? '&' : '?';
        script.src = `https://api.deezer.com/${endpoint}${separador}output=jsonp&callback=${callbackName}`;
        
        script.onerror = function() {
            delete window[callbackName];
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            console.error(`Erro ao carregar endpoint: ${endpoint}`);
            resolve(null);
        };

        document.body.appendChild(script);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfilHeader();
    carregarHome();
    configurarControleExclusivoAudio();
    configurarMonitoramentoCampoBusca();

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.comentario-menu-wrapper')) {
            document.querySelectorAll('.comentario-dropdown').forEach(d => d.style.display = 'none');
        }
    });
});

function configurarControleExclusivoAudio() {
    document.addEventListener('play', function(e) {
        if (e.target.tagName === 'AUDIO') {
            const todosAudios = document.querySelectorAll('audio');
            todosAudios.forEach(audio => {
                if (audio !== e.target) {
                    audio.pause();
                }
            });
        }
    }, true);
}

function configurarMonitoramentoCampoBusca() {
    const campo = document.getElementById('campoBusca');
    if (!campo) return;

    campo.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            restaurarHome();
        } else {
            lidarComInputBusca(e);
        }
    });

    campo.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            buscar();
        }
    });
}

function salvarDados() {
    localStorage.setItem('avaliacoesMusicais', JSON.stringify(avaliacoes));
    localStorage.setItem('perfilUsuario', JSON.stringify(perfilUsuario));
    localStorage.setItem('comentariosMusicas', JSON.stringify(comentariosMusicas));
}

function carregarPerfilHeader() {
    const nameEl = document.getElementById('headerName');
    const avatarEl = document.getElementById('headerAvatar');
    if (nameEl) nameEl.innerText = perfilUsuario.nome;
    if (avatarEl) avatarEl.src = perfilUsuario.avatar;
}

function navegarPara(secao) {
    document.querySelectorAll('.secao-view').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.menu-navegacao button').forEach(el => el.classList.remove('active'));

    if (secao === 'home') {
        const secaoBusca = document.getElementById('secaoBusca');
        if (secaoBusca) secaoBusca.style.display = 'block';
        document.getElementById('navBtnHome')?.classList.add('active');
        restaurarHome();
    } else if (secao === 'favoritos') {
        const secaoFavs = document.getElementById('secaoFavoritos');
        if (secaoFavs) secaoFavs.style.display = 'block';
        document.getElementById('navBtnFavs')?.classList.add('active');
        renderizarFavoritos();
    } else if (secao === 'perfil') {
        const secaoPerf = document.getElementById('secaoPerfil');
        if (secaoPerf) secaoPerf.style.display = 'block';
        document.getElementById('navBtnPerfil')?.classList.add('active');
        renderizarPerfil();
    }
}

function carregarHome() {
    carregarCarrossel('chart/0/tracks', 'topBrasil');
    carregarCarrossel('search?q=top%20world', 'topMundial');
    carregarCarrossel('search?q=pop', 'populares');
    carregarCarrossel('search?q=release', 'lancamentos');
}

async function carregarCarrossel(endpoint, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<p style="color: var(--texto-secundario); font-size: 0.85rem;">Carregando...</p>';

    const data = await fazerRequisicaoDeezer(endpoint);
    container.innerHTML = '';

    if (!data || !data.data || data.data.length === 0) {
        container.innerHTML = '<p style="color: var(--texto-secundario); font-size: 0.85rem;">Não foi possível carregar as músicas.</p>';
        return;
    }

    data.data.forEach(item => {
        if (item.title) {
            container.appendChild(criarCardMusica(item));
        }
    });
}

function rolarCarrossel(id, offset) {
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
}

function restaurarHome() {
    const campo = document.getElementById('campoBusca');
    if (campo) campo.value = '';

    const secoesHome = document.getElementById('secoesHome');
    const abasContainer = document.getElementById('abasContainer');
    const sugestoesContainer = document.getElementById('sugestoesContainer');
    const grid = document.getElementById('resultadosBusca');
    const secaoArtista = document.getElementById('secaoArtistaDetalhe');
    const secaoDetalhe = document.getElementById('secaoMusicaDetalhe');
    const secaoAlbum = document.getElementById('secaoAlbumDetalhe');

    if (secoesHome) secoesHome.style.display = 'block';
    if (abasContainer) abasContainer.style.display = 'none';
    if (sugestoesContainer) sugestoesContainer.style.display = 'none';
    if (grid) grid.style.display = 'none';

    if (secaoArtista) secaoArtista.style.display = 'none';
    if (secaoDetalhe) secaoDetalhe.style.display = 'none';
    if (secaoAlbum) secaoAlbum.style.display = 'none';

    const secaoBusca = document.getElementById('secaoBusca');
    if (secaoBusca) secaoBusca.style.display = 'block';
}

function lidarComInputBusca(e) {
    const query = e.target.value.trim();
    const container = document.getElementById('sugestoesContainer');

    if (query.length === 0) {
        restaurarHome();
        return;
    }

    if (!container) return;
    clearTimeout(timeoutBusca);

    timeoutBusca = setTimeout(async () => {
        const data = await fazerRequisicaoDeezer(`search?q=${encodeURIComponent(query)}&limit=5`);
        const resultados = data?.data || [];

        if (resultados.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = '';
        resultados.forEach(item => {
            const div = document.createElement('div');
            div.className = 'sugestao-item';
            div.onclick = () => {
                container.style.display = 'none';
                abrirDetalhesMusica(item.id);
            };

            const capaUrl = (item.album?.cover_small || item.cover_small || '').replace('http://', 'https://');
            div.innerHTML = `
                <img src="${capaUrl}" alt="Capa">
                <div class="sugestao-info">
                    <span class="sugestao-title">${item.title}</span>
                    <span class="sugestao-artist">${item.artist?.name || 'Artista'}</span>
                </div>
            `;
            container.appendChild(div);
        });
        container.style.display = 'block';
    }, 300);
}

async function buscar() {
    const campo = document.getElementById('campoBusca');
    if (!campo) return;
    const query = campo.value.trim();
    
    if (!query) {
        restaurarHome();
        return;
    }

    const secoesHome = document.getElementById('secoesHome');
    const abasContainer = document.getElementById('abasContainer');
    const sugestoesContainer = document.getElementById('sugestoesContainer');

    if (secoesHome) secoesHome.style.display = 'none';
    if (abasContainer) abasContainer.style.display = 'flex';
    if (sugestoesContainer) sugestoesContainer.style.display = 'none';

    const grid = document.getElementById('resultadosBusca');
    if (!grid) return;

    grid.innerHTML = '<p style="color: var(--texto-secundario); grid-column: 1/-1;">Buscando músicas e artistas...</p>';
    grid.style.display = 'grid';

    const dataTracks = await fazerRequisicaoDeezer(`search?q=${encodeURIComponent(query)}`);
    const dataArtists = await fazerRequisicaoDeezer(`search/artist?q=${encodeURIComponent(query)}`);

    grid.innerHTML = '';

    const artistas = dataArtists?.data || [];
    const resultados = dataTracks?.data || [];

    if (artistas.length > 0) {
        const art = artistas[0];
        const cardArt = document.createElement('div');
        cardArt.className = 'card-musica';
        cardArt.style.gridColumn = '1 / -1';
        cardArt.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.25), rgba(30, 30, 40, 0.8))';
        cardArt.style.border = '1px solid var(--cor-principal, #8a2be2)';
        cardArt.style.cursor = 'pointer';
        cardArt.style.padding = '1.2rem';
        cardArt.style.borderRadius = '12px';
        
        // CORREÇÃO: Passa tanto o ID quanto o Nome para evitar erros de id indefinido
        cardArt.onclick = () => abrirDetalhesArtistaPorId(art.id, art.name);

        cardArt.innerHTML = `
            <div style="display:flex; align-items:center; gap:1.2rem;">
                <img src="${art.picture_medium || art.picture}" style="width:90px; height:90px; border-radius:50%; object-fit:cover; box-shadow: 0 4px 10px rgba(0,0,0,0.4);" alt="${art.name}">
                <div>
                    <span style="background: var(--cor-principal, #8a2be2); color: #fff; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; text-transform: uppercase; font-weight: bold;">Artista Principal</span>
                    <h2 style="margin: 0.4rem 0 0.2rem 0; font-size: 1.5rem; color: #fff;">${art.name}</h2>
                    <p style="color: var(--texto-secundario, #a6a3b5); font-size: 0.85rem; margin: 0;">${art.nb_fan ? art.nb_fan.toLocaleString('pt-BR') + ' fãs no Deezer' : 'Clique para ver o perfil completo e álbuns'}</p>
                    <span style="color: var(--cor-principal, #8a2be2); font-size: 0.85rem; display: inline-block; margin-top: 0.4rem; font-weight: 500;">Ver todos os álbuns e músicas →</span>
                </div>
            </div>
        `;
        grid.appendChild(cardArt);
    }

    if (resultados.length === 0 && artistas.length === 0) {
        grid.innerHTML = '<p style="color: var(--texto-secundario); grid-column: 1/-1;">Nenhum resultado encontrado para a busca.</p>';
        return;
    }

    resultados.forEach(item => grid.appendChild(criarCardMusica(item)));
}

function criarCardMusica(item) {
    const div = document.createElement('div');
    div.className = 'card-musica';
    const aval = avaliacoes.find(a => a.id === item.id);
    const estrelas = aval ? '★'.repeat(aval.nota) + '☆'.repeat(5 - aval.nota) : '';

    const capaUrl = (item.album?.cover_medium || item.cover_medium || '').replace('http://', 'https://');

    div.innerHTML = `
        <div class="capa-container" onclick="abrirDetalhesMusica(${item.id})">
            <img src="${capaUrl}" alt="Capa">
            ${item.explicit_lyrics ? '<span class="badge-explicit">EXPLICIT</span>' : ''}
        </div>
        <h3 onclick="abrirDetalhesMusica(${item.id})">${item.title}</h3>
        <p class="artista-nome" onclick="abrirDetalhesArtistaPorId(${item.artist?.id}, '${(item.artist?.name || '').replace(/'/g, "\\'")}')" style="cursor:pointer; text-decoration:underline;">${item.artist?.name || 'Artista'}</p>
        <audio controls src="${item.preview || ''}"></audio>
        ${aval ? `<div class="estrelas-exibicao" style="color: var(--cor-dourado, #ffd700); margin-top: 5px;">${estrelas}</div>` : ''}
        <button style="margin-top: 8px;" onclick="abrirModalAvaliar(${JSON.stringify(item).replace(/"/g, '&quot;')})">
            ${aval ? 'Editar Avaliação' : 'Avaliar / Fazer Review'}
        </button>
    `;
    return div;
}

/* PÁGINA DO ARTISTA (SUPORTA BUSCA DIRETA POR ID OU NOME) */
async function abrirDetalhesArtistaPorId(artistId, artistName) {
    salvarSecaoAnterior();
    document.querySelectorAll('.secao-view').forEach(el => el.style.display = 'none');
    
    let secaoArtista = document.getElementById('secaoArtistaDetalhe');
    if (!secaoArtista) {
        secaoArtista = document.createElement('section');
        secaoArtista.id = 'secaoArtistaDetalhe';
        secaoArtista.className = 'secao-view';
        const main = document.querySelector('main') || document.body;
        main.appendChild(secaoArtista);
    }

    secaoArtista.style.display = 'block';
    secaoArtista.innerHTML = '<p style="color: white; padding: 2rem;">Carregando perfil do artista...</p>';

    let artista = null;

    // Tenta primeiro carregar direto pelo ID
    if (artistId) {
        artista = await fazerRequisicaoDeezer(`artist/${artistId}`);
    }

    // Caso o ID seja inválido ou falhe, faz o fallback de busca por nome
    if ((!artista || artista.error) && artistName) {
        const resName = await fazerRequisicaoDeezer(`search/artist?q=${encodeURIComponent(artistName)}`);
        if (resName && resName.data && resName.data.length > 0) {
            artista = resName.data[0];
            artistId = artista.id;
        }
    }

    if (!artista || artista.error) {
        secaoArtista.innerHTML = `
            <button class="btn-voltar" onclick="voltarParaOrigem()" style="margin-bottom: 1rem; cursor: pointer; padding: 8px 16px; border-radius: 8px; border: none; background: rgba(255,255,255,0.1); color: #fff;">← Voltar</button>
            <p style="color: white; padding: 1rem;">Não foi possível carregar o perfil deste artista.</p>
        `;
        return;
    }

    secaoArtista.innerHTML = `
        <button class="btn-voltar" onclick="voltarParaOrigem()" style="margin-bottom: 1rem; cursor: pointer; padding: 8px 16px; border-radius: 8px; border: none; background: rgba(255,255,255,0.1); color: #fff;">← Voltar</button>
        
        <div id="artistaHeaderContainer" style="display: flex; align-items: center; gap: 1.5rem; background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
            <img src="${artista.picture_big || artista.picture_medium || artista.picture}" style="border-radius: 50%; width: 140px; height: 140px; object-fit: cover;" alt="${artista.name}">
            <div>
                <span style="background: var(--cor-principal, #8a2be2); color: #fff; font-size: 0.75rem; padding: 3px 10px; border-radius: 12px; text-transform: uppercase; font-weight: bold;">Artista</span>
                <h1 style="font-size: 2.2rem; margin: 0.5rem 0; color: #fff;">${artista.name}</h1>
                <p style="color: var(--texto-secundario, #a6a3b5); margin: 0;">${artista.nb_fan ? artista.nb_fan.toLocaleString('pt-BR') + ' fãs no Deezer' : ''}</p>
            </div>
        </div>

        <div class="detalhes-conteudo">
            <h2 style="color: #fff; margin-bottom: 1rem;">Músicas Mais Populares</h2>
            <div id="artistaTopTracksList" style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 2.5rem;">
                <p style="color: #aaa;">Carregando faixas...</p>
            </div>

            <h2 style="color: #fff; margin-bottom: 1rem;">Álbuns</h2>
            <div id="artistaAlbumsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem;">
                <p style="color: #aaa; grid-column: 1/-1;">Carregando álbuns...</p>
            </div>
        </div>
    `;

    const topTracks = await fazerRequisicaoDeezer(`artist/${artista.id}/top?limit=10`);
    const listTracks = document.getElementById('artistaTopTracksList');
    if (listTracks) {
        listTracks.innerHTML = '';
        const faixas = topTracks?.data || [];
        if (faixas.length === 0) {
            listTracks.innerHTML = '<p style="color: #aaa;">Nenhuma faixa encontrada.</p>';
        } else {
            faixas.forEach((t, index) => {
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 10px 15px; border-radius: 8px; gap: 10px;';
                row.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer;" onclick="abrirDetalhesMusica(${t.id})">
                        <span style="color: #888; font-weight: bold;">${index + 1}</span>
                        <div>
                            <h4 style="color: #fff; margin: 0; font-size: 0.95rem;">${t.title}</h4>
                            <p style="color: #aaa; margin: 0; font-size: 0.8rem;">${t.album?.title || ''}</p>
                        </div>
                    </div>
                    <audio controls src="${t.preview || ''}" style="height: 30px; max-width: 200px;"></audio>
                `;
                listTracks.appendChild(row);
            });
        }
    }

    const albums = await fazerRequisicaoDeezer(`search/album?q=${encodeURIComponent(artista.name)}`);
    const gridAlbums = document.getElementById('artistaAlbumsGrid');
    
    if (gridAlbums) {
        gridAlbums.innerHTML = '';
        const listaAlbuns = (albums?.data || []).filter(alb => !alb.artist || alb.artist.id == artista.id || alb.artist.name.toLowerCase() === artista.name.toLowerCase());
        
        if (listaAlbuns.length === 0) {
            gridAlbums.innerHTML = '<p style="color: #aaa; grid-column: 1/-1;">Nenhum álbum encontrado para este artista.</p>';
        } else {
            listaAlbuns.forEach(alb => {
                const card = document.createElement('div');
                card.className = 'card-musica';
                card.onclick = () => abrirDetalhesAlbumPorId(alb.id);
                card.style.cssText = 'cursor: pointer; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: left;';
                card.innerHTML = `
                    <img src="${alb.cover_medium || alb.cover}" style="width: 100%; border-radius: 8px; aspect-ratio: 1; object-fit: cover;" alt="Capa">
                    <h4 style="color: #fff; margin: 8px 0 2px 0; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${alb.title}</h4>
                    <p style="color: #aaa; margin: 0; font-size: 0.75rem;">${alb.record_type ? alb.record_type.toUpperCase() : 'ÁLBUM'}</p>
                `;
                gridAlbums.appendChild(card);
            });
        }
    }
}

function salvarSecaoAnterior() {
    const secoes = ['secaoBusca', 'secaoFavoritos', 'secaoPerfil', 'secaoArtistaDetalhe', 'secaoAlbumDetalhe'];
    for (let id of secoes) {
        const el = document.getElementById(id);
        if (el && el.style.display !== 'none') {
            secaoAnterior = id;
            break;
        }
    }
}

function voltarParaOrigem() {
    document.querySelectorAll('.secao-view').forEach(el => el.style.display = 'none');
    
    const elAnterior = document.getElementById(secaoAnterior);
    if (elAnterior && secaoAnterior !== 'secaoMusicaDetalhe') {
        elAnterior.style.display = 'block';
    } else {
        restaurarHome();
    }
}

async function abrirDetalhesMusica(id) {
    salvarSecaoAnterior();
    document.querySelectorAll('.secao-view').forEach(el => el.style.display = 'none');
    
    const secaoDetalhe = document.getElementById('secaoMusicaDetalhe');
    if (secaoDetalhe) secaoDetalhe.style.display = 'block';

    const track = await fazerRequisicaoDeezer(`track/${id}`);
    if (!track) {
        alert("Não foi possível carregar os detalhes desta música.");
        return;
    }

    musicaDetalheAtual = track;
    albumIdAtual = track.album?.id || null;

    const capaUrl = (track.album?.cover_big || track.album?.cover_medium || '').replace('http://', 'https://');
    
    const imgCapa = document.getElementById('detalheCapa');
    const txtTitulo = document.getElementById('detalheTitulo');
    const txtArtista = document.getElementById('detalheArtista');
    const txtAlbum = document.getElementById('detalheAlbumNomeTexto');
    const playerAudio = document.getElementById('detalheAudioPlayer');

    if (imgCapa) imgCapa.src = capaUrl;
    if (txtTitulo) txtTitulo.innerText = track.title;
    if (txtArtista) {
        txtArtista.innerText = track.artist?.name || 'Artista Desconhecido';
        txtArtista.style.cursor = 'pointer';
        txtArtista.onclick = () => abrirDetalhesArtistaPorId(track.artist?.id, track.artist?.name);
    }
    if (txtAlbum) txtAlbum.innerText = track.album?.title || 'Single/Desconhecido';
    if (playerAudio) playerAudio.src = track.preview || '';

    const autores = track.contributors ? track.contributors.map(c => c.name).join(', ') : track.artist?.name;
    const txtAutores = document.getElementById('detalheAutores');
    if (txtAutores) txtAutores.innerText = autores || 'Informações de autoria indisponíveis.';

    buscarLetraGratuita(track.title, track.artist?.name);
    carregarComentariosMusica(id);
}

async function buscarLetraGratuita(titulo, artista) {
    const container = document.getElementById('detalheLetraContainer');
    if (!container) return;
    
    container.innerHTML = "Buscando letra...";

    try {
        const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artista)}&track_name=${encodeURIComponent(titulo)}`);
        if (!res.ok) throw new Error("Letra não encontrada");
        
        const data = await res.json();
        const letra = data.plainLyrics || data.syncedLyrics;

        if (letra) {
            const letraFormatada = letra.replace(/\[\d+:\d+\.\d+\]/g, '');
            container.innerText = letraFormatada;
        } else {
            container.innerHTML = "<em>Letra indisponível ou faixa instrumental.</em>";
        }
    } catch (err) {
        container.innerHTML = "<em>Letra não encontrada para esta faixa no catálogo gratuito.</em>";
    }
}

function redirecionarParaAlbumAtual() {
    if (albumIdAtual) {
        abrirDetalhesAlbumPorId(albumIdAtual);
    } else {
        alert("Álbum não encontrado para esta música.");
    }
}

async function abrirDetalhesAlbumPorId(albumId) {
    if (!albumId) return;
    salvarSecaoAnterior();
    document.querySelectorAll('.secao-view').forEach(el => el.style.display = 'none');
    
    const secaoAlbum = document.getElementById('secaoAlbumDetalhe');
    if (secaoAlbum) secaoAlbum.style.display = 'block';

    const album = await fazerRequisicaoDeezer(`album/${albumId}`);
    if (!album) {
        alert("Não foi possível carregar as faixas do álbum.");
        return;
    }

    const capaUrl = (album.cover_big || album.cover_medium || '').replace('http://', 'https://');
    const header = document.getElementById('albumHeaderContainer');
    if (header) {
        header.innerHTML = `
            <img src="${capaUrl}" class="album-cover-lg" alt="Capa Álbum">
            <div class="album-info-details">
                <span class="badge-tag">Álbum</span>
                <h2>${album.title}</h2>
                <p>Por <span style="cursor:pointer; text-decoration:underline;" onclick="abrirDetalhesArtistaPorId(${album.artist?.id}, '${(album.artist?.name || '').replace(/'/g, "\\'")}')">${album.artist?.name || 'Artista'}</span> • ${album.nb_tracks || 0} faixas</p>
            </div>
        `;
    }

    const list = document.getElementById('albumTracksList');
    if (!list) return;
    
    list.innerHTML = '';

    (album.tracks?.data || []).forEach((t, index) => {
        const row = document.createElement('div');
        row.className = 'track-item-row';
        row.innerHTML = `
            <span class="track-number">${index + 1}</span>
            <div class="track-title-info" onclick="abrirDetalhesMusica(${t.id})">
                <h4>${t.title}</h4>
                <p>${album.artist?.name || 'Artista'}</p>
            </div>
            <audio controls src="${t.preview || ''}"></audio>
            <button class="btn-secondary" onclick="abrirDetalhesMusica(${t.id})">Ver Letra</button>
        `;
        list.appendChild(row);
    });
}

function carregarComentariosMusica(id) {
    const lista = document.getElementById('comentariosLista');
    if (!lista) return;

    lista.innerHTML = '';
    
    const aval = avaliacoes.find(a => a.id === id);
    const listaOutrosComentarios = comentariosMusicas[id] || [];

    if (!aval && listaOutrosComentarios.length === 0) {
        lista.innerHTML = '<p style="color: var(--texto-secundario); font-size: 0.85rem;">Nenhum comentário feito ainda.</p>';
        return;
    }

    if (aval && aval.resenha) {
        const boxReview = document.createElement('div');
        boxReview.style.cssText = 'position: relative; background: rgba(138, 43, 226, 0.15); border-left: 4px solid var(--cor-principal, #8a2be2); padding: 12px; border-radius: 8px; margin-bottom: 12px;';
        boxReview.innerHTML = `
            <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 4px;">
                <strong style="color: #fff; font-size: 0.9rem;">Sua Review</strong>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--cor-dourado, #ffd700); font-size: 0.85rem;">${'★'.repeat(aval.nota)}</span>
                    <div class="comentario-menu-wrapper" style="position: relative;">
                        <button onclick="alternarMenuComentario(event, 'review_${id}')" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 1.1rem; padding: 0 4px; height: auto;">⋮</button>
                        <div id="dropdown_review_${id}" class="comentario-dropdown" style="display: none; position: absolute; right: 0; top: 20px; background: #222; border: 1px solid #444; border-radius: 6px; z-index: 10; min-width: 130px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                            <button onclick="apagarReview(${id})" style="background: none; border: none; color: #ff5555; width: 100%; text-align: left; padding: 8px 12px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🗑️ Apagar review</button>
                        </div>
                    </div>
                </div>
            </div>
            <p style="color: #e0e0e0; margin: 0; font-style: italic; font-size: 0.9rem;">"${aval.resenha}"</p>
            <small style="color: #aaa; font-size: 0.75rem; display: block; margin-top: 6px;">${aval.data}</small>
        `;
        lista.appendChild(boxReview);
    }

    listaOutrosComentarios.forEach((c, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'position: relative; background: rgba(255, 255, 255, 0.05); padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <p style="margin: 0; color: #ddd; font-size: 0.88rem; flex: 1;">${c.texto}</p>
                <div class="comentario-menu-wrapper" style="position: relative;">
                    <button onclick="alternarMenuComentario(event, 'comentario_${id}_${index}')" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 1.1rem; padding: 0 4px; height: auto;">⋮</button>
                    <div id="dropdown_comentario_${id}_${index}" class="comentario-dropdown" style="display: none; position: absolute; right: 0; top: 20px; background: #222; border: 1px solid #444; border-radius: 6px; z-index: 10; min-width: 140px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                        <button onclick="apagarComentarioMusica(${id}, ${index})" style="background: none; border: none; color: #ff5555; width: 100%; text-align: left; padding: 8px 12px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🗑️ Apagar comentário</button>
                    </div>
                </div>
            </div>
            <small style="color: #888; font-size: 0.7rem; display: block; margin-top: 4px;">${c.data}</small>
        `;
        lista.appendChild(item);
    });
}

function alternarMenuComentario(event, menuId) {
    event.stopPropagation();
    document.querySelectorAll('.comentario-dropdown').forEach(d => {
        if (d.id !== `dropdown_${menuId}`) d.style.display = 'none';
    });
    const dropdown = document.getElementById(`dropdown_${menuId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function apagarComentarioMusica(musicaId, index) {
    if (comentariosMusicas[musicaId]) {
        comentariosMusicas[musicaId].splice(index, 1);
        salvarDados();
        carregarComentariosMusica(musicaId);
    }
}

function apagarReview(musicaId) {
    const idx = avaliacoes.findIndex(a => a.id === musicaId);
    if (idx !== -1) {
        avaliacoes[idx].resenha = '';
        salvarDados();
        carregarComentariosMusica(musicaId);
        if (document.getElementById('secaoPerfil')?.style.display === 'block') {
            renderizarPerfil();
        }
    }
}

function adicionarComentarioMusica() {
    if (!musicaDetalheAtual) return;
    const txtInput = document.getElementById('novoComentarioTexto');
    if (!txtInput) return;
    
    const texto = txtInput.value.trim();
    if (!texto) return;

    const id = musicaDetalheAtual.id;
    if (!comentariosMusicas[id]) comentariosMusicas[id] = [];

    comentariosMusicas[id].push({
        texto,
        data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
    });

    salvarDados();
    txtInput.value = '';
    carregarComentariosMusica(id);
}

function fecharModal() {
    const modalResenha = document.getElementById('modalResenha');
    if (modalResenha) modalResenha.style.display = 'none';
}

function abrirModalAvaliar(musica) {
    musicaAtualParaAvaliar = musica;
    const modalTitulo = document.getElementById('modalTituloMusica');
    const modalResenha = document.getElementById('modalResenha');
    const campoTexto = document.getElementById('textoResenha') || document.getElementById('resenhaTexto') || document.querySelector('#modalResenha textarea');

    if (modalTitulo) modalTitulo.innerText = `Avaliar: ${musica.title}`;
    
    const avalExistente = avaliacoes.find(a => a.id === musica.id);
    if (avalExistente) {
        selecionarEstrelas(avalExistente.nota);
        if (campoTexto) campoTexto.value = avalExistente.resenha || '';
    } else {
        selecionarEstrelas(0);
        if (campoTexto) campoTexto.value = '';
    }

    if (modalResenha) modalResenha.style.display = 'flex';
}

function selecionarEstrelas(nota) {
    notaSelecionada = nota;
    const spans = document.querySelectorAll('.estrelas-input span');
    spans.forEach((span, idx) => {
        span.style.color = idx < nota ? 'var(--cor-dourado, #ffd700)' : 'rgba(166, 163, 181, 0.3)';
    });
}

function confirmarAvaliacao() {
    if (!musicaAtualParaAvaliar || notaSelecionada === 0) {
        alert("Por favor, selecione ao menos 1 estrela para avaliar!");
        return;
    }

    const campoTexto = document.getElementById('textoResenha') || document.getElementById('resenhaTexto') || document.querySelector('#modalResenha textarea');
    const texto = campoTexto ? campoTexto.value.trim() : '';

    const index = avaliacoes.findIndex(a => a.id === musicaAtualParaAvaliar.id);
    const capaUrl = (musicaAtualParaAvaliar.album?.cover_medium || musicaAtualParaAvaliar.cover_medium || '').replace('http://', 'https://');

    const novaAvaliacao = {
        id: musicaAtualParaAvaliar.id,
        titulo: musicaAtualParaAvaliar.title,
        artista: musicaAtualParaAvaliar.artist?.name || 'Artista',
        capa: capaUrl,
        nota: notaSelecionada,
        resenha: texto,
        data: new Date().toLocaleDateString('pt-BR')
    };

    if (index > -1) {
        avaliacoes[index] = novaAvaliacao;
    } else {
        avaliacoes.push(novaAvaliacao);
    }

    salvarDados();
    fecharModal();
    carregarHome();
    
    if (document.getElementById('secaoPerfil')?.style.display === 'block') {
        renderizarPerfil();
    }
}

/* PERFIL */
function renderizarPerfil() {
    const nameEl = document.getElementById('profileDisplayName');
    const bioEl = document.getElementById('profileBioText');
    const avatarEl = document.getElementById('profileAvatarImg');

    if (nameEl) nameEl.innerText = perfilUsuario.nome;
    if (bioEl) bioEl.innerText = perfilUsuario.bio;
    if (avatarEl) avatarEl.src = perfilUsuario.avatar;

    const songsCountEl = document.getElementById('statCountSongs');
    const avgRatingEl = document.getElementById('statAvgRating');
    const favCountEl = document.getElementById('statFavCount');

    if (songsCountEl) songsCountEl.innerText = avaliacoes.length;
    
    const media = avaliacoes.length ? (avaliacoes.reduce((acc, c) => acc + c.nota, 0) / avaliacoes.length).toFixed(1) : '0.0';
    if (avgRatingEl) avgRatingEl.innerText = media;

    const favs = avaliacoes.filter(a => a.nota >= 4);
    if (favCountEl) favCountEl.innerText = favs.length;

    trocarSubAbaPerfil('reviews');
}

function trocarSubAbaPerfil(aba) {
    document.querySelectorAll('.profile-subtabs button').forEach(b => b.classList.remove('ativa'));
    const body = document.getElementById('profileTabContent');
    if (!body) return;
    
    body.innerHTML = '';

    if (aba === 'reviews') {
        const btnTabReviews = document.getElementById('pTabReviews');
        if (btnTabReviews) btnTabReviews.classList.add('ativa');
        
        if (avaliacoes.length === 0) {
            body.innerHTML = '<p style="color: var(--texto-secundario); grid-column: 1/-1;">Você ainda não fez nenhuma avaliação.</p>';
            return;
        }

        avaliacoes.forEach(a => {
            const card = document.createElement('div');
            card.className = 'card-musica';
            card.style.cssText = 'width: 100%; text-align: left; margin-bottom: 1rem; padding: 1.2rem; background: rgba(255,255,255,0.05); border-radius: 12px;';

            const estrelasHTML = '★'.repeat(a.nota) + '☆'.repeat(5 - a.nota);

            card.innerHTML = `
                <div style="display:flex; gap:1rem; align-items:flex-start;">
                    <img src="${a.capa}" style="width:80px; height:80px; border-radius:8px; object-fit:cover; cursor:pointer;" onclick="abrirDetalhesMusica(${a.id})">
                    <div style="flex:1;">
                        <h3 style="cursor:pointer; margin: 0 0 0.3rem 0; color: #fff;" onclick="abrirDetalhesMusica(${a.id})">${a.titulo}</h3>
                        <p class="artista-nome" style="margin:0; color: #aaa;">${a.artista}</p>
                        <div style="color: var(--cor-dourado, #ffd700); margin: 0.4rem 0; font-size:1.1rem;">${estrelasHTML}</div>
                        <p style="font-size: 0.75rem; color: #888; margin:0;">Avaliado em ${a.data}</p>
                    </div>
                </div>
                ${a.resenha ? `
                <div style="margin-top: 0.8rem; padding: 0.8rem 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px; font-size: 0.9rem; line-height: 1.4; color: #e0e0e0; border-left: 3px solid var(--cor-principal, #8a2be2);">
                    <strong style="color: #fff; font-size: 0.8rem; text-transform: uppercase;">Minha Review:</strong>
                    <p style="margin: 0.3rem 0 0 0; font-style: italic;">"${a.resenha}"</p>
                </div>` : ''}
            `;
            body.appendChild(card);
        });
    }
}

function abrirModalEditProfile() {
    const editName = document.getElementById('editProfileName');
    const editBio = document.getElementById('editProfileBio');
    const editAvatar = document.getElementById('editProfileAvatarPreview');
    const modalEdit = document.getElementById('modalEditProfile');

    if (editName) editName.value = perfilUsuario.nome;
    if (editBio) editBio.value = perfilUsuario.bio;
    if (editAvatar) editAvatar.src = perfilUsuario.avatar;
    if (modalEdit) modalEdit.style.display = 'flex';
}

function fecharModalEditProfile() {
    const modalEdit = document.getElementById('modalEditProfile');
    if (modalEdit) modalEdit.style.display = 'none';
}

function previewImagemUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgPreview = document.getElementById('editProfileAvatarPreview');
            if (imgPreview) imgPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function salvarModalPerfil() {
    const editName = document.getElementById('editProfileName');
    const editBio = document.getElementById('editProfileBio');
    const editAvatar = document.getElementById('editProfileAvatarPreview');

    if (editName) perfilUsuario.nome = editName.value;
    if (editBio) perfilUsuario.bio = editBio.value;
    if (editAvatar) perfilUsuario.avatar = editAvatar.src;

    salvarDados();
    carregarPerfilHeader();
    renderizarPerfil();
    fecharModalEditProfile();
}

function renderizarFavoritos() {
    const grid = document.getElementById('listaFavoritos');
    if (!grid) return;

    grid.innerHTML = '';
    avaliacoes.forEach(a => {
        const card = document.createElement('div');
        card.className = 'card-musica';
        card.innerHTML = `
            <img src="${a.capa}" style="width:100%; border-radius:12px; margin-bottom:0.5rem; cursor:pointer;" onclick="abrirDetalhesMusica(${a.id})" alt="Capa">
            <h3 style="cursor:pointer;" onclick="abrirDetalhesMusica(${a.id})">${a.titulo}</h3>
            <p class="artista-nome">${a.artista}</p>
            <div style="color: var(--cor-dourado, #ffd700); margin-bottom: 0.5rem;">${'★'.repeat(a.nota)}</div>
            <button class="btn-remover" onclick="removerAvaliacao(${a.id})">Remover</button>
        `;
        grid.appendChild(card);
    });
}

function removerAvaliacao(id) {
    avaliacoes = avaliacoes.filter(a => a.id !== id);
    salvarDados();
    renderizarFavoritos();
}
