let favoritos = JSON.parse(localStorage.getItem('minhasMusicas')) || [];

function buscar() {
    const termo = document.getElementById('campoBusca').value;
    const conteinerResultados = document.getElementById('resultados');

    if (!termo) {
        alert('Digite algo para pesquisar!');
        return;
    }

    conteinerResultados.innerHTML = '<p>Buscando músicas no Deezer...</p>';

    // Remove qualquer script antigo de busca da tela
    const scriptAntigo = document.getElementById('deezer-jsonp');
    if (scriptAntigo) {
        scriptAntigo.remove();
    }

    // Cria uma chamada JSONP que o Deezer aceita nativamente sem bloqueio
    const script = document.createElement('script');
    script.id = 'deezer-jsonp';
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(termo)}&output=jsonp&callback=processarRespostaDeezer`;
    document.body.appendChild(script);
}

// Função global que recebe os dados diretamente do Deezer
window.processarRespostaDeezer = function(dados) {
    const conteinerResultados = document.getElementById('resultados');
    conteinerResultados.innerHTML = '';

    if (!dados.data || dados.data.length === 0) {
        conteinerResultados.innerHTML = '<p>Nenhuma música encontrada no Deezer.</p>';
        return;
    }

    dados.data.forEach(musica => {
        const card = document.createElement('div');
        card.className = 'card-musica';

        const titulo = musica.title.replace(/"/g, '&quot;');
        const artista = musica.artist.name.replace(/"/g, '&quot;');

        card.innerHTML = `
            <img src="${musica.album.cover_medium}" alt="${titulo}">
            <h3>${musica.title}</h3>
            <p><strong>Artista:</strong> ${musica.artist.name}</p>
            <audio controls src="${musica.preview}"></audio>
            <button class="btn-favoritar" onclick='salvarFavorito(${musica.id}, "${titulo}", "${artista}", "${musica.album.cover_medium}", "${musica.preview}")'>
                ❤️ Favoritar
            </button>
        `;

        conteinerResultados.appendChild(card);
    });
};

function salvarFavorito(id, titulo, artista, capa, preview) {
    const jaExiste = favoritos.some(item => item.id === id);

    if (jaExiste) {
        alert('Esta música já está nos seus favoritos!');
        return;
    }

    const novaMusica = { id, titulo, artista, capa, preview };
    favoritos.push(novaMusica);
    localStorage.setItem('minhasMusicas', JSON.stringify(favoritos));
    alert('Música adicionada aos favoritos!');
}

function removerFavorito(id) {
    favoritos = favoritos.filter(musica => musica.id !== id);
    localStorage.setItem('minhasMusicas', JSON.stringify(favoritos));
    mostrarFavoritos();
}

function mostrarFavoritos() {
    document.getElementById('secaoBusca').style.display = 'none';
    document.getElementById('secaoFavoritos').style.display = 'block';

    const conteinerFavoritos = document.getElementById('listaFavoritos');
    conteinerFavoritos.innerHTML = '';

    if (favoritos.length === 0) {
        conteinerFavoritos.innerHTML = '<p>Você ainda não tem músicas favoritadas.</p>';
        return;
    }

    favoritos.forEach(musica => {
        const card = document.createElement('div');
        card.className = 'card-musica';

        card.innerHTML = `
            <img src="${musica.capa}" alt="${musica.titulo}">
            <h3>${musica.titulo}</h3>
            <p><strong>Artista:</strong> ${musica.artista}</p>
            <audio controls src="${musica.preview}"></audio>
            <button class="btn-remover" onclick="removerFavorito(${musica.id})">
                🗑️ Remover
            </button>
        `;

        conteinerFavoritos.appendChild(card);
    });
}

function mostrarBusca() {
    document.getElementById('secaoBusca').style.display = 'block';
    document.getElementById('secaoFavoritos').style.display = 'none';
}