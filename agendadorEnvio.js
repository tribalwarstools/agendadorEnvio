(function () {
    if (!window.TribalWars) {
        alert("Este script deve ser executado dentro do Tribal Wars.");
        return;
    }

    function aplicarEstiloTWPadrao() {
        const style = document.createElement('style');
        style.textContent = `
            .twPainel {

		position: fixed;
		top: 50%;
		left: 20px; /* ou 0px se quiser totalmente encostado */
		transform: translateY(-50%);
                background: #2e2e2e;
                border: 2px solid #b79755;
                border-radius: 6px;
                padding: 10px 15px;
                font-family: Verdana, sans-serif;
                font-size: 13px;
                color: #f5deb3;
                z-index: 99999;
                box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.7);
                width: 320px;
                display: flex;
                flex-direction: column;
                gap: 10px;

            }

            .twPainel h3 {
                margin: 0 0 10px;
                font-size: 15px;
                color: #f0e2b6;
            }

            .twPainel select, .twPainel input[type="number"], .twPainel input[type="text"], .twPainel button {
                font-size: 13px;
                padding: 4px 6px;
                margin: 4px 0;
                border-radius: 4px;
                border: 1px solid #b79755;
                background-color: #1c1c1c;
                color: #f5deb3;
            }

            .twPainel button:hover {
                background-color: #3a3a3a;
                cursor: pointer;
            }

            .twPainel .linha {
                margin-bottom: 8px;
            }

            .twPainel .contador {
                font-size: 14px;
                font-weight: bold;
                margin-left: 6px;
                color: #ffd700;
            }

            .twPainel .btn-verde { background: #6b8e23; color: white; }
            .twPainel .btn-vermelho { background: #a52a2a; color: white; }
            .twPainel .btn-azul { background: #2196F3; color: white; }
            .twPainel .btn-verde-claro { background: #4CAF50; color: white; }
            .twPainel .btn-laranja { background: #ff9800; color: white; }
            .twPainel .btn-vermelho-claro { background: #f44336; color: white; }
        `;
        document.head.appendChild(style);
    }

    aplicarEstiloTWPadrao();

    let agendamentoAtivo = null;
    let intervaloCountdown = null;

    function duracaoParaMs(str) {
        const [h, m, s] = str.split(":").map(Number);
        return ((h * 3600) + (m * 60) + s) * 1000;
    }

    const painel = document.createElement("div");
    painel.id = "painel_agendador";
    painel.className = "twPainel";

    painel.innerHTML = `
        <div id="ag_header" style="display:flex; justify-content:space-between; align-items:center; cursor:move;">
            <h3>⚔️ Agendador de Envio</h3>
            <button id="fechar_painel_ag" style="background:#c00; color:white; border:none; border-radius:4px; padding:2px 6px; font-weight:bold;">✖</button>
        </div>
        <label>📅 Data alvo:<br><input id="ag_data" type="text" placeholder="DD/MM/AAAA"></label>
        <label>⏰ Hora alvo:<br><input id="ag_hora" type="text" placeholder="hh:mm:ss"></label>
        <label>⚙️ Ajuste (ms):<br><input id="ajuste_fino" type="number" value="0" step="10"></label>
        <div>
          <label><input type="radio" name="modo_agendamento" value="saida" checked> 🚀 Saída</label>
          <label style="margin-left:10px;"><input type="radio" name="modo_agendamento" value="chegada"> 🎯 Chegada</label>
        </div>
        <div style="display:flex; gap:8px;">
            <button id="btn_salvar" class="btn btn-verde" style="flex:1;">💾 Salvar</button>
            <button id="btn_limpar" class="btn btn-vermelho" style="flex:1;">🗑️ Limpar</button>
        </div>
        <div id="lista_horarios" style="max-height:150px; overflow:auto; border:1px solid #b79755; padding:5px; background:#1c1c1c; border-radius:5px;"></div>
        <p id="ag_status" style="font-weight:bold;"></p>
    `;

    document.body.appendChild(painel);

    const dataServidor = document.getElementById("serverDate")?.textContent.trim();
    const horaServidor = document.getElementById("serverTime")?.textContent.trim();
    if (dataServidor && horaServidor) {
        document.getElementById("ag_data").value = dataServidor;
        document.getElementById("ag_hora").value = horaServidor;
    }

    const status = document.getElementById("ag_status");

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

    document.getElementById("fechar_painel_ag").onclick = () => {
        if (agendamentoAtivo) {
            alert("⛔ Não é possível fechar o painel com agendamento ativo.");
        } else {
            painel.remove();
        }
    };

document.getElementById("btn_salvar").addEventListener("click", () => {
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
    });

    document.getElementById("btn_limpar").addEventListener("click", () => {
        if (confirm("Deseja apagar todos os horários salvos?")) {
            localStorage.removeItem("horarios_salvos");
            


    atualizarLista();
        }
    });

    function atualizarLista() {
        const container = document.getElementById("lista_horarios");
        const lista = JSON.parse(localStorage.getItem("horarios_salvos") || "[]");
        container.innerHTML = lista.length === 0 ? "<i>Nenhum horário salvo.</i>" : "";

        lista.forEach(({ data, hora, ajuste }, i) => {
            const div = document.createElement("div");
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.style.marginBottom = "4px";
            div.innerHTML = `
                <span style="font-size:12px;" class="ag_item" data-index="${i}">${data} ${hora} [${ajuste}ms]</span>
                <div style="display:flex; gap:3px;">
                    <button style="background:#2196F3; color:white; border:none; border-radius:4px; padding:2px 5px;" data-editar="${i}">✏️</button>
                    <button style="background:#4CAF50; color:white; border:none; border-radius:4px; padding:2px 5px;" data-agendar="${i}">▶️</button>
                    <button style="background:#f44336; color:white; border:none; border-radius:4px; padding:2px 5px;" data-remover="${i}">❌</button>
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

                // Destaque visual no agendamento ativo
                container.querySelectorAll(".ag_item").forEach(e => e.style.color = "");
                const ativo = container.querySelector(`[data-index="${btn.dataset.agendar}"]`);
                if (ativo) ativo.style.color = "green"; ativo.style.fontWeight = "bold";

            };
        });
    }

    function agendarEnvio({ data, hora, ajuste }) {
        const [sd, sm, sy] = document.getElementById("serverDate").textContent.split("/").map(Number);
        const [sh, smi, ss] = document.getElementById("serverTime").textContent.split(":").map(Number);
        const serverDate = new Date(sy, sm - 1, sd, sh, smi, ss);
        const offset = serverDate - new Date();

        // Pega o modo de agendamento selecionado
        const modo = document.querySelector('input[name="modo_agendamento"]:checked').value;

        // Pega a duração da viagem (tempo de viagem)
        const duracaoTexto = (() => {
            // tenta encontrar o tempo da viagem na tabela de comando
            // Ajuste o seletor conforme necessário na sua página
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

        let horarioEnvio;
        if (modo === "chegada") {
            horarioEnvio = new Date(target.getTime() - tempoViagem);
        } else {
            horarioEnvio = target;
        }

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
        status.style.fontWeight = "bold";
        desativarBotoes();

        agendamentoAtivo = setTimeout(() => {
            btn.click();
            status.textContent = `✔️ Tropas enviadas com ajuste de ${ajuste}ms!`;
            status.style.color = "green";
            agendamentoAtivo = null;
            reativarBotoes();
            removerBotaoCancelar();
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

                status.innerHTML = tempoStr.trim();
            }
        }, 250);

        criarBotaoCancelar();
    }

    function cancelarAgendamento() {
        clearTimeout(agendamentoAtivo);
        clearInterval(intervaloCountdown);
        agendamentoAtivo = null;
        status.textContent = "❌ Agendamento cancelado.";
        status.style.color = "orange";
        reativarBotoes();
        removerBotaoCancelar();
    }

    function criarBotaoCancelar() {
        removerBotaoCancelar();
        const btnCancelar = document.createElement("button");
        btnCancelar.textContent = "🛑 Cancelar";
        btnCancelar.id = "cancelar_envio";
        btnCancelar.className = "btn";
        btnCancelar.style = "margin-top:5px; background:#ff9800; color:white; border:none; border-radius:5px; padding:6px; width:100%; cursor:pointer;";
        status.parentElement.appendChild(btnCancelar);
        btnCancelar.addEventListener("click", cancelarAgendamento);
    }

    function removerBotaoCancelar() {
        const b = document.getElementById("cancelar_envio");
        if (b) b.remove();
    }

    function desativarBotoes() {
        document.getElementById("btn_salvar").disabled = true;
        document.getElementById("btn_limpar").disabled = true;
        document.querySelectorAll("[data-agendar], [data-editar], [data-remover]").forEach(b => b.disabled = true);
    }

    function reativarBotoes() {
        document.getElementById("btn_salvar").disabled = false;
        document.getElementById("btn_limpar").disabled = false;
        document.querySelectorAll("[data-agendar], [data-editar], [data-remover]").forEach(b => b.disabled = false);
    }

    window.addEventListener("beforeunload", function (e) {
        if (agendamentoAtivo) {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    
    // === ANTILOGOFF ===

    // 1. Ping ao servidor a cada 4 minutos
    setInterval(() => {
        fetch('/game.php?screen=overview')
            .then(() => console.log("[Ping] Sessão mantida"));
    }, 1000 * 60 * 4); // 4 minutos

    // 2. Simulação de movimento do mouse
    setInterval(() => {
        const evt = new MouseEvent('mousemove', { bubbles: true });
        document.dispatchEvent(evt);
        console.log("[Mouse] Movimento simulado");
    }, 1000 * 60 * 5); // 5 minutos

    // 3. Simulação de pressionamento de tecla
    setInterval(() => {
        const evt = new KeyboardEvent('keydown', { key: 'Shift' });
        document.dispatchEvent(evt);
        console.log("[Tecla] Pressionamento simulado");
    }, 1000 * 60 * 6); // 6 minutos

    atualizarLista();
})();

