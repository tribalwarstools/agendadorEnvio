// ==UserScript==
// @name         🗓️ Agendador de Envio Tribal Wars (Estilo Escuro)
// @namespace    https://tribalwarstools.github.io/
// @version      1.1
// @description  Agendador de envio com estilo TW escuro e painel fixo/arrastável.
// @match        *://*.tribalwars.*/*
// @grant        none
// ==/UserScript==

(function () {
    if (!window.TribalWars) {
        alert("Este script deve ser executado dentro do Tribal Wars.");
        return;
    }

    let agendamentoAtivo = null;
    let intervaloCountdown = null;

    // CSS escuro TW-style aplicado ao painel
    const style = document.createElement('style');
    style.textContent = `
    #painel_agendador {
        position: fixed;
        top: 50px;
        left: 20px;
        background: #2e2e2e;
        border: 2px solid #b79755;
        border-radius: 6px;
        padding: 10px 15px;
        font-family: "Tahoma", sans-serif;
        font-size: 14px;
        color: #f0e6d2;
        box-shadow: 0 0 8px rgba(0,0,0,0.8);
        z-index: 1000;
        width: 320px;
        user-select: none;
        text-align: left;
        cursor: default;
    }
    #painel_agendador h3 {
        margin: 0 0 8px 0;
        font-weight: bold;
        color: #d4b35d;
        cursor: move;
        user-select: none;
        font-size: 15px;
    }
    #painel_agendador button {
        background: #b79755;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        color: #2e2e2e;
        font-weight: bold;
        width: 100%;
        transition: background 0.3s ease;
    }
    #painel_agendador button:hover:not(:disabled) {
        background: #d4b35d;
    }
    #painel_agendador button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    #painel_agendador input,
    #painel_agendador select {
        width: 100%;
        padding: 5px;
        margin-top: 3px;
        margin-bottom: 8px;
        border: 1px solid #b79755;
        border-radius: 4px;
        background: #3e3e3e;
        color: #f0e6d2;
    }
    #painel_agendador .status {
        margin-top: 6px;
        font-weight: bold;
    }
    #painel_agendador .lista_horarios div {
        background: #3e3e3e;
        border-radius: 4px;
        padding: 3px 6px;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    `;
    document.head.appendChild(style);

    // Criação do painel
    const painel = document.createElement("div");
    painel.id = "painel_agendador";
    painel.innerHTML = `
        <div id="ag_header" style="display:flex; justify-content:space-between; align-items:center; cursor:move;">
            <h3>⚔️ Agendador de Envio</h3>
            <button id="fechar_painel_ag" style="width:auto; background:#c00; color:white;">✖</button>
        </div>
        <label>📅 Data alvo:<br><input id="ag_data" type="text" placeholder="DD/MM/AAAA"></label>
        <label>⏰ Hora alvo:<br><input id="ag_hora" type="text" placeholder="hh:mm:ss"></label>
        <label>⚙️ Ajuste (ms):<br><input id="ajuste_fino" type="number" value="0" step="10"></label>
		
		<div style="display:flex; justify-content:space-between; margin-bottom:8px;">
		  <label style="display:flex; align-items:center; gap:5px;">
			<input type="radio" name="modo_agendamento" value="saida" checked>Saída
		  </label>
		  <label style="display:flex; align-items:center; gap:5px;">
			<input type="radio" name="modo_agendamento" value="chegada">Chegada
		  </label>
		</div>

        <div style="display:flex; gap:8px;">
            <button id="btn_salvar">Salvar</button>
            <button id="btn_limpar" style="background:#a52a2a; color:white;">Limpar</button>
        </div>
        <div id="lista_horarios" class="lista_horarios" style="max-height:150px; overflow:auto; margin-top:10px;"></div>
        <p id="ag_status" class="status"></p>
    `;
    document.body.appendChild(painel);

    // Função: converter "HH:MM:SS" em ms
    function duracaoParaMs(str) {
        const [h, m, s] = str.split(":").map(Number);
        return ((h * 3600) + (m * 60) + s) * 1000;
    }

    // Preenche data/hora do servidor automaticamente
    const dataServidor = document.getElementById("serverDate")?.textContent.trim();
    const horaServidor = document.getElementById("serverTime")?.textContent.trim();
    if (dataServidor && horaServidor) {
        document.getElementById("ag_data").value = dataServidor;
        document.getElementById("ag_hora").value = horaServidor;
    }

    const status = document.getElementById("ag_status");

    // Painel arrastável
    (function tornarArrastavel(painel, handle) {
        let offsetX = 0, offsetY = 0, isDragging = false;

        handle.addEventListener("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - painel.offsetLeft;
            offsetY = e.clientY - painel.offsetTop;
            document.body.style.userSelect = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                painel.style.left = `${e.clientX - offsetX}px`;
                painel.style.top = `${e.clientY - offsetY}px`;
                painel.style.right = "auto";
            }
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });
    })(painel, document.getElementById("ag_header"));

    // Funções principais: salvar, limpar, atualizar, agendar
    document.getElementById("fechar_painel_ag").onclick = () => {
        if (agendamentoAtivo) {
            alert("⛔ Não é possível fechar o painel com agendamento ativo.");
        } else {
            painel.remove();
        }
    };

    document.getElementById("btn_salvar").onclick = () => {
        const data = document.getElementById("ag_data").value.trim();
        const hora = document.getElementById("ag_hora").value.trim();
        const ajuste = parseInt(document.getElementById("ajuste_fino").value, 10) || 0;

        if (!/\d{2}\/\d{2}\/\d{4}/.test(data) || !/\d{2}:\d{2}:\d{2}/.test(hora)) {
            status.textContent = "❌ Formato inválido. Use DD/MM/AAAA e hh:mm:ss";
            status.style.color = "red";
            return;
        }

        const lista = JSON.parse(localStorage.getItem("horarios_salvos") || "[]");
        lista.push({ data, hora, ajuste });
        localStorage.setItem("horarios_salvos", JSON.stringify(lista));
        atualizarLista();
    };

    document.getElementById("btn_limpar").onclick = () => {
        if (confirm("Deseja apagar todos os horários salvos?")) {
            localStorage.removeItem("horarios_salvos");
            atualizarLista();
        }
    };

    function atualizarLista() {
        const container = document.getElementById("lista_horarios");
        const lista = JSON.parse(localStorage.getItem("horarios_salvos") || "[]");
        container.innerHTML = lista.length === 0 ? "<i>Nenhum horário salvo.</i>" : "";

        lista.forEach(({ data, hora, ajuste }, i) => {
            const div = document.createElement("div");
            div.innerHTML = `
                <span class="ag_item" data-index="${i}" style="font-size:12px;">${data} ${hora} [${ajuste}ms]</span>
                <div style="display:flex; gap:3px;">
                    <button style="width:auto;" data-editar="${i}">✏️</button>
                    <button style="width:auto;" data-agendar="${i}">▶️</button>
                    <button style="width:auto;" data-remover="${i}">❌</button>
                </div>
            `;
            container.appendChild(div);
        });

        container.querySelectorAll("[data-editar]").forEach(btn => {
            btn.onclick = () => {
                const { data, hora, ajuste } = lista[parseInt(btn.dataset.editar)];
                document.getElementById("ag_data").value = data;
                document.getElementById("ag_hora").value = hora;
                document.getElementById("ajuste_fino").value = ajuste;
            };
        });

        container.querySelectorAll("[data-remover]").forEach(btn => {
            btn.onclick = () => {
                lista.splice(parseInt(btn.dataset.remover), 1);
                localStorage.setItem("horarios_salvos", JSON.stringify(lista));
                atualizarLista();
            };
        });

        container.querySelectorAll("[data-agendar]").forEach(btn => {
            btn.onclick = () => {
                agendarEnvio(lista[parseInt(btn.dataset.agendar)]);
            };
        });
    }

    function agendarEnvio({ data, hora, ajuste }) {
        const [sd, sm, sy] = document.getElementById("serverDate").textContent.split("/").map(Number);
        const [sh, smi, ss] = document.getElementById("serverTime").textContent.split(":").map(Number);
        const serverDate = new Date(sy, sm - 1, sd, sh, smi, ss);
        const offset = serverDate - new Date();

        const modo = document.querySelector('input[name="modo_agendamento"]:checked').value;
        const duracaoTexto = (() => {
            const linhas = document.querySelectorAll("table.vis tr");
            for (const linha of linhas) {
                const celulas = linha.querySelectorAll("td");
                if (celulas.length === 2 && celulas[0].textContent.trim() === "Duração:") {
                    return celulas[1].textContent.trim();
                }
            }
            return "0:0:0";
        })();
        const tempoViagem = duracaoParaMs(duracaoTexto);
        const [td, tm, ty] = data.split("/").map(Number);
        const [th, tmin, ts] = hora.split(":").map(Number);
        const target = new Date(ty, tm - 1, td, th, tmin, ts);
        let horarioEnvio = modo === "chegada" ? new Date(target - tempoViagem) : target;
        const millis = horarioEnvio - new Date() - offset + ajuste;

        if (millis < 0) {
            status.textContent = "⛔ Já passou do horário alvo!";
            status.style.color = "red";
            return;
        }

        const btn = document.getElementById("troop_confirm_submit");
        if (!btn) {
            status.textContent = "❌ Botão de envio não encontrado.";
            status.style.color = "red";
            return;
        }

        status.textContent = "⏳ Envio agendado...";
        status.style.color = "green";
        agendamentoAtivo = setTimeout(() => {
            btn.click();
            status.textContent = `✔️ Tropas enviadas com ajuste de ${ajuste}ms!`;
            agendamentoAtivo = null;
        }, millis);
		
		const inicio = Date.now();
intervaloCountdown = setInterval(() => {
    const decorrido = Date.now() - inicio;
    const restante = millis - decorrido;

    if (restante <= 0) {
        clearInterval(intervaloCountdown);
    } else {
        const segundos = Math.floor(restante / 1000);
        const dias = Math.floor(segundos / 86400);
        const horas = Math.floor((segundos % 86400) / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const seg = segundos % 60;

        let tempoStr = "⏳ Enviando em ";
        if (dias > 0) tempoStr += `${dias}d `;
        if (horas > 0 || dias > 0) tempoStr += `${horas}h `;
        if (minutos > 0 || horas > 0 || dias > 0) tempoStr += `${minutos}m `;
        tempoStr += `${seg}s`;

        status.textContent = tempoStr.trim();
        status.style.color = "gold";
    }
}, 250);

		
    }

    atualizarLista();
})();
